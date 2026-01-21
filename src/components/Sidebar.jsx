import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="col-md-3 col-lg-2 sidebar">
      <div className="text-center mb-4">
        <div className="avatar">R</div>
        <h5>Richie</h5>
      </div>

      <NavLink to="/admin/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Dashboard</NavLink>
      <NavLink to="/admin/add-movie"   id="add-movie" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Add Movies</NavLink>
      <NavLink to="/admin/list-shows" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>List Shows</NavLink>
      <NavLink to="/admin/list-bookings" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>List Bookings</NavLink>
      <NavLink to="/admin/foods" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Add Food & Drinks</NavLink>
      <NavLink to="/admin/foods" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Calendar</NavLink>
      <NavLink to="/admin/foods" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Reports & Analytics</NavLink>
      <NavLink to="/admin/foods" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Setting</NavLink>


      <div className="logout mt-auto">Logout</div>
    </aside>
  );
};

export default Sidebar;
