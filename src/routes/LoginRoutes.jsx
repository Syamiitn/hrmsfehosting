import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "@components/ProtectedRoute";
// Pages
import LoginPage from "@components/Login";
import ResetPasswordPage from "@components/ResetPassword";

export default [
    <Route element={<ProtectedRoute isPublic />}>
        <Route key="login" path="/login" element={<LoginPage />} />
    </Route>,
    <Route key="reset-password" path="/reset-password" element={<ResetPasswordPage />} />
];
