import axios from "axios";
// Use hosted backend as default, localhost as backup
const HOSTED_API_BASE = "https://ksi-gadgets-backend.onrender.com/api";
const LOCAL_API_BASE = "http://localhost:3000/api";
// Determine which base URL to use
const getBaseURL = () => {
    // Allow override via environment variable
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL + "/api";
    }
    // Default to hosted backend
    return HOSTED_API_BASE;
};
const apiClient = axios.create({
    baseURL: getBaseURL(),
    headers: { "Content-Type": "application/json" },
});
// Attach JWT from persisted Zustand store
apiClient.interceptors.request.use((config) => {
    try {
        const raw = localStorage.getItem("techlearn-auth");
        if (raw) {
            const { state } = JSON.parse(raw);
            if (state?.accessToken) {
                config.headers.Authorization = `Bearer ${state.accessToken}`;
            }
        }
    }
    catch {
        // ignore parse errors
    }
    return config;
});
// Handle 401 globally and fallback to localhost on network errors
apiClient.interceptors.response.use((res) => res, (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem("techlearn-auth");
        window.location.href = "/login";
        return Promise.reject(error);
    }
    // If request failed and we're using the hosted URL, try localhost
    if (apiClient.defaults.baseURL === HOSTED_API_BASE &&
        (!error.response || error.code === "ERR_NETWORK")) {
        // Store fallback flag to avoid infinite loops
        const attemptedFallback = localStorage.getItem("api-fallback-attempted");
        if (!attemptedFallback) {
            localStorage.setItem("api-fallback-attempted", "true");
            // Create a new request with localhost URL
            const newConfig = { ...error.config };
            newConfig.baseURL = LOCAL_API_BASE;
            const fallbackClient = axios.create(newConfig);
            return fallbackClient(newConfig);
        }
        else {
            localStorage.removeItem("api-fallback-attempted");
        }
    }
    return Promise.reject(error);
});
export default apiClient;
