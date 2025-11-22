import React, { createContext, useContext, useState, useCallback } from "react";
import Loading from "@components/common/Loading";

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    type: "spinner",
    size: "md",
    message: "",
    fullScreen: false,
  });

  // Show loader
  const showLoading = useCallback((options = {}) => {
    setLoadingState({
      isLoading: true,
      type: options.type || "spinner",
      size: options.size || "md",
      message: options.message || "",
      fullScreen: options.fullScreen ?? true,
    });
  }, []);

  // Hide loader
  const hideLoading = useCallback(() => {
    setLoadingState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}

      {/* Render global loader if active */}
      {loadingState.isLoading && (
        <Loading
          type={loadingState.type}
          size={loadingState.size}
          message={loadingState.message}
          fullScreen={loadingState.fullScreen}
        />
      )}
    </LoadingContext.Provider>
  );
};

// Custom hook
export const useLoading = () => useContext(LoadingContext);


//Usage:
// import { useLoading } = "@context/LoadingContext"

// const { showLoading, hideLoading } = useLoading();

// showLoading({type: 'spinner' size: 'sm/md/lg' message: 'your message' fullscreen });

// hideLoading();