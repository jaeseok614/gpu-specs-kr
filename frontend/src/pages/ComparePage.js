import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { compareGPUs } from "../api";

const SPEC_FIELDS = [
  { key: "manufacturer", label: "제조사" },
  { key: "gpu_chip", label: "GPU 칩" },
  { key: "release_date", label: "출시일" },
  { key: "bus_interface", label: "버스 인터페이스" },
  { key: "memory_size", label: "메모리 용량" },
  { key: "memory_type", label: "메모리 종류" },
  { key: "memory_bus", label: "메모리 버스" },
  { key: "gpu_clock", label: "GPU 클럭" },
  { key: "boost_clock", label: "부스트 클럭" },
  { key: "memory_clock", label: "메모리 클럭" },
  { key: "shaders", label: "셰이더 프로세서" },
  { key: "tmus", label: "TMU" },
  { key: "rops", label: "ROP" },
  { key: "tdp", label: "TDP (W)" },
  { key: "process_node", label: "공정" },
  { key: "transistors", label: "트랜지스터" },
  { key: "die_size", label: "다이 크기" },
];

// Fields where HIGHER value is BETTER
const HIGHER_IS_BETTER = new Set([
  "memory_size",
  "memory_bus",
  "gpu_clock",
  "boost_clock",
  "memory_clock",
  "shaders",
  "tmus",
  "rops",
  "transistors",
]);

// Fields where LOWER value is BETTER
const LOWER_IS_BETTER = new Set(["tdp", "process_node"]);

function extractNumber(str) {
  if (!str) return null;
  const match = str.match(/[\d,]+(?:\.\d+)?/);
  if (!match) return null;
  return parseFloat(match[0].replace(/,/g, ""));
}

function getBestIndex(values, field) {
  const nums = values.map(extractNumber);
  const valid = nums.filter((n) => n !== null);
  if (valid.length < 2) return null;

  const target = HIGHER_IS_BETTER.has(field)
    ? Math.max(...valid)
    : LOWER_IS_BETTER.has(field)
    ? Math.min(...valid)
    : null;

  if (target === null) return null;
  return nums.map((n) => n === target);
}

export default function ComparePage({ compareList, removeFromCompare, clearCompare }) {
  const navigate = useNavigate();
  const [gpuData, setGpuData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (compareList.length < 2) return;

    setLoading(true);
    compareGPUs(compareList.map((g) => g.id))
      .then((res) => setGpuData(res.gpus || []))
      .catch(() => setError("비교 데이터를 불러오는 데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [compareList]);

  if (compareList.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">⚖️</div>
        <h2 className="text-xl font-bold text-gray-200 mb-2">
          비교할 GPU가 부족합니다
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          최소 2개의 GPU를 비교 목록에 추가하세요.
        </p>
        <Link
          to="/"
          className="inline-block bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          GPU 목록으로 이동
        </Link>
      </div>
    );
  }

  const displayGPUs = gpuData.length > 0 ? gpuData : compareList;
  const colCount = displayGPUs.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-100">GPU 비교</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {colCount}개의 GPU 비교 중
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearCompare}
            className="text-sm text-red-400 hover:text-red-300 border border-red-800 hover:border-red-700 px-3 py-1.5 rounded transition-colors"
          >
            목록 초기화
          </button>
          <Link
            to="/"
            className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded transition-colors"
          >
            &larr; 목록으로
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse bg-gray-800 rounded-xl h-96" />
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-5 py-4 text-left text-gray-400 font-medium w-40 min-w-[10rem]">
                  사양
                </th>
                {displayGPUs.map((gpu) => (
                  <th
                    key={gpu.id}
                    className="px-5 py-4 text-center align-top"
                    style={{ minWidth: "180px" }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Link
                        to={`/gpu/${gpu.id}`}
                        className="text-gray-100 font-semibold hover:text-green-400 transition-colors text-sm leading-tight"
                      >
                        {gpu.name}
                      </Link>
                      {gpu.manufacturer && (
                        <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
                          {gpu.manufacturer}
                        </span>
                      )}
                      <button
                        onClick={() => removeFromCompare(gpu.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        제거
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {SPEC_FIELDS.map(({ key, label }) => {
                const values = displayGPUs.map((gpu) => gpu[key] || null);
                const bestFlags = getBestIndex(values, key);
                const allSame =
                  values.every((v) => v === values[0]) && values[0] !== null;

                return (
                  <tr
                    key={key}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-5 py-3 text-gray-400 font-medium whitespace-nowrap">
                      {label}
                    </td>
                    {values.map((val, i) => {
                      const isBest = bestFlags ? bestFlags[i] : false;
                      return (
                        <td
                          key={i}
                          className={`px-5 py-3 text-center ${
                            isBest
                              ? "text-green-400 font-semibold"
                              : allSame
                              ? "text-gray-300"
                              : "text-gray-300"
                          }`}
                        >
                          {val ? (
                            <span
                              className={
                                isBest
                                  ? "bg-green-900/40 px-2 py-0.5 rounded border border-green-800"
                                  : ""
                              }
                            >
                              {val}
                            </span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
        <span
          className="inline-block bg-green-900/40 border border-green-800 text-green-400 px-2 py-0.5 rounded"
        >
          녹색
        </span>
        <span>= 해당 항목에서 더 나은 값</span>
      </div>
    </div>
  );
}
