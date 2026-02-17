import { Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";

const AdminRoutes = ({ children }) => {
  const token = localStorage.getItem("token");

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (err) {
    user = null;
  }

  // Not logged in
  if (!token || !user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Not admin
  if (user.role?.toLowerCase() !== "admin") {
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
