# Smithery Tech AdminJS

AdminJS dashboard for managing your Supabase database with authentication.

## Features

- ✅ AdminJS integration with Supabase (PostgreSQL)
- ✅ Authentication system with secure password hashing (Argon2)
- ✅ "Made with love" branding disabled
- ✅ All database models configured (Claims, Policies, Documents, etc.)
- ✅ Role-based admin access

## Setup

### 1. Environment Variables

Update the `.env` file with your credentials:

```env
DATABASE_URL="postgresql://postgres:McTHdZzy4iJ74rZS@db.jrhhqqanwvbqgbmitsdc.supabase.co:5432/postgres"
SESSION_SECRET="change-this-to-a-random-secret-key"

# Optional: Customise default admin credentials
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
```

⚠️ **Important**: Change the `SESSION_SECRET` to a random string for production!

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Admin User

```bash
npm run seed
```

Default credentials:
- Email: `admin@example.com`
- Password: `admin123`

⚠️ **Important**: Change the password after first login!

### 4. Start the Server

```bash
npm start
# or for development
npm run dev
```

The AdminJS dashboard will be available at: `http://localhost:3000/admin`

## Database Models

The following models are configured in AdminJS:

### Claims Management
- **Claims** - Insurance claims with full lifecycle tracking
- **Policies** - Insurance policies information
- **Documents** - Claim-related documents with OCR processing
- **Status Updates** - Claim status change notifications

### Conversations
- **Conversation Sessions** - Telegram conversation tracking
- **Messages** - Individual messages in conversations

### System
- **Audit Logs** - System activity tracking
- **Admins** - Admin user management

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server
- `npm run seed` - Create the first admin user
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Configuration

### AdminJS Configuration

The main configuration is in `admin.config.js`:

- **Root Path**: `/admin` - Change this to customise the admin panel URL
- **Branding**: Disabled "Made with Love" component
- **Resources**: All database models are configured with appropriate navigation and icons

### Authentication

Authentication is configured in `index.js` using:
- Argon2 password hashing (secure and modern)
- Session-based authentication
- HTTP-only cookies in production

### Security Recommendations

1. Change `SESSION_SECRET` to a random 32+ character string
2. Change default admin password immediately after first login
3. Set `NODE_ENV=production` in production
4. Use HTTPS in production (secure cookies enabled automatically)
5. Regularly review audit logs

## Customisation

### Adding New Admin Users

1. Login to AdminJS dashboard
2. Navigate to "Admin" resource
3. Click "Create new"
4. Enter email and password
5. Save

### Customising Resources

Edit `admin.config.js` to customise:
- Navigation groups
- Icons
- Field visibility
- Validation rules
- Custom actions

## Database Schema

The database schema is managed by Prisma. To view or modify:

```bash
# View schema
cat prisma/schema.prisma

# Open Prisma Studio (visual editor)
npm run prisma:studio

# After schema changes, push to database
npx prisma db push
```

## Troubleshooting

### Cannot connect to database
- Check `DATABASE_URL` in `.env`
- Verify Supabase database is accessible
- Check firewall/network settings

### Authentication not working
- Clear browser cookies
- Check `SESSION_SECRET` is set
- Verify admin user exists in database

### Changes not reflected
- Restart the server
- Clear browser cache
- Run `npm run prisma:generate` if schema changed

## Support

For issues or questions, refer to:
- [AdminJS Documentation](https://docs.adminjs.co/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express Documentation](https://expressjs.com/)
