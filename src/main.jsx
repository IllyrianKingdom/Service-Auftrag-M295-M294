import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import Login from "./components/login.jsx";
import "./index.css";
import Dashboard from "./components/dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Auftraege from "./components/auftraege.jsx";

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
   
    ],
  },
],

);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
