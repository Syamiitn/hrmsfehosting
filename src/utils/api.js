import { API_ENDPOINTS } from "@config/api.config";

export const fetchDropdownData = async (apiKey, get) => {
    const endpoint = API_ENDPOINTS[apiKey];
    if (!endpoint) return [];
    const res = await get(endpoint);
    return res?.data || res; // Adjust based on your API shape
};
