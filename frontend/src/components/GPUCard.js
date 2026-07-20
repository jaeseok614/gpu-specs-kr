import React from "react";
import { Link } from "react-router-dom";

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
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded border font-medium ${colorClass}`}
    >
      {manufacturer || "기타"}
    </span>
  );
}

/**
 * GPU Card for list/grid display.
 * @param {{ gpu: Object, onAddCompare: (gpu: Object) => void, inCompare: boolean }} props
 */
export default function GPUCard({ gpu, onAddCompare, inCompare }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-500 transition-colors flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link
            to={`/gpu/${gpu.id}`}
            className="text-gray-100 font-semibold text-sm hover:text-green-400 transition-colors line-clamp-2 leading-tight"
          >
            {gpu.name}
          </Link>
          <div className="mt-1">
            <ManufacturerBadge manufacturer={gpu.manufacturer} />
          </div>
        </div>
      </div>

      {/* Specs grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <SpecItem label="VRAM" value={gpu.memory_size} />
        <SpecItem label="메모리 종류" value={gpu.memory_type} />
        <SpecItem label="GPU 클럭" value={gpu.gpu_clock} />
        <SpecItem label="부스트 클럭" value={gpu.boost_clock} />
        <SpecItem label="TDP" value={gpu.tdp ? `${gpu.tdp}` : null} />
        <SpecItem label="출시일" value={gpu.release_date} />
      </div>

      {/* Chip */}
      {gpu.gpu_chip && (
        <div className="text-xs text-gray-500 truncate">
          칩: <span className="text-gray-400">{gpu.gpu_chip}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-700">
        <Link
          to={`/gpu/${gpu.id}`}
          className="flex-1 text-center text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 py-1.5 rounded transition-colors"
        >
          상세 보기
        </Link>
        <button
          onClick={() => onAddCompare(gpu)}
          disabled={inCompare}
          className={`flex-1 text-xs py-1.5 rounded transition-colors ${
            inCompare
              ? "bg-green-900 text-green-400 cursor-default border border-green-700"
              : "bg-green-700 hover:bg-green-600 text-white"
          }`}
        >
          {inCompare ? "비교 추가됨" : "비교에 추가"}
        </button>
      </div>
    </div>
  );
}

function SpecItem({ label, value }) {
  return (
    <div>
      <span className="text-gray-500">{label}: </span>
      <span className="text-gray-300">{value || "-"}</span>
    </div>
  );
}
