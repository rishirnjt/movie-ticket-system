import React, { Children }  from "react";
import { Navigate } from "react-router-dom";

const AdminRoutes = ({ children}) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");


    //if not logged in as admin
    if(!token || !user || user.role !== "admin") {
        return <Navigate to="/" replace />
    }

    return children;
};

export default AdminRoutes;