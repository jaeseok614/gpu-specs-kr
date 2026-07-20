import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Fetch paginated GPU list with optional filters.
 * @param {Object} params
 * @param {string} [params.search]
 * @param {string} [params.manufacturer]
 * @param {number} [params.min_memory]
 * @param {number} [params.max_memory]
 * @param {number} [params.min_year]
 * @param {number} [params.max_year]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 */
export async function fetchGPUs(params = {}) {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  );
  const response = await api.get("/gpus", { params: filtered });
  return response.data;
}

/**
 * Fetch a single GPU by ID.
 * @param {number} id
 */
export async function fetchGPU(id) {
  const response = await api.get(`/gpus/${id}`);
  return response.data;
}

/**
 * Fetch compare data for an array of GPU IDs.
 * @param {number[]} ids
 */
export async function compareGPUs(ids) {
  const response = await api.get("/gpus/compare", {
    params: { ids: ids.join(",") },
  });
  return response.data;
}

/**
 * Fetch list of all manufacturers.
 */
export async function fetchManufacturers() {
  const response = await api.get("/gpus/manufacturers");
  return response.data;
}

/**
 * Fetch overall database stats.
 */
export async function fetchStats() {
  const response = await api.get("/gpus/stats");
  return response.data;
}

export default api;
