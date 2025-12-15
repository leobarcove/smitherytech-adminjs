import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Input,
  Label,
  Section,
  Text,
  Loader,
  Badge,
  Header,
  TextArea,
} from "@adminjs/design-system";
import { ApiClient, useNotice } from "adminjs";
import { useNavigate } from "react-router-dom";
import LoanDocuments from "./loan-documents";

const api = new ApiClient();

const ReviewLoan = (props) => {
  const { record, resource } = props;
  const sendNotice = useNotice();
  const navigate = useNavigate();

  const currentStatus = record.params.status;
  const isFinalized =
    currentStatus === "approved" || currentStatus === "rejected";

  const [tenureMonths, setTenureMonths] = useState(
    record.params.tenure_months || ""
  );
  const [interestRate, setInterestRate] = useState(
    record.params.interest_rate || ""
  );
  const [remarks, setRemarks] = useState(record.params.remarks || "");
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  // Fetch documents when component mounts
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setDocumentsLoading(true);
        const response = await api.resourceAction({
          resourceId: "lend_lyx_documents",
          actionName: "list",
          params: {
            "filters.lend_lyx_applications": record.params.id,
          },
        });

        if (response.data && response.data.records) {
          // Filter documents with non-empty ocr_data
          const docsWithOcr = response.data.records.map((r) => r.params);
          // .filter((doc) => {
          //   if (!doc.ocr_data) return false;
          //   if (typeof doc.ocr_data === "string") {
          //     try {
          //       const parsed = JSON.parse(doc.ocr_data);
          //       return parsed && Object.keys(parsed).length > 0;
          //     } catch {
          //       return doc.ocr_data.trim().length > 0;
          //     }
          //   }
          //   return (
          //     typeof doc.ocr_data === "object" &&
          //     Object.keys(doc.ocr_data).length > 0
          //   );
          // });
          setDocuments(docsWithOcr);
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
    // Validate required fields
    if (!remarks || remarks.trim() === "") {
      sendNotice({
        message: "Remarks are required",
        type: "error",
      });
      return;
    }

    if (action === "approve") {
      if (!tenureMonths || !interestRate) {
        sendNotice({
          message: "Tenure months and interest rate are required for approval",
          type: "error",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        actionType: action,
        tenure_months: tenureMonths,
        interest_rate: interestRate,
        remarks: remarks,
      };

      const response = await fetch(
        `/admin/api/lendlyx/applications/${record.id}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.success) {
        sendNotice({
          message: data.message,
          type: "success",
        });
        navigate(`/admin/resources/lend_lyx_applications`);
      } else {
        sendNotice({
          message: data.error || "Error updating loan application",
          type: "error",
        });
      }
    } catch (error) {
      sendNotice({ message: "Error updating loan application", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fieldsToDisplay = [
    { label: "ID", value: record.params.id },
    { label: "Reference No", value: record.params.reference_no },
    { label: "Loan Amount", value: record.params.loan_amount },
    { label: "Tenure Months", value: record.params.tenure_months },
    { label: "Interest Rate", value: record.params.interest_rate },
    { label: "Status", value: record.params.status },
    { label: "Purpose", value: record.params.loan_purpose },
    { label: "Submission Date", value: record.params.created_at },
  ];

  return (
    <Box variant="grey">
      <Box variant="white" p="xl">
        <Section>
          <Header.H5 style={{ marginBottom: "1.5rem" }}>
            Loan Information
          </Header.H5>
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
            <LoanDocuments
              record={record}
              where="review"
              documents={documents}
            />
          )}
        </Section>

        {isFinalized ? (
          <Section mt="xl">
            <Header.H5 style={{ marginBottom: "1.5rem" }}>
              Loan Status
            </Header.H5>
            <Box>
              <Badge
                variant={currentStatus === "approved" ? "success" : "danger"}
                size="large"
              >
                {currentStatus.toUpperCase()}
              </Badge>
              <Text mt="default" color="grey60">
                This application has already been {currentStatus}.
              </Text>
              {currentStatus === "approved" && (
                <Box mt="lg">
                  <Label>Tenure Months</Label>
                  <Text>{record.params.tenure_months || "-"}</Text>
                  <Label mt="default">Interest Rate</Label>
                  <Text>{record.params.interest_rate || "-"}</Text>
                </Box>
              )}
              {currentStatus === "rejected" && (
                <Box mt="lg">
                  <Label>Remarks</Label>
                  <Text>{record.params.remarks || "-"}</Text>
                </Box>
              )}
            </Box>
          </Section>
        ) : (
          <>
            <Box width={1 / 2}>
              <Box my="xl">
                <Label>Tenure Months (Required for Approval)</Label>
                <Input
                  width="100%"
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(e.target.value)}
                  type="number"
                  placeholder="Enter tenure in months"
                />
              </Box>
              <Box mb="xl">
                <Label>Interest Rate (Required for Approval)</Label>
                <Input
                  width="100%"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  type="number"
                  step="0.01"
                  placeholder="Enter interest rate"
                />
              </Box>
              <Box mb="xl">
                <Label>Remarks (Required)</Label>
                <TextArea
                  width="100%"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks"
                  rows={4}
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

export default ReviewLoan;
