import { Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";

const AdminRoutes = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!token || !user || user.role?.toLowerCase() !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
};

export default AdminRoutes;
