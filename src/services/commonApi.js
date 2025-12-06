import { API_ENDPOINTS } from "@config/api.config";

// Binds a provided HTTP client (from useApi()) to REST endpoints.
// Usage pattern:
//   const api = createCommonApi(client);
//   api.departments.list({ params: { search: "HR" } });
// The client is expected to expose get/post/put/patch/del with axios-like signatures.

// Factory for Departments API using a client from useApi()
export const departmentsApi = (client) => {
  const base = API_ENDPOINTS.departments;
  return {
    // List departments with optional query params
    list: (opts) => {
      if (opts && typeof opts === "object") {
        if (opts.params) return client.get(base, { params: opts.params });
        if (opts.organizationId) {
          return client.get(base, { params: { organizationId: opts.organizationId } });
        }
      }
      return client.get(base, { params: opts });
    },
    // Get single department by id
    get: (id) => client.get(`${base}/${id}`),
    // Create new department
    create: (data) => client.post(base, data),
    // Update department by id
    update: (id, data) => client.patch(`${base}/${id}`, data),
    // Delete department by id
    remove: (id) => client.del(`${base}/${id}`),
  };
};

// Factory for Designations API using a client from useApi()
export const designationsApi = (client) => {
  const base = API_ENDPOINTS.designations;
  return {
    list: (opts) => {
      if (opts && typeof opts === "object") {
        if (opts.params) return client.get(base, { params: opts.params });
        if (opts.organizationId) {
          return client.get(base, { params: { organizationId: opts.organizationId } });
        }
      }
      return client.get(base, { params: opts });
    },
    get: (id) => client.get(`${base}/${id}`),
    create: (data) => client.post(base, data),
    update: (id, data) => client.patch(`${base}/${id}`, data),
    remove: (id) => client.del(`${base}/${id}`),
  };
};

// Factory for Shifts API using a client from useApi()
export const shiftsApi = (client) => {
  const base = API_ENDPOINTS.shifts;
  return {
    // Retrieve all shifts (optionally filtered by query params)
    list: (params) => client.get(base, { params }),
    // Fetch a single shift definition
    get: (id) => client.get(`${base}/${id}`),
    // Create a new shift
    create: (data) => client.post(base, data),
    // Replace an existing shift
    update: (id, data) => client.put(`${base}/${id}`, data),
    // Delete a shift configuration
    remove: (id) => client.del(`${base}/${id}`),
  };
};

// Factory for Locations API using a client from useApi()
export const locationsApi = (client) => {
  const base = API_ENDPOINTS.locations;
  return {
    list: (params) => client.get(base, { params }),
    get: (id) => client.get(`${base}/${id}`),
    create: (data) => client.post(base, data),
    update: (id, data) => client.put(`${base}/${id}`, data),
    remove: (id) => client.del(`${base}/${id}`),
  };
};

// Factory for Roles API using a client from useApi()
export const rolesApi = (client) => {
  const base = API_ENDPOINTS.roles;
  return {
    list: (params) => client.get(base, { params }),
    get: (id) => client.get(`${base}/${id}`),
    create: (data) => client.post(base, data),
    update: (id, data) => client.patch(`${base}/${id}`, data),
    remove: (id) => client.del(`${base}/${id}`),
    // Assign a role to an employee's user account
    assignToEmployee: (employeeId, data) => client.patch(`/employees/${employeeId}/role`, data),
  };
};

// Factory for Policy Categories API using a client from useApi()
export const policyCategoriesApi = (client) => {
  const base = API_ENDPOINTS.policyCategories;
  return {
    list: (opts) => {
      if (opts && typeof opts === "object") {
        if (opts.params) return client.get(base, { params: opts.params });
        if (opts.organizationId) {
          return client.get(base, { params: { organizationId: opts.organizationId } });
        }
      }
      return client.get(base, { params: opts });
    },
    get: (id) => client.get(`${base}/${id}`),
    create: (data) => client.post(base, data),
    update: (id, data) => client.put(`${base}/${id}`, data),
    patch: (id, data) => client.patch(`${base}/${id}`, data),
    remove: (id) => client.del(`${base}/${id}`),
  };
};

// Factory for Policies API using a client from useApi()
export const policiesApi = (client) => {
  const base = API_ENDPOINTS.policies;
  return {
    list: (opts) => {
      if (opts && typeof opts === "object") {
        if (opts.params) return client.get(base, { params: opts.params });
        if (opts.organizationId) {
          return client.get(base, { params: { organizationId: opts.organizationId } });
        }
      }
      return client.get(base, { params: opts });
    },
    // Fetch a specific policy (optionally with query params)
    get: (id, opts) => client.get(`${base}/${id}`, { params: opts?.params }),
    // Create a new policy
    create: (data) => client.post(base, data),
    // Partial update of an existing policy
    update: (id, data) => client.patch(`${base}/${id}`, data),
    // Remove policy
    remove: (id) => client.del(`${base}/${id}`),
  };
};

// Factory for Separations API
export const separationsApi = (client) => {
  const base = API_ENDPOINTS.separations;
  return {
    list: (params) => client.get(base, { params }),
    get: (id, params) => client.get(`${base}/${id}`, { params }),
    create: (data) => client.post(base, data),
    update: (id, data) => client.patch(`${base}/${id}`, data),
    remove: (id) => client.del(`${base}/${id}`),
  };
};

// Leave Types fetching
export const leaveTypesApi = (client) => {
  const base = API_ENDPOINTS.leaveTypes;
  return {
    list: (opts) => {
      if (opts && typeof opts === "object") {
        if (opts.params) return client.get(base, { params: opts.params });
        if (opts.organizationId) {
          return client.get(base, { params: { organizationId: opts.organizationId } });
        }
      }
      return client.get(base, { params: opts });
    },
    get: (id) => client.get(`${base}/${id}`),
    create: (data) => client.post(base, data),
    update: (id, data) => client.put(`${base}/${id}`, data),
    patch: (id, data) => client.patch(`${base}/${id}`, data),
    remove: (id) => client.del(`${base}/${id}`),
  };
};

// Leave Balance API
export const leaveBalancesApi = (client) => ({
  list: (employeeId) => client.get(API_ENDPOINTS.leaveBalances(employeeId)),
});

// Factory for Job Types API
export const jobTypesApi = (client) => {
  const base = API_ENDPOINTS.jobTypes;
  return {
    list: (opts) => {
      if (opts && typeof opts === "object") {
        if (opts.params) return client.get(base, { params: opts.params });
        if (opts.organizationId) {
          return client.get(base, { params: { organizationId: opts.organizationId } });
        }
      }
      return client.get(base, { params: opts });
    },
    get: (id) => client.get(`${base}/${id}`),
    create: (data) => client.post(base, data),
    update: (id, data) => client.put(`${base}/${id}`, data),
    remove: (id) => client.del(`${base}/${id}`),
  };
};

// Factory for Holidays API
export const holidaysApi = (client) => {
  const base = API_ENDPOINTS.holidays;
  return {
    list: (params) => client.get(base, { params }),
    get: (id) => client.get(`${base}/${id}`),
    create: (data) => client.post(base, data),
    update: (id, data) => client.put(`${base}/${id}`, data),
    remove: (id) => client.del(`${base}/${id}`),
  };
};

// Factory for Localization API
export const localizationApi = (client) => {
  const base = API_ENDPOINTS.localizations;
  return {
    list: (params) => client.get(base, { params }),
    get: (id, params) => client.get(id ? `${base}/${id}` : base, { params }),
    create: (data) => client.post(base, data),
    update: (id, data) => client.put(`${base}/${id}`, data),
    patch: (id, data) => client.patch(`${base}/${id}`, data),
  };
};

// Convenience wrapper to access both in one place
export const organizationsApi = (client) => {
  const base = API_ENDPOINTS.organizations;
  return {
    list: (params) => client.get(base, { params }),
    get: (id, params) => client.get(`${base}/${id}`, { params }),
    create: (data) => client.post(base, data),
    update: (id, data) => client.put(`${base}/${id}`, data),
    patch: (id, data) => client.patch(`${base}/${id}`, data),
    remove: (id) => client.del(`${base}/${id}`),
  };
};

// Expense Types fetching
export const expenseTypesApi = (client) => {
  const base = API_ENDPOINTS.expenseTypes;

  return {
    list: (params) => client.get(base, { params }),
    get: (id, params) => client.get(id ? `${base}/${id}` : base, { params }),
    create: (data) => client.post(base, data),
    update: (id, data) => client.put(`${base}/${id}`, data),
    patch: (id, data) => client.patch(`${base}/${id}`, data),
    delete: (id) => client.delete(`${base}/${id}`),
  };
};

// Common API aggregator
export const createCommonApi = (client) => ({
  // Org-wide helpers
  organizations: organizationsApi(client),

  // Master data building blocks
  departments: departmentsApi(client),
  designations: designationsApi(client),
  shifts: shiftsApi(client),
  locations: locationsApi(client),
  roles: rolesApi(client),
  policyCategories: policyCategoriesApi(client),
  policies: policiesApi(client),
  separations: separationsApi(client),
  leaveBalances: leaveBalancesApi(client),
  jobTypes: jobTypesApi(client),
  holidays: holidaysApi(client),
  localization: localizationApi(client),

  // FIXED ✔
  expenseTypes: expenseTypesApi(client),
});
