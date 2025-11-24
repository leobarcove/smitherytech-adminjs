import { prisma } from './admin.config.js';

export const dashboardHandler = async () => {
  try {
    // Fetch statistics from database
    const [
      totalClaims,
      pendingClaims,
      approvedClaims,
      totalPolicies,
      activePolicies,
      totalDocuments,
      totalConversations,
    ] = await Promise.all([
      prisma.claims.count(),
      prisma.claims.count({
        where: {
          status: {
            in: ['draft', 'pending', 'submitted'],
          },
        },
      }),
      prisma.claims.count({
        where: {
          status: 'approved',
        },
      }),
      prisma.policies.count(),
      prisma.policies.count({
        where: {
          status: 'active',
        },
      }),
      prisma.documents.count(),
      prisma.conversation_sessions.count(),
    ]);

    // Return data object that will be passed to the React component
    return {
      totalClaims,
      pendingClaims,
      approvedClaims,
      totalPolicies,
      activePolicies,
      totalDocuments,
      totalConversations,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalClaims: 0,
      pendingClaims: 0,
      approvedClaims: 0,
      totalPolicies: 0,
      activePolicies: 0,
      totalDocuments: 0,
      totalConversations: 0,
      error: 'Failed to load statistics',
    };
  }
};
