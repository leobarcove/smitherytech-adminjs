import React from "react";
import { Box, Text } from "@adminjs/design-system";

const ServiceTypeDisplay = (props) => {
  const { record, property } = props;

  // Try to get service type name from the relation first
  const serviceTypeName = 
    record?.params?.slotiva_service_types?.name ||
    record?.populated?.slotiva_service_types?.name ||
    record?.params?.service_type || // Fallback to old field for backward compatibility
    "";

  if (!serviceTypeName) {
    return (
      <Box>
        <Text color="grey40">N/A</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text style={{ fontSize: "14px", color: "#1a202c" }}>
        {serviceTypeName}
      </Text>
    </Box>
  );
};

export default ServiceTypeDisplay;







