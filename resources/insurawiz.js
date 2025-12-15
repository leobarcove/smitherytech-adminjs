/**
 * InsuraWiz Resources Configuration
 */
export const createInsuraWizResources = (
  prisma,
  dmmf,
  getModelByName,
  Components
) => [
  {
    resource: {
      model: getModelByName("claims"),
      client: prisma,
      dmmf,
    },
    options: {
      navigation: {
        name: "InsuraWiz",
        icon: "Shield",
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
          label: "Review",
          component: Components.ReviewClaim,
          showInDrawer: false,
          handler: async (request, response, context) => {
            const { record, currentAdmin } = context;

            if (request.method === "get") {
              return {
                record: record.toJSON(currentAdmin),
              };
            }

            return {
              record: record.toJSON(currentAdmin),
            };
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
          component: Components.InsuraWizConversationView,
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
];
