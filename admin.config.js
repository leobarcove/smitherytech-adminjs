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
  WrsConversationView: componentLoader.add(
    "WrsConversationView",
    path.resolve("./components/wrs-conversation-view.jsx")
  ),
  CalendarView: componentLoader.add(
    "CalendarView",
    path.resolve("./components/calendar-view.jsx")
  ),
  ClientInfoDisplay: componentLoader.add(
    "ClientInfoDisplay",
    path.resolve("./components/client-info-display.jsx")
  ),
  StatusTag: componentLoader.add(
    "StatusTag",
    path.resolve("./components/status-tag.jsx")
  ),
  AppointmentDetails: componentLoader.add(
    "AppointmentDetails",
    path.resolve("./components/appointment-details.jsx")
  ),
  LendLyxConversationView: componentLoader.add(
    "LendLyxConversationView",
    path.resolve("./components/lendlyx-conversation-view.jsx")
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
  locale: {
    language: "en",
    availableLanguages: ["en"],
    translations: {
      en: {
        labels: {
          // Insura Wiz
          claims: "Claims",
          policies: "Policies",
          documents: "Documents",
          conversation_sessions: "Chat Sessions",
          status_updates: "Status Updates",
          // WRS Pro
          wrs_pro_brands: "Brands",
          wrs_pro_products: "Products",
          wrs_pro_rewards: "Rewards",
          wrs_pro_campaigns: "Campaigns",
          wrs_pro_campaign_products: "Campaign Products",
          wrs_pro_customers: "Customers",
          wrs_pro_identity_verifications: "Identity Verifications",
          wrs_pro_registrations: "Registrations",
          wrs_pro_registration_serials: "Registration Serials",
          wrs_pro_moderation_queue: "Moderation Queue",
          wrs_pro_support_tickets: "Support Tickets",
          wrs_pro_installers: "Installers",
          wrs_pro_installations: "Installations",
          wrs_pro_chat_sessions: "Chat Sessions",
          // LendLyx
          lend_lyx_applications: "Applications",
          lend_lyx_applicants: "Applicants",
          lend_lyx_documents: "Documents",
          lend_lyx_employments: "Employments",
          lend_lyx_financials: "Financials",
          lend_lyx_audit_logs: "Audit Logs",
          lend_lyx_compliance: "Compliance",
          lend_lyx_chat_sessions: "Chat Sessions",
        },
      },
    },
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
        model: getModelByName("wrs_pro_brands"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "WRS Pro",
          icon: "Tag",
        },
        properties: {
          logo_url: {
            components: {
              list: Components.FileUrlDisplay,
              show: Components.FileUrlDisplay,
            },
            props: {
              key: "logo_url",
              name: "Logo Url",
              file: "File",
            },
          },
        },
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
        properties: {
          serial_components: {
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
            props: {
              key: "ic_file_url",
              name: "IC File Url",
              file: "IC File",
            },
          },
          ic_ocr_data: {
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
            props: {
              key: "receipt_file_url",
              name: "Receipt File Url",
              file: "Receipt File",
            },
          },
          receipt_ocr_data: {
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
        model: getModelByName("wrs_pro_moderation_queue"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "WRS Pro",
          icon: "Shield",
        },
        properties: {
          uploaded_file_url: {
            components: {
              list: Components.FileUrlDisplay,
              show: Components.FileUrlDisplay,
            },
            props: {
              key: "uploaded_file_url",
              name: "Uploaded File Url",
              file: "Uploaded File",
            },
          },
          ocr_extracted_data: {
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
        listProperties: [
          "id",
          "telegram_chat_id",
          "current_state",
          "current_flow",
          "created_at",
          "last_message_at",
        ],
        properties: {
          flow_data: {
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
            component: Components.WrsConversationView,
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
        model: getModelByName("wrs_pro_chat_history"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: false,
      },
    },
    // Slotiva Appointment Scheduling System
    {
      resource: {
        model: getModelByName("slotiva_appointments"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "Slotiva",
          icon: "Calendar",
        },
        listProperties: [
          "id",
          "booking_id",
          "client_name",
          "service_type",
          "start_time",
          "end_time",
          "status",
        ],
        properties: {
          id: {
            components: {
              show: Components.AppointmentDetails,
            },
            isVisible: {
              list: false,
              filter: false,
              show: true,
              edit: false,
            },
          },
          client_name: {
            components: {
              list: Components.ClientInfoDisplay,
            },
            isVisible: {
              list: true,
              filter: true,
              show: false,
              edit: true,
            },
          },
          phone: {
            isVisible: {
              list: false,
              filter: true,
              show: false,
              edit: true,
            },
          },
          email: {
            isVisible: {
              list: false,
              filter: true,
              show: false,
              edit: true,
            },
          },
          booking_id: {
            isVisible: {
              list: true,
              filter: true,
              show: false,
              edit: false,
            },
          },
          service_type: {
            isVisible: {
              list: true,
              filter: true,
              show: false,
              edit: true,
            },
          },
          start_time: {
            isVisible: {
              list: true,
              filter: true,
              show: false,
              edit: true,
            },
          },
          end_time: {
            isVisible: {
              list: false,
              filter: true,
              show: false,
              edit: true,
            },
          },
          calendar_event_id: {
            isVisible: {
              list: false,
              filter: false,
              show: false,
              edit: false,
            },
          },
          reminder_sent: {
            isVisible: {
              list: false,
              filter: true,
              show: false,
              edit: false,
            },
          },
          reminder_sent_at: {
            isVisible: {
              list: false,
              filter: false,
              show: false,
              edit: false,
            },
          },
          notes: {
            type: "textarea",
            isVisible: {
              list: false,
              filter: false,
              show: false,
              edit: true,
            },
          },
          created_by: {
            isVisible: {
              list: false,
              filter: false,
              show: false,
              edit: false,
            },
          },
          status: {
            type: "select",
            availableValues: [
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ],
            components: {
              list: Components.StatusTag,
            },
            isVisible: {
              list: true,
              filter: true,
              show: false,
              edit: true,
            },
          },
          created_at: {
            isVisible: {
              list: false,
              filter: false,
              show: false,
              edit: false,
            },
          },
          updated_at: {
            isVisible: {
              list: false,
              filter: false,
              show: false,
              edit: false,
            },
          },
        },
        actions: {
          new: {
            before: async (request, context) => {
              // Auto-generate booking_id if not provided
              if (request.method === "post" && !request.payload?.booking_id) {
                const timestamp = Math.floor(Date.now() / 1000);
                request.payload.booking_id = `BK-${timestamp}`;
              }
              return request;
            },
          },
          viewCalendar: {
            actionType: "resource",
            icon: "Calendar",
            label: "View Calendar",
            component: Components.CalendarView,
            showInDrawer: false,
            handler: async (request, response, context) => {
              return {
                msg: "Calendar view loaded",
              };
            },
          },
        },
      },
    },
    {
      resource: {
        model: getModelByName("slotiva_service_types"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "Slotiva",
          icon: "List",
        },
        listProperties: ["name", "duration_minutes", "is_active", "created_at"],
        properties: {
          name: {
            isTitle: true,
          },
          description: {
            type: "textarea",
          },
          duration_minutes: {
            description: "Duration in minutes",
          },
        },
      },
    },
    // {
    //   resource: {
    //     model: getModelByName("slotiva_conversation_sessions"),
    //     client: prisma,
    //     dmmf,
    //   },
    //   options: {
    //     navigation: {
    //       name: "Slotiva",
    //       icon: "MessageCircle",
    //     },
    //     listProperties: [
    //       "id",
    //       "session_id",
    //       "channel",
    //       "phone",
    //       "email",
    //       "started_at",
    //       "last_activity",
    //     ],
    //     properties: {
    //       session_id: {
    //         isVisible: {
    //           list: true,
    //           filter: true,
    //           show: true,
    //           edit: false,
    //         },
    //       },
    //     },
    //   },
    // },
    // {
    //   resource: {
    //     model: getModelByName("slotiva_conversation_messages"),
    //     client: prisma,
    //     dmmf,
    //   },
    //   options: {
    //     navigation: {
    //       name: "Slotiva",
    //       icon: "MessageSquare",
    //     },
    //     listProperties: ["id", "session_id", "role", "message", "created_at"],
    //     properties: {
    //       message: {
    //         type: "textarea",
    //         isVisible: {
    //           list: true,
    //           filter: false,
    //           show: true,
    //           edit: true,
    //         },
    //       },
    //       tool_calls: {
    //         isVisible: {
    //           list: false,
    //           filter: false,
    //           show: true,
    //           edit: true,
    //         },
    //       },
    //     },
    //   },
    // },
    // {
    //   resource: {
    //     model: getModelByName("slotiva_audit_logs"),
    //     client: prisma,
    //     dmmf,
    //   },
    //   options: {
    //     navigation: {
    //       name: "Slotiva",
    //       icon: "Activity",
    //     },
    //     listProperties: [
    //       "id",
    //       "action_type",
    //       "action_description",
    //       "channel",
    //       "created_at",
    //     ],
    //     properties: {
    //       user_input: {
    //         isVisible: {
    //           list: false,
    //           filter: false,
    //           show: true,
    //           edit: false,
    //         },
    //       },
    //       ai_response: {
    //         isVisible: {
    //           list: false,
    //           filter: false,
    //           show: true,
    //           edit: false,
    //         },
    //       },
    //       tool_calls: {
    //         isVisible: {
    //           list: false,
    //           filter: false,
    //           show: true,
    //           edit: false,
    //         },
    //       },
    //     },
    //   },
    // },
    // LendLyx Resources
    {
      resource: {
        model: getModelByName("lend_lyx_applicants"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "LendLyx",
          icon: "Users",
        },
        listProperties: [
          "id",
          "full_name",
          "ic_number",
          "status",
          "created_at",
        ],
      },
    },
    {
      resource: {
        model: getModelByName("lend_lyx_documents"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "LendLyx",
          icon: "File",
        },
        listProperties: [
          "id",
          "file_path",
          "file_name",
          "doc_type",
          "status",
          "created_at",
        ],
        properties: {
          file_path: {
            components: {
              list: Components.FileUrlDisplay,
              show: Components.FileUrlDisplay,
            },
            props: {
              key: "file_path",
              name: "File",
              file: "File",
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
        model: getModelByName("lend_lyx_financials"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "LendLyx",
          icon: "DollarSign",
        },
        listProperties: [
          "id",
          "monthly_expenses",
          "debt_to_income_ratio",
          "credit_score",
          "created_at",
        ],
      },
    },
    {
      resource: {
        model: getModelByName("lend_lyx_compliance"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "LendLyx",
          icon: "CheckCircle",
        },
        listProperties: [
          "id",
          "ofac_check",
          "disclosures_accepted",
          "aml_status",
          "created_at",
        ],
      },
    },
    {
      resource: {
        model: getModelByName("lend_lyx_employments"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "LendLyx",
          icon: "Briefcase",
        },
        listProperties: [
          "id",
          "position",
          "monthly_income",
          "employer_name",
          "employment_status",
          "start_date",
          "end_date",
          "created_at",
        ],
      },
    },
    {
      resource: {
        model: getModelByName("lend_lyx_applications"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "LendLyx",
          icon: "FileText",
        },
        listProperties: [
          "id",
          "reference_no",
          "loan_amount",
          "tenure_months",
          "interest_rate",
          "status",
          "created_at",
        ],
      },
    },
    {
      resource: {
        model: getModelByName("lend_lyx_chat_sessions"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: {
          name: "LendLyx",
          icon: "MessageSquare",
        },
        listProperties: [
          "id",
          "telegram_chat_id",
          "telegram_user_name",
          "is_active",
          "created_at",
          "last_interacted_at",
        ],
        actions: {
          viewMessages: {
            actionType: "record",
            icon: "MessageSquare",
            label: "View Messages",
            component: Components.LendLyxConversationView,
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
        model: getModelByName("lend_lyx_chat_messages"),
        client: prisma,
        dmmf,
      },
      options: {
        navigation: false, // Hide from sidebar
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
