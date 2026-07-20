import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Floating panel showing GPUs selected for comparison.
 */
export default function ComparePanel({ compareList, onRemove, onClear }) {
  const navigate = useNavigate();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="bg-gray-900 border border-green-600 rounded-xl shadow-2xl shadow-black/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-green-400">
            비교 목록 ({compareList.length}/3)
          </h3>
          <button
            onClick={onClear}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            전체 삭제
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* GPU slots */}
          <div className="flex flex-1 gap-2">
            {compareList.map((gpu) => (
              <div
                key={gpu.id}
                className="flex-1 bg-gray-800 rounded-lg px-3 py-2 flex items-center justify-between gap-1 min-w-0"
              >
                <span className="text-xs text-gray-200 truncate flex-1">{gpu.name}</span>
                <button
                  onClick={() => onRemove(gpu.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors ml-1 flex-shrink-0"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: 3 - compareList.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex-1 bg-gray-800 border border-dashed border-gray-600 rounded-lg px-3 py-2 flex items-center justify-center"
              >
                <span className="text-xs text-gray-600">빈 슬롯</span>
              </div>
            ))}
          </div>

          {/* Compare button */}
          <button
            onClick={() => navigate("/compare")}
            disabled={compareList.length < 2}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
              compareList.length >= 2
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            비교하기
          </button>
        </div>
      </div>
    </div>
  );
}
