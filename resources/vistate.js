/**
 * Vistate Resources Configuration
 */

export const VISTATE_BUSINESS_HOURS = {
  startHour: 9,
  endHour: 18,
  days: [1, 2, 3, 4, 5, 6], // Mon (1) - Sat (6)
};

export const createVistateResources = (
  prisma,
  dmmf,
  getModelByName,
  Components
) => [
  {
    resource: {
      model: getModelByName("vistate_viewing_appointments"),
      client: prisma,
      dmmf,
    },
    options: {
      navigation: {
        name: "Vistate",
        icon: "Calendar",
      },
      listProperties: [
        "booking_reference",
        "client_id",
        "property_id",
        "scheduled_datetime",
        "status",
      ],
      properties: {
        id: {
          isVisible: {
            list: false,
            filter: false,
            show: true,
            edit: false,
          },
        },
        booking_reference: {
          isTitle: true,
          isVisible: {
            list: true,
            filter: true,
            show: true,
            edit: false,
          },
        },
        scheduled_datetime: {
          components: {
            edit: Components.FutureDatePicker,
          },
          custom: {
            businessHours: VISTATE_BUSINESS_HOURS,
            name: "Scheduled Date & Time",
          },
          isVisible: {
            list: true,
            filter: true,
            show: true,
            edit: true,
          },
        },
        status: {
          type: "select",
          availableValues: [
            { value: "pending", label: "Pending" },
            { value: "confirmed", label: "Confirmed" },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
            { value: "no_show", label: "No Show" },
          ],
          components: {
            list: Components.StatusTag,
          },
          isVisible: {
            list: true,
            filter: true,
            show: true,
            edit: true,
          },
        },
        notes: {
          type: "textarea",
        },
        booking_channel: {
          type: "select",
          availableValues: [
            { value: "whatsapp", label: "WhatsApp" },
            { value: "telegram", label: "Telegram" },
            { value: "website", label: "Website" },
          ],
        },
        created_at: {
          isVisible: { list: false, filter: false, show: true, edit: false },
        },
      },
      actions: {
        new: {
          before: async (request, context) => {
            if (request.method === "post" && !request.payload?.booking_reference) {
                // simple fallback generation
              const timestamp = Math.floor(Date.now() / 1000);
              const datePart = new Date().toISOString().slice(0,10).replace(/-/g, "");
              request.payload.booking_reference = `VW-${datePart}-${timestamp}`;
            }
            return request;
          },
        },
        viewCalendar: {
          actionType: "resource",
          icon: "Calendar",
          label: "View Calendar",
          component: Components.VistateCalendarView,
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
      model: getModelByName("vistate_properties"),
      client: prisma,
      dmmf,
    },
    options: {
      navigation: {
        name: "Vistate",
        icon: "Home",
      },
      listProperties: [
        "reference_code",
        "title",
        "status",
        "price",
        "listing_type",
      ],
      properties: {
        reference_code: {
          isTitle: true,
            isVisible: {
            list: true,
            filter: true,
            show: true,
            edit: false,
          },
        },
        price: {
            type: 'currency',
            props: {
                options: {
                    style: 'currency',
                    currency: 'MYR'
                }
            }
        },
        description: {
          type: "textarea",
        },
        address: {
            type: "textarea"
        },
         status: {
          type: "select",
          availableValues: [
            { value: "available", label: "Available" },
            { value: "pending", label: "Pending" },
            { value: "sold", label: "Sold" },
            { value: "rented", label: "Rented" },
          ],
           components: {
            list: Components.StatusTag,
          },
        },
         listing_type: {
          type: "select",
          availableValues: [
            { value: "sale", label: "For Sale" },
            { value: "rent", label: "For Rent" },
          ],
        },
        min_notice_hours: {
          isVisible: { list: false, filter: false, show: true, edit: true },
        },
        max_daily_viewings: {
          isVisible: { list: false, filter: false, show: true, edit: true },
        },
        viewing_duration_minutes: {
          isVisible: { list: false, filter: false, show: true, edit: true },
        },
      },
       actions: {
        // new: {
        //   before: async (request, context) => {
        //     if (request.method === "post" && !request.payload?.reference_code) {
        //        // simple fallback generation
        //       const timestamp = Math.floor(Date.now() / 1000);
        //       request.payload.reference_code = `PROP-${timestamp}`;
        //     }
        //     return request;
        //   },
        // },
       }
    },
  },
  {
    resource: {
      model: getModelByName("vistate_property_availability_blocks"),
      client: prisma,
      dmmf,
    },
    options: {
      navigation: {
        name: "Vistate",
        icon: "Clock",
      },
      listProperties: ["property_id", "start_datetime", "end_datetime", "reason"],
      properties: {
        start_datetime: {
          components: {
            edit: Components.FutureDatePicker,
          },
          custom: {
            businessHours: VISTATE_BUSINESS_HOURS,
            name: "Start Date & Time",
          }
        },
        end_datetime: {
           components: {
            edit: Components.FutureDatePicker,
          },
           custom: {
            businessHours: VISTATE_BUSINESS_HOURS,
            name: "End Date & Time",
          }
        },
        reason: {
          type: "select",
           availableValues: [
            { value: "maintenance", label: "Maintenance" },
            { value: "occupied", label: "Occupied" },
            { value: "renovation", label: "Renovation" },
            { value: "other", label: "Other" },
          ],
        }
      }
    },
  },
  {
    resource: {
      model: getModelByName("vistate_agents"),
      client: prisma,
      dmmf,
    },
    options: {
      navigation: {
        name: "Vistate",
        icon: "Users",
      },
      listProperties: ["name", "email", "phone", "is_active", "telegram_registration_code", "telegram_linked_at"],
      properties: {
        working_hours: {
          components: {
            edit: Components.WorkingHoursEditor,
            show: Components.WorkingHoursEditor,
          },
          isVisible: {
            list: false,
            filter: false,
            show: true,
            edit: true,
          },
        },
        telegram_registration_code: {
          label: "Telegram Registration",
          components: {
            list: Components.TelegramRegistrationLink,
          },
          isVisible: {
            list: true,
            filter: true,
            show: false,
            edit: false,
          },
        },
        telegram_linked_at: {
          label: "Telegram Linked At",
          isVisible: { list: true, show: true, edit: false, filter: true },
        },
        notification_enabled: { 
          type: 'boolean',
          isVisible: { edit: true, show: true, list: true } 
        },
        last_notified_at: { isVisible: { edit: false, show: true, list: false } },
      },
    },
  },
  {
    resource: {
      model: getModelByName("vistate_clients"),
      client: prisma,
      dmmf,
    },
    options: {
      navigation: {
        name: "Vistate",
        icon: "User",
      },
      listProperties: ["name", "phone", "email", "preferred_contact"],
    },
  },
    {
    resource: {
      model: getModelByName("vistate_property_types"),
      client: prisma,
      dmmf,
    },
    options: {
      navigation: {
        name: "Vistate",
        icon: "Tag",
      },
      listProperties: ["name", "category"],
    },
  },
  {
    resource: {
      model: getModelByName("vistate_communication_log"),
      client: prisma,
      dmmf,
    },
    options: {
      navigation: {
        name: "Vistate",
        icon: "MessageSquare",
      },
      listProperties: [
        "session_id",
        "channel",
        "direction",
        "message_type",
        "content",
        "created_at",
      ],
      properties: {
        content: {
          isVisible: {
            list: true,
            filter: false,
            show: true,
            edit: false,
          },
        },
        metadata: {
          isVisible: {
            list: false,
            filter: false,
            show: false,
            edit: false,
          },
        },
        session_id: {
          isTitle: true,
        },
        channel: {
          type: "select",
          availableValues: [
            { value: "telegram", label: "Telegram" },
            { value: "whatsapp", label: "WhatsApp" },
            { value: "email", label: "Email" },
            { value: "chat", label: "Chat" },
            { value: "webhook", label: "Webhook" },
          ],
        },
        direction: {
          type: "select",
          availableValues: [
            { value: "inbound", label: "Inbound" },
            { value: "outbound", label: "Outbound" },
          ],
        },
        message_type: {
          type: "select",
          availableValues: [
            { value: "inquiry", label: "Inquiry" },
            { value: "confirmation", label: "Confirmation" },
            { value: "reminder", label: "Reminder" },
            { value: "cancellation", label: "Cancellation" },
            { value: "feedback", label: "Feedback" },
          ],
        },
      },
      actions: {
        viewMessages: {
          actionType: "record",
          icon: "MessageSquare",
          label: "View Messages",
          component: Components.VistateConversationView,
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
];
