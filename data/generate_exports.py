"""
GPU 스펙 데이터 내보내기 스크립트
backend/gpu_specs.db 를 읽어 JSON, CSV, schema.json 으로 내보냅니다.
"""

import csv
import json
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "backend", "gpu_specs.db")
OUT_DIR = os.path.dirname(__file__)

JSON_OUT = os.path.join(OUT_DIR, "gpu_specs.json")
CSV_OUT = os.path.join(OUT_DIR, "gpu_specs.csv")
SCHEMA_OUT = os.path.join(OUT_DIR, "schema.json")

SCHEMA = [
    {"field": "id",               "type": "INTEGER", "ko": "고유 ID",            "en": "Unique row ID"},
    {"field": "name",             "type": "TEXT",    "ko": "GPU 모델명",          "en": "GPU model name"},
    {"field": "manufacturer",     "type": "TEXT",    "ko": "제조사",              "en": "Manufacturer (NVIDIA / AMD / Intel)"},
    {"field": "architecture",     "type": "TEXT",    "ko": "아키텍처",            "en": "GPU architecture / generation"},
    {"field": "gpu_chip",         "type": "TEXT",    "ko": "GPU 칩 코드네임",     "en": "GPU chip codename"},
    {"field": "release_date",     "type": "TEXT",    "ko": "출시일 (원문 텍스트)", "en": "Release date (raw text from Wikipedia)"},
    {"field": "release_year",     "type": "INTEGER", "ko": "출시 연도",           "en": "Release year (parsed integer)"},
    {"field": "bus_interface",    "type": "TEXT",    "ko": "버스 인터페이스",     "en": "PCIe bus interface"},
    {"field": "memory_size",      "type": "TEXT",    "ko": "메모리 용량 (원문)",  "en": "VRAM size (raw text)"},
    {"field": "memory_size_gb",   "type": "REAL",    "ko": "메모리 용량 (GB)",    "en": "VRAM size in gigabytes (parsed)"},
    {"field": "memory_type",      "type": "TEXT",    "ko": "메모리 종류",         "en": "Memory type (GDDR6, HBM2 …)"},
    {"field": "memory_bus",       "type": "TEXT",    "ko": "메모리 버스 폭",      "en": "Memory bus width (bits)"},
    {"field": "memory_bandwidth", "type": "TEXT",    "ko": "메모리 대역폭",       "en": "Memory bandwidth"},
    {"field": "gpu_clock",        "type": "TEXT",    "ko": "GPU 기본 클럭",       "en": "Base GPU clock"},
    {"field": "boost_clock",      "type": "TEXT",    "ko": "부스트 클럭",         "en": "Boost clock"},
    {"field": "memory_clock",     "type": "TEXT",    "ko": "메모리 클럭",         "en": "Memory clock"},
    {"field": "shaders",          "type": "TEXT",    "ko": "셰이더 프로세서 수",  "en": "Shader processor / CUDA core count"},
    {"field": "tmus",             "type": "TEXT",    "ko": "TMU 수",             "en": "Texture mapping unit count"},
    {"field": "rops",             "type": "TEXT",    "ko": "ROP 수",             "en": "Render output unit count"},
    {"field": "tdp",              "type": "TEXT",    "ko": "TDP (원문)",          "en": "Thermal design power (raw text)"},
    {"field": "tdp_w",            "type": "INTEGER", "ko": "TDP (W)",            "en": "TDP in watts (parsed integer)"},
    {"field": "process_node",     "type": "TEXT",    "ko": "공정 노드",           "en": "Manufacturing process node"},
    {"field": "transistors",      "type": "TEXT",    "ko": "트랜지스터 수",       "en": "Transistor count"},
    {"field": "die_size",         "type": "TEXT",    "ko": "다이 크기",           "en": "Die size"},
    {"field": "source_url",       "type": "TEXT",    "ko": "소스 URL",           "en": "Source URL"},
    {"field": "source_page",      "type": "TEXT",    "ko": "Wikipedia 페이지 제목", "en": "Wikipedia page title used for scraping"},
    {"field": "collected_at",     "type": "TEXT",    "ko": "수집 시각 (UTC ISO)", "en": "Timestamp when first scraped (UTC ISO 8601)"},
    {"field": "last_updated_at",  "type": "TEXT",    "ko": "마지막 갱신 시각",    "en": "Timestamp of last update (UTC ISO 8601)"},
    {"field": "created_at",       "type": "TEXT",    "ko": "DB 생성 시각",       "en": "Row creation timestamp in DB"},
]


def get_rows(conn: sqlite3.Connection) -> tuple[list[dict], list[str]]:
    conn.row_factory = sqlite3.Row
    cursor = conn.execute("SELECT * FROM gpus ORDER BY manufacturer, name")
    rows = [dict(r) for r in cursor.fetchall()]
    columns = [d[0] for d in cursor.description] if rows else []
    if not columns and rows:
        columns = list(rows[0].keys())
    return rows, columns


def export_json(rows: list[dict]) -> None:
    with open(JSON_OUT, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)
    print(f"JSON 내보내기 완료: {JSON_OUT} ({len(rows)}개)")


def export_csv(rows: list[dict], columns: list[str]) -> None:
    with open(CSV_OUT, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)
    print(f"CSV 내보내기 완료: {CSV_OUT} ({len(rows)}개)")


def export_schema() -> None:
    with open(SCHEMA_OUT, "w", encoding="utf-8") as f:
        json.dump(SCHEMA, f, ensure_ascii=False, indent=2)
    print(f"스키마 내보내기 완료: {SCHEMA_OUT}")


def print_stats(rows: list[dict]) -> None:
    total = len(rows)
    by_manufacturer: dict[str, int] = {}
    vram_missing = 0
    release_date_missing = 0

    for row in rows:
        mfr = row.get("manufacturer") or "기타"
        by_manufacturer[mfr] = by_manufacturer.get(mfr, 0) + 1
        if not row.get("memory_size"):
            vram_missing += 1
        if not row.get("release_date"):
            release_date_missing += 1

    print("\n=== 통계 ===")
    print(f"총 GPU: {total}개")
    for mfr, count in sorted(by_manufacturer.items()):
        print(f"  {mfr}: {count}개")
    if total:
        print(f"VRAM 미입력: {vram_missing}개 ({vram_missing / total * 100:.1f}%)")
        print(f"출시일 미입력: {release_date_missing}개 ({release_date_missing / total * 100:.1f}%)")
    print()


def main() -> None:
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"DB를 찾을 수 없습니다: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    try:
        rows, columns = get_rows(conn)
    finally:
        conn.close()

    if not rows:
        print("DB에 데이터가 없습니다. 먼저 크롤러를 실행하세요.")
        return

    if not columns:
        columns = list(rows[0].keys())

    export_json(rows)
    export_csv(rows, columns)
    export_schema()
    print_stats(rows)


if __name__ == "__main__":
    main()
