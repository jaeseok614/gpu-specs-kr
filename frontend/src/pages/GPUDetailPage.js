import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchGPU } from "../api";

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

export default function GPUDetailPage({ compareList, addToCompare }) {
  const { id } = useParams();
  const [gpu, setGpu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const inCompare = compareList.some((g) => g.id === parseInt(id, 10));

  useEffect(() => {
    setLoading(true);
    fetchGPU(id)
      .then(setGpu)
      .catch(() => setError("GPU 정보를 불러오는 데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-2/3" />
          <div className="h-4 bg-gray-700 rounded w-1/3" />
          <div className="h-64 bg-gray-800 rounded-lg mt-6" />
        </div>
      </div>
    );
  }

  if (error || !gpu) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
          {error || "GPU를 찾을 수 없습니다."}
        </div>
        <Link
          to="/"
          className="inline-block mt-4 text-green-400 hover:text-green-300 text-sm transition-colors"
        >
          &larr; 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-green-400 transition-colors">
          홈
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-300">{gpu.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-8">
        {/* GPU Image */}
        {gpu.image_url && (
          <div className="flex-shrink-0">
            <img
              src={gpu.image_url}
              alt={gpu.name}
              className="w-48 h-auto rounded-lg bg-gray-800 border border-gray-700 object-contain p-2"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        )}

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-100 mb-2">{gpu.name}</h1>
          {gpu.manufacturer && (
            <ManufacturerBadge manufacturer={gpu.manufacturer} />
          )}
          {gpu.gpu_chip && (
            <p className="text-sm text-gray-400 mt-2">
              칩셋: <span className="text-gray-300">{gpu.gpu_chip}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => addToCompare(gpu)}
              disabled={inCompare}
              className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                inCompare
                  ? "bg-green-900 text-green-400 border border-green-700 cursor-default"
                  : "bg-green-600 hover:bg-green-500 text-white"
              }`}
            >
              {inCompare ? "비교 목록에 있음" : "비교에 추가"}
            </button>

            {gpu.techpowerup_url && (
              <a
                href={gpu.techpowerup_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
              >
                TechPowerUp에서 보기 &rarr;
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Quick summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <QuickStat label="VRAM" value={gpu.memory_size} />
        <QuickStat label="GPU 클럭" value={gpu.gpu_clock} />
        <QuickStat label="부스트 클럭" value={gpu.boost_clock} />
        <QuickStat label="TDP" value={gpu.tdp} />
      </div>

      {/* Full specs table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700 bg-gray-750">
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
            전체 사양
          </h2>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-700">
            {SPEC_FIELDS.map(({ key, label }) => {
              const value = gpu[key];
              return (
                <tr key={key} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3 text-gray-400 font-medium w-1/3 whitespace-nowrap">
                    {label}
                  </td>
                  <td className="px-5 py-3 text-gray-200">
                    {value || <span className="text-gray-600">-</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Link
          to="/"
          className="text-green-400 hover:text-green-300 text-sm transition-colors"
        >
          &larr; 목록으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

function QuickStat({ label, value }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-base font-semibold text-green-400">{value || "-"}</div>
    </div>
  );
}

function ManufacturerBadge({ manufacturer }) {
  const colorMap = {
    nvidia: "bg-green-900 text-green-300 border-green-700",
    amd: "bg-red-900 text-red-300 border-red-700",
    intel: "bg-blue-900 text-blue-300 border-blue-700",
    ati: "bg-orange-900 text-orange-300 border-orange-700",
  };
  const key = (manufacturer || "").toLowerCase();
  const colorClass =
    Object.entries(colorMap).find(([k]) => key.includes(k))?.[1] ||
    "bg-gray-700 text-gray-300 border-gray-600";

  return (
    <span className={`inline-block text-sm px-3 py-0.5 rounded border font-medium ${colorClass}`}>
      {manufacturer}
    </span>
  );
}
