import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import mysql from 'mysql2/promise';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

const TOPICS = [
  'SELECT / WHERE / ORDER BY',
  'GROUP BY / HAVING / 집계 함수',
  'INNER JOIN / LEFT JOIN',
  '서브쿼리 (Subquery)',
  'CTE (WITH 절)',
  'NULL 처리 / COALESCE / CASE WHEN',
  '윈도우 함수 (ROW_NUMBER, RANK, LAG, LEAD)',
  '날짜 함수 / 문자열 함수',
];

const DIFFICULTIES = ['초급', '초급', '중급', '중급', '중급', '고급'];

function getDayIndex() {
  const start = new Date('2026-01-01');
  const today = new Date();
  return Math.floor((today - start) / (1000 * 60 * 60 * 24));
}

function getRotation(dayIndex) {
  const topic = TOPICS[dayIndex % TOPICS.length];
  const difficulty = DIFFICULTIES[Math.floor(dayIndex / TOPICS.length) % DIFFICULTIES.length];
  return { topic, difficulty };
}

function formatAsMarkdownTable(rows) {
  if (!rows || rows.length === 0) return '(결과 없음)';
  const headers = Object.keys(rows[0]);
  const headerRow = '| ' + headers.join(' | ') + ' |';
  const divider = '| ' + headers.map(() => '---').join(' | ') + ' |';
  const dataRows = rows.map(row =>
    '| ' + headers.map(h => String(row[h] ?? 'NULL')).join(' | ') + ' |'
  );
  return [headerRow, divider, ...dataRows].join('\n');
}

async function executeOnMySQL(schema, query) {
  const dbName = `sql_daily_tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    multipleStatements: true,
  });
  try {
    await conn.query(`CREATE DATABASE \`${dbName}\``);
    await conn.query(`USE \`${dbName}\``);
    await conn.query(schema);
    const [rows] = await conn.query(query);
    return { rows, markdown: formatAsMarkdownTable(rows) };
  } finally {
    await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    await conn.end();
  }
}

async function runOnMySQL(schema, answer) {
  const { markdown } = await executeOnMySQL(schema, answer);
  return markdown;
}

async function computeExpectedOutputFallback(schema, answer) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `아래 스키마의 INSERT 데이터를 직접 추적해서, 쿼리 실행 결과를 마크다운 테이블 형식으로만 출력하세요. 다른 텍스트는 절대 포함하지 마세요.

스키마 및 샘플 데이터:
${schema}

실행할 쿼리:
${answer}`,
    }],
  });
  return message.content[0].text.trim();
}

async function getExpectedOutput(problem) {
  try {
    const result = await runOnMySQL(problem.schema, problem.answer);
    console.log('MySQL 실행 성공 → 실제 결과 사용');
    return result;
  } catch (err) {
    console.warn('MySQL 실행 실패, Claude 폴백:', err.message);
    return computeExpectedOutputFallback(problem.schema, problem.answer);
  }
}

function parseJson(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}

// 컬럼명·순서 무관하게 행 값 집합을 비교
function normalizeRows(rows) {
  const normalized = rows.map(r =>
    Object.values(r).map(v => String(v ?? 'NULL')).sort()
  ).sort((a, b) => a.join('|').localeCompare(b.join('|')));
  return JSON.stringify(normalized);
}

async function reviewSolve(problem) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `당신은 SQL 전문가입니다. 아래 스키마와 문제만 보고 MySQL 5.7 쿼리를 작성하세요. 정답을 보지 마세요.

스키마 및 샘플 데이터:
${problem.schema}

문제:
${problem.question}

JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{"sql": "쿼리"}`,
    }],
  });

  const { sql: reviewerSQL } = parseJson(message.content[0].text);

  const [originalResult, reviewerResult] = await Promise.all([
    executeOnMySQL(problem.schema, problem.answer),
    executeOnMySQL(problem.schema, reviewerSQL),
  ]);

  const pass = normalizeRows(originalResult.rows) === normalizeRows(reviewerResult.rows);
  return {
    pass,
    reviewerSQL,
    issue: pass ? null : `리뷰어 풀이 결과 불일치\n리뷰어 쿼리: ${reviewerSQL}\n리뷰어 결과:\n${reviewerResult.markdown}`,
  };
}

async function reviewQuality(problem) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `아래 SQL 연습 문제를 검토하고 품질을 평가하세요.

주제: ${problem.topic}
난이도: ${problem.difficulty}
문제: ${problem.question}
예상 출력: ${problem.expected_output}

검토 항목:
1. 난이도 표기가 실제 난이도와 맞는가
2. 문제 요구사항이 모호하지 않고 명확한가
3. 예상 출력이 문제 의도와 맞는가

문제가 없으면 pass=true, issues=[]로 응답하세요.
문제가 있으면 pass=false, issues에 간단한 한 줄 설명만 넣으세요 (SQL 코드 포함 금지).
JSON 형식으로만 응답하세요: {"pass": true, "issues": []}`,
    }],
  });

  try {
    return parseJson(message.content[0].text);
  } catch {
    console.warn('품질 검토 응답 파싱 실패, 통과 처리');
    return { pass: true, issues: [] };
  }
}

async function generateWithReview(topic, difficulty) {
  const MAX_RETRIES = 3;
  let lastProblem;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`문제 생성 중... (시도 ${attempt}/${MAX_RETRIES})`);
    const problem = await generateProblem(topic, difficulty);
    problem.expected_output = await getExpectedOutput(problem);
    lastProblem = problem;

    console.log('리뷰 중...');
    const [qualityReview, solveReview] = await Promise.all([
      reviewQuality(problem),
      reviewSolve(problem).catch(err => ({ pass: false, issue: err.message })),
    ]);

    const issues = [
      ...(qualityReview.issues ?? []),
      ...(solveReview.issue ? [solveReview.issue] : []),
    ];
    const pass = qualityReview.pass && solveReview.pass;

    if (pass) {
      console.log(`리뷰 통과 (시도 ${attempt}회)`);
      return problem;
    }

    console.warn(`리뷰 실패:\n${issues.join('\n')}`);
    if (attempt < MAX_RETRIES) console.log('재생성합니다...');
  }

  console.warn('최대 재시도 초과, 마지막 생성 결과 사용');
  return lastProblem;
}

async function generateProblem(topic, difficulty) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `당신은 SQL 교육 전문가입니다. 아래 조건에 맞는 SQL 연습 문제를 하나 만들어주세요.

조건:
- 주제: ${topic}
- 난이도: ${difficulty}
- 실제 업무에서 자주 쓰이는 현실적인 시나리오
- MySQL 5.7 기준 문법 사용

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):

{
  "title": "문제 제목",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "scenario": "문제 배경 설명 (2~3문장)",
  "schema": "CREATE TABLE 문 (샘플 데이터 INSERT 포함, 5~8행)",
  "question": "구체적인 문제 요구사항",
  "hint": "풀이 방향 힌트 (1~2문장)",
  "answer": "정답 SQL 쿼리 (주석 포함)"
}`,
      },
    ],
  });

  return parseJson(message.content[0].text);
}

function buildEmailHtml(problem, dateStr) {
  const difficultyColor = {
    초급: '#22c55e',
    중급: '#f59e0b',
    고급: '#ef4444',
  };

  const color = difficultyColor[problem.difficulty] || '#6b7280';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>오늘의 SQL 문제</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- 헤더 -->
    <div style="background:#1e293b;padding:28px 32px;">
      <p style="margin:0 0 4px;color:#94a3b8;font-size:13px;">${dateStr}</p>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">오늘의 SQL 문제 💡</h1>
    </div>

    <div style="padding:28px 32px;">

      <!-- 제목 + 배지 -->
      <div style="margin-bottom:24px;">
        <div style="margin-bottom:8px;">
          <span style="display:inline-block;background:${color}22;color:${color};border:1px solid ${color}55;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:600;margin-right:6px;">${problem.difficulty}</span>
          <span style="display:inline-block;background:#e0e7ff;color:#4338ca;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:600;">${problem.topic}</span>
        </div>
        <h2 style="margin:8px 0 0;font-size:18px;color:#1e293b;">${problem.title}</h2>
      </div>

      <!-- 시나리오 -->
      <div style="background:#f8fafc;border-left:4px solid #6366f1;border-radius:0 8px 8px 0;padding:16px;margin-bottom:20px;">
        <p style="margin:0;color:#475569;font-size:14px;line-height:1.7;">${problem.scenario}</p>
      </div>

      <!-- 스키마 -->
      <div style="margin-bottom:20px;">
        <h3 style="margin:0 0 10px;font-size:14px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">테이블 스키마</h3>
        <pre style="margin:0;background:#0f172a;color:#e2e8f0;padding:16px;border-radius:8px;font-size:13px;overflow-x:auto;line-height:1.6;">${problem.schema}</pre>
      </div>

      <!-- 문제 -->
      <div style="margin-bottom:20px;">
        <h3 style="margin:0 0 10px;font-size:14px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">문제</h3>
        <div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:16px;">
          <p style="margin:0;color:#1e293b;font-size:15px;line-height:1.7;font-weight:500;">${problem.question}</p>
        </div>
      </div>

      <!-- 예상 결과 -->
      <div style="margin-bottom:20px;">
        <h3 style="margin:0 0 10px;font-size:14px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">예상 출력</h3>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;overflow-x:auto;">
          <pre style="margin:0;font-size:13px;color:#334155;line-height:1.6;">${problem.expected_output}</pre>
        </div>
      </div>

      <!-- 힌트 -->
      <div style="margin-bottom:28px;">
        <h3 style="margin:0 0 10px;font-size:14px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">힌트</h3>
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px;">
          <p style="margin:0;color:#166534;font-size:14px;line-height:1.7;">💡 ${problem.hint}</p>
        </div>
      </div>

      <!-- 정답 (스포일러) -->
      <details style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <summary style="padding:14px 16px;cursor:pointer;background:#f8fafc;color:#475569;font-size:14px;font-weight:600;user-select:none;list-style:none;">
          ▶ 정답 보기 (풀어본 후 확인하세요)
        </summary>
        <div style="padding:0 16px 16px;">
          <pre style="margin:16px 0 0;background:#0f172a;color:#a5f3fc;padding:16px;border-radius:8px;font-size:13px;overflow-x:auto;line-height:1.6;">${problem.answer}</pre>
        </div>
      </details>

    </div>

    <!-- 푸터 -->
    <div style="border-top:1px solid #f1f5f9;padding:16px 32px;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">평일 매일 오전 8시에 배송됩니다 · SQL Daily</p>
    </div>

  </div>
</body>
</html>`;
}

async function main() {
  const dayIndex = getDayIndex();
  const { topic, difficulty } = getRotation(dayIndex);

  console.log(`주제: ${topic}, 난이도: ${difficulty}`);

  const problem = await generateWithReview(topic, difficulty);
  console.log(`최종 문제: ${problem.title}`);

  const today = new Date();
  const dateStr = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'Asia/Seoul',
  });

  const html = buildEmailHtml(problem, dateStr);

  let emails;
  if (process.env.TEST_EMAIL) {
    emails = [process.env.TEST_EMAIL];
    console.log(`[테스트] ${process.env.TEST_EMAIL} 으로만 발송`);
  } else {
    const { data: contacts, error: contactsError } = await resend.contacts.list({
      segmentId: process.env.RESEND_SEGMENT_ID,
    });
    if (contactsError) {
      console.error('구독자 목록 조회 실패:', contactsError);
      process.exit(1);
    }
    emails = contacts.filter(c => !c.unsubscribed).map(c => c.email);
    if (emails.length === 0) {
      console.log('활성 구독자 없음, 종료');
      return;
    }
    console.log(`구독자 ${emails.length}명에게 발송 중...`);
  }

  const results = await Promise.all(
    emails.map(email =>
      resend.emails.send({
        from: 'SQL Daily <onboarding@resend.dev>',
        to: email,
        subject: `[SQL] ${problem.difficulty} | ${problem.title}`,
        html,
      })
    )
  );

  const failed = results.filter(r => r.error);
  if (failed.length > 0) console.error(`발송 실패 ${failed.length}건`);
  console.log(`발송 완료: ${emails.length - failed.length}/${emails.length}명`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
