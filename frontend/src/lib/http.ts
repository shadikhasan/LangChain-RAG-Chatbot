import axios from "axios";

export const http = axios.create({
  baseURL: "/api",
});

export const setAuthToken = (token?: string) => {
  if (token) {
    http.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete http.defaults.headers.common["Authorization"];
  }
};

let refreshPromise: Promise<string> | null = null;

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if (status === 401 && !original?._retry) {
      const refresh = localStorage.getItem("refreshToken");
      if (refresh) {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              "/api/auth/refresh",
              { refresh },
              {
                headers: { "Content-Type": "application/json" },
              }
            )
            .then((res) => {
              const newAccess = res.data?.access;
              if (newAccess) {
                localStorage.setItem("token", newAccess);
                setAuthToken(newAccess);
                return newAccess;
              }
              throw new Error("No access token returned");
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        try {
          const newAccess = await refreshPromise;
          original._retry = true;
          original.headers = {
            ...original.headers,
            Authorization: `Bearer ${newAccess}`,
          };
          return http(original);
        } catch (err) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          setAuthToken(undefined);
          return Promise.reject(err);
        }
      }
    }
    return Promise.reject(error);
  }
);
