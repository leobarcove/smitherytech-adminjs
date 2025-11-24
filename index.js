import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import AdminJS from 'adminjs';
import { buildAuthenticatedRouter } from '@adminjs/express';
import argon2 from 'argon2';
import connectPgSimple from 'connect-pg-simple';
import { adminOptions, prisma } from './admin.config.js';
import { dashboardHandler } from './dashboard-handler.js';

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
    tableName: 'session',
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
      cookieName: 'adminjs',
      cookiePassword: process.env.SESSION_SECRET || 'sessionsecret',
    },
    null,
    {
      store: sessionStore,
      resave: false,
      saveUninitialized: true,
      secret: process.env.SESSION_SECRET || 'sessionsecret',
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
      name: 'adminjs',
    }
  );

  app.use(admin.options.rootPath, adminRouter);

  // API endpoint to fetch conversation messages
  app.get('/admin/api/conversations/:sessionId/messages', async (req, res) => {
    try {
      const { sessionId } = req.params;

      // Fetch session details
      const session = await prisma.conversation_sessions.findUnique({
        where: { id: parseInt(sessionId) },
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Conversation session not found',
        });
      }

      // Fetch messages for this session
      const messages = await prisma.messages.findMany({
        where: {
          session_id: parseInt(sessionId),
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      res.json({
        success: true,
        session,
        messages,
      });
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch messages',
      });
    }
  });

  // View conversation messages HTML page
  app.get('/admin/conversations/:sessionId/view', async (req, res) => {
    try {
      const { sessionId } = req.params;

      // Fetch session details
      const session = await prisma.conversation_sessions.findUnique({
        where: { id: parseInt(sessionId) },
      });

      if (!session) {
        return res.status(404).send('Conversation session not found');
      }

      // Fetch messages for this session
      const messages = await prisma.messages.findMany({
        where: {
          session_id: parseInt(sessionId),
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      };

      const messagesHtml = messages.map((message) => {
        const isBot = message.sender_type === 'bot';
        const bgColor = isBot ? '#f3f4f6' : '#4C6FFF';
        const textColor = isBot ? '#1a1a1a' : 'white';
        const align = isBot ? 'left' : 'right';
        const borderRadius = isBot ? '0 16px 16px 16px' : '16px 0 16px 16px';

        return `
          <div style="display: flex; justify-content: ${align === 'right' ? 'flex-end' : 'flex-start'}; margin-bottom: 12px;">
            <div style="max-width: 70%; background-color: ${bgColor}; color: ${textColor}; padding: 12px 16px; border-radius: ${borderRadius}; box-shadow: 0 1px 2px rgba(0,0,0,0.08);">
              <div style="white-space: pre-wrap; word-wrap: break-word; line-height: 1.5;">${message.content}</div>
              <div style="font-size: 11px; margin-top: 6px; opacity: 0.7; text-align: right;">${formatDate(message.created_at)}</div>
            </div>
          </div>
        `;
      }).join('');

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Conversation Messages - ${session.telegram_chat_id}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              background: #f5f5f5;
            }
            .header {
              background: white;
              padding: 24px;
              border-bottom: 1px solid #e5e5e5;
              box-shadow: 0 2px 4px rgba(0,0,0,0.08);
              position: sticky;
              top: 0;
              z-index: 10;
            }
            .back-link {
              display: inline-block;
              margin-bottom: 16px;
              color: #4C6FFF;
              text-decoration: none;
              font-size: 14px;
            }
            .back-link:hover { text-decoration: underline; }
            .header-title { font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
            .header-subtitle { font-size: 14px; color: #666; }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 500;
              background: ${session.current_state === 'active' ? '#10B981' : '#6B7280'};
              color: white;
              margin-left: 8px;
            }
            .messages-container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 24px;
            }
            .empty-state {
              text-align: center;
              padding: 64px 24px;
              color: #9ca3af;
            }
            .empty-icon { font-size: 48px; margin-bottom: 16px; }
            .footer {
              background: white;
              padding: 16px 24px;
              border-top: 1px solid #e5e5e5;
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 24px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <a href="/admin/resources/conversation_sessions" class="back-link">← Back to Conversations</a>
            <div class="header-title">
              Telegram Chat ${session.telegram_chat_id}
              <span class="status-badge">${session.current_state}</span>
            </div>
            <div class="header-subtitle">
              ${messages.length} messages • Last interaction: ${session.last_interaction ? formatDate(session.last_interaction) : 'N/A'}
            </div>
          </div>

          <div class="messages-container">
            ${messages.length === 0 ? `
              <div class="empty-state">
                <div class="empty-icon">💬</div>
                <div>No messages in this conversation yet</div>
              </div>
            ` : messagesHtml}
          </div>

          <div class="footer">
            Session ID: ${session.id} • Created: ${formatDate(session.created_at)}
          </div>
        </body>
        </html>
      `;

      res.send(html);
    } catch (error) {
      console.error('Error viewing conversation messages:', error);
      res.status(500).send('Error loading conversation messages');
    }
  });

  // Custom stats dashboard route
  app.get('/admin/stats', async (req, res) => {
    try {
      const stats = await dashboardHandler();

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Smithery Tech - Dashboard Statistics</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              background: #f5f5f5;
              padding: 32px;
            }
            h1 { font-size: 32px; font-weight: 600; margin-bottom: 8px; color: #1a1a1a; }
            h2 { font-size: 20px; font-weight: 600; margin-bottom: 16px; margin-top: 32px; color: #1a1a1a; }
            .subtitle { color: #666; margin-bottom: 32px; }
            .grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
              margin-bottom: 32px;
            }
            .card {
              background: white;
              padding: 24px;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              border: 1px solid #e5e5e5;
            }
            .card-label { font-size: 12px; color: #666; margin-bottom: 8px; text-transform: uppercase; }
            .card-value { font-size: 36px; font-weight: 700; margin-bottom: 4px; }
            .card-subtitle { font-size: 11px; color: #999; }
            .blue { color: #4C6FFF; }
            .orange { color: #F59E0B; }
            .green { color: #10B981; }
            .back-link { display: inline-block; margin-bottom: 20px; color: #4C6FFF; text-decoration: none; }
            .back-link:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <a href="/admin" class="back-link">← Back to Admin Panel</a>

          <h1>Dashboard Overview</h1>
          <p class="subtitle">Welcome to Smithery Tech Admin Panel</p>

          <h2>Claims Management</h2>
          <div class="grid">
            <div class="card">
              <div class="card-label">Total Claims</div>
              <div class="card-value blue">${stats.totalClaims.toLocaleString()}</div>
              <div class="card-subtitle">All time claims</div>
            </div>
            <div class="card">
              <div class="card-label">Pending Claims</div>
              <div class="card-value orange">${stats.pendingClaims.toLocaleString()}</div>
              <div class="card-subtitle">Awaiting review</div>
            </div>
            <div class="card">
              <div class="card-label">Approved Claims</div>
              <div class="card-value green">${stats.approvedClaims.toLocaleString()}</div>
              <div class="card-subtitle">Successfully processed</div>
            </div>
          </div>

          <h2>Policies & Documents</h2>
          <div class="grid">
            <div class="card">
              <div class="card-label">Total Policies</div>
              <div class="card-value blue">${stats.totalPolicies.toLocaleString()}</div>
              <div class="card-subtitle">All policies</div>
            </div>
            <div class="card">
              <div class="card-label">Active Policies</div>
              <div class="card-value green">${stats.activePolicies.toLocaleString()}</div>
              <div class="card-subtitle">Currently active</div>
            </div>
            <div class="card">
              <div class="card-label">Documents</div>
              <div class="card-value blue">${stats.totalDocuments.toLocaleString()}</div>
              <div class="card-subtitle">Uploaded files</div>
            </div>
          </div>

          <h2>Customer Engagement</h2>
          <div class="grid">
            <div class="card">
              <div class="card-label">Conversations</div>
              <div class="card-value blue">${stats.totalConversations.toLocaleString()}</div>
              <div class="card-subtitle">Telegram sessions</div>
            </div>
          </div>
        </body>
        </html>
      `;

      res.send(html);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).send('Error loading dashboard statistics');
    }
  });

  app.get('/', (req, res) => {
    res.redirect(admin.options.rootPath);
  });

  app.listen(PORT, () => {
    console.log(`AdminJS started on http://localhost:${PORT}${admin.options.rootPath}`);
  });
};

start();
