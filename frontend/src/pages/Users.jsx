import { useEffect, useState } from "react";
import axios from "axios";
import "./Users.css";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

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

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5001/api/users",
        getAuthConfig()
      );

      const data = Array.isArray(res.data) ? res.data : [];

      const normalizedUsers = data.map((user) => ({
        _id: user._id,
        name:`${user.firstName || ""} ${user.lastName || ""}`.trim() || "No Name",
        email: user.email || "No Email",
        role: user.userType?.type || "User",
        status: user.status || "active",
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
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.role.toLowerCase().includes(search.toLowerCase())
  );

  // Edit user
  const handleEdit = (id) => {
    console.log("Edit user:", id);
    // navigate(`/admin/users/edit/${id}`)
  };

  // Block / Unblock user
  const handleToggleBlock = async (user) => {
    const isBlocked = user.status === "blocked";

    const confirmAction = window.confirm(
      isBlocked
        ? `Unblock ${user.name}?`
        : `Block ${user.name}?`
    );

    if (!confirmAction) return;

    try {
      const endpoint = isBlocked
        ? `http://localhost:5001/api/users/${user._id}/unblock`
        : `http://localhost:5001/api/users/${user._id}/block`;

      const res = await axios.put(endpoint, {}, getAuthConfig());

      const updatedUser = res.data?.user;

      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id
            ? {
                ...u,
                status: updatedUser?.status || (isBlocked ? "active" : "blocked"),
              }
            : u
        )
      );

      alert(isBlocked ? "User unblocked successfully" : "User blocked successfully");
    } catch (err) {
      console.error("Block/unblock failed:", err);
      alert("Failed to update user status");
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
                    className={
                      user.status === "blocked" ? "unblock" : "block"
                    }
                    onClick={() => handleToggleBlock(user)}
                  >
                    {user.status === "blocked" ? "Unblock" : "Block"}
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