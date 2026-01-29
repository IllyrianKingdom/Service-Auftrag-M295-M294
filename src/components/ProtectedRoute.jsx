import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  
  const hasContextUser = !!user;
  const hasLocalStorageUser = !!localStorage.getItem("sa_user");
  const hasAuthToken = !!localStorage.getItem("authToken");
  

  const isAuthenticated = hasAuthToken && (hasContextUser || hasLocalStorageUser);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
                  
  return children;
}

