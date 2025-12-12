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
