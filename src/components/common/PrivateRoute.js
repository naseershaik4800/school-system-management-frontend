import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const PrivateRoute = ({ component: Component, roles, children }) => {
  const token = localStorage.getItem("token");
  
  const isAuthenticated = () => {
    // console.log("PrivateRoute - Token:", token);
    if (!token) {
      console.log("No token found");
      return false;
    }
    try {
      const decoded = jwtDecode(token);
      // console.log("Decoded token:", decoded);
      const currentTime = Date.now() / 1000;
      // console.log("Current time:", currentTime, "Token exp:", decoded.exp);
      if (decoded.exp < currentTime) {
        console.log("Token expired");
        localStorage.removeItem("token");
        return false;
      }
      // console.log("Roles required:", roles, "User role:", decoded.role);
      return roles.includes(decoded.role);
    } catch (error) {
      console.error("Token decode error:", error);
      return false;
    }
  };

  const authenticated = isAuthenticated();
  // console.log("Is authenticated:", authenticated);
  return authenticated ? (children || <Component />) : <Navigate to="/login" />;
};

export default PrivateRoute;