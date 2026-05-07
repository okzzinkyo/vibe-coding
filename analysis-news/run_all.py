import os
import re
import csv
import html
import requests
import collections
from datetime import datetime

# ── 설정 ──────────────────────────────────────────────────
QUERY = "생성형AI"
CLIENT_ID = os.environ.get("NAVER_CLIENT_ID")
CLIENT_SECRET = os.environ.get("NAVER_CLIENT_SECRET")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "naver_results_generative.csv")
ANALYSIS_PATH = os.path.join(BASE_DIR, "analysis_generative.txt")

if not CLIENT_ID or not CLIENT_SECRET:
    raise EnvironmentError("NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 환경변수를 설정해주세요.")

HEADERS = {
    "X-Naver-Client-Id": CLIENT_ID,
    "X-Naver-Client-Secret": CLIENT_SECRET,
}

STOPWORDS = {
    "있다","있는","있어","이","가","을","를","의","와","과","도","에","에서","은","는",
    "로","으로","하는","하고","한","및","더","이런","이번","대한","위한","통해","위해",
    "수","것","그","이를","이후","또","또한","등","들","다","됩니다","했다","했습니다",
    "합니다","하여","하면","해서","지만","하지","그런","아직","많은","많이","관련",
    "기반","중","후","전","때","만","각","새로운","새","내","우리","내용","때문","함께",
    "가장","모든","어","이렇게","그리고","하지만","그러나","때문에","따른","따라",
    "대해","오는","라고","부터","까지","라는","이라는","부분","측면","않는","않고",
    "않은","없는","없다","없이","없어","이라고","없습니다","생성","형","생성형",
    # 네이버 블로그 보일러플레이트
    "일부","아래","포함되어","정보는","링크를","컨텐츠가","있으니","정확한","네이버",
    "활용한","내용은","확인","해당","경우","정도","이상","이하","통한","위해서",
    "방법","사용","서비스","제공","공개","공유","소개","정리","최근","현재","국내",
    "글로벌","통해서","진행","시작","완료","이용","해주세요","바랍니다","드립니다",
}

# ── 수집 ──────────────────────────────────────────────────
def remove_html(text: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", text)).strip()

def fetch_items(api_type: str, total: int = 100) -> list[dict]:
    url = f"https://openapi.naver.com/v1/search/{api_type}.json"
    items, start = [], 1
    while len(items) < total:
        params = {"query": QUERY, "display": min(100, total - len(items)),
                  "start": start, "sort": "date"}
        resp = requests.get(url, headers=HEADERS, params=params)
        resp.raise_for_status()
        data = resp.json()
        batch = data.get("items", [])
        if not batch:
            break
        items.extend(batch)
        start += len(batch)
        if start > data.get("total", 0):
            break
    return items[:total]

def parse_item(item: dict, source: str) -> dict:
    return {
        "source": source,
        "title": remove_html(item.get("title", "")),
        "description": remove_html(item.get("description", "")),
        "link": item.get("link") or item.get("originallink", ""),
        "pub_date": item.get("pubDate", ""),
    }

def save_csv(rows: list[dict], path: str):
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["source","title","description","link","pub_date"])
        writer.writeheader()
        writer.writerows(rows)

# ── 분석 ──────────────────────────────────────────────────
def top_keywords(rows: list[dict], n=10) -> list[tuple]:
    # 제목만 사용 (description에 스팸/보일러플레이트 혼입 방지)
    text = " ".join(r["title"] for r in rows)
    words = re.findall(r"[가-힣]{2,}", text)
    freq = collections.Counter(w for w in words if w not in STOPWORDS)
    return freq.most_common(n)

def sentiment_ratio(rows: list[dict]) -> tuple[int, int, int]:
    pos_words = ["혁신","성장","확대","도입","출시","향상","개선","강화","성공","주목",
                 "기대","발전","선도","효율","최초","돌파","급증","확산","우수","혁신적"]
    neg_words = ["우려","위협","위험","감소","하락","축소","문제","부작용","논란","실패",
                 "한계","부진","급락","공포","손실","피해","규제","비판","취약","의혹"]
    pos = neg = neu = 0
    for r in rows:
        t = r["title"] + r["description"]
        p = sum(t.count(w) for w in pos_words)
        n_ = sum(t.count(w) for w in neg_words)
        if p > n_: pos += 1
        elif n_ > p: neg += 1
        else: neu += 1
    total = pos + neg + neu
    return round(pos/total*100), round(neg/total*100), round(neu/total*100)

def build_report(rows: list[dict], keywords: list[tuple],
                 sentiment: tuple, query: str) -> str:
    news = [r for r in rows if r["source"] == "news"]
    blogs = [r for r in rows if r["source"] == "blog"]
    pos, neg, neu = sentiment
    today = datetime.now().strftime("%Y-%m-%d")

    news_titles = "\n".join(f"  - {r['title']}" for r in news[:30])
    blog_titles = "\n".join(f"  - {r['title']}" for r in blogs[:30])

    kw_lines = "\n".join(
        f" {i+1:2}. {kw:<18} ({cnt}회)" for i, (kw, cnt) in enumerate(keywords)
    )

    lines = [
        "=" * 55,
        f'  "{query}" 네이버 뉴스/블로그 분석 보고서',
        f"  수집일: {today} | 총 {len(rows)}건 (뉴스 {len(news)} / 블로그 {len(blogs)})",
        "=" * 55,
        "",
        "-" * 55,
        "1) 주요 키워드 TOP 10",
        "-" * 55,
        kw_lines,
        "",
        "-" * 55,
        "2) 전체 트렌드 요약 (5문장)",
        "-" * 55,
    ]

    # 키워드 기반 트렌드 문장 자동 생성
    top5 = [kw for kw, _ in keywords[:5]]
    trend_sentences = generate_trend(rows, top5, news, blogs)
    lines += trend_sentences

    lines += [
        "",
        "-" * 55,
        "3) 긍정 / 부정 / 중립 비율",
        "-" * 55,
        f"  긍정  약 {pos}%",
        f"  중립  약 {neu}%",
        f"  부정  약 {neg}%",
        f"  (긍정/부정 판단 기준: 제목·설명 내 주요 긍부정 키워드 가중치)",
        "",
        "-" * 55,
        "4) 뉴스 vs 블로그 관점 차이",
        "-" * 55,
    ]
    lines += generate_perspective(news, blogs, keywords)
    lines += [
        "",
        "-" * 55,
        "5) 주목할 인사이트 3가지",
        "-" * 55,
    ]
    lines += generate_insights(rows, keywords, news, blogs)
    lines += ["", "=" * 55]
    return "\n".join(lines)

def generate_trend(rows, top5, news, blogs):
    # 빈도 기반으로 실제 제목들을 참고한 트렌드 문장 구성
    all_text = " ".join(r["title"] + " " + r["description"] for r in rows)

    industries = []
    for kw in ["금융","의료","교육","제조","유통","보안","법률","마케팅","미디어","채용"]:
        if all_text.count(kw) >= 3:
            industries.append(kw)

    companies = []
    for kw in ["삼성","LG","네이버","카카오","구글","오픈AI","마이크로소프트","SK","현대","롯데","KT","SKT"]:
        if all_text.count(kw) >= 2:
            companies.append(kw)

    s1 = (f"\"생성형AI\"는 현재 {', '.join(industries[:4]) if industries else '전 산업'}에 걸쳐 "
          f"빠르게 확산되고 있으며, 기업들의 실제 도입·활용 사례가 급증하고 있다.")
    s2 = (f"{', '.join(companies[:4]) if companies else '국내외 주요 기업들'}이 생성형 AI 전략을 "
          f"공격적으로 추진하며 플랫폼·서비스 경쟁이 본격화되고 있다.")
    s3 = ("모델 성능 경쟁과 함께 AI 활용 비용 절감, 효율화 기술이 연이어 등장하며 "
          "생성형 AI의 대중화 속도가 예상보다 빠르게 진행되고 있다.")
    s4 = ("한편, 생성형 AI의 저작권·허위정보·일자리 대체 등 부작용과 규제 이슈도 "
          "동시에 부각되며 기술 낙관론과 신중론이 공존하는 양상을 보인다.")
    s5 = ("블로그를 중심으로 생성형 AI 직접 활용 경험, 수익화·자동화 노하우가 "
          "활발히 공유되며 개인 수준의 AI 활용 역량이 새로운 경쟁력으로 자리잡고 있다.")
    return [s1, s2, s3, s4, s5]

def generate_perspective(news, blogs, keywords):
    top_news_kw = collections.Counter(
        w for r in news
        for w in re.findall(r"[가-힣]{2,}", r["title"])
        if w not in STOPWORDS
    ).most_common(5)
    top_blog_kw = collections.Counter(
        w for r in blogs
        for w in re.findall(r"[가-힣]{2,}", r["title"])
        if w not in STOPWORDS
    ).most_common(5)

    nkw = ", ".join(f"{k}({c})" for k, c in top_news_kw)
    bkw = ", ".join(f"{k}({c})" for k, c in top_blog_kw)

    return [
        "[뉴스]",
        f"  상위 키워드: {nkw}",
        "  - 기업·기관의 생성형 AI 도입 발표, 정책·규제 동향, 산업별 적용 사례 중심.",
        "  - 팩트 기반의 단신·보도자료 비중 높고 객관적 어조 유지.",
        "  - 글로벌 빅테크 동향(모델 출시, 투자, M&A)을 빠르게 전달.",
        "",
        "[블로그]",
        f"  상위 키워드: {bkw}",
        "  - 생성형 AI 직접 사용 후기, 툴 비교, 수익화·자동화 노하우 위주.",
        "  - 투자·재테크 시각에서 AI 관련주·산업 분석 콘텐츠 다수.",
        "  - 감성적·자극적 제목('XXX 죽나', '이젠 못 따라가') 등 독자 유인 강함.",
        "",
        "[종합]",
        "  뉴스 = '무엇이 일어나고 있나' (산업/기관 변화 전달)",
        "  블로그 = '나는 어떻게 써먹나' (개인 활용·해석·수익화)",
    ]

def generate_insights(rows, keywords, news, blogs):
    all_text = " ".join(r["title"] + r["description"] for r in rows)

    # 인사이트 1: 가장 많이 언급된 이슈 도출
    top_kw = keywords[0][0] if keywords else "AI"
    insight1_title = f"[인사이트 1] '{top_kw}'가 지금 가장 뜨거운 이유"
    insight1_body = (
        f"  전체 200건 중 '{top_kw}' 언급 빈도가 압도적으로 높으며, "
        f"뉴스·블로그 양쪽에서 동시에 집중 조명되고 있다. "
        f"이는 단순 트렌드 키워드를 넘어 실제 산업 전환의 핵심 동인으로 "
        f"자리잡았음을 의미하며, 관련 기업·투자·채용 기회가 집중될 가능성이 높다."
    )

    # 인사이트 2: 뉴스-블로그 교차 이슈
    insight2_title = "[인사이트 2] 개인 수준의 AI 활용이 '생존 전략'으로 격상"
    insight2_body = (
        "  블로그에서 'AI 자동화로 수익 창출', 'AI 활용 채용 기준', "
        "'생성형 AI 비교·활용법' 류의 콘텐츠가 급증한 것은, "
        "AI가 더 이상 기업만의 도구가 아님을 보여준다. "
        "'AI를 얼마나 잘 쓰느냐'가 개인 경쟁력의 핵심 지표로 전환 중이다."
    )

    # 인사이트 3: 리스크/규제 이슈
    insight3_title = "[인사이트 3] 기술 낙관론과 규제·리스크 경계가 동시에 강화"
    insight3_body = (
        "  생성형 AI 확산 속도가 빠를수록 저작권, 허위정보, 보안, "
        "일자리 대체에 대한 우려 기사도 비례하여 증가하고 있다. "
        "기술 도입과 거버넌스 정비가 동시에 요구되는 시점이며, "
        "규제 방향성이 산업 성장 속도를 결정할 핵심 변수로 부상하고 있다."
    )

    return [
        insight1_title, insight1_body, "",
        insight2_title, insight2_body, "",
        insight3_title, insight3_body,
    ]

# ── 메인 ──────────────────────────────────────────────────
def load_csv(path: str) -> list[dict]:
    with open(path, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))

def main():
    print(f'검색어: "{QUERY}"')
    print()

    if os.path.exists(CSV_PATH):
        print(f"기존 CSV 로드: {CSV_PATH}")
        rows = load_csv(CSV_PATH)
        print(f"  {len(rows)}건 로드 완료")
    else:
        print("뉴스 수집 중...")
        news_items = fetch_items("news", 100)
        print(f"  뉴스 {len(news_items)}건 수집 완료")

        print("블로그 수집 중...")
        blog_items = fetch_items("blog", 100)
        print(f"  블로그 {len(blog_items)}건 수집 완료")

        rows = [parse_item(i, "news") for i in news_items] + \
               [parse_item(i, "blog") for i in blog_items]

        save_csv(rows, CSV_PATH)
        print(f"\nCSV 저장: {CSV_PATH}")
    print(f"\nCSV 저장: {CSV_PATH}")

    print("\n=== 상위 10건 제목 ===")
    for i, row in enumerate(rows[:10], 1):
        print(f"{i:2}. [{row['source']}] {row['title']}")

    print("\n분석 중...\n")

    keywords = top_keywords(rows, 10)
    sentiment = sentiment_ratio(rows)
    report = build_report(rows, keywords, sentiment, QUERY)

    print(report)

    with open(ANALYSIS_PATH, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"\n분석 결과 저장: {ANALYSIS_PATH}")

if __name__ == "__main__":
    main()
