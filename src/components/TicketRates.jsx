import React from "react";
import './TicketRates.css';

const ticketData = [
    {
        category:"Morning Shows (Sunday To Saturday, 6 AM- 9 AM)",
        gold: "Rs.220",
        platinum: "Rs.300",
        premium:"Rs.350",
    },
    {
        category:"Weekday Shows (Monday & Thursday)",
        gold: "Rs.440",
        platinum: "Rs.500",
        premium:"Rs.650",
    },
];

const TicketRates = () => {
    return(
        <div className="ticket-rates-sec">
            <div className="hero-banner">
                <h1>Ticket Rates</h1>
            </div>

            <div className="rates-table">
                <div className="table-header">
                    <span>Ticket Categories</span>
                    <span>GOLD (Cube 1 & 2)</span>
                    <span>Platinum(Cube 3)</span>
                    <span>PREMIUM(Cube 3)</span>
                </div>

                {ticketData.map((ticket,index) =>(
                    <div key={index} className="table-row">
                        <span>{ticket.category}</span>
                        <span>{ticket.gold}</span>
                        <span>{ticket.platinum}</span>
                        <span>{ticket.premium}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TicketRates;