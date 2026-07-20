import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import GPUDetailPage from "./pages/GPUDetailPage";
import ComparePage from "./pages/ComparePage";

export default function App() {
  const [compareList, setCompareList] = useState([]);

  const addToCompare = (gpu) => {
    setCompareList((prev) => {
      if (prev.find((g) => g.id === gpu.id)) return prev;
      if (prev.length >= 3) {
        alert("최대 3개의 GPU만 비교할 수 있습니다.");
        return prev;
      }
      return [...prev, gpu];
    });
  };

  const removeFromCompare = (id) => {
    setCompareList((prev) => prev.filter((g) => g.id !== id));
  };

  const clearCompare = () => setCompareList([]);

  return (
    <BrowserRouter>
      {/* Navigation */}
      <nav className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-green-400 text-2xl font-bold tracking-tight">
              GPU
            </span>
            <span className="text-gray-100 text-2xl font-bold tracking-tight">
              스펙 DB
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <Link
              to="/"
              className="hover:text-green-400 transition-colors"
            >
              홈
            </Link>
            {compareList.length > 0 && (
              <Link
                to="/compare"
                className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-md transition-colors"
              >
                <span>비교</span>
                <span className="bg-green-800 rounded-full px-1.5 py-0.5 text-xs">
                  {compareList.length}
                </span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="min-h-screen bg-gray-900">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                compareList={compareList}
                addToCompare={addToCompare}
                removeFromCompare={removeFromCompare}
                clearCompare={clearCompare}
              />
            }
          />
          <Route
            path="/gpu/:id"
            element={
              <GPUDetailPage
                compareList={compareList}
                addToCompare={addToCompare}
              />
            }
          />
          <Route
            path="/compare"
            element={
              <ComparePage
                compareList={compareList}
                removeFromCompare={removeFromCompare}
                clearCompare={clearCompare}
              />
            }
          />
        </Routes>
      </main>

      <footer className="bg-gray-900 border-t border-gray-800 text-center text-gray-500 text-xs py-4 mt-8">
        GPU 스펙 DB &mdash; 오픈소스 프로젝트 &middot; 데이터 출처:{" "}
        <a
          href="https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-green-400"
        >
          Wikipedia
        </a>
        {" "}(CC BY-SA 4.0)
      </footer>
    </BrowserRouter>
  );
}
