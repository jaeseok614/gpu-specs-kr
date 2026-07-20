/**
 * GPU Specs KR - API layer
 * 정적 JSON(GitHub Pages용)과 FastAPI(로컬 개발용)를 모두 지원합니다.
 */

const JSON_URL =
  "https://raw.githubusercontent.com/jaeseok614/gpu-specs-kr/main/data/gpu_specs.json";
const API_BASE = "http://localhost:8000";

// 전체 GPU 목록 캐시 (정적 모드에서 한 번만 로드)
let _cache = null;

async function loadAll() {
  if (_cache) return _cache;
  const res = await fetch(JSON_URL);
  if (!res.ok) throw new Error("JSON 로드 실패");
  _cache = await res.json();
  return _cache;
}

// 문자열에서 GB 추출
function toGB(str) {
  if (!str) return null;
  const s = String(str).toUpperCase();
  let m = s.match(/([\d.]+)\s*GB/);
  if (m) return parseFloat(m[1]);
  m = s.match(/([\d.]+)\s*MB/);
  if (m) return parseFloat(m[1]) / 1024;
  // 순수 숫자(구형 GPU: "1", "4" 등은 MB 단위가 많음)
  m = s.match(/^([\d.]+)$/);
  if (m) return parseFloat(m[1]) < 64 ? parseFloat(m[1]) : parseFloat(m[1]) / 1024;
  return null;
}

function toYear(str) {
  if (!str) return null;
  const m = String(str).match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0]) : null;
}

/**
 * GPU 목록 조회 (검색·필터·페이지네이션 클라이언트 처리)
 */
export async function fetchGPUs(params = {}) {
  const {
    search, manufacturer,
    min_memory, max_memory,
    min_year, max_year,
    page = 1, limit = 24,
  } = params;

  // 정적 JSON 시도
  try {
    let gpus = await loadAll();

    // 최신순 정렬
    gpus = [...gpus].sort((a, b) => {
      const ya = a.release_year || 0;
      const yb = b.release_year || 0;
      if (yb !== ya) return yb - ya;
      return (b.release_date || "").localeCompare(a.release_date || "");
    });

    // 검색
    if (search) {
      const q = search.toLowerCase().replace(/\s/g, "");
      gpus = gpus.filter((g) => {
        const name = (g.name || "").toLowerCase().replace(/\s/g, "");
        const chip = (g.gpu_chip || "").toLowerCase().replace(/\s/g, "");
        const mfr  = (g.manufacturer || "").toLowerCase();
        return name.includes(q) || chip.includes(q) || mfr.includes(q);
      });
    }

    // 제조사 필터
    if (manufacturer) {
      const mq = manufacturer.toLowerCase();
      gpus = gpus.filter((g) => (g.manufacturer || "").toLowerCase().includes(mq));
    }

    // VRAM 필터
    if (min_memory || max_memory) {
      gpus = gpus.filter((g) => {
        const gb = g.memory_size_gb ?? toGB(g.memory_size);
        if (gb === null) return false;
        if (min_memory && gb < Number(min_memory)) return false;
        if (max_memory && gb > Number(max_memory)) return false;
        return true;
      });
    }

    // 출시 연도 필터
    if (min_year || max_year) {
      gpus = gpus.filter((g) => {
        const yr = g.release_year ?? toYear(g.release_date);
        if (!yr) return false;
        if (min_year && yr < Number(min_year)) return false;
        if (max_year && yr > Number(max_year)) return false;
        return true;
      });
    }

    const total = gpus.length;
    const total_pages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const items = gpus.slice(offset, offset + limit);

    return { total, page, limit, total_pages, items };
  } catch {
    // FastAPI 폴백
    const url = new URL(`${API_BASE}/gpus`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
    const res = await fetch(url);
    if (!res.ok) throw new Error("API 요청 실패");
    return res.json();
  }
}

/**
 * GPU 단건 조회
 */
export async function fetchGPU(id) {
  try {
    const gpus = await loadAll();
    const gpu = gpus.find((g) => g.id === Number(id));
    if (!gpu) throw new Error("Not found");
    return gpu;
  } catch {
    const res = await fetch(`${API_BASE}/gpus/${id}`);
    if (!res.ok) throw new Error("API 요청 실패");
    return res.json();
  }
}

/**
 * GPU 비교
 */
export async function compareGPUs(ids) {
  try {
    const gpus = await loadAll();
    const result = ids.map((id) => gpus.find((g) => g.id === Number(id))).filter(Boolean);
    if (result.length !== ids.length) throw new Error("Not found");
    return { gpus: result };
  } catch {
    const res = await fetch(`${API_BASE}/gpus/compare?ids=${ids.join(",")}`);
    if (!res.ok) throw new Error("API 요청 실패");
    return res.json();
  }
}

/**
 * 제조사 목록
 */
export async function fetchManufacturers() {
  try {
    const gpus = await loadAll();
    const set = [...new Set(gpus.map((g) => g.manufacturer).filter(Boolean))].sort();
    return { manufacturers: set };
  } catch {
    const res = await fetch(`${API_BASE}/gpus/manufacturers`);
    return res.json();
  }
}

/**
 * 전체 통계
 */
export async function fetchStats() {
  try {
    const gpus = await loadAll();
    const mfrs = {};
    gpus.forEach((g) => { if (g.manufacturer) mfrs[g.manufacturer] = (mfrs[g.manufacturer] || 0) + 1; });
    return {
      total_gpus: gpus.length,
      total_manufacturers: Object.keys(mfrs).length,
      newest_release: gpus.filter((g) => g.release_date).sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""))[0]?.release_date || null,
      oldest_release: gpus.filter((g) => g.release_date).sort((a, b) => (a.release_date || "").localeCompare(b.release_date || ""))[0]?.release_date || null,
    };
  } catch {
    const res = await fetch(`${API_BASE}/gpus/stats`);
    return res.json();
  }
}
