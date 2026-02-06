import React from "react";
import MovieForm from "../components/MovieForm";
import { useParams, useNavigate } from "react-router-dom";
import "./MovieForm.css";

const EditMovie = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="admin-layout">
      <div className="admin-content">
        <MovieForm
          mode="edit"
          movieId={id}
          onSuccess={() => navigate("/admin/manage-movies")}
        />
      </div>
    </div>
  );
};

export default EditMovie;
