import { useEffect, useState } from "react";
import axios from "axios";
import "./Users.css";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get("http://localhost:5001/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = Array.isArray(res.data) ? res.data : [];

      const normalizedUsers = data.map((user) => ({
        _id: user._id,
        name:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          "No Name",
        email: user.email || "No Email",
        role: user.userType?.name || "User",
        status: user.isActive ? "Active" : "Inactive",
      }));

      setUsers(normalizedUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      alert("Failed to load users");
    }
  };

  // Search filter
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  // Edit user
  const handleEdit = (id) => {
    console.log("Edit user:", id);
    // Example:
    // navigate(`/admin/users/edit/${id}`)
  };

  // Delete user
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(`http://localhost:5001/api/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // update UI instantly
      setUsers(users.filter((user) => user._id !== id));

      alert("User deleted successfully");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete user");
    }
  };

  return (
    <div className="container users-page">
      <h1>User Management</h1>

      {/* Search */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
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
                    {user.status}
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
                    className="delete"
                    onClick={() => handleDelete(user._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Users;