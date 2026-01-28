import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./DashboardPage.css";

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.getTasks();
        const tasks = res.data || [];
        const counts = tasks.reduce(
          (acc, t) => {
            acc.total += 1;
            acc[t.status?.replace("-", "")] = (acc[t.status?.replace("-", "")] || 0) + 1;
            return acc;
          },
          { total: 0, pending: 0, inprogress: 0, completed: 0 }
        );
        setStats({
          total: counts.total,
          pending: counts.pending,
          inProgress: counts.inprogress,
          completed: counts.completed,
        });
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        // fail silently, dashboard stays simple
      }
    };
    fetchTasks();
  }, []);

  return (
    <Layout>
      
      <div className="dashboard-header">
        <h1>Welcome, {user?.username}</h1>
        <p>
          You are logged in as <strong>{user?.role}</strong>. Your permissions are explained
          below.
        </p>
      </div>

      <section className="cards-grid">
        <div className="stat-card stat-total">
          <h2>Total Tasks</h2>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card stat-pending">
          <h2>Pending</h2>
          <span className="stat-value">{stats.pending}</span>
        </div>
        <div className="stat-card stat-progress">
          <h2>In Progress</h2>
          <span className="stat-value">{stats.inProgress}</span>
        </div>
        <div className="stat-card stat-completed">
          <h2>Completed</h2>
          <span className="stat-value">{stats.completed}</span>
        </div>
      </section>

      <section className="role-rules">
        <h2>Role based access</h2>
        <div className="rules-grid">
          <div className="rule-column">
            <h3>Super Admin</h3>
            <ul>
              <li>Can view, add, update and delete any user.</li>
              <li>Can manage all tasks in the system.</li>
              <li>Can create managers and normal users.</li>
            </ul>
          </div>
          <div className="rule-column">
            <h3>Manager</h3>
            <ul>
              <li>Can see their own tasks.</li>
              <li>Can see and manage tasks of employees (users) only.</li>
              <li>Cannot see data of other managers or super admin.</li>
            </ul>
          </div>
          <div className="rule-column">
            <h3>User</h3>
            <ul>
              <li>Can see only their own tasks.</li>
              <li>Can create and update their own tasks.</li>
              <li>Cannot see or edit tasks of other people.</li>
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default DashboardPage;

