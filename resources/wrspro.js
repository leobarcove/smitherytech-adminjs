/**
 * WRS Pro Resources Configuration
 */
export const createWrsProResources = (
  prisma,
  dmmf,
  getModelByName,
  Components
) => [
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
          component: Components.WrsProConversationView,
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
];
