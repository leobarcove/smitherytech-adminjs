/**
 * LendLyx Resources Configuration
 */
export const createLendLyxResources = (
  prisma,
  dmmf,
  getModelByName,
  Components
) => [
  {
    resource: {
      model: getModelByName("lend_lyx_applicants"),
      client: prisma,
      dmmf,
    },
    options: {
      navigation: {
        name: "LendLyx",
        icon: "DollarSign",
      },
      listProperties: ["id", "full_name", "ic_number", "status", "created_at"],
      properties: {
        date_of_birth: {
          type: "date",
        },
        status: {
          type: "select",
          availableValues: [
            { value: "pending", label: "Pending" },
            { value: "verified", label: "Verified" },
            { value: "failed", label: "Failed" },
            { value: "manual_review", label: "Manual Review" },
          ],
        },
        lend_lyx_applications: {
          isVisible: {
            list: false,
            filter: false,
            show: true,
            edit: false,
          },
        },
        application_id: {
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
          isVisible: {
            list: true,
            filter: false,
            show: true,
            edit: true,
          },
          props: {
            key: "file_path",
            name: "File",
            file: "File",
            disabled: true,
          },
        },
        file_name: {
          isVisible: {
            list: true,
            filter: true,
            show: true,
            edit: true,
          },
          props: {
            disabled: true,
          },
        },
        file_size: {
          isVisible: {
            list: false,
            filter: false,
            show: true,
            edit: true,
          },
          props: {
            disabled: true,
          },
        },
        doc_type: {
          isVisible: {
            list: true,
            filter: true,
            show: true,
            edit: true,
          },
          props: {
            disabled: true,
          },
        },
        status: {
          type: "select",
          availableValues: [
            { value: "pending", label: "Pending" },
            { value: "verified", label: "Verified" },
            { value: "failed", label: "Failed" },
          ],
        },
        ocr_data: {
          isVisible: {
            list: false,
            filter: false,
            show: false,
            edit: false,
          },
        },
        lend_lyx_applications: {
          isVisible: {
            list: false,
            filter: false,
            show: true,
            edit: false,
          },
        },
        application_id: {
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
      properties: {
        status: {
          type: "select",
          availableValues: [
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ],
        },
      },
      actions: {
        reviewLoan: {
          actionType: "record",
          icon: "FileText",
          label: "Review",
          component: Components.ReviewLoan,
          showInDrawer: false,
          handler: async (request, response, context) => {
            const { record, currentAdmin } = context;

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
];
