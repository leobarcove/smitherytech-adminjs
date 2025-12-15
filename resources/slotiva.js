/**
 * Slotiva Resources Configuration
 */
export const createSlotivaResources = (
  prisma,
  dmmf,
  getModelByName,
  Components
) => [
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
          // components: {
          //   list: Components.ServiceTypeDisplay,
          // },
          isVisible: {
            list: true,
            filter: true,
            show: false,
            edit: true,
          },
        },
        service_type_id: {
          isVisible: {
            list: false,
            filter: false,
            show: false,
            edit: true,
          },
        },
        slotiva_service_type: {
          isVisible: {
            list: false,
            filter: false,
            show: false,
            edit: false,
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
        list: {
          after: async (response, request, context) => {
            // If we have records, include the relation
            if (response && response.records && response.records.length > 0) {
              // Update records with relation data
              response.records = response.records.map((record) => {
                const serviceType = record.populated.slotiva_service_type;
                if (
                  serviceType &&
                  serviceType.params &&
                  serviceType.params.name
                ) {
                  record.params.service_type = serviceType.params.name;
                }
                return record;
              });
            }

            return response;
          },
        },
        show: {
          after: async (response, request, context) => {
            // Include the relation for the show view
            if (response && response.record) {
              let record = response.record;
              const serviceType = record.populated.slotiva_service_type;
              if (
                serviceType &&
                serviceType.params &&
                serviceType.params.name
              ) {
                record.params.service_type = serviceType.params.name;
              }
              response.record = record;
            }

            return response;
          },
        },
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
  // TODO: Add other slotiva resources as needed (commented out in original)
];
