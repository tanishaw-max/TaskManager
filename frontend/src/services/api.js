import axios from "axios";

const instance = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://task-manager-qv7e.onrender.com",
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
  login: (data) => instance.post("/auth/login", data),
  register: (data) => instance.post("/auth/register", data),
  getTasks: () => instance.get("/tasks"),
  createTask: (data) => instance.post("/tasks", data),
  updateTask: (id, data) => instance.put(`/tasks/${id}`, data),
  deleteTask: (id) => instance.delete(`/tasks/${id}`),
  getUsers: () => instance.get("/users"),
  createUser: (data) => instance.post("/users", data),
  updateUser: (id, data) => instance.put(`/users/${id}`, data),
  deleteUser: (id) => instance.delete(`/users/${id}`),
};

export default api;

