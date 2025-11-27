import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  DatePicker,
  Input,
  Label,
  Section,
  Text,
  Loader,
  Badge,
  Header,
} from "@adminjs/design-system";
import { ApiClient, useNotice } from "adminjs";
import { useNavigate } from "react-router-dom";
import ClaimDocuments from "./claim-documents";

const ReviewClaim = (props) => {
  const { record, resource } = props;
  const api = new ApiClient();
  const sendNotice = useNotice();
  const navigate = useNavigate();

  const currentStatus = record.params.status;
  const isFinalized =
    currentStatus === "approved" || currentStatus === "rejected";

  const [claimedAmount, setClaimedAmount] = useState(
    record.params.claimed_amount || ""
  );
  const [approvedAmount, setApprovedAmount] = useState(
    record.params.approved_amount || ""
  );
  const [paymentDate, setPaymentDate] = useState(
    record.params.payment_date ? new Date(record.params.payment_date) : null
  );
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  // Fetch documents when component mounts
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setDocumentsLoading(true);
        const response = await api.resourceAction({
          resourceId: "documents",
          actionName: "list",
          params: {
            "filters.claims": record.params.id,
          },
        });

        if (response.data && response.data.records) {
          setDocuments(response.data.records.map((r) => r.params));
        }
      } catch (error) {
        sendNotice({ message: "Error loading documents", type: "error" });
      } finally {
        setDocumentsLoading(false);
      }
    };

    fetchDocuments();
  }, [record.params.id]);

  const handleAction = async (action) => {
    if (action === "approve") {
      if (!paymentDate) {
        sendNotice({
          message: "Payment date is required for approval",
          type: "error",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        actionType: action,
        claimed_amount: claimedAmount,
        approved_amount: approvedAmount,
        payment_date: paymentDate,
      };

      const response = await api.recordAction({
        resourceId: resource.id,
        recordId: record.id,
        actionName: "reviewClaim",
        data: payload,
      });

      if (response.data.notice) {
        sendNotice(response.data.notice);
      }

      if (response.data.redirectUrl) {
        navigate(response.data.redirectUrl);
      }
    } catch (error) {
      sendNotice({ message: "Error updating claim", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fieldsToDisplay = [
    { label: "ID", value: record.params.id },
    { label: "Claim Number", value: record.params.claim_number },
    { label: "Claim Type", value: record.params.claim_type },
    { label: "Claimant Name", value: record.params.claimant_name },
    { label: "IC Number", value: record.params.ic_number },
    { label: "Policy Number", value: record.params.policy_number },
    { label: "Incident Date", value: record.params.incident_date },
    { label: "Incident Location", value: record.params.incident_location },
    {
      label: "Incident Description",
      value: record.params.incident_description,
    },
    { label: "Submission Date", value: record.params.created_at },
  ];

  return (
    <Box variant="grey">
      <Box variant="white" p="xl">
        <Section>
          <Box flex flexWrap="wrap">
            {fieldsToDisplay.map((field, index) => (
              <Box
                key={field.label}
                width={1 / 2}
                mb={index >= fieldsToDisplay.length - 2 ? "" : "lg"}
                pr="lg"
              >
                <Label>{field.label}</Label>
                <Text>{field.value || "-"}</Text>
              </Box>
            ))}
          </Box>
        </Section>

        <Section mt="xl">
          {documentsLoading ? (
            <Box display="flex" justifyContent="center" p="xl">
              <Loader />
            </Box>
          ) : (
            <ClaimDocuments
              record={record}
              where="review"
              documents={documents}
            />
          )}
        </Section>

        {isFinalized ? (
          <Section mt="xl">
            <Header.H5 style={{ marginBottom: "1.5rem" }}>
              Claim Status
            </Header.H5>
            <Box>
              <Badge
                variant={currentStatus === "approved" ? "success" : "danger"}
                size="large"
              >
                {currentStatus.toUpperCase()}
              </Badge>
              <Text mt="default" color="grey60">
                This claim has already been {currentStatus}. No further action
                is required.
              </Text>
              {currentStatus === "approved" && (
                <Box mt="lg">
                  <Label>Approved Amount</Label>
                  <Text>{record.params.approved_amount || "-"}</Text>
                  <Label mt="default">Payment Date</Label>
                  <Text>{record.params.payment_date || "-"}</Text>
                  <Label mt="default">Approval Date</Label>
                  <Text>{record.params.approval_date || "-"}</Text>
                </Box>
              )}
            </Box>
          </Section>
        ) : (
          <>
            <Box width={1 / 2}>
              <Box my="xl">
                <Label>Claimed Amount</Label>
                <Input
                  width="100%"
                  value={claimedAmount}
                  onChange={(e) => setClaimedAmount(e.target.value)}
                  type="number"
                />
              </Box>
              <Box mb="xl">
                <Label>Approved Amount (Required for Approval)</Label>
                <Input
                  width="100%"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  type="number"
                />
              </Box>
              <Box mb="xl">
                <Label>Payment Date (Required for Approval)</Label>
                <DatePicker
                  value={paymentDate}
                  onChange={(date) => setPaymentDate(date)}
                />
              </Box>
            </Box>

            <Box flex style={{ gap: "1rem" }}>
              <Button
                variant="primary"
                onClick={() => handleAction("approve")}
                disabled={loading}
              >
                {loading ? <Loader /> : "Approve"}
              </Button>
              <Button
                variant="danger"
                onClick={() => handleAction("reject")}
                disabled={loading}
              >
                {loading ? <Loader /> : "Reject"}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ReviewClaim;
