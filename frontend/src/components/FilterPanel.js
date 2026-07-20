import React from "react";

const VRAM_OPTIONS = [
  { label: "전체", value: "" },
  { label: "1GB 이하", min: 0, max: 1 },
  { label: "2GB", min: 1, max: 2 },
  { label: "4GB", min: 2, max: 4 },
  { label: "6GB", min: 4, max: 6 },
  { label: "8GB", min: 6, max: 8 },
  { label: "12GB", min: 8, max: 12 },
  { label: "16GB", min: 12, max: 16 },
  { label: "24GB 이상", min: 16, max: 9999 },
];

const YEAR_OPTIONS = [
  { label: "전체", value: "" },
  { label: "2024~", min: 2024, max: 2030 },
  { label: "2022~2023", min: 2022, max: 2023 },
  { label: "2020~2021", min: 2020, max: 2021 },
  { label: "2018~2019", min: 2018, max: 2019 },
  { label: "2016~2017", min: 2016, max: 2017 },
  { label: "~2015", min: 1990, max: 2015 },
];

/**
 * Filter panel for manufacturer, VRAM, and year.
 */
export default function FilterPanel({ filters, manufacturers, onChange }) {
  const handleManufacturer = (e) => {
    onChange({ ...filters, manufacturer: e.target.value });
  };

  const handleVram = (e) => {
    const idx = parseInt(e.target.value, 10);
    if (isNaN(idx) || idx === 0) {
      onChange({ ...filters, min_memory: "", max_memory: "" });
    } else {
      const opt = VRAM_OPTIONS[idx];
      onChange({ ...filters, min_memory: opt.min, max_memory: opt.max });
    }
  };

  const handleYear = (e) => {
    const idx = parseInt(e.target.value, 10);
    if (isNaN(idx) || idx === 0) {
      onChange({ ...filters, min_year: "", max_year: "" });
    } else {
      const opt = YEAR_OPTIONS[idx];
      onChange({ ...filters, min_year: opt.min, max_year: opt.max });
    }
  };

  const selectedVramIdx = VRAM_OPTIONS.findIndex(
    (o) => o.min === filters.min_memory && o.max === filters.max_memory
  );
  const selectedYearIdx = YEAR_OPTIONS.findIndex(
    (o) => o.min === filters.min_year && o.max === filters.max_year
  );

  const hasActiveFilters =
    filters.manufacturer || filters.min_memory !== "" || filters.min_year !== "";

  const resetAll = () => {
    onChange({
      manufacturer: "",
      min_memory: "",
      max_memory: "",
      min_year: "",
      max_year: "",
    });
  };

  const selectClass =
    "w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-md py-2 px-3 text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent " +
    "cursor-pointer appearance-none";

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          필터
        </h3>
        {hasActiveFilters && (
          <button
            onClick={resetAll}
            className="text-xs text-green-400 hover:text-green-300 transition-colors"
          >
            초기화
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Manufacturer */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">제조사</label>
          <div className="relative">
            <select
              value={filters.manufacturer || ""}
              onChange={handleManufacturer}
              className={selectClass}
            >
              <option value="">전체</option>
              {manufacturers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* VRAM */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">VRAM 용량</label>
          <div className="relative">
            <select
              value={selectedVramIdx > 0 ? selectedVramIdx : 0}
              onChange={handleVram}
              className={selectClass}
            >
              {VRAM_OPTIONS.map((opt, idx) => (
                <option key={idx} value={idx}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Year */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">출시 연도</label>
          <div className="relative">
            <select
              value={selectedYearIdx > 0 ? selectedYearIdx : 0}
              onChange={handleYear}
              className={selectClass}
            >
              {YEAR_OPTIONS.map((opt, idx) => (
                <option key={idx} value={idx}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
