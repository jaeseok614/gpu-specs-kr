import React, { useState, useEffect, useCallback } from "react";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import GPUCard from "../components/GPUCard";
import ComparePanel from "../components/ComparePanel";
import { fetchGPUs, fetchManufacturers, fetchStats } from "../api";

const DEFAULT_FILTERS = {
  manufacturer: "",
  min_memory: "",
  max_memory: "",
  min_year: "",
  max_year: "",
};

export default function HomePage({ compareList, addToCompare, removeFromCompare, clearCompare }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [manufacturers, setManufacturers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadGPUs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchGPUs({
        search: search || undefined,
        manufacturer: filters.manufacturer || undefined,
        min_memory: filters.min_memory !== "" ? filters.min_memory : undefined,
        max_memory: filters.max_memory !== "" ? filters.max_memory : undefined,
        min_year: filters.min_year !== "" ? filters.min_year : undefined,
        max_year: filters.max_year !== "" ? filters.max_year : undefined,
        page,
        limit: 24,
      });
      setData(result);
    } catch (err) {
      setError("GPU 데이터를 불러오는 데 실패했습니다. 백엔드 서버가 실행 중인지 확인하세요.");
    } finally {
      setLoading(false);
    }
  }, [search, filters, page]);

  useEffect(() => {
    loadGPUs();
  }, [loadGPUs]);

  useEffect(() => {
    fetchManufacturers()
      .then((d) => setManufacturers(d.manufacturers || []))
      .catch(() => {});
    fetchStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  const handleSearchChange = (v) => {
    setSearch(v);
    setPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const compareIds = new Set(compareList.map((g) => g.id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Stats bar */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="총 GPU 수" value={stats.total_gpus.toLocaleString()} />
          <StatCard label="제조사 수" value={stats.total_manufacturers} />
          <StatCard label="최신 출시" value={stats.newest_release || "-"} />
          <StatCard label="최초 출시" value={stats.oldest_release || "-"} />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <FilterPanel
            filters={filters}
            manufacturers={manufacturers}
            onChange={handleFilterChange}
          />
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="mb-4">
            <SearchBar value={search} onChange={handleSearchChange} />
          </div>

          {/* Results info */}
          <div className="flex items-center justify-between mb-4">
            {data && (
              <p className="text-sm text-gray-400">
                전체{" "}
                <span className="text-green-400 font-semibold">
                  {data.total.toLocaleString()}
                </span>
                개의 GPU
                {search && (
                  <span>
                    {" "}
                    &mdash; &ldquo;<span className="text-gray-200">{search}</span>&rdquo; 검색 결과
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-48 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* GPU grid */}
          {!loading && data && (
            <>
              {data.items.length === 0 ? (
                <div className="text-center text-gray-400 py-16">
                  <div className="text-4xl mb-3">🔍</div>
                  <p>검색 결과가 없습니다.</p>
                  <p className="text-sm mt-1 text-gray-500">
                    다른 키워드나 필터를 사용해 보세요.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.items.map((gpu) => (
                    <GPUCard
                      key={gpu.id}
                      gpu={gpu}
                      onAddCompare={addToCompare}
                      inCompare={compareIds.has(gpu.id)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {data.total_pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded bg-gray-700 text-gray-300 text-sm disabled:opacity-40 hover:bg-gray-600 transition-colors"
                  >
                    이전
                  </button>

                  {getPaginationRange(page, data.total_pages).map((p, i) =>
                    p === "..." ? (
                      <span key={`dot-${i}`} className="text-gray-500 px-1">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1.5 rounded text-sm transition-colors ${
                          p === page
                            ? "bg-green-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                    disabled={page === data.total_pages}
                    className="px-3 py-1.5 rounded bg-gray-700 text-gray-300 text-sm disabled:opacity-40 hover:bg-gray-600 transition-colors"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Compare floating panel */}
      <ComparePanel
        compareList={compareList}
        onRemove={removeFromCompare}
        onClear={clearCompare}
      />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-bold text-green-400">{value}</div>
    </div>
  );
}

function getPaginationRange(current, total) {
  const delta = 2;
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }

  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push("...");
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
}
