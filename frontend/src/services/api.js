
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 30000
});

// Anasayfa verilerini getir
export const getHome = async () => {
  const response = await api.get("/Home");
  return response.data;
};

// Ürünleri listele
export const getCrops = async () => {
  const response = await api.get("/crops");
  return response.data;
};

// Ürün profillerini listele
export const getCropProfiles = async () => {
  const response = await api.get("/crops/profiles");
  return response.data;
};

// Genel rotasyon karşılaştırması
export const compareRotations = async (comparisonData) => {
  const response = await api.post("/compare", comparisonData);
  return response.data;
};

// Konuma göre iklim verisi
export const getClimateByLocation = async (locationData) => {
  const response = await api.post(
    "/climate/location",
    locationData
  );
  return response.data;
};

// Konuma göre rotasyon karşılaştırması
export const compareByLocation = async (locationData) => {
  const response = await api.post(
    "/compare/location",
    locationData
  );
  return response.data;
};

// Belirli periyoda göre yağış verisi
export const getRainfallByPeriod = async (periodData) => {
  const response = await api.post(
    "/rainfall/period",
    periodData
  );
  return response.data;
};

// Konum ve sezona göre ürün önerisi
export const getCropBySeason = async (seasonData) => {
  const response = await api.post(
    "/crop/season",
    seasonData
  );
  return response.data;
};

export default api;
