import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminContacts.css";

const AdminContacts = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const token = localStorage.getItem("token");

  const fetchMessages = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/contact", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(
        "Failed to fetch contact messages:",
        err.response?.data || err.message
      );
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      setUpdatingId(id);

      await axios.patch(
        `http://localhost:5001/api/contact/${id}/status`,
        { status },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === id ? { ...msg, status } : msg
        )
      );
    } catch (err) {
      console.error(
        "Failed to update contact status:",
        err.response?.data || err.message
      );
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <p className="admin-contacts-status">Loading messages...</p>;

  return (
    <div className="admin-contacts-page">
      <div className="admin-contacts-header">
        <h1>Contact Messages</h1>
        <p>Messages submitted from the Contact Us page</p>
      </div>

      {messages.length === 0 ? (
        <p className="admin-contacts-status">No contact messages yet.</p>
      ) : (
        <div className="admin-contacts-list">
          {messages.map((msg) => (
            <div className="contact-message-card" key={msg._id}>
              <div className="contact-message-top">
                <h3>{msg.subject}</h3>
                <span className={`status-badge status-${msg.status || "new"}`}>
                  {msg.status || "new"}
                </span>
              </div>

              <p>
                <strong>Name:</strong> {msg.name}
              </p>
              <p>
                <strong>Email:</strong> {msg.email}
              </p>
              <p>
                <strong>Message:</strong> {msg.message}
              </p>
              <p>
                <strong>Sent:</strong>{" "}
                {new Date(msg.createdAt).toLocaleString()}
              </p>

              <div className="contact-actions">
                <button
                  className="contact-action-btn read-btn"
                  disabled={updatingId === msg._id || msg.status === "read"}
                  onClick={() => handleStatusChange(msg._id, "read")}
                >
                  Mark Read
                </button>

                <button
                  className="contact-action-btn resolved-btn"
                  disabled={updatingId === msg._id || msg.status === "resolved"}
                  onClick={() => handleStatusChange(msg._id, "resolved")}
                >
                  Resolve
                </button>

                <button
                  className="contact-action-btn new-btn"
                  disabled={updatingId === msg._id || msg.status === "new"}
                  onClick={() => handleStatusChange(msg._id, "new")}
                >
                  Mark New
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminContacts;