import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import App from "./App.jsx";
import Login from "./components/login.jsx";
import "./index.css";
import Dashboard from "./components/dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Disposition from "./components/disposition.jsx";
import Auftraege from "./components/auftraege.jsx";
import Berichte from "./components/berichte.jsx";
import Mitarbeiter from "./components/mitarbeiter.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,  
        element: <Login />,
      },
      {
        path: "/dashboard", 
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>
      },
      {
        path: "/auftraege", 
        element: <ProtectedRoute><Auftraege /></ProtectedRoute>
      },
      {
        path: "/disposition", 
        element: <ProtectedRoute><Disposition /></ProtectedRoute>
      },
      {
        path: "/berichte", 
        element: <ProtectedRoute><Berichte /></ProtectedRoute>
      },
      {
        path: "/mitarbeiter", 
        element: <ProtectedRoute><Mitarbeiter /></ProtectedRoute>
      },
   
    ],
  },

  {path: "/dashboard", element: <ProtectedRoute><Dashboard /></ProtectedRoute>}


],

);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
