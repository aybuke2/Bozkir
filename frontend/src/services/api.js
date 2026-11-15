
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  headers: { "Content-Type": "application/json" },
  timeout: 120000,
});

export function getApiError(error) {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join("; ");
  }
  if (typeof detail === "string") return detail;
  if (error?.code === "ECONNABORTED") {
    return "The analysis timed out. Please try again.";
  }
  if (!error?.response) {
    return "Cannot connect to the backend. Make sure the API is running.";
  }
  return `Request failed (HTTP ${error.response.status}).`;
}

const get = async (url) => (await api.get(url)).data;
const post = async (url, data) => (await api.post(url, data)).data;

export const getHome = () => get("/");
export const getCrops = () => get("/crops");
export const getCropProfiles = () => get("/crops/profiles");
export const compareRotations = (data) => post("/compare", data);
export const getClimateByLocation = (data) => post("/climate/location", data);
export const getClimateHistory = (data) => post("/climate/history", data);
export const compareByLocation = (data) => post("/compare/location", data);
export const getRainfallByPeriod = (data) => post("/rainfall/period", data);
export const getCropBySeason = (data) => post("/crop/season", data);
export const getCropWater = (data) => post("/water/crop", data);
export const compareDecision = (data) => post("/decision/compare", data);

export default api;
