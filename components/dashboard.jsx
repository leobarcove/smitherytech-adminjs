import React, { useEffect, useState } from "react";
import { Box, H2, Text, Icon, Loader } from "@adminjs/design-system";
import { ApiClient } from "adminjs";

const api = new ApiClient();

const COLORS = {
  primary: "#3040D6",
  success: "#10B981",
  warning: "#F59E0B",
  warning_light: "#EDC683",
  danger: "#EF4444",
  danger_light: "#E07A7A",
  info: "#3B82F6",
  neutral: "#E5E7EB",
  neutral_light: "#EFF2F7",
};

const STATUS_COLORS = {
  approved: COLORS.info,
  active: COLORS.info,
  confirmed: COLORS.info,
  paid: COLORS.info,
  completed: COLORS.info,

  pending: COLORS.warning_light,

  rejected: COLORS.danger_light,
  cancelled: COLORS.danger_light,
  closed: COLORS.danger_light,

  draft: COLORS.neutral_light,
  unknown: COLORS.neutral_light,
};

const DonutChart = ({ distribution, total, size = 140, strokeWidth = 12 }) => {
  if (!total || total === 0) {
    return (
      <Box
        position="relative"
        width={size}
        height={size}
        flex
        justifyContent="center"
        alignItems="center"
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size - strokeWidth) / 2}
            fill="none"
            stroke={COLORS.neutral}
            strokeWidth={strokeWidth}
            opacity={0.2}
          />
        </svg>
        <Box
          position="absolute"
          flex
          flexDirection="column"
          alignItems="center"
        >
          <Text fontSize="h3" color="grey40" mb={0}>
            0
          </Text>
          <Text fontSize="xs" color="grey60">
            Total
          </Text>
        </Box>
      </Box>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  // Background circle
  const track = (
    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      fill="none"
      stroke={COLORS.neutral}
      strokeWidth={strokeWidth}
      opacity={0.2}
    />
  );

  const segments = Object.entries(distribution).map(([status, count]) => {
    const percent = count / total;
    const offset = circumference - percent * circumference;
    const rotation = accumulatedPercent * 360;
    accumulatedPercent += percent;

    return (
      <circle
        key={status}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={STATUS_COLORS[status] || COLORS.info}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(${rotation - 90} ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
      />
    );
  });

  return (
    <Box
      position="relative"
      width={size}
      height={size}
      flex
      justifyContent="center"
      alignItems="center"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {track}
        {segments.reverse()}
      </svg>
      <Box
        position="absolute"
        flex
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <H2
          style={{
            lineHeight: "1",
            fontSize: "2rem",
            marginBottom: "0",
            marginTop: "0",
          }}
        >
          {total.toLocaleString()}
        </H2>
        <Text fontSize="sm" color="grey60" mt="xxs">
          Total
        </Text>
      </Box>
    </Box>
  );
};

const ModuleAnalyticsCard = ({
  title,
  icon,
  data,
  color,
  href,
  description,
}) => {
  return (
    <Box
      variant="white"
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.05)"
      flex
      flexDirection="column"
      p="xxl"
      style={{
        minWidth: "320px",
        flex: 1,
        height: "100%",
        borderRadius: "8px",
        border: "1px solid #F3F4F6",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
      }}
      onClick={() => (window.location.href = href)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 24px rgba(0, 0, 0, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.05)";
      }}
    >
      {/* Header */}
      <Box
        flex
        flexDirection="row"
        justifyContent="space-between"
        alignItems="flex-start"
        mb="xl"
      >
        <Box>
          <Text fontSize="lg" fontWeight="bold" color="grey100" mb="xxs">
            {title}
          </Text>
          <Text fontSize="xs" color="grey60">
            {description}
          </Text>
        </Box>
        <Box
          bg={`${color}15`}
          color={color}
          p="sm"
          borderRadius="12px"
          flex
          alignItems="center"
          justifyContent="center"
        >
          <Icon icon={icon} size={20} />
        </Box>
      </Box>

      {/* Chart Section */}
      <Box flex justifyContent="center" mb="xxl" position="relative">
        <DonutChart
          distribution={data.distribution || {}}
          total={data.total || 0}
        />
      </Box>

      {/* Stats Breakdown Legend - Fixed Height for consistency */}
      <Box
        mb="lg"
        flex
        flexDirection="column"
        style={{ gap: "2px", minHeight: "76px" }}
      >
        {Object.entries(data.distribution || {}).length > 0 ? (
          Object.entries(data.distribution || {}).map(([status, count]) => (
            <Box
              key={status}
              flex
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box flex flexDirection="row" alignItems="center">
                <Box
                  width="10px"
                  height="10px"
                  borderRadius="5px"
                  bg={STATUS_COLORS[status] || COLORS.info}
                  mr="md"
                />
                <Text
                  fontSize="sm"
                  color="grey80"
                  style={{ textTransform: "capitalize", fontWeight: 500 }}
                >
                  {status}
                </Text>
              </Box>
              <Text fontSize="sm" fontWeight="bold" color="grey100">
                {count}
              </Text>
            </Box>
          ))
        ) : (
          <Box flex justifyContent="center" alignItems="center" height="100%">
            <Text fontSize="sm" color="grey40">
              No status data available
            </Text>
          </Box>
        )}
      </Box>

      {/* Secondary Metrics Footer - Fixed Height */}
      <Box pt="lg" borderTop="1px solid #E5E7EB" style={{ minHeight: "60px" }}>
        {(data.secondary || []).length > 0 ? (
          data.secondary.map((metric, idx) => (
            <Box
              key={idx}
              flex
              flexDirection="row"
              justifyContent="space-between"
              mb="xs"
            >
              <Text fontSize="xs" color="grey60" fontWeight="600">
                {metric.label.toUpperCase()}
              </Text>
              <Text fontSize="xs" fontWeight="bold" color="grey80">
                {metric.value}
              </Text>
            </Box>
          ))
        ) : (
          <Box flex flexDirection="row" justifyContent="center" mb="xs">
            <Text fontSize="xs" color="grey40">
              -
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    insurawiz: {},
    wrspro: {},
    slotiva: {},
    lendlyx: {},
  });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchStats();
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.getDashboard();
      if (response.data) {
        setStats(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const optionsDate = {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    const optionsTime = { hour: "numeric", minute: "numeric", hour12: true };
    return `${date.toLocaleDateString(
      "en-GB",
      optionsDate
    )} | ${date.toLocaleTimeString("en-US", optionsTime)}`;
  };

  if (loading) {
    return (
      <Box
        flex
        justifyContent="center"
        alignItems="center"
        height="80vh"
        minHeight="400px"
      >
        <Loader />
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Box
        mb="xxl"
        flex
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <H2 style={{ marginBottom: "0" }}>Dashboard Overview</H2>
          <Text color="grey60">
            Monitor real-time module performance and status.
          </Text>
        </Box>
        <Box flex alignItems="center">
          <Text color="grey60">{formatDate(currentDate)}</Text>
        </Box>
      </Box>

      <Box flex flexDirection="row" flexWrap="wrap" style={{ gap: "24px" }}>
        <ModuleAnalyticsCard
          title="Insura Wiz"
          description="Manage claims and active policies"
          icon="Shield"
          color={COLORS.info}
          data={stats.insurawiz || {}}
          href="/admin/resources/claims"
        />
        <ModuleAnalyticsCard
          title="WRS Pro"
          description="Track warranties and campaigns"
          icon="Tag"
          color={COLORS.info}
          data={stats.wrspro || {}}
          href="/admin/resources/wrs_pro_registrations"
        />
        <ModuleAnalyticsCard
          title="Slotiva"
          description="Monitor appointments and services"
          icon="Calendar"
          color={COLORS.info}
          data={stats.slotiva || {}}
          href="/admin/resources/slotiva_appointments"
        />
        <ModuleAnalyticsCard
          title="Lend Lyx"
          description="Manage loans and applicants"
          icon="DollarSign"
          color={COLORS.info}
          data={stats.lendlyx || {}}
          href="/admin/resources/lend_lyx_applications"
        />
      </Box>
    </Box>
  );
};

export default Dashboard;
