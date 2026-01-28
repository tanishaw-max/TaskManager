import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Role from "../models/Role.js";

// Verify JWT and attach user + role to req.user
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret_change_me"
    );

    const user = await User.findById(decoded.id).populate("roleId");
    if (!user || user.isDeleted || !user.isActive) {
      return res.status(401).json({ message: "User not active or not found" });
    }

    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.roleId?.roleTitle || "user",
      roleId: user.roleId?._id,
    };

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Allow only specific roles
export const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const userRole = (req.user.role || "").toLowerCase();
    const canAccess = allowedRoles
      .map((r) => r.toLowerCase())
      .includes(userRole);

    if (!canAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

