import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./UsersPage.css";

const UsersPage = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    roleTitle: "user",
    isActive: true,
  });

  const isSuperAdmin = role === "super-admin";

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      setUsers(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.createUser(form);
      setSuccess("User created successfully!");
      setForm({
        username: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        roleTitle: "user",
        isActive: true,
      });
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user._id);
    setForm({
      username: user.username,
      email: user.email,
      phone: user.phone,
      address: user.address,
      roleTitle: user.roleId?.roleTitle || "user",
      isActive: user.isActive,
      password: "", // Don't pre-fill password
    });
    setShowForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const updateData = { ...form };
      if (!updateData.password) {
        delete updateData.password; // Don't send empty password
      }
      await api.updateUser(editingUser, updateData);
      setSuccess("User updated successfully!");
      setEditingUser(null);
      setShowForm(false);
      setForm({
        username: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        roleTitle: "user",
        isActive: true,
      });
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.deleteUser(id);
      setSuccess("User deleted successfully!");
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setForm({
      username: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      roleTitle: "user",
      isActive: true,
    });
  };

  return (
    <Layout>
      <div className="users-header">
        <div>
          <h1>Users</h1>
          <p>
            {role === "super-admin" &&
              "Manage all users: create, update, and delete accounts."}
            {role === "manager" &&
              "View your team members (employees with user role)."}
            {role === "user" && "View user information."}
          </p>
        </div>
      </div>

      {(showForm || editingUser) && isSuperAdmin && (
        <section className="user-form-card">
          <h2>{editingUser ? "Edit User" : "Create User"}</h2>
          <form onSubmit={editingUser ? handleUpdate : handleCreate} autoComplete="off">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">
                  Password {editingUser && "(leave empty to keep current)"}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required={!editingUser}
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="roleTitle">Role</label>
                <select
                  id="roleTitle"
                  name="roleTitle"
                  value={form.roleTitle}
                  onChange={handleChange}
                  required
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="super-admin">Super Admin</option>
                </select>
              </div>
              {editingUser && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={handleChange}
                    />
                    Active
                  </label>
                </div>
              )}
            </div>
            {error && <div className="error-text">{error}</div>}
            {success && <div className="success-text">{success}</div>}
            <div className="form-actions">
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? "Saving..." : editingUser ? "Update User" : "Create User"}
              </button>
              <button type="button" className="secondary-btn" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="users-card">
        {error && !showForm && <div className="error-text">{error}</div>}
        {success && !showForm && <div className="success-text">{success}</div>}
        <div className="users-table">
          <div className="users-header-row">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            {isSuperAdmin && <span>Actions</span>}
          </div>
          {users.map((u) => (
            <div key={u._id} className="users-row">
              <span>{u.username}</span>
              <span>{u.email}</span>
              <span className={`user-role-badge role-${u.roleId?.roleTitle?.toLowerCase()}`}>
                {u.roleId?.roleTitle || "N/A"}
              </span>
              <span className={u.isActive ? "status-active" : "status-inactive"}>
                {u.isActive ? "✓ Active" : "✗ Inactive"}
              </span>
              {isSuperAdmin && (
                <span className="user-actions">
                  <button className="edit-user-btn" onClick={() => handleEdit(u)}>
                    ✏️ Edit
                  </button>
                  <button className="delete-user-btn" onClick={() => handleDelete(u._id)}>
                    🗑️ Delete
                  </button>
                </span>
              )}
            </div>
          ))}
          {users.length === 0 && <p className="empty-text">No users to show.</p>}
        </div>
      </section>

      {isSuperAdmin && (
        <div className="add-user-section">
          <button className="primary-btn" onClick={() => setShowForm(true)}>
            + Add User
          </button>
        </div>
      )}
    </Layout>
  );
};

export default UsersPage;
