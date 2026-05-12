import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';

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
- MySQL 또는 PostgreSQL 기준

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):

{
  "title": "문제 제목",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "scenario": "문제 배경 설명 (2~3문장)",
  "schema": "CREATE TABLE 문 (샘플 데이터 INSERT 포함, 5~8행)",
  "question": "구체적인 문제 요구사항",
  "expected_output": "컬럼명과 샘플 결과 (마크다운 테이블)",
  "hint": "풀이 방향 힌트 (1~2문장)",
  "answer": "정답 SQL 쿼리 (주석 포함)"
}`,
      },
    ],
  });

  const text = message.content[0].text.trim();
  return JSON.parse(text);
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

  console.log(`문제 생성 중... 주제: ${topic}, 난이도: ${difficulty}`);

  const problem = await generateProblem(topic, difficulty);
  console.log(`문제 생성 완료: ${problem.title}`);

  const today = new Date();
  const dateStr = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'Asia/Seoul',
  });

  const html = buildEmailHtml(problem, dateStr);

  const { data, error } = await resend.emails.send({
    from: 'SQL Daily <onboarding@resend.dev>',
    to: process.env.TO_EMAIL,
    subject: `[SQL] ${problem.difficulty} | ${problem.title}`,
    html,
  });

  if (error) {
    console.error('이메일 발송 실패:', error);
    process.exit(1);
  }

  console.log(`이메일 발송 완료: ${data.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
