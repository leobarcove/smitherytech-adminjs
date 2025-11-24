import React, { useEffect, useState } from 'react';
import { Box, H2, H5, Text } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const api = new ApiClient();

const Dashboard = (props) => {
  const [stats, setStats] = useState({
    totalClaims: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    totalPolicies: 0,
    activePolicies: 0,
    totalDocuments: 0,
    totalConversations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.getDashboard();
      if (response.data) {
        setStats(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, subtitle, color = 'primary' }) => (
    <Box
      flex
      flexDirection="column"
      bg="white"
      p="xl"
      borderRadius="lg"
      boxShadow="card"
      border="default"
      style={{ minWidth: '250px' }}
    >
      <Text fontSize="sm" color="grey60" mb="sm">
        {title}
      </Text>
      <H2 color={color} mb="sm">
        {loading ? '...' : value.toLocaleString()}
      </H2>
      {subtitle && (
        <Text fontSize="xs" color="grey40">
          {subtitle}
        </Text>
      )}
    </Box>
  );

  return (
    <Box>
      <Box mb="xxl">
        <H2 mb="lg">Dashboard Overview</H2>
        <Text color="grey60">Welcome to Smithery Tech Admin Panel</Text>
      </Box>

      <Box mb="xl">
        <H5 mb="lg">Claims Management</H5>
        <Box flex flexDirection="row" flexWrap="wrap" style={{ gap: '20px' }}>
          <MetricCard
            title="Total Claims"
            value={stats.totalClaims}
            subtitle="All time claims"
            color="primary"
          />
          <MetricCard
            title="Pending Claims"
            value={stats.pendingClaims}
            subtitle="Awaiting review"
            color="warning"
          />
          <MetricCard
            title="Approved Claims"
            value={stats.approvedClaims}
            subtitle="Successfully processed"
            color="success"
          />
        </Box>
      </Box>

      <Box mb="xl">
        <H5 mb="lg">Policies & Documents</H5>
        <Box flex flexDirection="row" flexWrap="wrap" style={{ gap: '20px' }}>
          <MetricCard
            title="Total Policies"
            value={stats.totalPolicies}
            subtitle="All policies"
            color="primary"
          />
          <MetricCard
            title="Active Policies"
            value={stats.activePolicies}
            subtitle="Currently active"
            color="success"
          />
          <MetricCard
            title="Documents"
            value={stats.totalDocuments}
            subtitle="Uploaded files"
            color="info"
          />
        </Box>
      </Box>

      <Box mb="xl">
        <H5 mb="lg">Customer Engagement</H5>
        <Box flex flexDirection="row" flexWrap="wrap" style={{ gap: '20px' }}>
          <MetricCard
            title="Conversations"
            value={stats.totalConversations}
            subtitle="Telegram sessions"
            color="primary"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
