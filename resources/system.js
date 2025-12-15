/**
 * System Resources Configuration
 * Contains Admin users and Audit logs
 */
export const createSystemResources = (prisma, dmmf, getModelByName) => [
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
];
