import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";


export function AuthLayout() {
  const { user, loadingUser } = useAppContext();

  if (loadingUser) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function GuestLayout() {
  const { user, loadingUser } = useAppContext();

  if (loadingUser) return <Loading />;
  // already signed in: skip login/register and go to the chat page
  if (user) return <Navigate to="/chat" replace />;

  return <Outlet />;
}
