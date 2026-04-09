import React from "react";
import "./LoadingSpinner.css";

const LoadingSpinner = ({
  text = "Loading...",
  fullScreen = false,
  small = false,
}) => {
  return (
    <div
      className={`loading-spinner-wrap ${fullScreen ? "fullscreen" : ""} ${
        small ? "small" : ""
      }`}
    >
      <div className="loading-spinner" />
      {text && <p className="loading-spinner-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;