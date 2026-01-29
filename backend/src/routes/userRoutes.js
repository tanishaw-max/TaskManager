import express from "express";
import User from "../models/User.js";
import Role from "../models/Role.js";
import { protect, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/users/me - current user profile
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("roleId", "roleTitle description")
      .select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  } catch (error) {
    console.error("Get me error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users - list users depending on role
router.get("/", protect, async (req, res) => {
  try {
    const role = (req.user.role || "").toLowerCase();

    let filter = { isDeleted: false };

    if (role === "super-admin") {
      // see all users
    } else if (role === "manager") {
      // manager can see self + employees (role "user"), not other managers or super-admins
      const userRole = await Role.findOne({ roleTitle: "user" });
      const users = await User.find({
        $or: [
          { _id: req.user.id },
          { roleId: userRole?._id || null },
        ],
        isDeleted: false,
      })
        .populate("roleId", "roleTitle")
        .select("-password");
      return res.json(users);
    } else {
      // regular user: only self
      const self = await User.findById(req.user.id)
        .populate("roleId", "roleTitle")
        .select("-password");
      return res.json([self]);
    }

    const users = await User.find(filter)
      .populate("roleId", "roleTitle")
      .select("-password");
    return res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/users - create user with specific role (super-admin only)
router.post("/", protect, allowRoles("super-admin"), async (req, res) => {
  try {
    const { username, email, password, phone, address, roleTitle } = req.body;

    if (!username || !email || !password || !phone || !address || !roleTitle) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const role = await Role.findOne({ roleTitle: roleTitle.toLowerCase() });
    if (!role) {
      return res.status(400).json({ message: "Role not found" });
    }

    const user = await User.create({
      username,
      email,
      password,
      phone,
      address,
      roleId: role._id,
    });

    return res.status(201).json({
      message: "User created",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: role.roleTitle,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/:id - update user (super-admin only in this simple version)
router.put("/:id", protect, allowRoles("super-admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { username,phone, address, roleTitle, isActive} = req.body;

    const user = await User.findById(id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username !== undefined) user.username = username;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (isActive !== undefined) user.isActive = isActive;

    if (roleTitle) {
      const role = await Role.findOne({ roleTitle: roleTitle.toLowerCase() });
      if (!role) {
        return res.status(400).json({ message: "Role not found" });
      }
      user.roleId = role._id;
    }

    await user.save();
    return res.json({ message: "User updated" });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/users/:id - soft delete (super-admin only)
router.delete("/:id", protect, allowRoles("super-admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isDeleted = true;
    await user.save();

    return res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

