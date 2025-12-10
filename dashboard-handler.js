import { prisma } from "./admin.config.js";

const getDistribution = (data) => {
  const distribution = {};
  let total = 0;
  data.forEach((item) => {
    const status = item.status || "unknown";
    const count = item._count.status || item._count._all || 0;
    distribution[status] = count;
    total += count;
  });
  return { distribution, total };
};

export const dashboardHandler = async () => {
  try {
    // Fetch aggregated statistics
    const [
      claimsData,
      registrationsData,
      appointmentsData,
      applicationsData,
      insuraConversations,
      insuraActivePolicies,
      wrsConversations,
      wrsActiveCampaigns,
      slotivaConversations,
      slotivaActiveServices,
      lendlyxConversations,
      lendlyxActiveApplicants,
    ] = await Promise.all([
      prisma.claims.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.wrs_pro_registrations.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.slotiva_appointments.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.lend_lyx_applications.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.conversation_sessions.count(),
      prisma.policies.count({ where: { status: "active" } }),
      prisma.wrs_pro_chat_sessions.count(),
      prisma.wrs_pro_campaigns.count({ where: { is_active: true } }),
      prisma.slotiva_conversation_sessions.count(),
      prisma.slotiva_service_types.count({ where: { is_active: true } }),
      prisma.lend_lyx_chat_sessions.count(),
      prisma.lend_lyx_applicants.count({ where: { status: "active" } }),
    ]);

    const claimsStats = getDistribution(claimsData);
    const registrationsStats = getDistribution(registrationsData);
    const appointmentsStats = getDistribution(appointmentsData);
    const applicationsStats = getDistribution(applicationsData);

    return {
      insurawiz: {
        total: claimsStats.total,
        distribution: claimsStats.distribution,
        secondary: [
          { label: "Conversations", value: insuraConversations },
          { label: "Active Policies", value: insuraActivePolicies },
        ],
      },
      wrspro: {
        total: registrationsStats.total,
        distribution: registrationsStats.distribution,
        secondary: [
          { label: "Conversations", value: wrsConversations },
          { label: "Active Campaigns", value: wrsActiveCampaigns },
        ],
      },
      slotiva: {
        total: appointmentsStats.total,
        distribution: appointmentsStats.distribution,
        secondary: [
          { label: "Conversations", value: slotivaConversations },
          { label: "Active Service Types", value: slotivaActiveServices },
        ],
      },
      lendlyx: {
        total: applicationsStats.total,
        distribution: applicationsStats.distribution,
        secondary: [
          { label: "Conversations", value: lendlyxConversations },
          { label: "Active Applicants", value: lendlyxActiveApplicants },
        ],
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      error: "Failed to load statistics",
    };
  }
};
