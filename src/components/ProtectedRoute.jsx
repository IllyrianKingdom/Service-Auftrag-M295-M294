import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { user, isInitialized } = useAuth();
  
  // Warte bis AuthProvider initialisiert ist
  if (!isInitialized) {
    return <div>Loading...</div>;
  }
  
  // Prüfe ob User im Context ist
  const hasContextUser = !!user;
  
  // Oder in localStorage
  const hasLocalStorageUser = !!localStorage.getItem("sa_user");
  
  // Und ob Token existiert
  const hasAuthToken = !!localStorage.getItem("authToken");

  // User ist authenticated wenn beides da ist
  const isAuthenticated = hasAuthToken && (hasContextUser || hasLocalStorageUser);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
                  
  return children;
}
