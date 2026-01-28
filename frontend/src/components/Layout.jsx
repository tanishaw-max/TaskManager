import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Layout.css";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const role = user?.role?.toLowerCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand" aria-label="Task Manager">
            <span className="brand-icon" aria-hidden="true" />
            <span className="brand-text">Task Manager</span>
          </div>
          <div className="user-info">
            <span className="user-name">{user?.username}</span>
            <span className={`user-role role-${role}`}>{user?.role}</span>
          </div>
        </div>
        <nav className="nav-links">
          <Link
            to="/"
            className={location.pathname === "/" ? "nav-link active" : "nav-link"}
          >
            Dashboard
          </Link>
          <Link
            to="/tasks"
            className={location.pathname === "/tasks" ? "nav-link active" : "nav-link"}
          >
            Tasks
          </Link>
          {role === "super-admin" || role === "manager" ? (
            <Link
              to="/users"
              className={location.pathname === "/users" ? "nav-link active" : "nav-link"}
            >
              Users
            </Link>
          ) : null}
        </nav>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;

