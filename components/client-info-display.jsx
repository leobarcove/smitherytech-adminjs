import React from "react";
import { Box, Text } from "@adminjs/design-system";

const ClientInfoDisplay = (props) => {
  const { record, property, where } = props;

  const clientName = record?.params?.client_name || "";
  const phone = record?.params?.phone || "";
  const email = record?.params?.email || "";

  if (!clientName && !phone && !email) {
    return (
      <Box>
        <Text color="grey40">No client information</Text>
      </Box>
    );
  }

  return (
    <Box style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {clientName && (
        <Text style={{ fontWeight: 600, fontSize: "14px", color: "#1a202c" }}>
          {clientName}
        </Text>
      )}
      {phone && (
        <Text style={{ fontSize: "13px", color: "#4a5568" }}>
          📞 {phone}
        </Text>
      )}
      {email && (
        <Text style={{ fontSize: "13px", color: "#4a5568" }}>
          ✉️ {email}
        </Text>
      )}
    </Box>
  );
};

export default ClientInfoDisplay;

