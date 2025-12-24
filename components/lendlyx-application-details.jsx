import React, { useEffect, useMemo, useState } from "react";
import { Box, Label, Text, Badge } from "@adminjs/design-system";

const formatDateOnly = (value) => {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  // Use a stable yyyy-mm-dd format
  return d.toISOString().split("T")[0];
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getApplicationStatusBadgeVariant = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "approved") return "success";
  if (s === "rejected") return "danger";
  if (s === "pending") return "info";
  return "default";
};

const startCase = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const Field = ({ label, value, monospace }) => (
  <Box>
    <Label
      style={{
        marginBottom: "6px",
        fontSize: "12px",
        color: "#718096",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {label}
    </Label>
    <Text
      fontSize="md"
      color="grey100"
      style={monospace ? { fontFamily: "monospace" } : undefined}
    >
      {value ?? "N/A"}
    </Text>
  </Box>
);

const LendLyxApplicationDetails = (props) => {
  const { record } = props;
  const params = record?.params || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applicants, setApplicants] = useState([]);

  const applicationId = useMemo(() => record?.id, [record?.id]);

  useEffect(() => {
    const load = async () => {
      if (!applicationId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/admin/api/lendlyx/applications/${applicationId}/applicants`
        );
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Failed to fetch applicants");
        }
        setApplicants(Array.isArray(data.applicants) ? data.applicants : []);
      } catch (e) {
        setError(e?.message || "Failed to fetch applicants");
        setApplicants([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [applicationId]);

  return (
    <Box p="xl" variant="grey">
      {/* Applicant section (top) */}
      <Box
        bg="white"
        p="xl"
        mb="lg"
        style={{
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Box
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <Text fontSize="lg" fontWeight="600" color="grey100">
            Applicant Information
          </Text>
            {loading && (
              <Badge variant="info">
                Loading...
              </Badge>
            )}
        </Box>

        {error && (
          <Box mb="lg">
            <Text color="error">{error}</Text>
          </Box>
        )}

        {!loading && !error && applicants.length === 0 && (
          <Text color="grey60">No applicant found for this application.</Text>
        )}

        {!loading && !error && applicants.length > 0 && (
          <Box style={{ display: "grid", gap: "16px" }}>
            {applicants.map((a) => (
              <Box
                key={a.id}
                p="lg"
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              >
                <Box
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <Text fontSize="md" fontWeight="600" color="grey100">
                    {a.full_name || "Unnamed Applicant"}
                  </Text>
                  {a.status ? (
                    <Badge variant="primary">{startCase(String(a.status))}</Badge>
                  ) : (
                    <Badge variant="default">N/A</Badge>
                  )}
                </Box>

                <Box
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <Field label="Applicant ID" value={a.id} monospace />
                  <Field label="IC Number" value={a.ic_number} />
                  <Field label="Date of Birth" value={formatDateOnly(a.date_of_birth)} />
                  <Field label="Email" value={a.email} />
                  <Field label="Phone" value={a.phone} />
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Application details */}
      <Box
        bg="white"
        p="xl"
        style={{
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Text fontSize="lg" fontWeight="600" color="grey100" mb="lg">
          Application Details
        </Text>

        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          <Field label="Application ID" value={params.id || record?.id} monospace />
          <Field label="Reference No" value={params.reference_no} />
          <Field label="Loan Amount" value={params.loan_amount} />
          <Field label="Tenure Months" value={params.tenure_months} />
          <Field label="Interest Rate" value={params.interest_rate} />
          <Field label="Purpose" value={params.loan_purpose} />
          <Box>
            <Label
              style={{
                marginBottom: "6px",
                fontSize: "12px",
                color: "#718096",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Status
            </Label>
            {params.status ? (
              <Badge variant="default">
                {startCase(String(params.status))}
              </Badge>
            ) : (
              <Badge variant="default">N/A</Badge>
            )}
          </Box>
          <Field label="Remarks" value={params.remarks} />
          <Field label="Action Date" value={formatDateTime(params.action_date)} />
          <Field label="Created At" value={formatDateTime(params.created_at)} />
          <Field label="Updated At" value={formatDateTime(params.updated_at)} />
        </Box>
      </Box>
    </Box>
  );
};

export default LendLyxApplicationDetails;


