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
    tableName: "insura_wiz_session",
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

  // Page to view conversation messages
  app.get("/admin/conversations/:sessionId/view", async (req, res) => {
    try {
      const { sessionId } = req.params;

      // Fetch session details
      const session = await prisma.conversation_sessions.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Session Not Found</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  padding: 40px;
                  background: #f5f5f5;
                }
                .error {
                  background: white;
                  padding: 30px;
                  border-radius: 8px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                  max-width: 600px;
                  margin: 0 auto;
                }
              </style>
            </head>
            <body>
              <div class="error">
                <h1>Session Not Found</h1>
                <p>The conversation session you're looking for doesn't exist.</p>
                <a href="/admin">Back to Dashboard</a>
              </div>
            </body>
          </html>
        `);
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

      // Render HTML page with messages
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Conversation Messages - ${sessionId}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background: #f5f7fa;
                color: #2d3748;
                line-height: 1.6;
              }

              .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
              }

              .header {
                background: white;
                padding: 20px 30px;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                margin-bottom: 20px;
              }

              .header h1 {
                font-size: 24px;
                color: #1a202c;
                margin-bottom: 10px;
              }

              .session-info {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #e2e8f0;
              }

              .info-item {
                display: flex;
                flex-direction: column;
              }

              .info-label {
                font-size: 12px;
                color: #718096;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
              }

              .info-value {
                font-size: 14px;
                color: #2d3748;
                font-weight: 500;
              }

              .back-button {
                display: inline-block;
                padding: 8px 16px;
                background: #4299e1;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-size: 14px;
                transition: background 0.2s;
                margin-bottom: 20px;
              }

              .back-button:hover {
                background: #3182ce;
              }

              .messages-container {
                background: white;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                padding: 20px;
              }

              .messages-header {
                font-size: 18px;
                font-weight: 600;
                color: #1a202c;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e2e8f0;
              }

              .message {
                padding: 15px;
                margin-bottom: 15px;
                border-radius: 8px;
                border-left: 4px solid #e2e8f0;
                background: #f7fafc;
              }

              .message.user {
                border-left-color: #4299e1;
                background: #ebf8ff;
              }

              .message.bot {
                border-left-color: #48bb78;
                background: #f0fff4;
              }

              .message-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
              }

              .message-role {
                font-weight: 600;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }

              .message.user .message-role {
                color: #2c5282;
              }

              .message.bot .message-role {
                color: #276749;
              }

              .message-time {
                font-size: 12px;
                color: #718096;
              }

              .message-content {
                color: #2d3748;
                white-space: pre-wrap;
                word-wrap: break-word;
                line-height: 1.6;
              }

              .empty-state {
                text-align: center;
                padding: 60px 20px;
                color: #718096;
              }

              .empty-state svg {
                width: 64px;
                height: 64px;
                margin-bottom: 16px;
                opacity: 0.5;
              }

              @media (max-width: 768px) {
                .container {
                  padding: 10px;
                }

                .header, .messages-container {
                  padding: 15px;
                }

                .session-info {
                  grid-template-columns: 1fr;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <a href="/admin/resources/conversation_sessions" class="back-button">← Back to Conversation Sessions</a>

              <div class="header">
                <h1>Conversation Messages</h1>
                <div class="session-info">
                  <div class="info-item">
                    <div class="info-label">Session ID</div>
                    <div class="info-value">${session.id}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Telegram Chat ID</div>
                    <div class="info-value">${
                      session.telegram_chat_id || "N/A"
                    }</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Current State</div>
                    <div class="info-value">${
                      session.current_state || "N/A"
                    }</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Created At</div>
                    <div class="info-value">${new Date(
                      session.created_at
                    ).toLocaleString()}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Last Interaction</div>
                    <div class="info-value">${
                      session.last_interaction
                        ? new Date(session.last_interaction).toLocaleString()
                        : "N/A"
                    }</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Total Messages</div>
                    <div class="info-value">${messages.length}</div>
                  </div>
                </div>
              </div>

              <div class="messages-container">
                <div class="messages-header">
                  Messages History
                </div>
                ${
                  messages.length > 0
                    ? messages
                        .map(
                          (msg) => `
                  <div class="message ${msg.role}">
                    <div class="message-header">
                      <span class="message-role">${msg.role}</span>
                      <span class="message-time">${new Date(
                        msg.created_at
                      ).toLocaleString()}</span>
                    </div>
                    <div class="message-content">${escapeHtml(
                      msg.content
                    )}</div>
                  </div>
                `
                        )
                        .join("")
                    : `
                  <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3>No messages yet</h3>
                    <p>This conversation session doesn't have any messages.</p>
                  </div>
                `
                }
              </div>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                padding: 40px;
                background: #f5f5f5;
              }
              .error {
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                max-width: 600px;
                margin: 0 auto;
                color: #e53e3e;
              }
            </style>
          </head>
          <body>
            <div class="error">
              <h1>Error</h1>
              <p>Failed to load conversation messages. Please try again later.</p>
              <a href="/admin">Back to Dashboard</a>
            </div>
          </body>
        </html>
      `);
    }
  });

  // Helper function to escape HTML
  function escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

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

  app.put(
    "/admin/api/slotiva/appointments/:appointmentId/cancel",
    async (req, res) => {
      try {
        const { appointmentId } = req.params;

        const appointment = await prisma.slotiva_appointments.update({
          where: { id: appointmentId },
          data: {
            status: "cancelled",
          },
        });

        res.json({
          success: true,
          appointment,
        });
      } catch (error) {
        console.error("Error canceling slotiva appointment:", error);
        res.status(500).json({
          success: false,
          error: "Failed to cancel appointment",
        });
      }
    }
  );

  app.put(
    "/admin/api/slotiva/appointments/:appointmentId",
    async (req, res) => {
      try {
        const { appointmentId } = req.params;
        const { start_time, end_time } = req.body;

        const newStart = new Date(start_time);
        const newEnd = new Date(end_time);

        // Validate dates
        if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid date format",
          });
        }

        // 1. Restrict to Today or Future Dates
        const now = new Date();
        const todayMidnight = new Date(now);
        todayMidnight.setHours(0, 0, 0, 0);

        if (newStart < todayMidnight) {
          return res.status(400).json({
            success: false,
            error:
              "Appointments can only be rescheduled for today or future dates.",
          });
        }

        // 2. Check Availability (Overlap Check)
        // Exclude the current appointment and cancelled appointments
        const conflict = await prisma.slotiva_appointments.findFirst({
          where: {
            AND: [
              { id: { not: appointmentId } },
              { status: { notIn: ["cancelled", "completed"] } },
              {
                start_time: { lt: newEnd },
                end_time: { gt: newStart },
              },
            ],
          },
        });

        if (conflict) {
          return res.status(400).json({
            success: false,
            error: "The requested time slot is not available.",
          });
        }

        const appointment = await prisma.slotiva_appointments.update({
          where: { id: appointmentId },
          data: {
            start_time,
            end_time,
          },
        });

        res.json({
          success: true,
          appointment,
        });
      } catch (error) {
        console.error("Error updating slotiva appointment:", error);
        res.status(500).json({
          success: false,
          error: "Failed to update appointment",
        });
      }
    }
  );

  // API endpoint to fetch Slotiva appointments for calendar view
  app.get("/admin/api/slotiva/appointments", async (req, res) => {
    console.log("fetching slotiva appointments");
    try {
      const { start, end } = req.query;

      // Build query filters
      const where = {};
      if (start && end) {
        where.start_time = {
          gte: new Date(start),
          lte: new Date(end),
        };
      }

      // Fetch appointments from database
      const appointments = await prisma.slotiva_appointments.findMany({
        where,
        orderBy: {
          start_time: "asc",
        },
      });

      // Transform appointments to FullCalendar event format
      const events = appointments.map((appointment) => {
        // Determine color based on status
        const statusColors = {
          confirmed: { bg: "#10B981", border: "#059669" },
          cancelled: { bg: "#EF4444", border: "#DC2626" },
          completed: { bg: "#3B82F6", border: "#2563EB" },
          pending: { bg: "#F59E0B", border: "#D97706" },
        };
        const colors = statusColors[appointment.status] || {
          bg: "#6B7280",
          border: "#4B5563",
        };

        return {
          id: appointment.id,
          title: `${appointment.client_name}${
            appointment.service_type ? ` - ${appointment.service_type}` : ""
          }`,
          start: appointment.start_time,
          end: appointment.end_time,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          extendedProps: {
            bookingId: appointment.booking_id,
            clientName: appointment.client_name,
            phone: appointment.phone,
            email: appointment.email,
            serviceType: appointment.service_type,
            status: appointment.status,
            notes: appointment.notes,
            calendarEventId: appointment.calendar_event_id,
            reminderSent: appointment.reminder_sent,
          },
        };
      });

      res.json({
        success: true,
        appointments: events,
      });
    } catch (error) {
      console.error("Error fetching Slotiva appointments:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch appointments",
      });
    }
  });

  // WRS Pro Conversation Routes

  // Page to view WRS Pro conversation messages
  app.get("/admin/wrs-conversations/:sessionId/view", async (req, res) => {
    try {
      const { sessionId } = req.params;

      // Fetch session details
      const session = await prisma.wrs_pro_chat_sessions.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Session Not Found</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  padding: 40px;
                  background: #f5f5f5;
                }
                .error {
                  background: white;
                  padding: 30px;
                  border-radius: 8px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                  max-width: 600px;
                  margin: 0 auto;
                }
              </style>
            </head>
            <body>
              <div class="error">
                <h1>Session Not Found</h1>
                <p>The conversation session you're looking for doesn't exist.</p>
                <a href="/admin">Back to Dashboard</a>
              </div>
            </body>
          </html>
        `);
      }

      // Fetch messages for this session
      const wrsMessages = await prisma.wrs_pro_chat_history.findMany({
        where: { session_id: sessionId },
        orderBy: { created_at: "asc" },
      });

      // Map WRS messages to standard format for display
      const messages = wrsMessages.map((msg) => ({
        role: msg.message_direction === "incoming" ? "user" : "bot",
        content:
          msg.message_content ||
          (msg.message_data ? JSON.stringify(msg.message_data) : ""),
        created_at: msg.created_at,
      }));

      // Render HTML page with messages
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Conversation Messages - ${sessionId}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background: #f5f7fa;
                color: #2d3748;
                line-height: 1.6;
              }

              .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
              }

              .header {
                background: white;
                padding: 20px 30px;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                margin-bottom: 20px;
              }

              .header h1 {
                font-size: 24px;
                color: #1a202c;
                margin-bottom: 10px;
              }

              .session-info {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #e2e8f0;
              }

              .info-item {
                display: flex;
                flex-direction: column;
              }

              .info-label {
                font-size: 12px;
                color: #718096;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
              }

              .info-value {
                font-size: 14px;
                color: #2d3748;
                font-weight: 500;
              }

              .back-button {
                display: inline-block;
                padding: 8px 16px;
                background: #4299e1;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-size: 14px;
                transition: background 0.2s;
                margin-bottom: 20px;
              }

              .back-button:hover {
                background: #3182ce;
              }

              .messages-container {
                background: white;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                padding: 20px;
              }

              .messages-header {
                font-size: 18px;
                font-weight: 600;
                color: #1a202c;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e2e8f0;
              }

              .message {
                padding: 15px;
                margin-bottom: 15px;
                border-radius: 8px;
                border-left: 4px solid #e2e8f0;
                background: #f7fafc;
              }

              .message.user {
                border-left-color: #4299e1;
                background: #ebf8ff;
              }

              .message.bot {
                border-left-color: #48bb78;
                background: #f0fff4;
              }

              .message-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
              }

              .message-role {
                font-weight: 600;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }

              .message.user .message-role {
                color: #2c5282;
              }

              .message.bot .message-role {
                color: #276749;
              }

              .message-time {
                font-size: 12px;
                color: #718096;
              }

              .message-content {
                color: #2d3748;
                white-space: pre-wrap;
                word-wrap: break-word;
                line-height: 1.6;
              }

              .empty-state {
                text-align: center;
                padding: 60px 20px;
                color: #718096;
              }

              .empty-state svg {
                width: 64px;
                height: 64px;
                margin-bottom: 16px;
                opacity: 0.5;
              }

              @media (max-width: 768px) {
                .container {
                  padding: 10px;
                }

                .header, .messages-container {
                  padding: 15px;
                }

                .session-info {
                  grid-template-columns: 1fr;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <a href="/admin/resources/wrs_pro_chat_sessions" class="back-button">← Back to WRS Pro Chat Sessions</a>

              <div class="header">
                <h1>Conversation Messages</h1>
                <div class="session-info">
                  <div class="info-item">
                    <div class="info-label">Session ID</div>
                    <div class="info-value">${session.id}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Telegram Chat ID</div>
                    <div class="info-value">${
                      session.telegram_chat_id || "N/A"
                    }</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Current State</div>
                    <div class="info-value">${
                      session.current_state || "N/A"
                    }</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Created At</div>
                    <div class="info-value">${new Date(
                      session.created_at
                    ).toLocaleString()}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Last Interaction</div>
                    <div class="info-value">${
                      session.last_message_at
                        ? new Date(session.last_message_at).toLocaleString()
                        : "N/A"
                    }</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Total Messages</div>
                    <div class="info-value">${messages.length}</div>
                  </div>
                </div>
              </div>

              <div class="messages-container">
                <div class="messages-header">
                  Messages History
                </div>
                ${
                  messages.length > 0
                    ? messages
                        .map(
                          (msg) => `
                  <div class="message ${msg.role}">
                    <div class="message-header">
                      <span class="message-role">${msg.role}</span>
                      <span class="message-time">${new Date(
                        msg.created_at
                      ).toLocaleString()}</span>
                    </div>
                    <div class="message-content">${escapeHtml(
                      msg.content
                    )}</div>
                  </div>
                `
                        )
                        .join("")
                    : `
                  <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3>No messages yet</h3>
                    <p>This conversation session doesn't have any messages.</p>
                  </div>
                `
                }
              </div>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error fetching WRS conversation messages:", error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                padding: 40px;
                background: #f5f5f5;
              }
              .error {
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                max-width: 600px;
                margin: 0 auto;
                color: #e53e3e;
              }
            </style>
          </head>
          <body>
            <div class="error">
              <h1>Error</h1>
              <p>Failed to load conversation messages. Please try again later.</p>
              <a href="/admin">Back to Dashboard</a>
            </div>
          </body>
        </html>
      `);
    }
  });

  // API endpoint to fetch WRS Pro conversation messages
  app.get(
    "/admin/api/wrs-conversations/:sessionId/messages",
    async (req, res) => {
      try {
        const { sessionId } = req.params;

        // Fetch session details
        const session = await prisma.wrs_pro_chat_sessions.findUnique({
          where: { id: sessionId },
        });

        if (!session) {
          return res.status(404).json({
            success: false,
            error: "Conversation session not found",
          });
        }

        // Fetch messages for this session
        const wrsMessages = await prisma.wrs_pro_chat_history.findMany({
          where: { session_id: sessionId },
          orderBy: { created_at: "asc" },
        });

        // Map WRS messages to standard format
        const messages = wrsMessages.map((msg) => ({
          role: msg.message_direction === "incoming" ? "user" : "bot",
          content:
            msg.message_content ||
            (msg.message_data ? JSON.stringify(msg.message_data) : ""),
          created_at: msg.created_at,
        }));

        // Normalize session for frontend
        const normalizedSession = {
          ...session,
          telegram_user_id: session.telegram_chat_id,
          last_message_at: session.last_message_at,
          status: session.current_state,
        };

        res.json({
          success: true,
          session: normalizedSession,
          messages,
        });
      } catch (error) {
        console.error("Error fetching WRS conversation messages:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch messages",
        });
      }
    }
  );

  app.get(
    "/admin/api/lendlyx-conversations/:sessionId/messages",
    async (req, res) => {
      try {
        const { sessionId } = req.params;

        // Fetch session details
        const session = await prisma.lend_lyx_chat_sessions.findUnique({
          where: { id: sessionId },
        });

        if (!session) {
          return res.status(404).json({
            success: false,
            error: "Conversation session not found",
          });
        }

        // Fetch messages for this session
        const lendlyxMessages = await prisma.lend_lyx_chat_messages.findMany({
          where: { session_id: sessionId },
          orderBy: { created_at: "asc" },
        });

        res.json({
          success: true,
          session,
          messages: lendlyxMessages,
        });
      } catch (error) {
        console.error("Error fetching LendLyx conversation messages:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch messages",
        });
      }
    }
  );

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
