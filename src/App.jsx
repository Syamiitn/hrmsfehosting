import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import './App.css'

// Route groups
import LoginRoutes from "@routes/LoginRoutes";
import AdminRoutes from "@routes/AdminRoutes";
import EmployeeRoutes from "@routes/EmployeeRoutes";
import HrRoutes from "@routes/HrRoutes";
import ManagerRoute from "@routes/ManagerRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login / Public routes */}
        {LoginRoutes}

        {/* Admin Routes */}
        {AdminRoutes}

        {/* Employee Routes */}
        {EmployeeRoutes}

        {/* Hr Routes */}
        {HrRoutes}

        {/* Manager Routes */}
        {ManagerRoute}

        {/* Redirecting to login */}
        <Route path="*" element={<Navigate to={'/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}
