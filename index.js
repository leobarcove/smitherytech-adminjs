import "dotenv/config";
import * as url from "url";
import * as path from "path";
import express from "express";
import session from "express-session";
import AdminJS from "adminjs";
import { buildAuthenticatedRouter } from "@adminjs/express";
import argon2 from "argon2";
import connectPgSimple from "connect-pg-simple";
import { adminOptions, prisma } from "./admin.config.js";

// Fix BigInt serialization for JSON
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const PORT = process.env.PORT || 3000;
const PgSession = connectPgSimple(session);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const start = async () => {
  const app = express();
  const admin = new AdminJS(adminOptions);

  app.use(express.json());
  app.use(express.static(path.join(__dirname, "public")));

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

  app.get(
    "/admin/api/insurawiz/conversations/:sessionId/messages",
    async (req, res) => {
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
    }
  );

  app.post("/admin/api/insurawiz/claims/:claimId/review", async (req, res) => {
    try {
      const { claimId } = req.params;
      const { actionType, claimed_amount, approved_amount, payment_date } =
        req.body;

      const now = new Date();
      const claim = await prisma.claims.findUnique({
        where: { id: claimId },
      });

      if (!claim) {
        return res.status(404).json({
          success: false,
          error: "Claim not found",
        });
      }

      if (actionType === "approve") {
        await prisma.claims.update({
          where: { id: claimId },
          data: {
            status: "approved",
            approval_date: now,
            updated_at: now,
            payment_date: payment_date ? new Date(payment_date) : null,
            claimed_amount: claimed_amount ? parseFloat(claimed_amount) : null,
            approved_amount: approved_amount
              ? parseFloat(approved_amount)
              : null,
          },
        });
      } else if (actionType === "reject") {
        await prisma.claims.update({
          where: { id: claimId },
          data: {
            status: "rejected",
            updated_at: now,
          },
        });
      }

      const newStatus = actionType === "approve" ? "approved" : "rejected";
      await prisma.status_updates.create({
        data: {
          claim_id: claimId,
          update_type: "review",
          old_status: claim.status || "draft",
          new_status: newStatus,
          message_text: `Claim ${newStatus} by admin`,
          created_at: now,
        },
      });

      res.json({
        success: true,
        message: `Claim ${newStatus} successfully`,
      });
    } catch (error) {
      console.error("Error reviewing claim:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update claim status",
      });
    }
  });

  app.get(
    "/admin/api/wrspro/conversations/:sessionId/messages",
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
    "/admin/api/slotiva/appointments/:appointmentId/complete",
    async (req, res) => {
      try {
        const { appointmentId } = req.params;

        const appointment = await prisma.slotiva_appointments.update({
          where: { id: appointmentId },
          data: {
            status: "completed",
          },
        });

        res.json({
          success: true,
          appointment,
        });
      } catch (error) {
        console.error("Error completing slotiva appointment:", error);
        res.status(500).json({
          success: false,
          error: "Failed to complete appointment",
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
  app.get("/admin/api/slotiva/service-types", async (req, res) => {
    try {
      const serviceTypes = await prisma.slotiva_service_types.findMany({
        where: {
          is_active: true,
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          description: true,
          duration_minutes: true,
        },
      });

      res.json({
        success: true,
        serviceTypes,
      });
    } catch (error) {
      console.error("Error fetching service types:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch service types",
      });
    }
  });

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
        include: {
          slotiva_service_type: true,
        },
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

        // Get service type name from relation or fallback to old field
        const serviceTypeName =
          appointment.slotiva_service_type?.name ||
          appointment.service_type ||
          "";

        return {
          id: appointment.id,
          title: `${appointment.client_name}${
            serviceTypeName ? ` - ${serviceTypeName}` : ""
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
            serviceType: serviceTypeName,
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

  // Vistate API Endpoints

  app.get("/admin/api/vistate/appointments", async (req, res) => {
    console.log("fetching vistate appointments");
    try {
      // Fetch appointments from database (fetch all for now for simplicity, or add date filter if needed)
      // Standard FullCalendar fetches often don't pass start/end if configured simply, but good to handle if they do.
      const appointments = await prisma.vistate_viewing_appointments.findMany({
        include: {
          vistate_properties: true,
          vistate_clients: true,
          vistate_agents: true,
        },
        orderBy: {
          scheduled_datetime: "asc",
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
          no_show: { bg: "#9CA3AF", border: "#4B5563" },
        };
        const colors = statusColors[appointment.status] || {
          bg: "#6B7280",
          border: "#4B5563",
        };

        const startTime = new Date(appointment.scheduled_datetime);
        const endTime = new Date(startTime.getTime() + (appointment.duration_minutes || 30) * 60000);

        return {
          id: appointment.id,
          title: `${appointment.vistate_clients?.name || 'Unknown'} - ${appointment.vistate_properties?.title || 'Unknown Property'}`,
          start: startTime,
          end: endTime,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          extendedProps: {
            bookingReference: appointment.booking_reference,
            clientName: appointment.vistate_clients?.name,
            propertyTitle: appointment.vistate_properties?.title,
            propertyAddress: appointment.vistate_properties?.address,
            agentName: appointment.vistate_agents?.name,
            agentId: appointment.agent_id,
            status: appointment.status,
            notes: appointment.notes,
          },
        };
      });

      res.json({
        success: true,
        appointments: events,
      });
    } catch (error) {
      console.error("Error fetching Vistate appointments:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch appointments",
      });
    }
  });

  app.put("/admin/api/vistate/appointments/:appointmentId", async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const { scheduled_datetime } = req.body;

      if (!scheduled_datetime) {
          return res.status(400).json({ success: false, error: "Scheduled datetime is required" });
      }

      const newStart = new Date(scheduled_datetime);
      if (isNaN(newStart.getTime())) {
         return res.status(400).json({ success: false, error: "Invalid date format" });
      }
      
      // Update
      const appointment = await prisma.vistate_viewing_appointments.update({
        where: { id: appointmentId },
        data: {
          scheduled_datetime: newStart,
        },
      });

      res.json({
        success: true,
        appointment,
      });
    } catch (error) {
      console.error("Error updating Vistate appointment:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update appointment",
      });
    }
  });

  app.put("/admin/api/vistate/appointments/:appointmentId/cancel", async (req, res) => {
    try {
      const { appointmentId } = req.params;

      const appointment = await prisma.vistate_viewing_appointments.update({
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
      console.error("Error canceling Vistate appointment:", error);
      res.status(500).json({
        success: false,
        error: "Failed to cancel appointment",
      });
    }
  });

  app.put("/admin/api/vistate/appointments/:appointmentId/complete", async (req, res) => {
    try {
        const { appointmentId } = req.params;
  
        const appointment = await prisma.vistate_viewing_appointments.update({
          where: { id: appointmentId },
          data: {
            status: "completed",
          },
        });
  
        res.json({
          success: true,
          appointment,
        });
      } catch (error) {
        console.error("Error completing Vistate appointment:", error);
        res.status(500).json({
          success: false,
          error: "Failed to complete appointment",
        });
      }
  });

  app.get("/admin/api/vistate/agents", async (req, res) => {
    try {
      const agents = await prisma.vistate_agents.findMany({
        where: { is_active: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });

      res.json({
        success: true,
        agents,
      });
    } catch (error) {
      console.error("Error fetching Vistate agents:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch agents",
      });
    }
  });

  app.put("/admin/api/vistate/appointments/:appointmentId/reassign", async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const { agentId } = req.body;

      if (!agentId) {
        return res.status(400).json({
          success: false,
          error: "Agent ID is required",
        });
      }

      // Verify agent exists and is active
      const agent = await prisma.vistate_agents.findUnique({
        where: { id: agentId },
      });

      if (!agent || !agent.is_active) {
        return res.status(400).json({
          success: false,
          error: "Invalid or inactive agent",
        });
      }

      const appointment = await prisma.vistate_viewing_appointments.update({
        where: { id: appointmentId },
        data: {
          agent_id: agentId,
        },
      });

      res.json({
        success: true,
        appointment,
      });
    } catch (error) {
      console.error("Error reassigning Vistate appointment:", error);
      res.status(500).json({
        success: false,
        error: "Failed to reassign appointment",
      });
    }
  });

  // Vistate Conversation Messages Endpoint
  app.get(
    "/admin/api/vistate/conversations/:sessionId/messages",
    async (req, res) => {
      try {
        const { sessionId } = req.params;

        // Fetch messages for this session
        const messages = await prisma.vistate_communication_log.findMany({
          where: { session_id: sessionId },
          orderBy: { created_at: "asc" },
          include: {
            vistate_clients: {
              select: {
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        });

        if (messages.length === 0) {
          return res.status(404).json({
            success: false,
            error: "Conversation session not found",
          });
        }

        // Build session summary from messages
        const firstMessage = messages[0];
        const lastMessage = messages[messages.length - 1];
        const client = firstMessage.vistate_clients;

        const session = {
          session_id: sessionId,
          client_name: client?.name || "Unknown Client",
          client_phone: client?.phone || null,
          client_email: client?.email || null,
          channel: firstMessage.channel,
          last_interaction_at: lastMessage.created_at,
          message_count: messages.length,
        };

        // Map messages to standard format
        const formattedMessages = messages.map((msg) => ({
          id: msg.id,
          direction: msg.direction,
          message_type: msg.message_type,
          content: msg.content,
          channel: msg.channel,
          created_at: msg.created_at,
          delivered_at: msg.delivered_at,
          read_at: msg.read_at,
          failed: msg.failed,
          error_message: msg.error_message,
          ai_intent: msg.ai_intent,
          ai_confidence: msg.ai_confidence ? parseFloat(msg.ai_confidence) : null,
        }));

        res.json({
          success: true,
          session,
          messages: formattedMessages,
        });
      } catch (error) {
        console.error("Error fetching Vistate conversation messages:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch messages",
        });
      }
    }
  );

  app.get(
    "/admin/api/lendlyx/conversations/:sessionId/messages",
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

  app.post(
    "/admin/api/lendlyx/applications/:applicationId/review",
    async (req, res) => {
      try {
        const { applicationId } = req.params;
        const { actionType, tenure_months, interest_rate, remarks } = req.body;
        const now = new Date();

        if (!remarks || remarks.trim() === "") {
          return res.status(400).json({
            success: false,
            error: "Remarks are required",
          });
        }

        const application = await prisma.lend_lyx_applications.findUnique({
          where: { id: applicationId },
        });

        if (!application) {
          return res.status(404).json({
            success: false,
            error: "Loan application not found",
          });
        }

        if (actionType === "approve") {
          if (!tenure_months || !interest_rate) {
            return res.status(400).json({
              success: false,
              error:
                "Tenure months and interest rate are required for approval",
            });
          }

          await prisma.lend_lyx_applications.update({
            where: { id: applicationId },
            data: {
              status: "approved",
              tenure_months: parseInt(tenure_months),
              interest_rate: parseFloat(interest_rate),
              remarks: remarks,
              updated_at: now,
            },
          });
        } else if (actionType === "reject") {
          await prisma.lend_lyx_applications.update({
            where: { id: applicationId },
            data: {
              status: "rejected",
              remarks: remarks,
              updated_at: now,
            },
          });
        }

        // Notify customer on approval status
        const applicant = await prisma.lend_lyx_applicants.findFirst({
          where: { application_id: applicationId },
        });
        const session = await prisma.lend_lyx_chat_sessions.findUnique({
          where: { id: applicant.session_id },
        });
        await fetch(
          "https://smitherytech.zeabur.app/webhook/8a154e80-a633-4910-919e-e71f6e15c5d6",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ref: application.reference_no,
              cid: session.telegram_chat_id,
              sid: session.id,
              is_approved: actionType === "approve",
              amount: application.loan_amount,
              tenure: application.tenure_months,
              rate: application.interest_rate,
            }),
          }
        );

        res.json({
          success: true,
          message: `Loan application ${
            actionType === "approve" ? "approved" : "rejected"
          } successfully`,
        });
      } catch (error) {
        console.error("Error reviewing loan application:", error);
        res.status(500).json({
          success: false,
          error: "Failed to update loan application status",
        });
      }
    }
  );

  app.get(
    "/admin/api/lendlyx/applications/:applicationId/applicants",
    async (req, res) => {
      try {
        const { applicationId } = req.params;

        const applicants = await prisma.lend_lyx_applicants.findMany({
          where: { application_id: applicationId },
          orderBy: { created_at: "asc" },
          select: {
            id: true,
            application_id: true,
            session_id: true,
            full_name: true,
            ic_number: true,
            date_of_birth: true,
            email: true,
            phone: true,
            marital_status: true,
            tin_no: true,
            citizenship: true,
            address: true,
            city: true,
            state: true,
            postcode: true,
            status: true,
            created_at: true,
            updated_at: true,
          },
        });

        res.json({
          success: true,
          applicants,
        });
      } catch (error) {
        console.error("Error fetching LendLyx application applicants:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch applicants",
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
