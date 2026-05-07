import os
import re
import csv
import requests
from datetime import datetime

CLIENT_ID = os.environ.get("NAVER_CLIENT_ID")
CLIENT_SECRET = os.environ.get("NAVER_CLIENT_SECRET")

if not CLIENT_ID or not CLIENT_SECRET:
    raise EnvironmentError("NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 환경변수를 설정해주세요.")

QUERY = "AI 에이전트"
HEADERS = {
    "X-Naver-Client-Id": CLIENT_ID,
    "X-Naver-Client-Secret": CLIENT_SECRET,
}

def remove_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text).strip()

def fetch_items(api_type: str, total: int = 100) -> list[dict]:
    url = f"https://openapi.naver.com/v1/search/{api_type}.json"
    items = []
    start = 1

    while len(items) < total:
        params = {
            "query": QUERY,
            "display": min(100, total - len(items)),
            "start": start,
            "sort": "date",
        }
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
    fieldnames = ["source", "title", "description", "link", "pub_date"]
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

def main():
    print("뉴스 수집 중...")
    news_items = fetch_items("news", 100)
    print(f"  뉴스 {len(news_items)}건 수집 완료")

    print("블로그 수집 중...")
    blog_items = fetch_items("blog", 100)
    print(f"  블로그 {len(blog_items)}건 수집 완료")

    rows = [parse_item(i, "news") for i in news_items] + \
           [parse_item(i, "blog") for i in blog_items]

    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "naver_results.csv")
    save_csv(rows, output_path)
    print(f"\nCSV 저장 완료: {output_path}")
    print(f"총 {len(rows)}건\n")

    print("=== 상위 10건 제목 ===")
    for i, row in enumerate(rows[:10], 1):
        print(f"{i:2}. [{row['source']}] {row['title']}")

if __name__ == "__main__":
    main()
