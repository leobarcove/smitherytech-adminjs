import React from "react";
import { Box, Text, Label, Badge } from "@adminjs/design-system";

const AppointmentDetails = (props) => {
  const { record } = props;

  if (!record) {
    return (
      <Box>
        <Text>No appointment data available</Text>
      </Box>
    );
  }

  const params = record.params || {};

  // Format date and time
  const formatDateTime = (dateTime) => {
    if (!dateTime) return "N/A";
    const date = new Date(dateTime);
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date only
  const formatDate = (dateTime) => {
    if (!dateTime) return "N/A";
    const date = new Date(dateTime);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time only
  const formatTime = (dateTime) => {
    if (!dateTime) return "N/A";
    const date = new Date(dateTime);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate duration
  const getDuration = () => {
    if (!params.start_time || !params.end_time) return "N/A";
    const start = new Date(params.start_time);
    const end = new Date(params.end_time);
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      confirmed: { bg: "#10B981", text: "white" },
      cancelled: { bg: "#EF4444", text: "white" },
      completed: { bg: "#3B82F6", text: "white" },
      pending: { bg: "#F59E0B", text: "white" },
    };
    return colors[status?.toLowerCase()] || { bg: "#6B7280", text: "white" };
  };

  const statusColor = getStatusColor(params.status);

  return (
    <Box style={{ padding: "24px", backgroundColor: "#f7fafc", minHeight: "100%" }}>
      {/* Header Section */}
      <Box
        bg="white"
        p="xl"
        mb="lg"
        style={{
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          borderLeft: `4px solid ${statusColor.bg}`,
        }}
      >
        <Box flex alignItems="center" justifyContent="space-between" mb="md">
          <Box>
            <Text fontSize="xl" fontWeight="700" color="grey100" mb="xs">
              Appointment Details
            </Text>
            <Text fontSize="sm" color="grey60">
              Booking ID: {params.booking_id || "N/A"}
            </Text>
          </Box>
          <Badge
            variant={
              params.status === "confirmed"
                ? "success"
                : params.status === "cancelled"
                ? "danger"
                : params.status === "completed"
                ? "info"
                : "warning"
            }
            style={{
              fontSize: "13px",
              padding: "6px 14px",
              textTransform: "capitalize",
            }}
          >
            {params.status || "N/A"}
          </Badge>
        </Box>
      </Box>

      {/* Client Information Section */}
      <Box
        bg="white"
        p="xl"
        mb="lg"
        style={{
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Text fontSize="lg" fontWeight="600" color="grey100" mb="lg">
          Client Information
        </Text>
        <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
          <Box>
            <Label style={{ marginBottom: "8px", fontSize: "12px", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Client Name
            </Label>
            <Text fontSize="md" fontWeight="600" color="grey100">
              {params.client_name || "N/A"}
            </Text>
          </Box>
          <Box>
            <Label style={{ marginBottom: "8px", fontSize: "12px", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Phone Number
            </Label>
            <Text fontSize="md" color="grey100">
              {params.phone ? (
                <a href={`tel:${params.phone}`} style={{ color: "#4299e1", textDecoration: "none" }}>
                  📞 {params.phone}
                </a>
              ) : (
                "N/A"
              )}
            </Text>
          </Box>
          <Box>
            <Label style={{ marginBottom: "8px", fontSize: "12px", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Email Address
            </Label>
            <Text fontSize="md" color="grey100">
              {params.email ? (
                <a href={`mailto:${params.email}`} style={{ color: "#4299e1", textDecoration: "none" }}>
                  ✉️ {params.email}
                </a>
              ) : (
                "N/A"
              )}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Appointment Details Section */}
      <Box
        bg="white"
        p="xl"
        mb="lg"
        style={{
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Text fontSize="lg" fontWeight="600" color="grey100" mb="lg">
          Appointment Details
        </Text>
        <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
          <Box>
            <Label style={{ marginBottom: "8px", fontSize: "12px", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Service Type
            </Label>
            <Text fontSize="md" fontWeight="500" color="grey100">
              {params.service_type || "N/A"}
            </Text>
          </Box>
          <Box>
            <Label style={{ marginBottom: "8px", fontSize: "12px", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Duration
            </Label>
            <Text fontSize="md" fontWeight="500" color="grey100">
              {getDuration()}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Date & Time Section */}
      <Box
        bg="white"
        p="xl"
        mb="lg"
        style={{
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Text fontSize="lg" fontWeight="600" color="grey100" mb="lg">
          Schedule
        </Text>
        <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          <Box
            style={{
              padding: "16px",
              backgroundColor: "#ebf8ff",
              borderRadius: "6px",
              border: "1px solid #bee3f8",
            }}
          >
            <Label style={{ marginBottom: "8px", fontSize: "12px", color: "#2c5282", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
              Start Time
            </Label>
            <Text fontSize="sm" color="grey60" mb="xs">
              {formatDate(params.start_time)}
            </Text>
            <Text fontSize="lg" fontWeight="700" color="#2c5282">
              {formatTime(params.start_time)}
            </Text>
          </Box>
          <Box
            style={{
              padding: "16px",
              backgroundColor: "#f0fff4",
              borderRadius: "6px",
              border: "1px solid #c6f6d5",
            }}
          >
            <Label style={{ marginBottom: "8px", fontSize: "12px", color: "#276749", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
              End Time
            </Label>
            <Text fontSize="sm" color="grey60" mb="xs">
              {formatDate(params.end_time)}
            </Text>
            <Text fontSize="lg" fontWeight="700" color="#276749">
              {formatTime(params.end_time)}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Additional Information Section */}
      <Box
        bg="white"
        p="xl"
        mb="lg"
        style={{
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Text fontSize="lg" fontWeight="600" color="grey100" mb="lg">
          Additional Information
        </Text>
        <Box style={{ display: "grid", gap: "20px" }}>
          {params.notes && (
            <Box>
              <Label style={{ marginBottom: "8px", fontSize: "12px", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Notes
              </Label>
              <Box
                style={{
                  padding: "16px",
                  backgroundColor: "#f7fafc",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Text fontSize="md" color="grey100" style={{ whiteSpace: "pre-wrap" }}>
                  {params.notes}
                </Text>
              </Box>
            </Box>
          )}
          <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            {params.calendar_event_id && (
              <Box>
                <Label style={{ marginBottom: "8px", fontSize: "12px", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Calendar Event ID
                </Label>
                <Text fontSize="sm" color="grey60" style={{ fontFamily: "monospace" }}>
                  {params.calendar_event_id}
                </Text>
              </Box>
            )}
            {params.reminder_sent !== undefined && (
              <Box>
                <Label style={{ marginBottom: "8px", fontSize: "12px", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Reminder Sent
                </Label>
                <Badge variant={params.reminder_sent ? "success" : "secondary"} style={{ fontSize: "12px" }}>
                  {params.reminder_sent ? "Yes" : "No"}
                </Badge>
                {params.reminder_sent_at && (
                  <Text fontSize="xs" color="grey60" style={{ marginTop: "4px" }}>
                    {formatDateTime(params.reminder_sent_at)}
                  </Text>
                )}
              </Box>
            )}
            {params.created_by && (
              <Box>
                <Label style={{ marginBottom: "8px", fontSize: "12px", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Created By
                </Label>
                <Text fontSize="sm" color="grey60">
                  {params.created_by}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Metadata Section */}
      <Box
        bg="white"
        p="xl"
        style={{
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Text fontSize="lg" fontWeight="600" color="grey100" mb="lg">
          Metadata
        </Text>
        <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
          <Box>
            <Label style={{ marginBottom: "8px", fontSize: "12px", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Appointment ID
            </Label>
            <Text fontSize="sm" color="grey60" style={{ fontFamily: "monospace" }}>
              {params.id || "N/A"}
            </Text>
          </Box>
          {params.created_at && (
            <Box>
              <Label style={{ marginBottom: "8px", fontSize: "12px", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Created At
              </Label>
              <Text fontSize="sm" color="grey60">
                {formatDateTime(params.created_at)}
              </Text>
            </Box>
          )}
          {params.updated_at && (
            <Box>
              <Label style={{ marginBottom: "8px", fontSize: "12px", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Last Updated
              </Label>
              <Text fontSize="sm" color="grey60">
                {formatDateTime(params.updated_at)}
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AppointmentDetails;


