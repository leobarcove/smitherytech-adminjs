import React from "react";
import { Badge } from "@adminjs/design-system";

const StatusTag = (props) => {
  const { record, property } = props;

  const status = record?.params?.status || record?.params?.[property.name] || "";

  if (!status) {
    return <Badge variant="secondary">N/A</Badge>;
  }

  // Map status values to AdminJS Badge variants
  const statusVariantMap = {
    confirmed: "success",
    cancelled: "danger",
    completed: "info",
    pending: "warning",
    approved: "success",
    rejected: "danger",
    draft: "secondary",
    active: "success",
    inactive: "secondary",
  };

  // Get variant, default to secondary if not found
  const variant = statusVariantMap[status.toLowerCase()] || "secondary";

  // Capitalize first letter of status
  const displayStatus =
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return <Badge variant={variant}>{displayStatus}</Badge>;
};

export default StatusTag;

