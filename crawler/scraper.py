"""
GPU Specs Crawler - Wikipedia 기반
NVIDIA, AMD, Intel GPU 스펙을 Wikipedia에서 수집하여 SQLite DB에 저장합니다.
"""

import sqlite3
import time
import re
import logging
import os
from typing import Optional

import requests
from bs4 import BeautifulSoup, Tag

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

WIKI_API = "https://en.wikipedia.org/w/api.php"
WIKI_HEADERS = {"User-Agent": "GPUSpecsKR/1.0 (personal project; educational use)"}

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "backend", "gpu_specs.db")

WIKI_PAGES = {
    "NVIDIA": ["List_of_Nvidia_graphics_processing_units"],
    "AMD":    ["List_of_AMD_graphics_processing_units"],
    "Intel":  ["Intel_Arc"],
}

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS gpus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    manufacturer TEXT,
    architecture TEXT,
    gpu_chip TEXT,
    release_date TEXT,
    bus_interface TEXT,
    memory_size TEXT,
    memory_type TEXT,
    memory_bus TEXT,
    memory_bandwidth TEXT,
    gpu_clock TEXT,
    boost_clock TEXT,
    memory_clock TEXT,
    shaders TEXT,
    tmus TEXT,
    rops TEXT,
    tdp TEXT,
    process_node TEXT,
    transistors TEXT,
    die_size TEXT,
    source_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, manufacturer)
);
"""


# ── DB ──────────────────────────────────────────────────────────────────────

def get_db() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_db()
    conn.execute(CREATE_TABLE_SQL)
    conn.commit()
    conn.close()
    logger.info("DB 초기화: %s", DB_PATH)


# ── Wikipedia 페이지 가져오기 ────────────────────────────────────────────────

def fetch_wiki_html(page_title: str) -> Optional[BeautifulSoup]:
    params = {
        "action": "parse", "page": page_title,
        "format": "json", "prop": "text", "disableeditsection": "1",
    }
    try:
        r = requests.get(WIKI_API, params=params, headers=WIKI_HEADERS, timeout=20)
        r.raise_for_status()
        data = r.json()
        if "parse" not in data:
            return None
        return BeautifulSoup(data["parse"]["text"]["*"], "lxml")
    except Exception as e:
        logger.error("fetch_wiki_html 실패 (%s): %s", page_title, e)
        return None


# ── 텍스트 정리 ──────────────────────────────────────────────────────────────

def clean(text: str) -> str:
    text = re.sub(r'\[.*?\]', '', text)   # 각주
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def is_empty(val: str) -> bool:
    return not val or val in ("-", "–", "—", "N/A", "n/a", "?", "TBD", "TBA")


# ── 테이블 그리드 빌더 (rowspan/colspan 완전 처리) ───────────────────────────

def build_grid(table: Tag) -> dict[tuple[int, int], str]:
    """HTML 테이블을 2D 딕셔너리 (row, col) → text 로 변환"""
    grid: dict[tuple[int, int], str] = {}
    for row_idx, row in enumerate(table.find_all("tr")):
        col_idx = 0
        for cell in row.find_all(["th", "td"]):
            while (row_idx, col_idx) in grid:
                col_idx += 1
            text = clean(cell.get_text())
            try:
                cs = int(re.sub(r"[^\d]", "", str(cell.get("colspan", "1"))) or 1)
                rs = int(re.sub(r"[^\d]", "", str(cell.get("rowspan", "1"))) or 1)
            except ValueError:
                cs = rs = 1
            for r in range(row_idx, row_idx + rs):
                for c in range(col_idx, col_idx + cs):
                    grid[(r, c)] = text
            col_idx += cs
    return grid


def get_num_cols(grid: dict) -> int:
    if not grid:
        return 0
    return max(c for _, c in grid.keys()) + 1


def get_num_rows(grid: dict) -> int:
    if not grid:
        return 0
    return max(r for r, _ in grid.keys()) + 1


# ── 헤더 행 수 판별 ──────────────────────────────────────────────────────────

def count_header_rows(table: Tag) -> int:
    """<th> 셀이 과반수인 행의 수를 헤더 행으로 간주"""
    count = 0
    for row in table.find_all("tr"):
        cells = row.find_all(["th", "td"])
        if not cells:
            continue
        th_ratio = sum(1 for c in cells if c.name == "th") / len(cells)
        if th_ratio >= 0.5:
            count += 1
        else:
            break
    return max(count, 1)


# ── 헤더 → DB 필드 매핑 ──────────────────────────────────────────────────────

FIELD_MAP = [
    # (키워드들, db필드)  ── 키워드는 공백/괄호 제거 후 매칭됨
    (["model"],                                             "name"),
    (["launchdate", "launch", "released", "releasedate"],  "release_date"),
    (["codename", "code name"],                            "gpu_chip"),
    (["fab", "process", "lithography", "node"],            "process_node"),
    (["transistors"],                                      "transistors"),
    (["diesize", "die size"],                              "die_size"),
    (["businterface", "bus interface"],                    "bus_interface"),
    (["boost clock", "boostclock", "boost"],               "boost_clock"),
    (["core clock", "baseclock", "coremhz", "core (mhz)"], "gpu_clock"),
    (["memclock", "mem clock", "memoryclock", "memory clock", "memorymhz"], "memory_clock"),
    # shaders: CoreConfig, Shader Processors, CUDA Cores 등 (PixelShader 제외)
    (["coreconfig", "core config", "shader proc", "stream proc",
      "cuda core", "execution unit", "xe core", "shadersprocessors"], "shaders"),
    (["tmu", "texture unit"],                              "tmus"),
    (["rop", "render output"],                             "rops"),
    # memory size: Size(MB), Size(GB) 등 (DieSize 제외 - 위에서 먼저 처리됨)
    (["sizemb", "sizegb", "vram", "mem size", "memory size", "memorysize"], "memory_size"),
    (["buswidth", "bus width", "mem bus", "membus"],       "memory_bus"),
    (["bandwidth"],                                        "memory_bandwidth"),
    (["bustype", "bus type", "mem type", "memtype"],       "memory_type"),
    (["tdp", "board power", "boardpower", "thermal design"], "tdp"),
]

# 무시할 헤더 키워드 (잘못 매핑될 수 있는 것들)
IGNORE_HEADERS = {"pixelshader", "pixel shader", "texel", "fillrate",
                  "direct3d", "opengl", "vulkan", "directx", "msrp",
                  "price", "apisupport", "api support"}


def header_to_field(header: str) -> Optional[str]:
    h = header.lower()
    # 공백·괄호·특수문자 제거 버전
    h_clean = re.sub(r'[\s()\[\]²/,·]', '', h)

    # 무시 목록 체크
    if any(ig in h_clean for ig in IGNORE_HEADERS):
        return None

    for keywords, field in FIELD_MAP:
        for kw in keywords:
            kw_clean = re.sub(r'[\s()\[\]²/,·]', '', kw)
            if kw_clean in h_clean:
                return field
    return None


# ── 테이블 파싱 ──────────────────────────────────────────────────────────────

def parse_table(table: Tag, manufacturer: str, architecture: str) -> list[dict]:
    grid = build_grid(table)
    if not grid:
        return []

    num_rows = get_num_rows(grid)
    num_cols = get_num_cols(grid)
    n_header = count_header_rows(table)

    # 각 컬럼의 리프 헤더(마지막 헤더 행 값) → DB 필드 결정
    col_field: dict[int, str] = {}
    for col in range(num_cols):
        # 헤더 행을 아래에서 위로 보며 의미있는 이름 찾기
        for row in range(n_header - 1, -1, -1):
            val = grid.get((row, col), "")
            if val:
                field = header_to_field(val)
                if field:
                    col_field[col] = field
                    break

    if not col_field:
        return []

    gpus = []
    for row in range(n_header, num_rows):
        gpu: dict = {"manufacturer": manufacturer, "architecture": architecture}
        for col, field in col_field.items():
            val = grid.get((row, col), "")
            if not is_empty(val) and field not in gpu:
                gpu[field] = val

        # 헤더 행이 데이터로 들어온 경우 제거 (name이 "Model", "GPU" 등인 경우)
        _header_words = {"model", "gpu", "card", "product", "name", "processor"}
        name_val = (gpu.get("name") or "").lower().strip()
        if name_val in _header_words:
            continue

        # 이름 있고 필드가 3개 이상이면 유효한 GPU
        if gpu.get("name") and len(gpu) >= 4:
            gpus.append(gpu)

    return gpus


# ── 페이지 전체 수집 ──────────────────────────────────────────────────────────

def scrape_page(page_title: str, manufacturer: str) -> list[dict]:
    logger.info("[%s] 수집 중: %s", manufacturer, page_title)
    soup = fetch_wiki_html(page_title)
    if not soup:
        return []

    all_gpus: list[dict] = []
    current_arch = ""

    for element in soup.find_all(["h2", "h3", "table"]):
        if element.name in ("h2", "h3"):
            current_arch = clean(element.get_text()).split("[")[0].strip()
        elif element.name == "table" and "wikitable" in element.get("class", []):
            gpus = parse_table(element, manufacturer, current_arch)
            if gpus:
                logger.info("  [%s] %d개", current_arch or "?", len(gpus))
                all_gpus.extend(gpus)

    return all_gpus


# ── DB 저장 ──────────────────────────────────────────────────────────────────

def upsert_gpu(conn: sqlite3.Connection, data: dict) -> None:
    fields = [
        "name", "manufacturer", "architecture", "gpu_chip", "release_date",
        "bus_interface", "memory_size", "memory_type", "memory_bus",
        "memory_bandwidth", "gpu_clock", "boost_clock", "memory_clock",
        "shaders", "tmus", "rops", "tdp", "process_node",
        "transistors", "die_size", "source_url",
    ]
    row = {f: data.get(f) for f in fields}
    conn.execute(
        """
        INSERT INTO gpus (name, manufacturer, architecture, gpu_chip, release_date,
            bus_interface, memory_size, memory_type, memory_bus, memory_bandwidth,
            gpu_clock, boost_clock, memory_clock, shaders, tmus, rops, tdp,
            process_node, transistors, die_size, source_url)
        VALUES (:name, :manufacturer, :architecture, :gpu_chip, :release_date,
            :bus_interface, :memory_size, :memory_type, :memory_bus, :memory_bandwidth,
            :gpu_clock, :boost_clock, :memory_clock, :shaders, :tmus, :rops, :tdp,
            :process_node, :transistors, :die_size, :source_url)
        ON CONFLICT(name, manufacturer) DO UPDATE SET
            architecture=excluded.architecture,
            gpu_chip=excluded.gpu_chip, release_date=excluded.release_date,
            bus_interface=excluded.bus_interface, memory_size=excluded.memory_size,
            memory_type=excluded.memory_type, memory_bus=excluded.memory_bus,
            memory_bandwidth=excluded.memory_bandwidth, gpu_clock=excluded.gpu_clock,
            boost_clock=excluded.boost_clock, memory_clock=excluded.memory_clock,
            shaders=excluded.shaders, tmus=excluded.tmus, rops=excluded.rops,
            tdp=excluded.tdp, process_node=excluded.process_node,
            transistors=excluded.transistors, die_size=excluded.die_size
        """,
        row,
    )


# ── 메인 ────────────────────────────────────────────────────────────────────

def run_crawler(limit: Optional[int] = None, delay: float = 1.0) -> None:
    init_db()
    conn = get_db()
    saved = errors = 0

    for manufacturer, pages in WIKI_PAGES.items():
        for page_title in pages:
            gpus = scrape_page(page_title, manufacturer)
            if limit:
                gpus = gpus[:max(0, limit - saved)]
            for gpu in gpus:
                if not gpu.get("name"):
                    continue
                try:
                    upsert_gpu(conn, gpu)
                    conn.commit()
                    saved += 1
                except Exception as e:
                    logger.debug("저장 실패 (%s): %s", gpu.get("name"), e)
                    errors += 1
            if limit and saved >= limit:
                break
            time.sleep(delay)
        if limit and saved >= limit:
            break

    conn.close()
    logger.info("완료! 저장: %d개, 오류: %d개", saved, errors)


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--limit", type=int, default=None)
    p.add_argument("--delay", type=float, default=1.0)
    args = p.parse_args()
    run_crawler(limit=args.limit, delay=args.delay)
