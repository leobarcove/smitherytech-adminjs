import 'dotenv/config';
import AdminJS from 'adminjs';
import { Database, Resource, getModelByName } from '@adminjs/prisma';
import { PrismaClient } from '@prisma/client';

AdminJS.registerAdapter({ Database, Resource });

const prisma = new PrismaClient();
const dmmf = (prisma._baseDmmf || prisma._dmmf);

const adminOptions = {
  rootPath: '/admin',
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
      },
    },
    {
      resource: { model: getModelByName('messages'), client: prisma, dmmf },
      options: {
        navigation: {
          name: 'Conversations',
          icon: 'MessageCircle',
        },
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
