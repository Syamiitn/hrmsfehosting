import React, { useEffect } from "react";
 
export default function ModalBox({
  open,
  onClose,
  title,
  children,
  footer,
  fullWidth = false,
}) {
  // Disable ESC close by default — only backdrop closes
  useEffect(() => {
    const handler = (e) => {
      // do nothing on Escape
    };
    if (open) {
      window.addEventListener("keydown", handler);
    }
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [open]);
 
  if (!open) return null;
 
  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div
        style={{
          ...styles.container,
          width: fullWidth ? "100vw" : "720px",
          borderRadius: fullWidth ? 0 : 12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>{title}</div>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
 
        {/* Content */}
        <div style={styles.content}>{children}</div>
 
        {/* Footer: only render if provided */}
        {footer && <div style={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
 
/* =============== Inline Styles =============== */
const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.35)",
    display: "grid",
    placeItems: "center",
    zIndex: 999,
  },
  container: {
    background: "#fff",
    maxHeight: "90vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 10px 30px rgba(0,0,0,.15)",
  },
  header: {
    padding: "14px 18px",
    borderBottom: "1px solid #eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontWeight: 700,
  },
  title: {
    fontWeight: 700,
  },
  closeBtn: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
  },
  content: {
    padding: 18,
    overflowY: "auto",
    flexGrow: 1,
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    padding: 12,
    borderTop: "1px solid #eee",
    background: "#fafafa",
  },
};
 