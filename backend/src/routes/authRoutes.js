import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Role from "../models/Role.js";

const router = express.Router();

/* ======================
   JWT TOKEN GENERATOR
====================== */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.roleId?.roleTitle,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/* ======================
   ENSURE DEFAULT ROLES
====================== */
const ensureDefaultRoles = async () => {
  const roles = [
    { roleTitle: "super-admin", description: "Full access" },
    { roleTitle: "manager", description: "Team management access" },
    { roleTitle: "user", description: "Basic user access" },
  ];

  for (const role of roles) {
    const exists = await Role.findOne({ roleTitle: role.roleTitle });
    if (!exists) {
      await Role.create(role);
    }
  }
};

/* ======================
   REGISTER
====================== */
router.post("/register", async (req, res) => {
  try {
    console.log("Register request body:", req.body);
    await ensureDefaultRoles();

    const {
      username,
      email,
      password,
      phone,
      address,
      roleTitle,
      registrationKey,
    } = req.body;

    if (!username || !email || !password || !phone || !address) {
      console.log("Missing required fields:", { username: !!username, email: !!email, password: !!password, phone: !!phone, address: !!address });
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    /* ======================
       ROLE LOGIC
    ====================== */
    let finalRole = "user";

    if (roleTitle === "manager") {
      if (registrationKey !== process.env.REGISTRATION_KEY_MANAGER) {
        return res.status(403).json({
          message: "Invalid manager registration key",
        });
      }
      finalRole = "manager";
    }

    if (roleTitle === "super-admin") {
      if (registrationKey !== process.env.REGISTRATION_KEY_SUPER_ADMIN) {
        return res.status(403).json({
          message: "Invalid super-admin registration key",
        });
      }
      finalRole = "super-admin";
    }

    const role = await Role.findOne({ roleTitle: finalRole });
    if (!role) {
      return res.status(500).json({ message: "Role not found" });
    }

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      phone,
      address,
      roleId: role._id,
    });

    const token = generateToken(user);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: role.roleTitle,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

/* ======================
   LOGIN
====================== */
router.post("/login", async (req, res) => {
  try {
    console.log("Login request body:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("Missing login fields:", { email: !!email, password: !!password });
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
      isActive: true,
    })
      .select("+password")
      .populate("roleId");

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.roleId?.roleTitle,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

export default router;
