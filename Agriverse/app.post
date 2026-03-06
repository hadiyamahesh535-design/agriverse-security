import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Security Log API
  app.post("/api/security-log", async (req, res) => {
    const { userId, userName, email, phone, violationType, violationCount, timestamp } = req.body;
    
    // Immediate response
    res.status(200).json({ status: "success", message: "Report received." });

    // Background Email Task
    (async () => {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS.replace(/\s/g, ''),
        },
      });

      const mailOptions = {
        from: `"AgriVerse Security" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `🚨 Security Violation: ${violationType}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #d32f2f;">Security Violation Detected</h2>
            <p><strong>User:</strong> ${userName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Mobile:</strong> ${phone}</p>
            <p><strong>Violation:</strong> ${violationType}</p>
            <p><strong>Count:</strong> ${violationCount}</p>
            <p><strong>Time:</strong> ${timestamp}</p>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (error) {
        console.error("Email failed:", error);
      }
    })();
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
