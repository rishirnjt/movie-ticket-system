import { useEffect, useState } from "react";
import axios from "axios";
import "./Users.css";
import { toast } from "react-toastify";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5001/api/users",
        getAuthConfig()
      );

      const data = Array.isArray(res.data) ? res.data : [];

      const normalizedUsers = data.map((user) => ({
        _id: user._id,
        name:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() || "No Name",
        email: user.email || "No Email",
        role: user.userType?.type || "User",
        status: user.status || "active",
      }));

      setUsers(normalizedUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to load users");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (id) => {
    console.log("Edit user:", id);
  };

  const openPopup = (user) => {
    setSelectedUser(user);
  };

  const closePopup = () => {
    setSelectedUser(null);
  };

  const confirmToggleBlock = async () => {
    if (!selectedUser) return;

    const isBlocked = selectedUser.status === "blocked";

    try {
      const endpoint = isBlocked
        ? `http://localhost:5001/api/users/${selectedUser._id}/unblock`
        : `http://localhost:5001/api/users/${selectedUser._id}/block`;

      const res = await axios.put(endpoint, {}, getAuthConfig());

      const updatedUser = res.data?.user;

      setUsers((prev) =>
        prev.map((u) =>
          u._id === selectedUser._id
            ? {
              ...u,
              status:
                updatedUser?.status || (isBlocked ? "active" : "blocked"),
            }
            : u
        )
      );

      toast.success(
        isBlocked
          ? "User unblocked successfully"
          : "User blocked successfully"
      );
      closePopup();
    } catch (err) {
      console.error("Block/unblock failed:", err);
      toast.error("Failed to update user status");
    }
  };

  return (
    <div className="container users-page">
      <h1>User Management</h1>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="user-table">
        <thead>
          <tr>
            <th>#</th>
            <th>User Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan="6" className="no-users">
                No users found
              </td>
            </tr>
          ) : (
            filteredUsers.map((user, index) => (
              <tr key={user._id}>
                <td>{index + 1}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`status ${user.status.toLowerCase()}`}>
                    {user.status === "blocked" ? "Blocked" : "Active"}
                  </span>
                </td>
                <td className="actions">
                  <button
                    className="edit"
                    onClick={() => handleEdit(user._id)}
                  >
                    Edit
                  </button>

                  <button
                    className={user.status === "blocked" ? "unblock" : "block"}
                    onClick={() => openPopup(user)}
                  >
                    {user.status === "blocked" ? "Unblock" : "Block"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {selectedUser && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>
              {selectedUser.status === "blocked" ? "Unblock User" : "Block User"}
            </h3>
            <p>
              Are you sure you want to{" "}
              <strong>
                {selectedUser.status === "blocked" ? "unblock" : "block"}
              </strong>{" "}
              <strong>{selectedUser.name}</strong>?
            </p>

            <div className="confirm-modal-actions">
              <button className="cancel-btn" onClick={closePopup}>
                Cancel
              </button>

              <button
                className={`confirm-btn ${selectedUser.status === "blocked" ? "unblock-btn" : "block-btn"
                  }`}
                onClick={confirmToggleBlock}
              >
                {selectedUser.status === "blocked" ? "Yes, Unblock" : "Yes, Block"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;