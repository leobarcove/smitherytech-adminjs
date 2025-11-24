import 'dotenv/config';
import AdminJS from 'adminjs';
import { Database, Resource, getModelByName } from '@adminjs/prisma';
import { PrismaClient } from '@prisma/client';
import { dashboardHandler } from './dashboard-handler.js';

AdminJS.registerAdapter({ Database, Resource });

const prisma = new PrismaClient();
const dmmf = (prisma._baseDmmf || prisma._dmmf);

const adminOptions = {
  rootPath: '/admin',
  dashboard: {
    handler: dashboardHandler,
  },
  branding: {
    companyName: 'Smithery Tech Admin',
    logo: false,
    withMadeWithLove: false, // Disable "made with love" component
    softwareBrothers: false,
  },
  resources: [
    {
      resource: { model: getModelByName('Admin'), client: prisma, dmmf },
      options: {
        navigation: {
          name: 'System',
          icon: 'User',
        },
        properties: {
          password: {
            type: 'password',
            isVisible: {
              list: false,
              filter: false,
              show: false,
              edit: true,
            },
          },
          createdAt: {
            isVisible: {
              list: true,
              filter: true,
              show: true,
              edit: false,
            },
          },
          updatedAt: {
            isVisible: {
              list: true,
              filter: true,
              show: true,
              edit: false,
            },
          },
        },
      },
    },
    {
      resource: { model: getModelByName('claims'), client: prisma, dmmf },
      options: {
        navigation: {
          name: 'Claims Management',
          icon: 'FileText',
        },
      },
    },
    {
      resource: { model: getModelByName('policies'), client: prisma, dmmf },
      options: {
        navigation: {
          name: 'Claims Management',
          icon: 'Shield',
        },
      },
    },
    {
      resource: { model: getModelByName('documents'), client: prisma, dmmf },
      options: {
        navigation: {
          name: 'Claims Management',
          icon: 'File',
        },
      },
    },
    {
      resource: { model: getModelByName('status_updates'), client: prisma, dmmf },
      options: {
        navigation: {
          name: 'Claims Management',
          icon: 'Activity',
        },
      },
    },
    {
      resource: { model: getModelByName('conversation_sessions'), client: prisma, dmmf },
      options: {
        navigation: {
          name: 'Conversations',
          icon: 'MessageSquare',
        },
        listProperties: ['id', 'telegram_chat_id', 'current_state', 'created_at', 'last_interaction'],
        actions: {
          viewMessages: {
            actionType: 'record',
            icon: 'MessageCircle',
            label: 'View Messages',
            isVisible: true,
            handler: async (request, response, context) => {
              const { record } = context;
              const sessionId = record.id();
              return {
                record: record.toJSON(context.currentAdmin),
                redirectUrl: `/admin/conversations/${sessionId}/view`,
              };
            },
          },
        },
      },
    },
    {
      resource: { model: getModelByName('messages'), client: prisma, dmmf },
      options: {
        navigation: false,
      },
    },
    {
      resource: { model: getModelByName('audit_logs'), client: prisma, dmmf },
      options: {
        navigation: {
          name: 'System',
          icon: 'List',
        },
      },
    },
  ],
};

export { adminOptions, prisma };
