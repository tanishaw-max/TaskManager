import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Role from "../models/Role.js";

const router = express.Router();

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.roleId?.roleTitle,
    },
    process.env.JWT_SECRET || "dev_secret_change_me",
    { expiresIn: "7d" }
  );
};

// Seed default roles if not exists (super-admin, manager, user)
const ensureDefaultRoles = async () => {
  const defaultRoles = [
    { roleTitle: "super-admin", description: "Super admin (full access)" },
    { roleTitle: "manager", description: "Manager (team tasks access)" },
    { roleTitle: "user", description: "Regular user (own tasks only)" },
  ];

  for (const role of defaultRoles) {
    const exists = await Role.findOne({ roleTitle: role.roleTitle });
    if (!exists) {
      await Role.create(role);
    }
  }
};

// Public: register a user with optional role selection
// Security: 
// - Default role is "user" (most secure)
// - To register as "manager" or "super-admin", provide registrationKey
// - Registration keys can be set in environment variables or use default dev keys
router.post("/register", async (req, res) => {
  try {
    await ensureDefaultRoles();

    const { username, email, password, phone, address, roleTitle, registrationKey } = req.body;

    if (!username || !email || !password || !phone || !address) {
      return res
        .status(400)
        .json({ message: "All fields are required (username, email, password, phone, address)" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Determine role based on request
    let targetRoleTitle = "user"; // Default to user for security
    
    if (roleTitle) {
      const requestedRole = roleTitle.toLowerCase();
      
      // If requesting manager or super-admin, require registration key
      if (requestedRole === "manager" || requestedRole === "super-admin") {
        const validManagerKey = process.env.REGISTRATION_KEY_MANAGER || "manager_key_2024";
        const validSuperAdminKey = process.env.REGISTRATION_KEY_SUPER_ADMIN || "super_admin_key_2024";
        
        if (requestedRole === "manager" && registrationKey !== validManagerKey) {
          return res.status(403).json({ 
            message: "Invalid registration key for manager role. Default role 'user' will be assigned." 
          });
        }
        
        if (requestedRole === "super-admin" && registrationKey !== validSuperAdminKey) {
          return res.status(403).json({ 
            message: "Invalid registration key for super-admin role. Default role 'user' will be assigned." 
          });
        }
        
        // Check if super-admin already exists (optional: limit to one super-admin)
        if (requestedRole === "super-admin") {
          const existingSuperAdmin = await User.findOne().populate("roleId");
          const superAdminRole = await Role.findOne({ roleTitle: "super-admin" });
          const superAdminCount = await User.countDocuments({ 
            roleId: superAdminRole?._id,
            isDeleted: false 
          });
          
          // Allow multiple super-admins, but you can uncomment below to limit to one
          // if (superAdminCount > 0) {
          //   return res.status(403).json({ message: "Super admin already exists" });
          // }
        }
        
        targetRoleTitle = requestedRole;
      } else if (requestedRole === "user") {
        targetRoleTitle = "user";
      } else {
        return res.status(400).json({ message: "Invalid role. Must be 'user', 'manager', or 'super-admin'" });
      }
    }

    const selectedRole = await Role.findOne({ roleTitle: targetRoleTitle });
    if (!selectedRole) {
      return res.status(500).json({ message: "Role not found" });
    }

    const user = await User.create({
      username,
      email,
      password,
      phone,
      address,
      roleId: selectedRole._id,
    });

    const token = generateToken(user);
    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: selectedRole.roleTitle,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Public: login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user with password field included
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password").populate("roleId");
    
    if (!user) {
      console.log(`Login attempt failed: User not found for email: ${email}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.isDeleted) {
      console.log(`Login attempt failed: User is deleted for email: ${email}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      console.log(`Login attempt failed: User is inactive for email: ${email}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if password field exists (should be included with select("+password"))
    if (!user.password) {
      console.error(`Login error: Password field not found for user: ${email}`);
      return res.status(500).json({ message: "Server error: Password field missing" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Login attempt failed: Password mismatch for email: ${email}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);
    console.log(`Login successful for user: ${email}`);
    return res.json({
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
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;

