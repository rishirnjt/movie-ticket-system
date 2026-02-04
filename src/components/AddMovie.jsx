import React from "react";
import Sidebar from "./Sidebar";
import MovieForm from "./MovieForm";
import { useNavigate } from "react-router-dom";
import "./MovieForm.css";

const AddMovie = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-content">
        <MovieForm mode="add" onSuccess={() => navigate("/admin/manage-movies")} />
      </div>
    </div>
  );
};

export default AddMovie;
