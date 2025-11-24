import "dotenv/config";
import express from "express";
import session from "express-session";
import AdminJS from "adminjs";
import { buildAuthenticatedRouter } from "@adminjs/express";
import argon2 from "argon2";
import connectPgSimple from "connect-pg-simple";
import { adminOptions, prisma } from "./admin.config.js";
import { dashboardHandler } from "./dashboard-handler.js";

// Fix BigInt serialization for JSON
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const PORT = process.env.PORT || 3000;
const PgSession = connectPgSimple(session);

const start = async () => {
  const app = express();

  const admin = new AdminJS(adminOptions);

  // Configure PostgreSQL session store
  const sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: "session",
  });

  // Authentication configuration
  const adminRouter = buildAuthenticatedRouter(
    admin,
    {
      authenticate: async (email, password) => {
        const admin = await prisma.admin.findUnique({
          where: { email },
        });

        if (admin) {
          const matched = await argon2.verify(admin.password, password);
          if (matched) {
            return admin;
          }
        }
        return false;
      },
      cookieName: "adminjs",
      cookiePassword: process.env.SESSION_SECRET || "sessionsecret",
    },
    null,
    {
      store: sessionStore,
      resave: false,
      saveUninitialized: true,
      secret: process.env.SESSION_SECRET || "sessionsecret",
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
      name: "adminjs",
    }
  );

  // API endpoint to fetch conversation messages
  app.get("/admin/api/conversations/:sessionId/messages", async (req, res) => {
    try {
      const { sessionId } = req.params;

      // Fetch session details
      const session = await prisma.conversation_sessions.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Conversation session not found",
        });
      }

      // Fetch messages for this session
      const messages = await prisma.messages.findMany({
        where: {
          session_id: sessionId,
        },
        orderBy: {
          created_at: "asc",
        },
      });

      res.json({
        success: true,
        session,
        messages,
      });
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch messages",
      });
    }
  });

  // Mount AdminJS router AFTER all custom routes
  app.use(admin.options.rootPath, adminRouter);

  app.get("/", (req, res) => {
    res.redirect(admin.options.rootPath);
  });

  app.listen(PORT, () => {
    console.log(
      `AdminJS started on http://localhost:${PORT}${admin.options.rootPath}`
    );
  });
};

start();
