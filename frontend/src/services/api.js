import axios from "axios";

const instance = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://task-manager-qv7e.onrender.com",
  withCredentials: true, // important for auth
});

export const setToken = (token) => {
  if (token) {
    instance.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete instance.defaults.headers.common.Authorization;
  }
};

const api = {
  client: instance,
  setToken,

  // AUTH
  login: (data) => instance.post("/api/auth/login", data),
  register: (data) => instance.post("/api/auth/register", data),

  // TASKS
  getTasks: () => instance.get("/api/tasks"),
  createTask: (data) => instance.post("/api/tasks", data),
  updateTask: (id, data) => instance.put(`/api/tasks/${id}`, data),
  deleteTask: (id) => instance.delete(`/api/tasks/${id}`),

  // USERS
  getUsers: () => instance.get("/api/users"),
  createUser: (data) => instance.post("/api/users", data),
  updateUser: (id, data) => instance.put(`/api/users/${id}`, data),
  deleteUser: (id) => instance.delete(`/api/users/${id}`),
};

export default api;
