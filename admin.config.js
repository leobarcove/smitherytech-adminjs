import "dotenv/config";
import AdminJS from "adminjs";
import { Database, Resource, getModelByName } from "@adminjs/prisma";
import { PrismaClient } from "@prisma/client";
import { dashboardHandler } from "./dashboard-handler.js";
import { projectConfig } from "./config/project.js";
import { componentLoader, Components } from "./components/index.js";

// Import Modular Resources
import { createInsuraWizResources } from "./resources/insurawiz.js";
import { createWrsProResources } from "./resources/wrspro.js";
import { createSlotivaResources } from "./resources/slotiva.js";
import { createLendLyxResources } from "./resources/lendlyx.js";
import { createSystemResources } from "./resources/system.js";

AdminJS.registerAdapter({ Database, Resource });

const prisma = new PrismaClient();
const dmmf = prisma._baseDmmf || prisma._dmmf;

// Builds the resource list dynamically based on enabled modules
const buildResources = () => {
  const creators = {
    insurawiz: createInsuraWizResources,
    wrspro: createWrsProResources,
    slotiva: createSlotivaResources,
    lendlyx: createLendLyxResources,
    system: createSystemResources,
  };

  return Object.entries(creators)
    .filter(([key]) => projectConfig.modules[key])
    .flatMap(([_, creator]) =>
      creator(prisma, dmmf, getModelByName, Components)
    );
};

const adminOptions = {
  rootPath: "/admin",
  assets: projectConfig.assets,
  branding: projectConfig.branding,
  componentLoader,
  dashboard: {
    handler: dashboardHandler,
    component: Components.Dashboard,
  },
  resources: buildResources(),
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
};

export { adminOptions, prisma };
