import "dotenv/config";
import path from "path";
import AdminJS from "adminjs";
import { Database, Resource, getModelByName } from "@adminjs/prisma";
import { PrismaClient } from "@prisma/client";
import { dashboardHandler } from "./dashboard-handler.js";
import { ComponentLoader } from "adminjs";

const componentLoader = new ComponentLoader();

const Components = {
  ConversationView: componentLoader.add(
    "ConversationView",
    path.resolve("./components/conversation-view.jsx")
  ),
  FileUrlDisplay: componentLoader.add(
    "FileUrlDisplay",
    path.resolve("./components/file-url-display.jsx")
  ),
};

AdminJS.registerAdapter({ Database, Resource });

const prisma = new PrismaClient();
const dmmf = prisma._baseDmmf || prisma._dmmf;

const adminOptions = {
  rootPath: "/admin",
  componentLoader,
  dashboard: {
    handler: dashboardHandler,
  },
  branding: {
    companyName: "Smithery Tech Admin",
    logo: false,
    withMadeWithLove: false, // Disable "made with love" component
    softwareBrothers: false,
  },
  resources: [
    {
      resource: {
        model: getModelByName("claims"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "InsuraWiz",
          icon: "FileText",
        },
        listProperties: [
          "id",
          "claim_type",
          "claim_number",
          "claimant_name",
          "policy_number",
          "status",
          "created_at",
        ],
        properties: {
          email: {
            isVisible: {
              list: false,
              filter: false,
              show: false,
              edit: false,
            },
          },
        },
      },
    },
    {
      resource: {
        model: getModelByName("policies"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "InsuraWiz",
          icon: "Shield",
        },
      },
    },
    {
      resource: {
        model: getModelByName("documents"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "InsuraWiz",
          icon: "File",
        },
        listProperties: [
          "id",
          "document_type",
          "file_url",
          "processing_status",
          "uploaded_at",
        ],
        properties: {
          file_url: {
            components: {
              list: Components.FileUrlDisplay,
              show: Components.FileUrlDisplay,
            },
          },
          file_name: {
            isVisible: {
              list: false,
              show: false,
              filter: true,
              edit: false,
            },
          },
          file_type: {
            isVisible: {
              list: false,
              show: false,
              filter: true,
              edit: false,
            },
          },
          file_size_bytes: {
            isVisible: {
              list: false,
              show: false,
              filter: false,
              edit: false,
            },
          },
        },
      },
    },
    {
      resource: {
        model: getModelByName("conversation_sessions"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "InsuraWiz",
          icon: "MessageSquare",
        },
        listProperties: [
          "id",
          "telegram_chat_id",
          "current_state",
          "created_at",
          "last_interaction",
        ],
        actions: {
          viewMessages: {
            actionType: "record",
            icon: "MessageSquare",
            label: "View Messages",
            component: Components.ConversationView,
            showInDrawer: false,
            handler: async (request, response, context) => {
              return {
                record: context.record.toJSON(context.currentAdmin),
              };
            },
          },
        },
      },
    },
    {
      resource: {
        model: getModelByName("status_updates"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "InsuraWiz",
          icon: "Activity",
        },
      },
    },
    {
      resource: {
        model: getModelByName("messages"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: false,
      },
    },
    {
      resource: { model: getModelByName("Admin"), client: prisma, dmmf },
      options: {
        navigation: {
          name: "System",
          icon: "User",
        },
        properties: {
          password: {
            type: "password",
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
      resource: { model: getModelByName("audit_logs"), client: prisma, dmmf },
      options: {
        navigation: {
          name: "System",
          icon: "List",
        },
      },
    },
  ],
};

export { adminOptions, prisma };
