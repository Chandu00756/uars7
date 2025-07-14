import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const baseURL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ||
  "http://localhost:8080";

const apiClient = axios.create({
  baseURL,
  timeout: 10_000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // No prefix logic; backend expects /auth/* endpoints directly
  console.log("🌐 API Request:", config.method?.toUpperCase(), config.url);
  return config;
}, (error) => {
  console.error("❌ Request interceptor error:", error);
  return Promise.reject(error);
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response.config.url, response.status);
    return response;
  },
  (error: AxiosError) => {
    console.log("❌ API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });

    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      console.log("🚪 401 error - redirecting to login");
      window.location.href = "/login";
      return Promise.reject(error);
    }
    
    if (error.response?.status === 403) {
      console.error("🚫 Forbidden:", error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
