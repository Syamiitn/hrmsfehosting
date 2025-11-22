import React, { useState, useEffect, useRef } from "react";
import {
  MdArrowBack,
  MdPersonAddAlt1,
  MdBadge,
  MdLocationOn,
  MdEdit,
} from "react-icons/md";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from "react-router-dom";
import { useModal } from "@context/GlobalModalContext";
import { useApi } from "@hooks/useApi";
import DateInput from "@components/common/DateInput";
import { showErrorToast, showSuccessToast } from "@utils/utils";
import Button from "@components/common/Button";
import "./index.css";
import CustomPhoneInput from "@components/common/PhoneInput";


// Utility function for backend date format (YYYY-MM-DD)
const formatDate = (date) => {
  if (!date) return "";
  // If already in YYYY-MM-DD, return as-is
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = new Date(date);
  if (isNaN(d)) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
};

// Normalize phone number for comparisons (keep only digits)
const normalizePhone = (p) => (p || "").toString().replace(/[^\d]/g, "");

// Code mappings for employee code generation
const ENTITY_CODES = {
  sogo_corporation: "SG",
  sogo_technologies: "ST",
  sogo_services: "SS",
  other: "OT",
};
const BUSINESS_UNIT_CODES = {
  "Human Resources": "HR",
  Finance: "FN",
  "Sales & Marketing": "SM",
  Operations: "OP",
  Other: "OT",
};
const EMP_TYPE_CODES = {
  full_time: "FT",
  part_time: "PT",
  contract: "CT",
  intern: "IN",
};

export default function EmpOnboarding() {
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();
  const { get, post, loading, lastError } = useApi();

  // refs
  const empRef = useRef(null);
  const personalRef = useRef(null);

  // address UI state
  const [sameAddress, setSameAddress] = useState(false);

  // form states
  const [employeeCode, setEmployeeCode] = useState("");
  const [sequenceNumber, setSequenceNumber] = useState(null);
  const [manualOverride, setManualOverride] = useState(false);
  const [codeStatus, setCodeStatus] = useState({ isTaken: null, message: "" });
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    employeeCode: "",
    legalEntity: "",
    businessUnit: "",
    employmentType: "",
    hireDate: "",
    firstName: "",
    middleName: "",
    lastName: "",
    displayName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    dob: "",
    gender: "",
    maritalStatus: "",
    emergencyName: "",
    emergencyPhone: "",
    manualOverride: false,
    currentAddress: { line1: "", city: "", state: "", postalCode: "" },
    permanentAddress: { line1: "", city: "", state: "", postalCode: "" },
  });

  const OnboardingSchema = Yup.object().shape({
    legalEntity: Yup.string().required("Legal Entity is required"),
    businessUnit: Yup.string().required("Business Unit is required"),
    employmentType: Yup.string().required("Employment Type is required"),
    hireDate: Yup.string().required("Hire Date is required"),
    firstName: Yup.string().trim().min(2, "First name must have 2+ characters").matches(/^[A-Za-z\s'\-\.]+$/, "Only letters, spaces, - and .' allowed").required("First name is required"),
    middleName: Yup.string().trim().max(50, "Middle name too long").matches(/^[A-Za-z\s'\-\.]*$/, "Only letters, spaces, - and .' allowed").nullable(),
    lastName: Yup.string().trim().min(2, "Last name must have 2+ characters").matches(/^[A-Za-z\s'\-\.]+$/, "Only letters, spaces, - and .' allowed").required("Last name is required"),
    dob: Yup.string()
      .required("Date of Birth is required")
      .test("past-date", "Date of Birth must be in the past", (value) => {
        if (!value) return true;
        const d = new Date(value);
        if (isNaN(d)) return false;
        return d < new Date();
      })
      .test("age-18+", "Employee must be at least 18 years old", (value) => {
        if (!value) return true;
        const d = new Date(value);
        if (isNaN(d)) return false;
        const today = new Date();
        const eighteen = new Date(d.getFullYear() + 18, d.getMonth(), d.getDate());
        return eighteen <= today;
      }),
    gender: Yup.string()
      .oneOf(["male", "female", "prefer-not-to-say"], "Select a valid gender option")
      .required("Gender is required"),

    // email validation with domain restrictions
    email: Yup.string().transform((v) => (v ? v.trim() : v))
      .email("Invalid email format")
      .matches(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, "Invalid email format")
      .test(
        "not-company-email",
        "Company domain emails are not allowed",
        (value) => {
          if (!value) return true;
          const restrictedDomains = [
            "sogo.com",
            "sogotechnologies.com",
            "sogocorporation.com",
            "sogoservices.com",
            "charter.com",
            "spectrum.com",
            "keybank.com",
            "elevancehealth.com",
            "tetriqsolutions.com",
          ];
          const domain = value.split("@")[1]?.toLowerCase();
          return !restrictedDomains.some((d) => domain?.endsWith(d));
        }
      )
      .required("Personal email is required"),
    phone: Yup.string()
      .required("Phone number is required")
      .test("valid-phone", "Enter a valid phone number (10-15 digits)", (v) => {
        const n = normalizePhone(v);
        return n.length >= 10 && n.length <= 15;
      }),
    alternatePhone: Yup.string()
      .nullable()
      .test("alt-valid", "Alternate phone must be 10-15 digits", (v) => {
        if (!v) return true;
        const n = normalizePhone(v);
        return n.length === 0 || (n.length >= 10 && n.length <= 15);
      })
      .test("alt-different", "Alternate phone cannot match phone", function (v) {
        const n1 = normalizePhone(v);
        const n2 = normalizePhone(this.parent.phone);
        if (!n1 || !n2) return true;
        return n1 !== n2;
      }),
    emergencyName: Yup.string().required("Emergency contact name is required"),
    emergencyPhone: Yup.string()
      .required("Emergency phone number is required")
      .test("emg-valid", "Emergency phone must be 10-15 digits", (v) => {
        const n = normalizePhone(v);
        return n.length >= 10 && n.length <= 15;
      })
      .test("emg-unique", "Emergency phone cannot match phone or alternate phone", function (v) {
        const n = normalizePhone(v);
        const n1 = normalizePhone(this.parent.phone);
        const n2 = normalizePhone(this.parent.alternatePhone);
        return n !== n1 && n !== n2;
      }),
    employeeCode: Yup.string().when('manualOverride', {
      is: true,
      then: (schema) => schema.required('Employee Code is required when manual override is enabled')
        .matches(/^[A-Z]{2}-[A-Z]{2}-[A-Z]{2}-\d{4}$/,
          'Format must be XX-XX-XX-0000'),
      otherwise: (schema) => schema.notRequired(),
    }),
    currentAddress: Yup.object({
      line1: Yup.string().trim().min(3, 'Address line must be at least 3 chars').required("Current address line is required"),
      city: Yup.string().trim().min(2, 'City must be at least 2 chars').required("Current city is required"),
      state: Yup.string().trim().min(2, 'State must be at least 2 chars').required("Current state is required"),
      postalCode: Yup.string().trim().matches(/^[A-Za-z0-9\s-]{3,10}$/,
        'Postal code must be 3-10 letters/digits').required("Current postal code is required"),
    }),
    permanentAddress: Yup.object({
      line1: Yup.string().trim().min(3, 'Address line must be at least 3 chars').required("Permanent address line is required"),
      city: Yup.string().trim().min(2, 'City must be at least 2 chars').required("Permanent city is required"),
      state: Yup.string().trim().min(2, 'State must be at least 2 chars').required("Permanent state is required"),
      postalCode: Yup.string().trim().matches(/^[A-Za-z0-9\s-]{3,10}$/,
        'Postal code must be 3-10 letters/digits').required("Permanent postal code is required"),
    }),
  });

  // =====================================================
  // Fetch Sequence Number (no random fallback)
  // =====================================================
  useEffect(() => {
    let isMounted = true;

    const fetchSeq = async () => {
      try {
        // Fetch from API
        const seqRes = await get("/employees/sequence?isCustom=false");

        if (isMounted && seqRes?.sequenceNumber) {
          setSequenceNumber(seqRes.sequenceNumber);
          sessionStorage.setItem("employeeSequence", seqRes.sequenceNumber);
        }
      } catch (err) {
        console.error("Failed to fetch sequence:", err.message);
        if (!isMounted) return;
        const cached = sessionStorage.getItem("employeeSequence");
        if (cached) {
          setSequenceNumber(Number(cached));
        } else {
          setSequenceNumber(null);
          showErrorToast("Could not fetch employee sequence. Please retry.");
        }
      }
    };

    fetchSeq();
    return () => {
      isMounted = false;
    };
  }, []);

  // =====================================================
  // Scroll to Section
  // =====================================================
  const scrollToSection = (ref) => {
    closeModal();
    setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth" }), 300);
  };

  // =====================================================
  // Submit Handler (Fixed)
  // =====================================================
  const handleConfirmSubmit = async (values) => {
    closeModal();
    try {
      // Determine which sequence number to send
      let seqToSend = sequenceNumber;
      if (manualOverride) {
        const match = (values.employeeCode || '').match(/(\d{1,4})$/);
        const customSeq = match ? parseInt(match[1], 10) : NaN;
        if (!Number.isFinite(customSeq) || customSeq <= 0) {
          showErrorToast("Enter a valid 1-4 digit custom code suffix before submitting.");
          return;
        }
        seqToSend = customSeq;
      }
      if (!Number.isFinite(seqToSend)) {
        showErrorToast("Sequence number not ready. Please retry.");
        return;
      }
      const payload = {
        employeeCode: values.employeeCode || employeeCode,
        sequenceNumber: seqToSend,
        employmentType: values.employmentType,
        status: "active",
        hireDate: formatDate(values.hireDate),
        exitDate: null,
        isCustom: manualOverride,
        isActive: true,
        onboardingStatus: "PENDING",
        personalDetails: {
          firstName: values.firstName,
          middleName: values.middleName,
          lastName: values.lastName,
          displayName: values.displayName,
          personalEmail: values.email,
          phoneNumber: values.phone,
          alternatePhone: values.alternatePhone,
          dateOfBirth: formatDate(values.dob),
          gender: values.gender,
          maritalStatus: values.maritalStatus,
          currentAddress: values.currentAddress,
          permanentAddress: values.permanentAddress,
          emergencyContactName: values.emergencyName,
          emergencyContactNumber: values.emergencyPhone,
          isActive: true,
        },
      };

      // Always send a numeric sequenceNumber:
      // - manualOverride = true  -> custom numeric suffix
      // - manualOverride = false -> system-generated numeric value we fetched

      const response = await post("/employees", payload);
      showSuccessToast("Employee Added Successfully!");

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate(`/hr/ems/directory/${response.data.id}/personal-details`);
      }, 1500);
    } catch (err) {
      console.error("Failed to add employee:", err);
      const backendMsg = Array.isArray(err?.data?.message)
        ? err.data.message.join("\n")
        : (err?.data?.message || err?.message || "Unknown error");
      showErrorToast(`Failed to add employee: ${backendMsg}`);
    }
  };

  // =====================================================
  // Preview Modal
  // =====================================================
  const handlePreview = (values) => {
    if (!values) {
      showErrorToast("Please fill all required fields before proceeding.");
      return;
    }

    // Additional guards for production readiness
    if (!sequenceNumber) {
      showErrorToast("Employee sequence not loaded. Please try again.");
      return;
    }
    if (!values.employeeCode) {
      showErrorToast("Employee code is not ready.");
      return;
    }
    if (manualOverride && codeStatus.isTaken !== false) {
      showErrorToast(codeStatus.message || "Custom code not verified as available.");
      return;
    }
    const required = (addr) => addr && addr.line1 && addr.city && addr.state && addr.postalCode;
    if (!required(values.currentAddress) || !required(values.permanentAddress)) {
      showErrorToast("Please complete both Current and Permanent Address.");
      return;
    }

    openModal(
      <div className="preview-modal wide">
        <div className="d-flex flex-column justify-content-center align-items-center">
          <h4>Review Employee Onboarding Details</h4>
          <p className="p3">Please verify all details before submission.</p>
        </div>

        <div className="preview-grid">
          <PreviewSection
            title="Employee Details"
            icon={<MdBadge className="accent-icon" />}
            fields={[
              { label: "Legal Entity", value: values.legalEntity },
              { label: "Business Unit", value: values.businessUnit },
              { label: "Employment Type", value: values.employmentType },
              { label: "Hire Date", value: values.hireDate },
              { label: "Employee Code", value: values.employeeCode || employeeCode || "Generating..." },
            ]}
            onEdit={() => scrollToSection(empRef)}
          />
          <PreviewSection
            title="Personal Details"
            icon={<MdLocationOn className="accent-icon" />}
            fields={[
              { label: "First Name", value: values.firstName },
              { label: "Middle Name", value: values.middleName || "-" },
              { label: "Last Name", value: values.lastName },
              { label: "Display Name", value: values.displayName },
              { label: "Email", value: values.email },
              { label: "Phone", value: values.phone },
              { label: "Alternate Phone", value: values.alternatePhone || "-" },
              { label: "Date of Birth", value: values.dob },
              { label: "Gender", value: values.gender || "-" },
              { label: "Marital Status", value: values.maritalStatus || "-" },
              {
                label: "Current Address",
                value: `${values.currentAddress?.line1 || ""}, ${values.currentAddress?.city || ""}, ${values.currentAddress?.state || ""} - ${values.currentAddress?.postalCode || ""}`,
              },
              {
                label: "Permanent Address",
                value: `${values.permanentAddress?.line1 || ""}, ${values.permanentAddress?.city || ""}, ${values.permanentAddress?.state || ""} - ${values.permanentAddress?.postalCode || ""}`,
              },
              {
                label: "Emergency Contact",
                value: `${values.emergencyName} (${values.emergencyPhone})`,
              },
            ]}
            onEdit={() => scrollToSection(personalRef)}
          />
        </div>

        <div className="modal-actions">
          <Button size="sm" variant="outline" label="Cancel" radius={5} onClick={closeModal} />
          <Button
            size="sm"
            variant="solid"
            label={loading ? "Submitting..." : "Confirm & Submit"}
            radius={5}
            disabled={loading}
            onClick={() => handleConfirmSubmit(values)} // passes values correctly

          />
        </div>
      </div>,
      { size: "xl", title: "Preview Employee Details", position: "center" }
    );
  };

  // =====================================================
  // =====================================================
  // Render
  return (
    <div className="onboard-page">
      <div className="container-fluid">
        <Formik
          initialValues={formData}
          validationSchema={OnboardingSchema}
          enableReinitialize
          validateOnMount
          onSubmit={(values) => {
            console.log("Validated Form Data:", values);
            // handlePreview(values); // will trigger preview modal after validation
          }}
        >
          {({ handleSubmit, isValid, values, setFieldValue }) => {
            // 💡 Keep Formik values in sync with employee code generation
            // Avoid persisting PII to storage (removed sessionStorage mirroring)

            // Keep employeeCode in parent synced with Formik
            useEffect(() => {
              if (values.employeeCode && values.employeeCode !== employeeCode) {
                setEmployeeCode(values.employeeCode);
              }
            }, [values.employeeCode]);

            return (
              <>
                {/* Move Header inside Formik, now values exist */}
                <Header
                  navigate={navigate}
                  employeeCode={values.employeeCode || employeeCode}
                />

                <Form onSubmit={handleSubmit}>
                  <EmployeeSection
                    empRef={empRef}
                    manualOverride={manualOverride}
                    setManualOverride={setManualOverride}
                    employeeCode={employeeCode}
                    codeStatus={codeStatus}
                    sequenceNumber={sequenceNumber}
                    onCodeStatusChange={setCodeStatus}
                  />

                  <PersonalSection
                    personalRef={personalRef}
                    sameAddress={sameAddress}
                    setSameAddress={setSameAddress}
                  />

                  {/* Footer */}
                  <Footer
                    isFormValid={isValid}
                    loading={loading}
                    handlePreview={() => handlePreview(values)}
                    showSuccess={showSuccess}
                    lastError={lastError}
                  />
                </Form>
              </>
            );
          }}
        </Formik>
      </div>
    </div>
  );
}

// =====================================================
// Subcomponents
// =====================================================

// Header
const Header = ({ navigate, employeeCode }) => (
  <div className="onboard-header shadow-sm">
    <button className="back-btn" onClick={() => navigate("/hr/ems/overview")}>
      <MdArrowBack className="icon" size={18} /> Back to Employee Management
    </button>
    <div className="heading-inline">
      <MdPersonAddAlt1 className="icon" />
      <div>
        <h5>Employee Onboarding</h5>
        <p className="p3">EMS · Add new employee to the organization</p>
      </div>
    </div>
    <div className="onboard-badge">
      <p>Employee ID</p>
      <h5>{employeeCode || "Auto-Generate"}</h5>
    </div>
  </div>
);

// Preview Section
const PreviewSection = ({ title, icon, fields = [], onEdit }) => {
  return (
    <div className="preview-section">
      {/* Header */}
      <div className="preview-header d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          {icon && <span className="accent-icon">{icon}</span>}
          <h5 className="m-0">{title}</h5>
        </div>

        {onEdit && (
          <Button
            size="sm"
            variant="solid"
            label="Edit"
            radius={5}
            iconLeft={<MdEdit size={16} />}
            onClick={onEdit}
          />
        )}
      </div>

      <hr className="my-2" />

      {/* Field List */}
      <ul className="preview-list">
        {fields.length > 0 ? (
          fields.map((f, i) => (
            <li key={i} className="d-flex justify-content-between align-items-start py-1">
              <span className="preview-label"><b>{f.label}</b></span>
              <span className="preview-value text-end">
                {f.value && f.value !== "" ? f.value : "-"}
              </span>
            </li>
          ))
        ) : (
          <li className="text-muted p3">No data available</li>
        )}
      </ul>
    </div>
  );
};

// Employee Section
const EmployeeSection = ({
  empRef,
  manualOverride,
  setManualOverride,
  employeeCode,
  codeStatus,
  sequenceNumber,
  onCodeStatusChange,
}) => {
  // Access Formik context
  const { values, setFieldValue, errors, touched } = useFormikContext();
  const { get } = useApi(); // for backend call
  const [status, setStatus] = useState({ isTaken: null, message: "" });
  const debounceRef = useRef(null);

  // ==============================================
  // Auto-generate Employee Code dynamically
  // ==============================================
  // Live preview with placeholders until all three are selected
  useEffect(() => {
    if (manualOverride) return;
    const entityCode = values.legalEntity
      ? (ENTITY_CODES[values.legalEntity] || values.legalEntity.substring(0, 2).toUpperCase())
      : "__";
    const buCode = values.businessUnit
      ? (BUSINESS_UNIT_CODES[values.businessUnit] || values.businessUnit.substring(0, 2).toUpperCase())
      : "__";
    const empTypeCode = values.employmentType
      ? (EMP_TYPE_CODES[values.employmentType] || values.employmentType.substring(0, 2).toUpperCase())
      : "__";
    const paddedSeq = sequenceNumber != null ? String(sequenceNumber).padStart(4, "0") : "0000";
    const newCode = `${entityCode}-${buCode}-${empTypeCode}-${paddedSeq}`;
    setFieldValue("employeeCode", newCode);
  }, [values.legalEntity, values.businessUnit, values.employmentType, manualOverride, sequenceNumber, setFieldValue]);

  // When manual override is ON, keep last 4 digits but update prefix if dropdowns change
  useEffect(() => {
    if (!manualOverride) return;
    const entityCode = values.legalEntity ? (ENTITY_CODES[values.legalEntity] || values.legalEntity.substring(0, 2).toUpperCase()) : "__";
    const buCode = values.businessUnit ? (BUSINESS_UNIT_CODES[values.businessUnit] || values.businessUnit.substring(0, 2).toUpperCase()) : "__";
    const empTypeCode = values.employmentType ? (EMP_TYPE_CODES[values.employmentType] || values.employmentType.substring(0, 2).toUpperCase()) : "__";
    const currentDigits = (values.employeeCode || "").match(/(\d{0,4})$/)?.[1] || "";
    const seq = String(currentDigits).padStart(4, "0");
    const locked = `${entityCode}-${buCode}-${empTypeCode}-${seq}`.toUpperCase();
    if (locked !== values.employeeCode) setFieldValue("employeeCode", locked);
  }, [values.legalEntity, values.businessUnit, values.employmentType, manualOverride, values.employeeCode, setFieldValue]);

  // ==============================================
  // 🔍 Check Custom Employee Code Availability (Debounced)
  // ==============================================
  const checkCustomEmployeeCode = async (code) => {
    if (!code || !manualOverride) return;

    const match = code.match(/(\d{1,4})$/);
    const numericPart = match ? match[1] : null;
    const seqNumber = numericPart != null ? parseInt(numericPart, 10) : NaN;

    // Ensure we send a real number (no leading-zero string) and non-zero
    if (!Number.isFinite(seqNumber) || seqNumber <= 0) {
      const s = { isTaken: true, message: "⚠️ Invalid sequence. Enter a number from 1 to 9999." };
      setStatus(s);
      onCodeStatusChange && onCodeStatusChange(s);
      return;
    }

    try {
      setStatus({ isTaken: null, message: "Checking..." });
      const res = await get(
        `/employees/sequence?isCustom=true&sequenceNumber=${seqNumber}`
      );

      if (res?.isTaken) {
        const s = { isTaken: true, message: res?.message || "Code already taken." };
        setStatus(s);
        onCodeStatusChange && onCodeStatusChange(s);
      } else {
        const s = { isTaken: false, message: res?.message || "Code is available." };
        setStatus(s);
        onCodeStatusChange && onCodeStatusChange(s);
      }
    } catch (err) {
      console.error("Code check failed:", err);
      const s = { isTaken: null, message: "Could not verify this code. Try again." };
      setStatus(s);
      onCodeStatusChange && onCodeStatusChange(s);
    }
  };

  // ==============================================
  // Handle manual Employee Code input
  // ==============================================
  const handleEmployeeCodeChange = (value) => {
    // Lock prefix; allow editing only the last 4 digits
    const entityCode = values.legalEntity
      ? (ENTITY_CODES[values.legalEntity] || values.legalEntity.substring(0, 2).toUpperCase())
      : "__";
    const buCode = values.businessUnit
      ? (BUSINESS_UNIT_CODES[values.businessUnit] || values.businessUnit.substring(0, 2).toUpperCase())
      : "__";
    const empTypeCode = values.employmentType
      ? (EMP_TYPE_CODES[values.employmentType] || values.employmentType.substring(0, 2).toUpperCase())
      : "__";

    const digits = String(value || "").replace(/\D/g, "").slice(-4);
    const seq = digits.padStart(4, "0");
    const locked = `${entityCode}-${buCode}-${empTypeCode}-${seq}`.toUpperCase();

    setFieldValue("employeeCode", locked);
    setStatus({ isTaken: null, message: "Checking..." });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      checkCustomEmployeeCode(locked);
    }, 600);
  };

  // ==============================================
  // Render Section
  // ==============================================
  return (
    <div ref={empRef} className="onboard-section">
      <div className="d-flex align-items-center gap-1">
        <MdBadge className="icon" />
        <h5>Employee Details</h5>
      </div>
      <hr />

      <div className="row">
        {/* Legal Entity */}
        <div className="col-12 col-md-6 col-lg-4 mb-3">
          <label className="form-label">Legal Entity *</label>
          <Field as="select" name="legalEntity" className="form-control">
            <option value="" disabled>Select legal entity</option>
            <option value="sogo_corporation">SoGo Corporation</option>
            <option value="sogo_technologies">SoGo Technologies</option>
            <option value="sogo_services">SoGo Services</option>
            <option value="other">Other</option>
          </Field>
          <ErrorMessage
            name="legalEntity"
            component="div"
            className="text-danger p4"
          />
        </div>

        {/* Business Unit */}
        <div className="col-12 col-md-6 col-lg-4 mb-3">
          <label className="form-label">Business Unit *</label>
          <Field as="select" name="businessUnit" className="form-control">
            <option value="" disabled>Select business unit</option>
            <option value="human_resources">Human Resources</option>
            <option value="finance">Finance</option>
            <option value="sales_marketing">Sales & Marketing</option>
            <option value="operations">Operations</option>
            <option value="other">Other</option>
          </Field>
          <ErrorMessage
            name="businessUnit"
            component="div"
            className="text-danger p4"
          />
        </div>

        {/* Employment Type */}
        <div className="col-12 col-md-6 col-lg-4 mb-3">
          <label className="form-label">Employment Type *</label>
          <Field as="select" name="employmentType" className="form-control">
            <option value="" disabled>Select employment type</option>
            <option value="full_time">Full-Time</option>
            <option value="part_time">Part-Time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
          </Field>
          <ErrorMessage
            name="employmentType"
            component="div"
            className="text-danger p4"
          />
        </div>

        {/* Hire Date */}
        <div className="col-12 col-md-6 col-lg-4 mb-3">
          <DateInput
            label="Hire Date"
            name="hireDate"
            value={values.hireDate}
            onChange={(date) => setFieldValue("hireDate", date)}
            hasError={!!(touched.hireDate && errors.hireDate)}
            required
          />
          <ErrorMessage
            name="hireDate"
            component="div"
            className="text-danger p4"
          />
        </div>

        {/* Employee Code */}
        <div className="col-12 col-md-6 col-lg-4 mb-3 full-width empcode-field">
          <div className="d-flex align-items-center justify-content-between">
            <label className="form-label">Employee Code</label>
            <div className="mb-1 d-flex gap-1">
              <span>Manual Override</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={manualOverride}
                  onChange={(e) => {
                    setManualOverride(e.target.checked);
                    setFieldValue('manualOverride', e.target.checked);
                    const s = { isTaken: null, message: "" };
                    setStatus(s);
                    onCodeStatusChange && onCodeStatusChange(s);
                  }}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <input
            className="form-control"
            type="text"
            name="employeeCode"
            value={values.employeeCode || employeeCode}
            placeholder="Auto-generated from table"
            disabled={!manualOverride}
            onChange={(e) => handleEmployeeCodeChange(e.target.value)}
          />

          {/* Status feedback */}
          {!manualOverride && (
            <p className="p4 text-muted">Auto-generated from system</p>
          )}
          {manualOverride && status.message && (
            <p
              className={`p4 ${status.isTaken === true
                  ? "text-danger"
                  : status.isTaken === false
                    ? "text-success"
                    : "text-secondary"
                }`}
            >
              {status.message}
            </p>
          )}
          <ErrorMessage name="employeeCode" component="div" className="text-danger p4" />
        </div>
      </div>
    </div>
  );
};


// Personal Section
const PersonalSection = ({
  personalRef,
  sameAddress,
  setSameAddress,
}) => {
  const { values, setFieldValue, setFieldTouched, errors, touched } = useFormikContext();

  // =====================================================
  //  Auto Display Name (Formik version)
  // =====================================================
  useEffect(() => {
    const first = values.firstName?.trim() || "";
    const last = values.lastName?.trim() || "";
    const display = `${first} ${last}`.trim();

    // only update if different (prevents infinite loop)
    if (display !== values.displayName) {
      setFieldValue("displayName", display);
    }
  }, [values.firstName, values.lastName, setFieldValue, values.displayName]);

  // =====================================================
  // Restricted domains (frontend-only)
  // =====================================================
  const restrictedDomains = [
    "sogo.com",
    "sogotechnologies.com",
    "sogocorporation.com",
    "sogoservices.com",
    "charter.com",
    "spectrum.com",
    "keybank.com",
    "elevancehealth.com",
    "tetriqsolutions.com",
    "eminentleap.com",
    "sogopartners.com",
    "accenture.com",
    "tcs.com",
    "wipro.com",
  ];

  // =====================================================
  // Render
  // =====================================================
  return (
    <div ref={personalRef} className="onboard-section">
      <div className="d-flex align-items-center gap-1">
        <MdLocationOn className="icon" />
        <h5>Personal Details</h5>
      </div>
      <hr />

      <div className="row">
        {/* First Name */}
        <div className="col-12 col-md-6 col-lg-4 mb-3">
          <label className="form-label">First Name *</label>
          <Field
            name="firstName"
            type="text"
            placeholder="Enter first name"
            className={`form-control ${touched.firstName && errors.firstName ? "error" : ""}`}
          />
          <ErrorMessage name="firstName" component="div" className="text-danger p4" />
        </div>

        {/* Middle Name */}
        <div className="col-12 col-md-6 col-lg-4 mb-3">
          <label className="form-label">Middle Name</label>
          <Field
            name="middleName"
            type="text"
            placeholder="Enter middle name"
            className="form-control"
          />
        </div>

        {/* Last Name */}
        <div className="col-12 col-md-6 col-lg-4 mb-3">
          <label className="form-label">Last Name *</label>
          <Field
            name="lastName"
            type="text"
            placeholder="Enter last name"
            className={`form-control ${touched.lastName && errors.lastName ? "error" : ""}`}
          />
          <ErrorMessage name="lastName" component="div" className="text-danger p4" />
        </div>

        {/* Display Name (auto) */}
        <div className="col-12 col-md-6 col-lg-4 mb-3">
          <label className="form-label">Display Name</label>
          <Field name="displayName" className="form-control" disabled />
        </div>

        {/* Email */}
        <div className="col-12 col-md-6 col-lg-4 mb-3">
          <label className="form-label">Email Address *</label>
          <Field
            name="email"
            type="email"
            placeholder="Enter personal email address"
            className={`form-control ${touched.email && errors.email ? "error" : ""}`}
            onChange={(e) => {
              const email = e.target.value.trim();
              const domain = email.split("@")[1]?.toLowerCase();
              if (domain && restrictedDomains.some((d) => domain.endsWith(d))) {
                showErrorToast("Company domain emails are not allowed in the Personal Email field");
                return;
              }
              setFieldValue("email", email);
            }}
          />
          <ErrorMessage name="email" component="div" className="text-danger p4" />
        </div>

        {/* Phone Number */}
        <div className="col-12 col-md-6 col-lg-4 mb-3">
          <CustomPhoneInput
            label="Phone Number"
            name="phone"
            value={values.phone}
            onChange={(phone, countryData) => {
              setFieldValue("phone", phone);
              setFieldValue("countryCode", countryData.countryCode);
              setFieldValue("dialCode", countryData.dialCode);
            }}
            hasError={!!(touched.phone && errors.phone)}
            required
            countryCodeEditable={false}
          />
          <ErrorMessage name="phone" component="div" className="text-danger p4" />
        </div>

        {/* Gender */}
        <div className="col-12 col-md-6 col-lg-4 mb-3">
          <label className="form-label">Gender *</label>
          <Field
            as="select"
            name="gender"
            className={`form-control ${touched.gender && errors.gender ? "error" : ""}`}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="prefer-not-to-say">Prefer Not to Say</option>
          </Field>
          <ErrorMessage name="gender" component="div" className="text-danger p4" />
        </div>

        {/* Date of Birth */}
        <div className="col-12 col-md-6 col-lg-4 mb-3">
          <DateInput
            label="Date of Birth"
            name="dob"
            value={values.dob}
            onChange={(date) => setFieldValue("dob", date)}
            hasError={!!(touched.dob && errors.dob)}
            required
            maxDate={new Date()}
          />
          <ErrorMessage name="dob" component="div" className="text-danger p4" />
        </div>

        {/* Marital Status */}
        <div className="col-12 col-md-8 col-lg-4 mb-3">
          <label className="form-label">Marital Status</label>
          <Field as="select" name="maritalStatus" className="form-control">
            <option value="">Select marital status</option>
            <option value={'single'}>Single</option>
            <option value={'married'}>Married</option>
            <option value={'divorced'}>Divorced</option>
            <option value={'widowed'}>Widowed</option>
            <option value={'prefer-not-to-say'}>Prefer Not to Say</option>
          </Field>
        </div>

        {/* Current Address */}
        <div className="col-12 col-md-6 full-width">
          <label className="form-label">Current Address *</label>
          <div className="address-grid">
            {["line1", "city", "state", "postalCode"].map((field) => (
              <input
                key={field}
                className={`form-control ${touched.currentAddress?.[field] && errors.currentAddress?.[field] ? 'error' : ''}`}
                type="text"
                name={`currentAddress.${field}`}
                placeholder={field === "line1" ? "Address Line 1" : field.charAt(0).toUpperCase() + field.slice(1)}
                value={values.currentAddress?.[field] || ""}
                onChange={(e) => {
                  const v = { ...(values.currentAddress || {}), [field]: e.target.value };
                  setFieldValue("currentAddress", v);
                  if (sameAddress) setFieldValue("permanentAddress", v);
                }}
              />
            ))}
          </div>
          <ErrorMessage name="currentAddress.line1" component="div" className="text-danger p4" />
          <ErrorMessage name="currentAddress.city" component="div" className="text-danger p4" />
          <ErrorMessage name="currentAddress.state" component="div" className="text-danger p4" />
          <ErrorMessage name="currentAddress.postalCode" component="div" className="text-danger p4" />
        </div>

        {/* Permanent Address */}
        <div className="col-12 col-md-6 full-width">
          <label className="form-label">Permanent Address *</label>
          <div className="address-grid">
            {["line1", "city", "state", "postalCode"].map((field) => (
              <input
                key={field}
                className={`form-control ${touched.permanentAddress?.[field] && errors.permanentAddress?.[field] ? 'error' : ''}`}
                type="text"
                name={`permanentAddress.${field}`}
                placeholder={field === "line1" ? "Address Line 1" : field.charAt(0).toUpperCase() + field.slice(1)}
                value={values.permanentAddress?.[field] || ""}
                disabled={sameAddress}
                onChange={(e) => {
                  const v = { ...(values.permanentAddress || {}), [field]: e.target.value };
                  setFieldValue("permanentAddress", v);
                }}
              />
            ))}
          </div>
          <ErrorMessage name="permanentAddress.line1" component="div" className="text-danger p4" />
          <ErrorMessage name="permanentAddress.city" component="div" className="text-danger p4" />
          <ErrorMessage name="permanentAddress.state" component="div" className="text-danger p4" />
          <ErrorMessage name="permanentAddress.postalCode" component="div" className="text-danger p4" />
        </div>

        {/* Same as Current */}
        <div className="toggle-inline my-3">
          <span>Same as Current Address</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={sameAddress}
              onChange={(e) => {
                const checked = e.target.checked;
                setSameAddress(checked);
                if (checked) {
                  setFieldValue("permanentAddress", values.currentAddress || { line1: "", city: "", state: "", postalCode: "" });
                }
              }}
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Alternate Phone */}
        <div className="col-12 col-md-6 col-lg-4 mb-3">
          <CustomPhoneInput
            label="Alternate Phone"
            name="alternatePhone"
            value={values.alternatePhone}
            onChange={(phone, countryData) => {
              setFieldValue("alternatePhone", phone);
              setFieldValue("alternateCountryCode", countryData.countryCode);
            }}
            hasError={!!(touched.alternatePhone && errors.alternatePhone)}
            defaultCountry={values.alternateCountryCode || values.countryCode || "in"}
            countryCodeEditable={false}
          />
        </div>

        {/* Emergency Contact Name */}
        <div className="col-12 col-md-6 col-lg-4 mb-3">
          <label className="form-label">Emergency Contact Name *</label>
          <Field
            name="emergencyName"
            type="text"
            placeholder="Enter emergency contact name"
            className={`form-control ${touched.emergencyName && errors.emergencyName ? "error" : ""}`}
          />
          <ErrorMessage name="emergencyName" component="div" className="text-danger p4" />
        </div>

        {/* Emergency Contact Phone */}
        <div className="col-12 col-md-6 col-lg-4 mb-3">
          <CustomPhoneInput
            label="Emergency Contact Phone"
            name="emergencyPhone"
            value={values.emergencyPhone}
            onChange={(phone, countryData) => {
              setFieldValue("emergencyPhone", phone);
              setFieldValue("emergencyCountryCode", countryData.countryCode);
              const sameAsPhone = normalizePhone(phone) === normalizePhone(values.phone);
              const sameAsAlt = normalizePhone(phone) === normalizePhone(values.alternatePhone);
              if (sameAsPhone || sameAsAlt) {
                setFieldTouched("emergencyPhone", true, true);
              }
            }}
            hasError={!!(touched.emergencyPhone && errors.emergencyPhone)}
            defaultCountry={values.emergencyCountryCode || values.countryCode || "in"}
            required
            countryCodeEditable={false}
          />
          <ErrorMessage name="emergencyPhone" component="div" className="text-danger p4" />
        </div>
      </div>
    </div>
  );
};

/// Footer
const Footer = ({ loading, handlePreview, showSuccess, lastError }) => {
  const { isValid, values, dirty, validateForm, setTouched } = useFormikContext();

  const touchAll = (obj) => {
    if (!obj || typeof obj !== 'object') return true;
    const out = Array.isArray(obj) ? [] : {};
    for (const key of Object.keys(obj)) out[key] = touchAll(obj[key]);
    return out;
  };

  const firstErrorPath = (errs, prefix = "") => {
    for (const key of Object.keys(errs)) {
      const value = errs[key];
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'string') return path;
      if (value && typeof value === 'object') {
        const child = firstErrorPath(value, path);
        if (child) return child;
      }
    }
    return null;
  };

  return (
    <div className="onboard-footer">
      <p className="p3">
        Please fill all mandatory fields to continue
      </p>

      <Button
        className={`${isValid && dirty ? "enabled" : ""}`}
        disabled={loading}
        onClick={async () => {
          const errs = await validateForm();
          if (Object.keys(errs || {}).length > 0) {
            setTouched(touchAll(errs), true);
            const path = firstErrorPath(errs);
            if (path) {
              let el = document.querySelector(`[name="${path}"]`);
              if (!el) el = document.querySelector(`[data-name="${path}"]`);
              if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              if (el && el.focus) try { el.focus(); } catch { }
            }
            return;
          }
          handlePreview(values);
        }}
        size="md"
        variant="solid"
        radius={5}
        label={loading ? "Submitting..." : "Preview & Submit"}
      />
    </div>
  );
};
