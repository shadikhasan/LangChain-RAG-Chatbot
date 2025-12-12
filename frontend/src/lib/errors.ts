export const extractError = (err: any, fallback = "Request failed") => {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  const value = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
  return typeof value === "string" ? value : fallback;
};
