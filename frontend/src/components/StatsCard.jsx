import React from "react";

const StatsCard = ({ title, value, icon, growth }) => (
  <div className="col-md-3">
    <div className="stats-card">
      <div className="icon">{icon}</div>
      <h5>{title}</h5>
      <h3>{value}</h3>
    </div>
  </div>
);

export default StatsCard;
