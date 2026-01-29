import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Render/Vercel sit behind proxies; safe default.
app.set("trust proxy", 1);
/* ======================
   DATABASE CONNECTION
====================== */
connectDB();

/* ======================
   MIDDLEWARE
====================== */
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Allows:
// - explicit origins via CORS_ORIGIN="https://foo.vercel.app,https://bar.com"
// - any *.vercel.app (covers preview + production deployments)
// - common localhost dev URLs
// - same-origin / server-to-server (no Origin header)
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);

      // Local development
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
        return cb(null, true);
      }

      // Explicitly allowed origins from env
      if (allowedOrigins.includes(origin)) return cb(null, true);

      // Any Vercel deployment
      if (/^https:\/\/.*\.vercel\.app$/i.test(origin)) return cb(null, true);

      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ======================
   HEALTH CHECK
====================== */
app.get("/", (req, res) => {
  res.status(200).json({ message: "API is running 🚀" });
});

/* ======================
   ROUTES
====================== */
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

/* ======================
   GLOBAL ERROR HANDLER
====================== */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server",
  });
});

/* ======================
   SERVER START
====================== */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
