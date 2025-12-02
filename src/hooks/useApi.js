import { useCallback, useMemo, useState } from "react";
import axios from "axios";

const BASE_URL = "https://hrmsbehosting.onrender.com/"; // base API endpoint (http://192.168.29.245:3000/ - old ip)

// Abhishek Server
// 1. http://192.168.191.162:3000

// Create an axios instance (centralized configuration)
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 100000, // 10s default timeout (can override per request)
});

export function useApi() {
    const [loading, setLoading] = useState(false);
    const [lastError, setLastError] = useState(null);

    // Wrapper for API calls with loading/error state
    const call = useCallback(async (method, path, opts = {}) => {
        setLoading(true);
        setLastError(null);

        try {
            const response = await api.request({
                method,
                url: path,
                params: opts.params, // query params
                data: opts.body, // request body
                headers: opts.headers,
                timeout: opts.timeout || api.defaults.timeout,
            });

            setLoading(false);
            return response.data; // return only data
        } catch (err) {
            setLoading(false);
            // Axios error structure
            const error = {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
            };
            setLastError(error);
            throw error;
        }
    }, []);

    // CRUD methods
    const get = useCallback((path, opts) => call("GET", path, opts), [call]);
    const post = useCallback(
        (path, body, opts = {}) => call("POST", path, { ...opts, body }),
        [call]
    );
    const put = useCallback(
        (path, body, opts = {}) => call("PUT", path, { ...opts, body }),
        [call]
    );
    const patch = useCallback(
        (path, body, opts = {}) => call("PATCH", path, { ...opts, body }),
        [call]
    );
    const del = useCallback((path, opts) => call("DELETE", path, opts), [call]);

    return useMemo(
        () => ({
            get,
            post,
            put,
            patch,
            del,
            loading,
            lastError,
            baseUrl: BASE_URL,
        }),
        [get, post, put, patch, del, loading, lastError]
    );
}


/* ===========================================================
   📘 Usage Guide: useApi Hook
   ===========================================================

   1. Import and initialize inside your component:
      const { get, post, put, patch, del, loading, lastError } = useApi();

   -----------------------------------------------------------
   🔹 GET request (with query params)
   -----------------------------------------------------------
      const data = await get("/objects", { params: { limit: 5 } });

   -----------------------------------------------------------
   🔹 POST request (with body)
   -----------------------------------------------------------
      const newObj = await post("/objects", {
        name: "Laptop",
        data: { brand: "Dell" }
      });

   -----------------------------------------------------------
   🔹 PUT request (replace resource)
   -----------------------------------------------------------
      const updated = await put("/objects/1", {
        name: "Updated Laptop",
        data: { brand: "HP" }
      });

   -----------------------------------------------------------
   🔹 PATCH request (partial update)
   -----------------------------------------------------------
      const patched = await patch("/objects/1", {
        "data.brand": "Lenovo"
      });

   -----------------------------------------------------------
   🔹 DELETE request
   -----------------------------------------------------------
      const deleted = await del("/objects/1");

   -----------------------------------------------------------
   🔹 Multiple requests (parallel example)
   -----------------------------------------------------------
      const [emp, dept, role] = await Promise.all([
        post("/employees", { name: "Nitesh" }),
        post("/departments", { name: "Engineering" }),
        post("/roles", { name: "Admin" }),
      ]);

   -----------------------------------------------------------
   🔹 Error & Loading
   -----------------------------------------------------------
      - Use `loading` to show spinners.
      - Use `lastError` to show error messages:
        if (lastError) console.error(lastError.message);

   ===========================================================
*/
