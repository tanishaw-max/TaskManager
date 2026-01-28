import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./TasksPage.css";

const emptyForm = { taskTitle: "", description: "", userId: "" };

const TasksPage = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canAssignToOthers = role === "super-admin" || role === "manager";

  const loadTasks = async () => {
    try {
      const res = await api.getTasks();
      setTasks(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tasks");
    }
  };

  const loadUsers = async () => {
    if (!canAssignToOthers) return;
    try {
      const res = await api.getUsers();
      setUsers(res.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadTasks();
    loadUsers();
    
    // Auto-refresh tasks every 5 seconds to show status updates
    const interval = setInterval(() => {
      loadTasks();
    }, 5000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        taskTitle: form.taskTitle,
        description: form.description,
      };
      if (canAssignToOthers && form.userId) {
        payload.userId = form.userId;
      }
      await api.createTask(payload);
      setForm(emptyForm);
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const note = `Status changed to ${status}`;
      await api.updateTask(id, { status, note });
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({ taskTitle: "", description: "" });

  const handleEdit = (task) => {
    setEditingTask(task._id);
    setEditForm({ taskTitle: task.taskTitle, description: task.description });
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditForm({ taskTitle: "", description: "" });
  };

  const handleUpdateTask = async (id) => {
    try {
      await api.updateTask(id, { 
        taskTitle: editForm.taskTitle, 
        description: editForm.description 
      });
      setEditingTask(null);
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.deleteTask(id);
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task");
    }
  };

  return (
    <Layout>
      <div className="tasks-header">
        <div>
          <h1>Tasks</h1>
          <p>
            {role === "super-admin" && "You can manage all tasks and assign to any user."}
            {role === "manager" &&
              "You can manage your tasks and employees (users) tasks, but not other managers."}
            {role === "user" && "You can manage only your own tasks."}
          </p>
        </div>
      </div>

      <div className="tasks-layout">
        <section className="task-form-card">
          <h2>Create task</h2>
          <form className="task-form" onSubmit={handleCreate} autoComplete="off">
            <div className="form-row">
              <div className="field">
                <label htmlFor="taskTitle">Title</label>
                <input
                  id="taskTitle"
                  name="taskTitle"
                  value={form.taskTitle}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  value={form.description}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                />
              </div>
            </div>
            {canAssignToOthers && (
              <div className="form-row">
                <div className="field">
                  <label htmlFor="userId">Assign to</label>
                  <select
                    id="userId"
                    name="userId"
                    value={form.userId}
                    onChange={handleChange}
                  >
                    <option value="">Select user (optional)</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.username} ({u.roleId?.roleTitle})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            {error && <div className="error-text">{error}</div>}
            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create task"}
            </button>
          </form>
        </section>

        <section className="tasks-list-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Task list</h2>
            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
              🔄 Auto-refreshes every 5s
            </span>
          </div>
          <div className="tasks-list">
            {tasks.length === 0 && <p className="empty-text">No tasks yet.</p>}
            {tasks.map((t) => (
              <article key={t._id} className="task-item">
                {editingTask === t._id ? (
                  <div className="task-edit-form">
                    <input
                      type="text"
                      value={editForm.taskTitle}
                      onChange={(e) => setEditForm({ ...editForm, taskTitle: e.target.value })}
                      className="edit-input"
                      placeholder="Task title"
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="edit-textarea"
                      placeholder="Description"
                      rows="3"
                    />
                    <div className="edit-actions">
                      <button
                        className="save-btn"
                        onClick={() => handleUpdateTask(t._id)}
                      >
                        Save
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <header className="task-item-header">
                      <div>
                        <h3>{t.taskTitle}</h3>
                        <p className="task-meta">
                          Assigned to: {t.userId?.username} ({t.userId?.email})
                        </p>
                        <p className="task-meta" style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                          Created: {new Date(t.createdAt).toLocaleString()}
                          {t.updatedAt !== t.createdAt && (
                            <> • Updated: {new Date(t.updatedAt).toLocaleString()}</>
                          )}
                        </p>
                      </div>
                      <span className={`status-chip status-${t.status}`}>
                        {t.status === "pending" && "⏳"}
                        {t.status === "in-progress" && "🔄"}
                        {t.status === "completed" && "✅"}
                        {" "}
                        {t.status}
                      </span>
                    </header>
                    <p className="task-desc">{t.description}</p>
                    
                    {/* Status History */}
                    {t.statusHistory && t.statusHistory.length > 0 && (
                      <div className="status-history">
                        <strong>Status History:</strong>
                        <ul>
                          {t.statusHistory.slice().reverse().map((history, idx) => (
                            <li key={idx}>
                              <span className="history-status">{history.status}</span>
                              {" "}by {history.changedBy?.username || "System"}
                              {" "}on {new Date(history.changedAt).toLocaleString()}
                              {history.note && (
                                <span className="history-note">{history.note}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="task-actions">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t._id, e.target.value)}
                        className="status-select"
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="in-progress">🔄 In Progress</option>
                        <option value="completed">✅ Completed</option>
                      </select>
                      <button
                        className="edit-btn"
                        type="button"
                        onClick={() => handleEdit(t)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="delete-btn"
                        type="button"
                        onClick={() => handleDelete(t._id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default TasksPage;

