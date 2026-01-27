import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  // Check multiple sources for token/user existence
  const hasContextUser = !!user;
  const hasLocalStorageUser = !!localStorage.getItem("sa_user");
  const hasAuthToken = !!localStorage.getItem("authToken");
  const hasCookie = document.cookie.split(';').some(cookie => 
    cookie.trim().startsWith('authToken=') || cookie.trim().startsWith('sessionToken=')
  );

  // User is authenticated if they have a token AND context user, or at least have stored credentials
  const isAuthenticated = hasAuthToken && (hasContextUser || hasLocalStorageUser);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

