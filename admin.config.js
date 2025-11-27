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
  ReviewClaim: componentLoader.add(
    "ReviewClaim",
    path.resolve("./components/review-claim.jsx")
  ),
  ClaimDocuments: componentLoader.add(
    "ClaimDocuments",
    path.resolve("./components/claim-documents.jsx")
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
          status_history: {
            isVisible: {
              list: false,
              filter: false,
              show: false,
              edit: false,
            },
          },
          additional_data: {
            isVisible: {
              list: false,
              filter: false,
              show: false,
              edit: false,
            },
          },
        },
        actions: {
          reviewClaim: {
            actionType: "record",
            icon: "FileText",
            label: "Review Claim",
            component: Components.ReviewClaim,
            showInDrawer: false,
            handler: async (request, response, context) => {
              const { record, currentAdmin } = context;

              if (request.method === "get") {
                return {
                  record: record.toJSON(currentAdmin),
                };
              }

              const {
                actionType,
                claimed_amount,
                approved_amount,
                payment_date,
              } = request.payload;
              const now = new Date();

              try {
                if (actionType === "approve") {
                  await prisma.claims.update({
                    where: { id: record.id() },
                    data: {
                      status: "approved",
                      approval_date: now,
                      updated_at: now,
                      payment_date: payment_date
                        ? new Date(payment_date)
                        : null,
                      claimed_amount: claimed_amount
                        ? parseFloat(claimed_amount)
                        : null,
                      approved_amount: approved_amount
                        ? parseFloat(approved_amount)
                        : null,
                    },
                  });
                } else if (actionType === "reject") {
                  await prisma.claims.update({
                    where: { id: record.id() },
                    data: {
                      status: "rejected",
                      updated_at: now,
                    },
                  });
                }

                // Create status update trail
                await prisma.status_updates.create({
                  data: {
                    claim_id: record.id(),
                    update_type: "review",
                    old_status: record.params.status || "draft",
                    new_status:
                      actionType === "approve" ? "approved" : "rejected",
                    message_text: `Claim ${new_status} by admin`,
                    created_at: now,
                  },
                });

                return {
                  record: record.toJSON(currentAdmin),
                  redirectUrl: `/admin/resources/claims`,
                  notice: {
                    message: `Claim ${
                      actionType === "approve" ? "approved" : "rejected"
                    } successfully`,
                    type: "success",
                  },
                };
              } catch (error) {
                console.error("Error reviewing claim:", error);
                throw new Error("Failed to update claim status");
              }
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
            isVisible: {
              list: true,
              show: true,
              filter: false,
              edit: false,
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
          ocr_text: {
            isVisible: {
              list: false,
              filter: false,
              show: false,
              edit: false,
            },
          },
          ocr_data: {
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
        properties: {
          context_data: {
            isVisible: {
              list: false,
              filter: false,
              show: false,
              edit: false,
            },
          },
        },
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
        listProperties: [
          "id",
          "update_type",
          "old_status",
          "new_status",
          "created_at",
        ],
        properties: {
          additional_data: {
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
        model: getModelByName("messages"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: false,
      },
    },
    {
      resource: {
        model: getModelByName("wrs_pro_products"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "WRS Pro",
          icon: "Package",
        },
      },
    },
    {
      resource: {
        model: getModelByName("wrs_pro_rewards"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "WRS Pro",
          icon: "Gift",
        },
      },
    },
    {
      resource: {
        model: getModelByName("wrs_pro_brands"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "WRS Pro",
          icon: "Tag",
        },
      },
    },
    {
      resource: {
        model: getModelByName("wrs_pro_campaigns"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "WRS Pro",
          icon: "Target",
        },
      },
    },
    {
      resource: {
        model: getModelByName("wrs_pro_moderation_queue"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "WRS Pro",
          icon: "Shield",
        },
      },
    },
    {
      resource: {
        model: getModelByName("wrs_pro_campaign_products"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "WRS Pro",
          icon: "Layers",
        },
      },
    },
    {
      resource: {
        model: getModelByName("wrs_pro_customers"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "WRS Pro",
          icon: "Users",
        },
      },
    },
    {
      resource: {
        model: getModelByName("wrs_pro_identity_verifications"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "WRS Pro",
          icon: "UserCheck",
        },
        properties: {
          ic_file_url: {
            components: {
              list: Components.FileUrlDisplay,
              show: Components.FileUrlDisplay,
            },
          },
        },
      },
    },
    {
      resource: {
        model: getModelByName("wrs_pro_registrations"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "WRS Pro",
          icon: "FileText",
        },
        properties: {
          receipt_file_url: {
            components: {
              list: Components.FileUrlDisplay,
              show: Components.FileUrlDisplay,
            },
          },
        },
      },
    },
    {
      resource: {
        model: getModelByName("wrs_pro_registration_serials"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "WRS Pro",
          icon: "Hash",
        },
      },
    },
    {
      resource: {
        model: getModelByName("wrs_pro_support_tickets"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "WRS Pro",
          icon: "LifeBuoy",
        },
      },
    },
    {
      resource: {
        model: getModelByName("wrs_pro_installers"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "WRS Pro",
          icon: "Tool",
        },
      },
    },
    {
      resource: {
        model: getModelByName("wrs_pro_installations"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "WRS Pro",
          icon: "Settings",
        },
      },
    },
    {
      resource: {
        model: getModelByName("wrs_pro_chat_sessions"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "WRS Pro",
          icon: "MessageSquare",
        },
      },
    },
    {
      resource: {
        model: getModelByName("wrs_pro_chat_history"),
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
