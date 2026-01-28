import Task from "../models/Task.js";
import User from "../models/User.js";
import Role from "../models/Role.js";

// Helper: get ids of users that a manager can manage (only users with "user" role)
const getManagerVisibleUserIds = async (managerId) => {
  const userRole = await Role.findOne({ roleTitle: "user" });
  if (!userRole) return [managerId];

  const employees = await User.find({
    roleId: userRole._id,
    isDeleted: false,
    isActive: true,
  }).select("_id");

  return [managerId, ...employees.map((e) => e._id)];
};

// GET /api/tasks - list tasks based on role
export const getTasks = async (req, res) => {
  try {
    const role = (req.user.role || "").toLowerCase();

    let filter = { isDeleted: false };

    if (role === "super-admin") {
      // no extra filter, see all tasks
    } else if (role === "manager") {
      const visibleUserIds = await getManagerVisibleUserIds(req.user.id);
      filter.userId = { $in: visibleUserIds };
    } else {
      // normal user: only own tasks
      filter.userId = req.user.id;
    }

    const tasks = await Task.find(filter)
      .populate({ path: "userId", select: "username email" })
      .populate({ path: "statusHistory.changedBy", select: "username email" })
      .sort({ createdAt: -1 });

    return res.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/tasks - create task
export const createTask = async (req, res) => {
  try {
    const { taskTitle, description, userId } = req.body;

    if (!taskTitle || !description) {
      return res
        .status(400)
        .json({ message: "Task title and description are required" });
    }

    const role = (req.user.role || "").toLowerCase();
    let targetUserId = userId || req.user.id;

    if (role === "user") {
      // user can only create tasks for themselves
      targetUserId = req.user.id;
    } else if (role === "manager") {
      // manager can assign to self or employees (users with "user" role)
      if (!targetUserId) targetUserId = req.user.id;

      const targetUser = await User.findById(targetUserId).populate("roleId");
      if (!targetUser || targetUser.isDeleted || !targetUser.isActive) {
        return res.status(400).json({ message: "Target user not found" });
      }

      const targetRole = targetUser.roleId?.roleTitle?.toLowerCase();
      if (targetUser._id.toString() !== req.user.id.toString() && targetRole !== "user") {
        return res
          .status(403)
          .json({ message: "Managers can only assign tasks to users (employees)" });
      }
    }
    // super-admin can assign to any user

    const task = await Task.create({
      taskTitle,
      description,
      userId: targetUserId,
    });

    // Initialize status history with creation
    task.statusHistory = [{
      status: "pending",
      changedBy: req.user.id,
      changedAt: new Date(),
      note: "Task created",
    }];
    await task.save();

    await task.populate([
      { path: "userId", select: "username email" },
      { path: "statusHistory.changedBy", select: "username email" },
    ]);

    return res.status(201).json(task);
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/tasks/:id - update task (status, title, description)
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { taskTitle, description, status, note } = req.body;

    const task = await Task.findById(id);
    if (!task || task.isDeleted) {
      return res.status(404).json({ message: "Task not found" });
    }

    const role = (req.user.role || "").toLowerCase();

    if (role === "user") {
      if (task.userId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: "You can update only your own tasks" });
      }
    } else if (role === "manager") {
      const visibleUserIds = await getManagerVisibleUserIds(req.user.id);
      if (!visibleUserIds.map(String).includes(task.userId.toString())) {
        return res.status(403).json({ message: "You cannot update this task" });
      }
    }
    // super-admin can update any task

    // Track status changes in history
    const oldStatus = task.status;
    if (status !== undefined && status !== oldStatus) {
      if (!task.statusHistory) {
        task.statusHistory = [];
      }
      task.statusHistory.push({
        status: status,
        changedBy: req.user.id,
        changedAt: new Date(),
        note: note || `Status changed from ${oldStatus} to ${status}`,
      });
    }

    if (taskTitle !== undefined) task.taskTitle = taskTitle;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;

    await task.save();
    
    // Populate the status history for response
    await task.populate([
      { path: "userId", select: "username email" },
      { path: "statusHistory.changedBy", select: "username email" },
    ]);
    
    return res.json(task);
  } catch (error) {
    console.error("Update task error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/tasks/:id - soft delete
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task || task.isDeleted) {
      return res.status(404).json({ message: "Task not found" });
    }

    const role = (req.user.role || "").toLowerCase();

    if (role === "user") {
      if (task.userId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: "You can delete only your own tasks" });
      }
    } else if (role === "manager") {
      const visibleUserIds = await getManagerVisibleUserIds(req.user.id);
      if (!visibleUserIds.map(String).includes(task.userId.toString())) {
        return res.status(403).json({ message: "You cannot delete this task" });
      }
    }
    // super-admin can delete any task

    task.isDeleted = true;
    await task.save();

    return res.json({ message: "Task deleted" });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};