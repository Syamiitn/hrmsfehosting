// 📁 OrganizationInfoForm.jsx — BEM version (no inline styles)
// Uses OrganizationInfoForm.css (imported below)

import "./index.css";
import FileUploader from "@components/GlobalSettingSteps/FileUploader";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "@hooks/useApi";
import { createCommonApi } from "@services/commonApi";
import { showErrorToast } from "@utils/utils";

/* ---------------------------
   Small helpers & mappings
   --------------------------- */
const COUNTRY_OPTIONS = ["India", "South Africa", "UAE"];
const COUNTRY_DEFAULT_CURRENCY = {
  India: "INR",
  "South Africa": "ZAR",
  UAE: "AED",
};
const PAYROLL_FREQUENCIES = ["Monthly", "Bi-weekly", "Weekly", "Quarterly"];
const CURRENCY_OPTIONS = ["INR", "ZAR", "AED", "USD", "EUR", "GBP"];
const UAE_COMPANY_TYPES = ["Mainland", "Freezone", "Offshore"];
const UAE_EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain",
];

/* ============================================================
   🧩 Reusable subcomponents
   ============================================================ */
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="organization__section-header">
      <div className="organization__section-header-left">
        <div className="organization__section-icon">{icon}</div>
        <div>
          <div className="organization__section-title">{title}</div>
          <div className="organization__section-subtitle">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  as = "input",
  options = [],
  inputRef,
  placeholder,
  full = false,
}) {
  const fieldClass = full
    ? "organization__field organization__field--full"
    : "organization__field";

  if (as === "textarea") {
    return (
      <div className={fieldClass}>
        <label className="organization__label">{label}</label>
        <textarea
          ref={inputRef}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`organization__textarea organization__input ${
            error ? "organization__input--error" : ""
          }`}
        />
        {error ? <div className="organization__error-text">{error}</div> : null}
      </div>
    );
  }

  if (as === "select") {
    return (
      <div className={fieldClass}>
        <label className="organization__label">{label}</label>
        <select
          ref={inputRef}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={`organization__input ${
            error ? "organization__input--error" : ""
          }`}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {error ? <div className="organization__error-text">{error}</div> : null}
      </div>
    );
  }

  return (
    <div className={fieldClass}>
      <label className="organization__label">{label}</label>
      <input
        ref={inputRef}
        type={label.toLowerCase().includes("contact number") ? "tel" : "text"}
        inputMode={
          label.toLowerCase().includes("contact number") ? "tel" : "text"
        }
        pattern={
          label.toLowerCase().includes("contact number") ? "[0-9+]*" : undefined
        }
        maxLength={label.toLowerCase().includes("contact number") ? 15 : ""}
        value={value || ""}
        onChange={(e) => {
          const val = e.target.value;
          if (val.length > 0 && val == " ") return;
          if (/ {3,}/.test(val)) return;
          if (label.toLowerCase().includes("contact number")) {
            const cleaned = val.replace(/[^0-9+]/g, "");
            onChange(cleaned);
          } else {
            onChange(val);
          }
        }}
        placeholder={placeholder}
        className={`organization__input ${
          error ? "organization__input--error" : ""
        }`}
      />
      {error ? <div className="organization__error-text">{error}</div> : null}
    </div>
  );
}

function CheckboxChip({ label, checked, onChange }) {
  return (
    <label className="organization__chip">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

const unwrapOrganization = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  if (payload.data && typeof payload.data === "object") return payload.data;
  return payload;
};

/* ------------------------------------------------------------
   Advanced Settings (Create mode only)
   ------------------------------------------------------------ */
function AdvancedSettings({ value, onChange }) {
  return (
    <div className="organization__card">
      <SectionHeader
        icon="⚙️"
        title="Advanced Settings"
        subtitle="Fine-tune organization behavior"
      />

      <div className="organization__grid-2">
        <label className="organization__adv-switch">
          <input
            type="checkbox"
            checked={!!value.inheritParentPolicies}
            onChange={(e) =>
              onChange({ ...value, inheritParentPolicies: e.target.checked })
            }
          />
          <div>
            <div className="organization__text-600 organization__mb-6">
              Enable Inherit Parent Policies
            </div>
            <div className="organization__help-text">
              Automatically inherit HR policies from the parent organization.
            </div>
          </div>
        </label>

        <label className="organization__adv-switch">
          <input
            type="checkbox"
            checked={!!value.customPayrollSettings}
            onChange={(e) =>
              onChange({ ...value, customPayrollSettings: e.target.checked })
            }
          />
          <div>
            <div className="organization__text-600 organization__mb-6">
              Enable Custom Payroll Settings
            </div>
            <div className="organization__help-text">
              Use a separate payroll configuration for this subsidiary.
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}



export default function OrganizationInfoForm({ selectedOrg, parentId }) {
  const { get, post, put, patch, del } = useApi();
  const apiClient = useMemo(
    () => ({ get, post, put, patch, del }),
    [get, post, put, patch, del]
  );
  const commonApi = useMemo(() => createCommonApi(apiClient), [apiClient]);
  const isCreateMode = !!parentId;
  const [loading, setLoading] = useState(!isCreateMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState({ open: false, url: "" });
  const [selectedCountry, setSelectedCountry] = useState("India");
  const [formData, setFormData] = useState({
    orgInfo: {
      orgName: "",
      legalEntityName: "",
      businessUnit: "",
      country: "India",
      address: "",
      contactEmail: "",
      contactNumber: "",
      companyLogo: "",
    },
    registration: {
      cin: "",
      pan: "",
      gstin: "",
      tan: "",
      cipc: "",
      vatNumber: "",
      payeReference: "",
      uifNumber: "",
      tradeLicense: "",
      vatTrn: "",
      establishmentCard: "",
      companyType: "",
      registeredEmirate: "",
      currency: COUNTRY_DEFAULT_CURRENCY["India"],
      timezone: "Asia/Kolkata",
    },

    statutory: {
      // Country-specific compliance flags
      pfEpf: false, // India
      uifPaye: false, // South Africa
      wps: false, // UAE
      // Common statutory fields
      esi: false,
      gratuity: false,
      includeHolidays: false,
      defaultPayrollCurrency: COUNTRY_DEFAULT_CURRENCY["India"],
      defaultPayrollFrequency: "Monthly",
    },
    documents: {
      required: {
        certificateOfIncorporation: "",
        panCard: "",
        gstCertificate: "",
        companyRegistrationCertificate: "",
        vatCertificate: "",
        uifCertificate: "",
        tradeLicense: "",
        vatCertificateUAE: "",
        establishmentCardDoc: "",
      },
      additional: [],
    },
    advanced: {
      inheritParentPolicies: false,
      customPayrollSettings: false,
    },
  });
  const fieldRefs = useRef({});
  const isManualCountryChange = useRef(false);
  const lastFetchedOrgId = useRef(null);
  const stableOrgId = selectedOrg?.organizationId || selectedOrg?.id || null;

  /* ---------- Load in Edit Mode ---------- */
  useEffect(() => {
    if (isCreateMode) {
      // 🧠 Initialize base defaults for India
      setFormData((p) => ({
        ...p,
        registration: {
          ...p.registration,
          currency: COUNTRY_DEFAULT_CURRENCY["India"],
        },
        statutory: {
          ...p.statutory,
          defaultPayrollCurrency: COUNTRY_DEFAULT_CURRENCY["India"],
          defaultPayrollFrequency: "Monthly",
        },
        orgInfo: { ...p.orgInfo, country: "India" },
      }));

      // ✅ Explicitly mark this as a manual-like change
      isManualCountryChange.current = true;
      setSelectedCountry("India");

      // ✅ We’re not using setTimeout — initialize instantly and let [selectedCountry] effect rebuild the fields
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      const orgId = stableOrgId;
      if (!orgId) {
        setLoading(false);
        return;
      }

      if (lastFetchedOrgId.current === orgId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        console.debug("[OrganizationInfo] Fetching organization", orgId);
        let payload = null;
        if (commonApi?.organizations) {
          payload = await commonApi.organizations.get(orgId);
        } else if (apiClient?.get) {
          payload = await apiClient.get(`/organizations/${orgId}`);
        }
        const data = unwrapOrganization(payload);
        if (!data) throw new Error("Organization not found");
        if (cancelled) return;
        lastFetchedOrgId.current = orgId;

        // 🧠 Normalize statutory keys per country (map pfEpf → correct field)
        const normalizedStatutory = { ...data.statutory };
        if (data.orgInfo?.country === "South Africa") {
          normalizedStatutory.uifPaye = normalizedStatutory.pfEpf ?? false;
          delete normalizedStatutory.pfEpf;
        } else if (data.orgInfo?.country === "UAE") {
          normalizedStatutory.wps = normalizedStatutory.pfEpf ?? false;
          delete normalizedStatutory.pfEpf;
        }

        setFormData((prev) => {
          const merged = {
            ...prev,
            orgInfo: { ...prev.orgInfo, ...(data.orgInfo || {}) },
            registration: {
              ...prev.registration,
              ...(data.registration || {}),
            },
            statutory: { ...prev.statutory, ...normalizedStatutory },
            documents: {
              required: {
                ...prev.documents.required,
                ...(data.documents?.required || {}),
              },
              additional:
                data.documents?.additional || prev.documents.additional,
            },
          };
          return merged;
        });

        const apiCountry = (data.orgInfo && data.orgInfo.country) || "India";
        setSelectedCountry(apiCountry);
        isManualCountryChange.current = false; // ✅ mark as API update, not manual change
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load organization info", error);
          showErrorToast(
            error?.data?.message || error?.message || "Failed to load organization info"
          );
          lastFetchedOrgId.current = null;
        }
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isCreateMode, stableOrgId, commonApi]);

  /* ---------- When selectedCountry changes ---------- */
  /* ---------- When selectedCountry changes ---------- */
  useEffect(() => {
    if (!isManualCountryChange.current) return;

    const currency = COUNTRY_DEFAULT_CURRENCY[selectedCountry] || "USD";
    const timezone =
      selectedCountry === "India"
        ? "Asia/Kolkata"
        : selectedCountry === "South Africa"
        ? "Africa/Johannesburg"
        : selectedCountry === "UAE"
        ? "Asia/Dubai"
        : "UTC";

    setFormData((prev) => {
      // 🧹 Build fresh country-specific registration defaults
      let registration = {};
      if (selectedCountry === "India") {
        registration = {
          cin: "",
          pan: "",
          gstin: "",
          tan: "",
          currency,
          timezone,
        };
      } else if (selectedCountry === "South Africa") {
        registration = {
          cipc: "",
          vatNumber: "",
          payeReference: "",
          uifNumber: "",
          currency,
          timezone,
        };
      } else if (selectedCountry === "UAE") {
        registration = {
          tradeLicense: "",
          vatTrn: "",
          establishmentCard: "",
          currency,
          timezone,
          companyType: UAE_COMPANY_TYPES[0], // ✅ default value set in state
          registeredEmirate: UAE_EMIRATES[0], // ✅ default value set in state
        };
      } else {
        registration = { currency, timezone };
      }

      // 🧩 Reset statutory fields per country
      let statutory = {};
      if (selectedCountry === "India") {
        statutory = {
          pfEpf: false,
          esi: false,
          gratuity: false,
          includeHolidays: false,
          defaultPayrollCurrency: currency,
          defaultPayrollFrequency: "Monthly",
        };
      } else if (selectedCountry === "South Africa") {
        statutory = {
          uifPaye: false,
          gratuity: false,
          includeHolidays: false,
          defaultPayrollCurrency: currency,
          defaultPayrollFrequency: "Monthly",
        };
      } else if (selectedCountry === "UAE") {
        statutory = {
          wps: false,
          gratuity: false,
          includeHolidays: false,
          defaultPayrollCurrency: currency,
          defaultPayrollFrequency: "Monthly",
        };
      }

      // 🗂 Reset documents
      const documents =
        selectedCountry === "India"
          ? {
              required: {
                certificateOfIncorporation: "",
                panCard: "",
                gstCertificate: "",
              },
              additional: [],
            }
          : selectedCountry === "South Africa"
          ? {
              required: {
                companyRegistrationCertificate: "",
                vatCertificate: "",
                uifCertificate: "",
              },
              additional: [],
            }
          : selectedCountry === "UAE"
          ? {
              required: {
                tradeLicense: "",
                vatCertificateUAE: "",
                establishmentCardDoc: "",
              },
              additional: [],
            }
          : { required: {}, additional: [] };

      return {
        ...prev,
        orgInfo: {
          ...prev.orgInfo,
          country: selectedCountry,
        },
        registration,
        statutory,
        documents,
        advanced: {
          inheritParentPolicies: false,
          customPayrollSettings: false,
        },
      };
    });

    setErrors({});
    isManualCountryChange.current = false;
  }, [selectedCountry]);

  /* ---------- Helpers ---------- */
  const setField = (section, key, value) =>
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));

  const setDocRequired = (key, value) =>
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        required: { ...prev.documents.required, [key]: value },
      },
    }));

  const pushAdditionalDoc = (url) =>
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        additional: [...prev.documents.additional, url],
      },
    }));

  const removeAdditionalDoc = (i) =>
    setFormData((prev) => {
      const copy = [...prev.documents.additional];
      copy.splice(i, 1);
      return { ...prev, documents: { ...prev.documents, additional: copy } };
    });

  const setAdvanced = (v) =>
    setFormData((p) => ({ ...p, advanced: { ...p.advanced, ...v } }));

  /* ---------- Validation ---------- */
  const validateForm = () => {
    const e = {};

    /* -----------------------------------------
        ✅ CONSTANTS (kept inside the function)
    -------------------------------------------- */
    const MSG = {
      REQUIRED: (label) => `${label} is required`,
      EMAIL: "Enter a valid email address",
      PHONE: "Enter a valid phone number",
      ONLY_ALPHANUMERIC: "should contain only letters and numbers",
      MULTIPLE_SPACES: "cannot contain multiple spaces together",
    };

    const PATTERN = {
      EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/,
      PHONE: /^\+?[0-9\s\-()]{7,20}$/,

      INDIA: {
        PAN: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
        GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
        TAN: /^[A-Z]{4}[0-9]{5}[A-Z]$/,
        CIN_LENGTH: 21,
      },

      SOUTH_AFRICA: {
        CIPC: /^[A-Za-z0-9/]+$/,
        VAT: /^[0-9]{10}$/,
        PAYE: /^[A-Za-z0-9/]+$/,
        UIF: /^[A-Za-z0-9]+$/,
        CIPC_MIN: 10,
        CIPC_MAX: 20,
      },

      UAE: {
        TRADE: /^[A-Za-z0-9-]+$/,
        TRADE_MIN: 5,
        TRADE_MAX: 30,
        VAT_TRN: /^[0-9]{15}$/,
        EST_CARD: /^[A-Za-z0-9]{6,12}$/,
      },
    };

    /* -----------------------------------------
          Small validators
    -------------------------------------------- */

    const req = (path, label, val) => {
      if (!val || String(val).trim() === "") e[path] = MSG.REQUIRED(label);
    };

    const isValidEmail = (email) =>
      PATTERN.EMAIL.test(email.trim()) && !email.includes("..");

    const isValidPhone = (phone) =>
      PATTERN.PHONE.test(phone) && phone.replace(/\D/g, "").length >= 10;

    /* --------------------------------------------------
        ✅ Organization Info Validation
    -------------------------------------------------- */

    req("orgInfo.orgName", "Organization Name", formData.orgInfo.orgName);
    if (formData.orgInfo.orgName) {
      const val = formData.orgInfo.orgName.trim();
      if (val.length < 5 || val.length > 120)
        e["orgInfo.orgName"] =
          "Organization Name must be between 5 to 120 characters";
      else if (!/^[A-Za-z0-9 ]+$/.test(val))
        e["orgInfo.orgName"] = `Organization Name ${MSG.ONLY_ALPHANUMERIC}`;
    }

    req(
      "orgInfo.legalEntityName",
      "Legal Entity Name",
      formData.orgInfo.legalEntityName
    );
    if (formData.orgInfo.legalEntityName) {
      const val = formData.orgInfo.legalEntityName.trim();
      if (val.length < 5 || val.length > 120)
        e["orgInfo.legalEntityName"] =
          "Legal Entity Name must be between 5 to 120 characters";
      else if (!/^[A-Za-z0-9 ]+$/.test(val))
        e[
          "orgInfo.legalEntityName"
        ] = `Legal Entity Name ${MSG.ONLY_ALPHANUMERIC}`;
    }

    if (formData.orgInfo.businessUnit) {
      const val = formData.orgInfo.businessUnit.trim();
      if (!/^[A-Za-z0-9 ]+$/.test(val))
        e["orgInfo.businessUnit"] = `Business Unit ${MSG.ONLY_ALPHANUMERIC}`;
      if (/ {3,}/.test(val))
        e["orgInfo.businessUnit"] = `Business Unit ${MSG.MULTIPLE_SPACES}`;
    }

    req("orgInfo.country", "Country", formData.orgInfo.country);

    req("orgInfo.address", "Registered Address", formData.orgInfo.address);
    if (formData.orgInfo.address?.trim().length < 20)
      e["orgInfo.address"] =
        "Registered Address must be at least 20 characters";

    req("orgInfo.contactEmail", "Contact Email", formData.orgInfo.contactEmail);
    if (
      formData.orgInfo.contactEmail &&
      !isValidEmail(formData.orgInfo.contactEmail)
    )
      e["orgInfo.contactEmail"] = MSG.EMAIL;

    req(
      "orgInfo.contactNumber",
      "Contact Number",
      formData.orgInfo.contactNumber
    );
    if (
      formData.orgInfo.contactNumber &&
      !isValidPhone(formData.orgInfo.contactNumber)
    )
      e["orgInfo.contactNumber"] = MSG.PHONE;

    if (!formData.orgInfo.companyLogo)
      e["orgInfo.companyLogo"] = MSG.REQUIRED("Company Logo");

    /* --------------------------------------------------
        ✅ Country-wise Registration Validation
    -------------------------------------------------- */

    const r = formData.registration;

    /** 🇮🇳 INDIA **/
    if (selectedCountry === "India") {
      // ✅ CIN (Required, exactly 21 characters)
      req("registration.cin", "CIN", r.cin);
      if (r.cin?.trim().length !== PATTERN.INDIA.CIN_LENGTH)
        e[
          "registration.cin"
        ] = `CIN must be exactly ${PATTERN.INDIA.CIN_LENGTH} characters`;

      // ✅ PAN (Required)
      req("registration.pan", "PAN", r.pan);
      if (r.pan && !PATTERN.INDIA.PAN.test(r.pan.trim().toUpperCase()))
        e["registration.pan"] = "Invalid PAN format (ABCDE1234F)";

      // ✅ GSTIN (Required — changed from optional)
      req("registration.gstin", "GSTIN", r.gstin);
      if (r.gstin && !PATTERN.INDIA.GST.test(r.gstin.trim().toUpperCase()))
        e["registration.gstin"] = "Invalid GSTIN format";

      // ✅ TAN (Optional — validate only if present)
      if (r.tan && !PATTERN.INDIA.TAN.test(r.tan.trim().toUpperCase()))
        e["registration.tan"] = "Invalid TAN format (AAAA99999A)";

      // ✅ Required documents validation
      if (!formData.documents.required.certificateOfIncorporation)
        e["documents.required.certificateOfIncorporation"] = MSG.REQUIRED(
          "Certificate of Incorporation"
        );

      if (!formData.documents.required.panCard)
        e["documents.required.panCard"] = MSG.REQUIRED("PAN Card");

      if (!formData.documents.required.gstCertificate)
        e["documents.required.gstCertificate"] =
          MSG.REQUIRED("GST Certificate");
    }

    /** 🇿🇦 South Africa **/
    if (selectedCountry === "South Africa") {
      req("registration.cipc", "CIPC Registration Number", r.cipc);
      const cipc = r.cipc?.trim();

      if (
        cipc &&
        (!PATTERN.SOUTH_AFRICA.CIPC.test(cipc) ||
          cipc.length < PATTERN.SOUTH_AFRICA.CIPC_MIN ||
          cipc.length > PATTERN.SOUTH_AFRICA.CIPC_MAX)
      ) {
        e[
          "registration.cipc"
        ] = `CIPC must be ${PATTERN.SOUTH_AFRICA.CIPC_MIN}-${PATTERN.SOUTH_AFRICA.CIPC_MAX} characters`;
      }

      req("registration.vatNumber", "VAT Number", r.vatNumber);
      if (r.vatNumber && !PATTERN.SOUTH_AFRICA.VAT.test(r.vatNumber.trim()))
        e["registration.vatNumber"] = "VAT Number must be exactly 10 digits";

      req(
        "registration.payeReference",
        "PAYE Reference Number",
        r.payeReference
      );
      if (
        r.payeReference &&
        !PATTERN.SOUTH_AFRICA.PAYE.test(r.payeReference.trim())
      )
        e["registration.payeReference"] =
          "PAYE Reference must be alphanumeric or '/'";

      if (r.uifNumber && !PATTERN.SOUTH_AFRICA.UIF.test(r.uifNumber.trim()))
        e["registration.uifNumber"] = "UIF Number must be alphanumeric";

      // ✅ Required Document Validation (fix for missing case)
      if (!formData.documents.required.companyRegistrationCertificate)
        e["documents.required.companyRegistrationCertificate"] = MSG.REQUIRED(
          "Company Registration Certificate"
        );

      if (!formData.documents.required.vatCertificate)
        e["documents.required.vatCertificate"] =
          MSG.REQUIRED("VAT Certificate");

      if (!formData.documents.required.uifCertificate)
        e["documents.required.uifCertificate"] =
          MSG.REQUIRED("UIF Certificate");
    }
    /** 🇦🇪 UAE **/
    if (selectedCountry === "UAE") {
      // ✅ Trade License (Required)
      req("registration.tradeLicense", "Trade License Number", r.tradeLicense);
      const trade = r.tradeLicense?.trim();

      if (
        trade &&
        (!PATTERN.UAE.TRADE.test(trade) ||
          trade.length < PATTERN.UAE.TRADE_MIN ||
          trade.length > PATTERN.UAE.TRADE_MAX)
      ) {
        e[
          "registration.tradeLicense"
        ] = `Trade License must be ${PATTERN.UAE.TRADE_MIN}-${PATTERN.UAE.TRADE_MAX} characters`;
      }

      // ✅ VAT TRN (Required, must be exactly 15 digits)
      req("registration.vatTrn", "VAT TRN", r.vatTrn);
      if (r.vatTrn && !PATTERN.UAE.VAT_TRN.test(r.vatTrn.trim()))
        e["registration.vatTrn"] = "VAT TRN must be 15 digits";

      // ✅ Company Type (Required)
      req("registration.companyType", "Company Type", r.companyType);

      // ✅ Registered Emirate (Required)
      req(
        "registration.registeredEmirate",
        "Registered Emirate",
        r.registeredEmirate
      );

      // ❌ Establishment Card is optional (validate only if entered)
      if (
        r.establishmentCard &&
        !PATTERN.UAE.EST_CARD.test(r.establishmentCard.trim())
      )
        e["registration.establishmentCard"] =
          "Establishment Card must be 6–12 alphanumeric characters";

      /* ✅ Required document validation */
      if (!formData.documents.required.tradeLicense)
        e["documents.required.tradeLicense"] = MSG.REQUIRED("Trade License");

      if (!formData.documents.required.vatCertificateUAE)
        e["documents.required.vatCertificateUAE"] =
          MSG.REQUIRED("VAT Certificate");

      if (!formData.documents.required.establishmentCardDoc)
        e["documents.required.establishmentCardDoc"] =
          MSG.REQUIRED("Establishment Card");
    }

    /* --------------------------------------------------
        ✅ Final
    -------------------------------------------------- */

    setErrors(e);
    if (Object.keys(e).length > 0) setTimeout(() => setErrors({}), 6000);

    return {
      isValid: Object.keys(e).length === 0,
      firstErrorKey: Object.keys(e)[0],
    };
  };

  // ✅ Deep trim utility
  const deepTrim = (data) => {
    if (Array.isArray(data)) return data.map(deepTrim);
    if (data !== null && typeof data === "object") {
      const trimmed = {};
      for (const key in data) trimmed[key] = deepTrim(data[key]);
      return trimmed;
    }
    return typeof data === "string" ? data.trim() : data;
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async () => {
    const { isValid, firstErrorKey } = validateForm();

    // ✅ trim everything before payload creation
    const trimmedFormData = deepTrim(formData);

    if (!isValid) {
      const scrollToError = (key) => {
        const el = fieldRefs.current[key];
        if (!el) {
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        el.scrollIntoView({ behavior: "smooth", block: "center" });

        const input = el.querySelector("input, textarea, select");
        input?.focus?.();
      };

      scrollToError(firstErrorKey);
      return;
    }

    if (!window.confirm("Are you sure you want to submit?")) return;

    setSubmitting(true);
    try {
      const { advanced, ...rest } = trimmedFormData;

      /* ------------------------------------------------
         ✅ 1. STATUTORY CLEANUP — allow only country-specific keys
      ------------------------------------------------ */
      const cleanStatutory = { ...rest.statutory };

      if (selectedCountry === "India") {
        delete cleanStatutory.uifPaye;
        delete cleanStatutory.wps;
      } else if (selectedCountry === "South Africa") {
        delete cleanStatutory.pfEpf;
        delete cleanStatutory.esi;
        delete cleanStatutory.wps;
      } else if (selectedCountry === "UAE") {
        delete cleanStatutory.pfEpf;
        delete cleanStatutory.esi;
        delete cleanStatutory.uifPaye;
      }

      /* ------------------------------------------------
         ✅ 2. REGISTRATION FILTERING — keep only valid fields per country
      ------------------------------------------------ */
      const allowedRegistrationKeys =
        selectedCountry === "India"
          ? ["cin", "pan", "gstin", "tan", "currency", "timezone"]
          : selectedCountry === "South Africa"
          ? [
              "cipc",
              "vatNumber",
              "payeReference",
              "uifNumber",
              "currency",
              "timezone",
            ]
          : selectedCountry === "UAE"
          ? [
              "tradeLicense",
              "vatTrn",
              "establishmentCard",
              "companyType",
              "registeredEmirate",
              "currency",
              "timezone",
            ]
          : [];

      const filteredRegistration = Object.fromEntries(
        Object.entries(rest.registration).filter(([key]) =>
          allowedRegistrationKeys.includes(key)
        )
      );

      /* ------------------------------------------------
         ✅ 3. DOCUMENT FILTERING — keep only required docs per country
      ------------------------------------------------ */
      const allowedRequiredDocs =
        selectedCountry === "India"
          ? ["certificateOfIncorporation", "panCard", "gstCertificate"]
          : selectedCountry === "South Africa"
          ? [
              "companyRegistrationCertificate",
              "vatCertificate",
              "uifCertificate",
            ]
          : selectedCountry === "UAE"
          ? ["tradeLicense", "vatCertificateUAE", "establishmentCardDoc"]
          : [];

      const filteredRequiredDocs = Object.fromEntries(
        Object.entries(rest.documents.required).filter(([key]) =>
          allowedRequiredDocs.includes(key)
        )
      );

      const filteredDocuments = {
        required: filteredRequiredDocs,
        additional: rest.documents.additional, // we don't filter additional docs
      };

      /* ------------------------------------------------
          ✅ CREATE MODE (POST → include advanced + parentId)
      ------------------------------------------------ */
      if (isCreateMode) {
        const cleanedPayload = {
          parentId,
          ...rest,
          registration: filteredRegistration,
          documents: filteredDocuments,
          statutory: cleanStatutory,
          advanced, // only in CREATE mode
        };

        const res = await apiCreateOrganization(cleanedPayload);
        if (res?.success) {
          console.log("✅ Created New Organization:", cleanedPayload);
        }
      } else {
        /* ------------------------------------------------
          ✅ EDIT MODE (PATCH → DO NOT send advanced/parentId)
      ------------------------------------------------ */
        const cleanedPayload = {
          ...rest,
          registration: filteredRegistration,
          documents: filteredDocuments,
          statutory: cleanStatutory,
        };

        const res = await apiPatchOrganization(selectedOrg.id, cleanedPayload);
        if (res?.success) {
          console.log("✅ Updated Organization:", cleanedPayload);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Small utilities ---------- */
  const isImage = (url = "") => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url);
  const getFileName = (url = "") => {
    try {
      const base = url.split("/").pop() || "";
      return base.split("?")[0].split("#")[0] || url;
    } catch {
      return url;
    }
  };

  /* ---------- Render country-specific sections ---------- */
  function CountryRegistrationSection() {
    if (selectedCountry === "India") {
      return (
        <div className="organization__card">
          <SectionHeader
            icon="🇮🇳"
            title="India – Legal & Registration Details"
            subtitle="Complete country-specific legal requirements and registration details"
          />
          <div className="organization__grid-2">
            <div style={{ display: "flex", gap: "10px" }}>
              <Field
                label="CIN (Corporate Identification Number) *"
                value={formData.registration.cin}
                onChange={(v) => setField("registration", "cin", v)}
                error={errors["registration.cin"]}
                inputRef={(el) => (fieldRefs.current["registration.cin"] = el)}
                placeholder="Enter cin (corporate identification number)"
              />
              <Field
                label="PAN Number *"
                value={formData.registration.pan}
                onChange={(v) =>
                  setField("registration", "pan", v.toUpperCase())
                }
                error={errors["registration.pan"]}
                inputRef={(el) => (fieldRefs.current["registration.pan"] = el)}
                placeholder="Enter pan number"
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Field
                label="GSTIN *"
                value={formData.registration.gstin}
                onChange={(v) =>
                  setField("registration", "gstin", v.toUpperCase())
                }
                error={errors["registration.gstin"]}
                placeholder="Enter gstin"
              />
              <Field
                label="TAN"
                value={formData.registration.tan}
                onChange={(v) =>
                  setField("registration", "tan", v.toUpperCase())
                }
                placeholder="Enter tan"
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Field
                label="Currency"
                as="select"
                options={CURRENCY_OPTIONS}
                value={
                  formData.registration.currency ||
                  COUNTRY_DEFAULT_CURRENCY["India"]
                }
                onChange={(v) => setField("registration", "currency", v)}
              />
              <Field
                label="Timezone"
                as="select"
                options={["Asia/Kolkata", "UTC"]}
                value={formData.registration.timezone || "Asia/Kolkata"}
                onChange={(v) => setField("registration", "timezone", v)}
              />
            </div>
          </div>
        </div>
      );
    } else if (selectedCountry === "South Africa") {
      return (
        <div className="organization__card">
          <SectionHeader
            icon="🇿🇦"
            title="South Africa – Legal & Registration Details"
            subtitle="Complete country-specific legal requirements and registration details"
          />
          <div className="organization__grid-2">
            <div style={{ display: "flex", gap: "20px" }}>
              <Field
                label="CIPC Registration Number *"
                value={formData.registration.cipc}
                onChange={(v) => setField("registration", "cipc", v)}
                error={errors["registration.cipc"]}
                inputRef={(el) => (fieldRefs.current["registration.cipc"] = el)}
                placeholder="Enter cipc registration number"
              />
              <Field
                label="VAT Number *"
                value={formData.registration.vatNumber}
                onChange={(v) => setField("registration", "vatNumber", v)}
                error={errors["registration.vatNumber"]}
                inputRef={(el) =>
                  (fieldRefs.current["registration.vatNumber"] = el)
                }
                placeholder="Enter vat number"
              />
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
              <Field
                label="PAYE Reference Number *"
                value={formData.registration.payeReference}
                onChange={(v) => setField("registration", "payeReference", v)}
                error={errors["registration.payeReference"]}
                placeholder="Enter paye reference number"
              />
              <Field
                label="UIF Number"
                value={formData.registration.uifNumber}
                onChange={(v) => setField("registration", "uifNumber", v)}
                placeholder="Enter uif number"
              />
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
              <Field
                label="Currency"
                as="select"
                options={CURRENCY_OPTIONS}
                value={formData.registration.currency}
                onChange={(v) => setField("registration", "currency", v)}
              />
              <Field
                label="Timezone"
                as="select"
                options={["Africa/Johannesburg", "UTC"]}
                value={formData.registration.timezone}
                onChange={(v) => setField("registration", "timezone", v)}
              />
            </div>
          </div>
        </div>
      );
    } else if (selectedCountry === "UAE") {
      return (
        <div className="organization__card">
          <SectionHeader
            icon="🇦🇪"
            title="United Arab Emirates – Legal & Registration Details"
            subtitle="Complete country-specific legal requirements and registration details"
          />
          <div className="organization__grid-2">
            <div style={{ display: "flex", gap: "20px" }}>
              <Field
                label="Trade License Number *"
                value={formData.registration.tradeLicense}
                onChange={(v) => setField("registration", "tradeLicense", v)}
                error={errors["registration.tradeLicense"]}
                inputRef={(el) =>
                  (fieldRefs.current["registration.tradeLicense"] = el)
                }
                placeholder="Enter trade license number"
              />
              <Field
                label="VAT TRN *"
                value={formData.registration.vatTrn}
                onChange={(v) => setField("registration", "vatTrn", v)}
                error={errors["registration.vatTrn"]}
                inputRef={(el) =>
                  (fieldRefs.current["registration.vatTrn"] = el)
                }
                placeholder="Enter vat trn"
              />
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
              <Field
                label="Establishment Card Number"
                value={formData.registration.establishmentCard}
                onChange={(v) =>
                  setField("registration", "establishmentCard", v)
                }
                error={errors["registration.establishmentCard"]}
                placeholder="Enter establishment card number"
                inputRef={(el) =>
                  (fieldRefs.current["registration.establishmentCard"] = el)
                } // ✅ this enables scroll-to-error
              />
              <Field
                label="Company Type *"
                as="select"
                options={UAE_COMPANY_TYPES}
                value={
                  formData.registration.companyType || UAE_COMPANY_TYPES[0]
                }
                onChange={(v) => setField("registration", "companyType", v)}
                error={errors["registration.companyType"]}
                inputRef={(el) =>
                  (fieldRefs.current["registration.companyType"] = el)
                }
              />
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
              <Field
                label="Registered Emirate *"
                as="select"
                options={UAE_EMIRATES}
                value={
                  formData.registration.registeredEmirate || UAE_EMIRATES[0]
                }
                onChange={(v) =>
                  setField("registration", "registeredEmirate", v)
                }
                error={errors["registration.registeredEmirate"]}
                inputRef={(el) =>
                  (fieldRefs.current["registration.registeredEmirate"] = el)
                }
              />
              <Field
                label="Currency"
                as="select"
                options={CURRENCY_OPTIONS}
                value={formData.registration.currency}
                onChange={(v) => setField("registration", "currency", v)}
              />
            </div>
            <Field
              label="Timezone"
              as="select"
              options={["Asia/Dubai", "UTC"]}
              value={formData.registration.timezone}
              onChange={(v) => setField("registration", "timezone", v)}
            />
          </div>
        </div>
      );
    }
    return null;
  }
  // 💡 Country-specific statutory flags
  // - India → pfEpf
  // - South Africa → uifPaye
  // - UAE → wps
  function CountryStatutorySection() {
    const Chips = () => (
      <div className="organization__chips">
        {/* 🔹 Country-specific statutory checkboxes */}
        {selectedCountry === "India" && (
          <>
            <CheckboxChip
              label="Enable PF/EPF"
              checked={formData.statutory.pfEpf}
              onChange={(v) => setField("statutory", "pfEpf", v)}
            />
            <CheckboxChip
              label="Enable ESI"
              checked={formData.statutory.esi}
              onChange={(v) => setField("statutory", "esi", v)}
            />
          </>
        )}

        {selectedCountry === "South Africa" && (
          <CheckboxChip
            label="Enable UIF / PAYE"
            checked={formData.statutory.uifPaye}
            onChange={(v) => setField("statutory", "uifPaye", v)}
          />
        )}

        {selectedCountry === "UAE" && (
          <CheckboxChip
            label="Enable WPS Compliance"
            checked={formData.statutory.wps}
            onChange={(v) => setField("statutory", "wps", v)}
          />
        )}

        {/* 🔹 Common checkboxes */}
        <CheckboxChip
          label="Include Country-Specific Holidays"
          checked={formData.statutory.includeHolidays}
          onChange={(v) => setField("statutory", "includeHolidays", v)}
        />
        <CheckboxChip
          label="Enable Gratuity Policy"
          checked={formData.statutory.gratuity}
          onChange={(v) => setField("statutory", "gratuity", v)}
        />
      </div>
    );

    return (
      <div className="organization__card">
        <SectionHeader
          icon="🛡️"
          title="Statutory Configurations"
          subtitle="Enable compliance features and statutory requirements for your organization"
        />

        <div className="organization__title-sm">Compliance Features</div>
        <Chips />

        <hr className="organization__divider" />

        <div className="organization__title-sm">Payroll Configuration</div>
        <div style={{ display: "flex", gap: "20px" }}>
          <Field
            label="Default Payroll Currency"
            as="select"
            options={CURRENCY_OPTIONS}
            value={formData.statutory.defaultPayrollCurrency}
            onChange={(v) => setField("statutory", "defaultPayrollCurrency", v)}
          />
          <Field
            label="Default Payroll Frequency"
            as="select"
            options={PAYROLL_FREQUENCIES}
            value={formData.statutory.defaultPayrollFrequency || "Monthly"}
            onChange={(v) =>
              setField("statutory", "defaultPayrollFrequency", v)
            }
          />
        </div>
      </div>
    );
  }

  function CountryDocumentsSection() {
    return (
      <div className="organization__card">
        <SectionHeader
          icon="📁"
          title="Organization Document Repository"
          subtitle="Upload and manage organization documents"
        />

        <div className="organization__req-header">
          <div className="organization__req-title-wrap">
            <div className="organization__req-dot" />
            <div className="organization__req-title">
              Required Legal Documents
            </div>
            <div className="organization__req-badge">
              {selectedCountry === "India" ? "3 Required" : "3 Required"}
            </div>
          </div>
        </div>

        <div className="organization__req-grid">
          {selectedCountry === "India" && (
            <>
              <div
                ref={(el) =>
                  (fieldRefs.current[
                    "documents.required.certificateOfIncorporation"
                  ] = el)
                }
              >
                <FileUploader
                  label="Certificate of Incorporation *"
                  value={formData.documents.required.certificateOfIncorporation}
                  onChange={(url) =>
                    setDocRequired("certificateOfIncorporation", url)
                  }
                  onPreview={({ url }) => setPreview({ open: true, url })}
                  required
                />
                {errors["documents.required.certificateOfIncorporation"] && (
                  <div className="organization__error-text">
                    {errors["documents.required.certificateOfIncorporation"]}
                  </div>
                )}
              </div>

              <div
                ref={(el) =>
                  (fieldRefs.current["documents.required.panCard"] = el)
                }
              >
                <FileUploader
                  label="PAN Card *"
                  value={formData.documents.required.panCard}
                  onChange={(url) => setDocRequired("panCard", url)}
                  onPreview={({ url }) => setPreview({ open: true, url })}
                  required
                />
                {errors["documents.required.panCard"] && (
                  <div className="organization__error-text">
                    {errors["documents.required.panCard"]}
                  </div>
                )}
              </div>

              <div>
                <FileUploader
                  label="GST Certificate *"
                  value={formData.documents.required.gstCertificate}
                  onChange={(url) => setDocRequired("gstCertificate", url)}
                  onPreview={({ url }) => setPreview({ open: true, url })}
                  required
                />
                {errors["documents.required.gstCertificate"] && (
                  <div className="organization__error-text">
                    {errors["documents.required.gstCertificate"]}
                  </div>
                )}
              </div>
            </>
          )}

          {selectedCountry === "South Africa" && (
            <>
              <div
                ref={(el) =>
                  (fieldRefs.current[
                    "documents.required.companyRegistrationCertificate"
                  ] = el)
                }
              >
                <FileUploader
                  label="Company Registration Certificate *"
                  value={
                    formData.documents.required.companyRegistrationCertificate
                  }
                  onChange={(url) =>
                    setDocRequired("companyRegistrationCertificate", url)
                  }
                  onPreview={({ url }) => setPreview({ open: true, url })}
                  required
                />
                {errors[
                  "documents.required.companyRegistrationCertificate"
                ] && (
                  <div className="organization__error-text">
                    {
                      errors[
                        "documents.required.companyRegistrationCertificate"
                      ]
                    }
                  </div>
                )}
              </div>

              <div
                ref={(el) =>
                  (fieldRefs.current["documents.required.vatCertificate"] = el)
                }
              >
                <FileUploader
                  label="VAT Certificate *"
                  value={formData.documents.required.vatCertificate}
                  onChange={(url) => setDocRequired("vatCertificate", url)}
                  onPreview={({ url }) => setPreview({ open: true, url })}
                  required
                />
                {errors["documents.required.vatCertificate"] && (
                  <div className="organization__error-text">
                    {errors["documents.required.vatCertificate"]}
                  </div>
                )}
              </div>

              <div
                ref={(el) =>
                  (fieldRefs.current["documents.required.uifCertificate"] = el)
                }
              >
                <FileUploader
                  label="UIF Certificate *"
                  value={formData.documents.required.uifCertificate}
                  onChange={(url) => setDocRequired("uifCertificate", url)}
                  onPreview={({ url }) => setPreview({ open: true, url })}
                  required
                />
                {errors["documents.required.uifCertificate"] && (
                  <div className="organization__error-text">
                    {errors["documents.required.uifCertificate"]}
                  </div>
                )}
              </div>
            </>
          )}

          {selectedCountry === "UAE" && (
            <>
              <div
                ref={(el) =>
                  (fieldRefs.current["documents.required.tradeLicense"] = el)
                }
              >
                <FileUploader
                  label="Trade License *"
                  value={formData.documents.required.tradeLicense}
                  onChange={(url) => setDocRequired("tradeLicense", url)}
                  onPreview={({ url }) => setPreview({ open: true, url })}
                  required
                />
                {errors["documents.required.tradeLicense"] && (
                  <div className="organization__error-text">
                    {errors["documents.required.tradeLicense"]}
                  </div>
                )}
              </div>

              <div
                ref={(el) =>
                  (fieldRefs.current["documents.required.vatCertificateUAE"] =
                    el)
                }
              >
                <FileUploader
                  label="VAT Certificate *"
                  value={formData.documents.required.vatCertificateUAE}
                  onChange={(url) => setDocRequired("vatCertificateUAE", url)}
                  onPreview={({ url }) => setPreview({ open: true, url })}
                  required
                />
                {errors["documents.required.vatCertificateUAE"] && (
                  <div className="organization__error-text">
                    {errors["documents.required.vatCertificateUAE"]}
                  </div>
                )}
              </div>

              <div
                ref={(el) =>
                  (fieldRefs.current[
                    "documents.required.establishmentCardDoc"
                  ] = el)
                }
              >
                <FileUploader
                  label="Establishment Card *"
                  value={formData.documents.required.establishmentCardDoc}
                  onChange={(url) =>
                    setDocRequired("establishmentCardDoc", url)
                  }
                  onPreview={({ url }) => setPreview({ open: true, url })}
                  required
                />
                {errors["documents.required.establishmentCardDoc"] && (
                  <div className="organization__error-text">
                    {errors["documents.required.establishmentCardDoc"]}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="organization__opt-wrap">
          <div className="organization__opt-dot" />
          <div className="organization__req-title">
            Additional Supporting Documents
          </div>
          <div className="organization__opt-badge">Optional</div>
        </div>

        <div className="organization__mt-8">
          <FileUploader
            label="Upload Supporting Document"
            onChange={(url) => pushAdditionalDoc(url)}
            onPreview={({ url }) => setPreview({ open: true, url })}
            required={false}
          />
        </div>

        {formData.documents.additional.length > 0 && (
          <div className="organization__mt-12">
            {formData.documents.additional.map((url, idx) => (
              <div key={idx} className="organization__doc-row">
                <div className="organization__doc-left">
                  <div className="organization__doc-thumb">📄</div>
                  <div>
                    <div className="organization__text-700">
                      {getFileName(url)}
                    </div>
                    <div className="organization__text-muted-small">{url}</div>
                  </div>
                </div>
                <div className="organization__doc-actions">
                  <button
                    type="button"
                    className="organization__link-btn"
                    onClick={() => setPreview({ open: true, url })}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="organization__danger-btn"
                    onClick={() => removeAdditionalDoc(idx)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="organization__tips-box">
          <div className="organization__text-700 organization__mb-6">
            Document Upload Tips
          </div>
          <ul className="organization__tips-list">
            <li>Ensure documents are clear and legible</li>
            <li>Use descriptive names for easy identification</li>
            <li>PDF format is preferred for official documents</li>
          </ul>
        </div>
      </div>
    );
  }

  /* ---------- Main render ---------- */
  if (!isCreateMode && !selectedOrg?.id) {
    return (
      <div className="organization__empty">
        Please provide <code>parentId</code> (for creating) or{" "}
        <code>selectedOrg</code> (for editing)
      </div>
    );
  }
  if (loading)
    return <div className="organization__loading">Loading organization…</div>;

  return (
    <div className="organization">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="organization__form"
      >
        {/* 1) Parent Organization Information */}
        <div className="organization__card">
          <SectionHeader
            icon="📄"
            title="Parent Organization Information"
            subtitle="Configure the main organization details and legal information"
          />
          <div className="organization__formcontainer">
            <div className="organization__formcontainer__firstRow">
              <Field
                label="Organization Name *"
                value={formData.orgInfo.orgName}
                onChange={(v) => setField("orgInfo", "orgName", v)}
                error={errors["orgInfo.orgName"]}
                inputRef={(el) => (fieldRefs.current["orgInfo.orgName"] = el)}
              />

              <Field
                label="Legal Entity Name *"
                value={formData.orgInfo.legalEntityName}
                onChange={(v) => setField("orgInfo", "legalEntityName", v)}
                error={errors["orgInfo.legalEntityName"]}
                inputRef={(el) =>
                  (fieldRefs.current["orgInfo.legalEntityName"] = el)
                }
              />
            </div>
            <div className="organization__formcontainer__secoundRow">
              <Field
                label="Country *"
                as="select"
                options={COUNTRY_OPTIONS}
                value={selectedCountry}
                onChange={(v) => {
                  isManualCountryChange.current = true; // ✅ mark user action
                  setSelectedCountry(v);
                }}
              />
              <Field
                label="Business Unit"
                value={formData.orgInfo.businessUnit}
                onChange={(v) => setField("orgInfo", "businessUnit", v)}
                error={errors["orgInfo.businessUnit"]}
                inputRef={(el) =>
                  (fieldRefs.current["orgInfo.businessUnit"] = el)
                }
              />
            </div>
            <div className="organization__formcontainer__thirdRow">
              <Field
                label="Registered Address *"
                as="textarea"
                full
                value={formData.orgInfo.address}
                onChange={(v) => setField("orgInfo", "address", v)}
                error={errors["orgInfo.address"]}
                inputRef={(el) => (fieldRefs.current["orgInfo.address"] = el)}
              />
            </div>

            {/* Contact Number — single input */}
            <div className="organization__formcontainer__forthRow">
              <Field
                label="Contact Number *"
                value={formData.orgInfo.contactNumber}
                onChange={(v) => setField("orgInfo", "contactNumber", v)}
                error={errors["orgInfo.contactNumber"]}
                inputRef={(el) =>
                  (fieldRefs.current["orgInfo.contactNumber"] = el)
                }
              />
              <Field
                label="Contact Email *"
                value={formData.orgInfo.contactEmail}
                onChange={(v) => setField("orgInfo", "contactEmail", v)}
                error={errors["orgInfo.contactEmail"]}
                inputRef={(el) =>
                  (fieldRefs.current["orgInfo.contactEmail"] = el)
                }
              />
            </div>

            <div
              className="organization__field organization__field--full"
              ref={(el) => (fieldRefs.current["orgInfo.companyLogo"] = el)}
            >
              <label className="organization__label">Company Logo</label>
              <FileUploader
                label="Company Logo"
                value={formData.orgInfo.companyLogo}
                onChange={(url) => setField("orgInfo", "companyLogo", url)}
                onPreview={({ url }) => setPreview({ open: true, url })}
                allowedTypes={["png", "jpg", "jpeg", "webp", "svg"]}
                required
                maxSizeMB={5}
              />
              {errors["orgInfo.companyLogo"] && (
                <div className="organization__error-text">
                  {errors["orgInfo.companyLogo"]}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2) Country-specific Registration Section */}
        {CountryRegistrationSection()}

        {/* 3) Statutory */}
        {CountryStatutorySection()}

        {/* 4) Documents */}
        {CountryDocumentsSection()}

        {/* Advanced */}
        {isCreateMode && (
          <AdvancedSettings value={formData.advanced} onChange={setAdvanced} />
        )}

        {/* Submit */}
        <div className="organization__footer">
          <button
            type="submit"
            disabled={submitting}
            className="organization__primary-btn"
          >
            {submitting
              ? isCreateMode
                ? "Creating…"
                : "Submitting…"
              : isCreateMode
              ? "Create Organization"
              : "Submit"}
          </button>
        </div>
      </form>

      {/* Lightbox Preview Modal */}
      {preview.open && (
        <div
          className="organization__modal-backdrop"
          onClick={() => setPreview({ open: false, url: "" })}
        >
          <div
            className="organization__modal-body"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="organization__modal-header">
              <div className="organization__text-700">
                {getFileName(preview.url) || "Preview"}
              </div>
              <button
                className="organization__close-btn"
                onClick={() => setPreview({ open: false, url: "" })}
              >
                ✕
              </button>
            </div>
            <div className="organization__modal-content">
              {isImage(preview.url) ? (
                <img
                  src={preview.url}
                  alt="Preview"
                  className="organization__preview-image"
                />
              ) : (
                <div className="organization__iframe-wrap">
                  <iframe
                    title="Document"
                    src={preview.url}
                    className="organization__iframe"
                  />
                  <div className="organization__mt-8 organization__center">
                    <a href={preview.url} target="_blank" rel="noreferrer">
                      Open in new tab
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
