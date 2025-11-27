import React, { useEffect, useState } from "react";
import { Box, Header, Label, Link, Loader, Text } from "@adminjs/design-system";
import { ApiClient } from "adminjs";
import FileUrlDisplay from "./file-url-display";

const api = new ApiClient();

const ClaimDocuments = (props) => {
  const { record, where, documents: propDocuments } = props;
  const [documents, setDocuments] = useState(propDocuments || []);
  const [loading, setLoading] = useState(!propDocuments);

  useEffect(() => {
    if (propDocuments) {
      setDocuments(propDocuments);
      setLoading(false);
      return;
    }

    const fetchDocuments = async () => {
      if (!record?.params?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
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
        console.error("Error loading documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [propDocuments, record]);

  if (loading) {
    return <Loader />;
  }

  if (!documents || documents.length === 0) {
    return <Text>No documents found</Text>;
  }

  const renderOcrData = (ocrData, depth = 0) => {
    if (!ocrData) return <Text>-</Text>;

    let data = ocrData;
    // Check if it's a string and try to parse it
    if (typeof ocrData === "string") {
      try {
        data = JSON.parse(ocrData);
      } catch (e) {
        // If parsing fails, display the string with proper overflow handling
        return (
          <Text
            style={{
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              maxWidth: "100%",
            }}
            title={ocrData}
          >
            {ocrData}
          </Text>
        );
      }
    }

    if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
      return <Text>-</Text>;
    }

    // Helper to render a value (handles nested objects/arrays recursively)
    const renderValue = (value, currentDepth = 0) => {
      if (value === null || value === undefined) {
        return <Text style={{ color: "#999", fontSize: "12px" }}>-</Text>;
      }

      if (Array.isArray(value)) {
        if (value.length === 0) {
          return <Text style={{ color: "#999", fontSize: "12px" }}>[]</Text>;
        }

        // Check if array contains objects (that are not null)
        const containsObjects = value.some(
          (item) => typeof item === "object" && item !== null
        );

        if (containsObjects) {
          return (
            <Box>
              {value.map((item, index) => (
                <Box key={index} mb={index === value.length - 1 ? "" : "sm"}>
                  {renderValue(item, currentDepth + 1)}
                </Box>
              ))}
            </Box>
          );
        }

        // Always display arrays as comma-separated values
        const displayValue = value
          .map((item) => {
            if (item === null || item === undefined) return "-";
            if (typeof item === "object") return JSON.stringify(item);
            return String(item);
          })
          .join(", ");

        const isTruncated = displayValue.length > 200;
        const truncatedValue = isTruncated
          ? `${displayValue.substring(0, 200)}...`
          : displayValue;

        return (
          <Text
            style={{
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              fontSize: "12px",
              lineHeight: "1.4",
            }}
            title={displayValue}
          >
            {truncatedValue}
          </Text>
        );
      }

      if (typeof value === "object") {
        return renderNestedObject(value, currentDepth);
      }

      if (typeof value === "boolean") {
        return (
          <Text
            style={{ color: value ? "#28a745" : "#dc3545", fontSize: "12px" }}
          >
            {value ? "Yes" : "No"}
          </Text>
        );
      }

      // For primitive values - handle long strings with proper overflow
      const stringValue = String(value);
      const isLongText = stringValue.length > 200;
      const isUrl =
        stringValue.startsWith("http://") || stringValue.startsWith("https://");

      if (isUrl) {
        const truncatedUrl =
          stringValue.length > 60
            ? `${stringValue.substring(0, 60)}...`
            : stringValue;

        return (
          <a
            href={stringValue}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "rgb(48, 64, 214)",
              textDecoration: "underline",
              wordBreak: "break-all",
              display: "inline-block",
              maxWidth: "100%",
              fontSize: "12px",
            }}
            title={stringValue}
          >
            {truncatedUrl}
          </a>
        );
      }

      if (isLongText) {
        const truncatedValue = `${stringValue.substring(0, 200)}...`;
        return (
          <Text
            style={{
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              whiteSpace: "pre-wrap",
              fontSize: "12px",
              lineHeight: "1.4",
            }}
            title={stringValue}
          >
            {truncatedValue}
          </Text>
        );
      }

      return (
        <Text
          style={{
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            whiteSpace: "pre-wrap",
            fontSize: "12px",
            lineHeight: "1.4",
          }}
        >
          {stringValue}
        </Text>
      );
    };

    // Helper to render nested objects as tables
    const renderNestedObject = (obj, currentDepth = 0) => {
      if (!obj || Object.keys(obj).length === 0) {
        return <Text style={{ color: "#999", fontSize: "12px" }}>-</Text>;
      }

      // Filter out 'url' and 'type' fields at the top level
      const filteredEntries = Object.entries(obj).filter(([key]) => {
        if (currentDepth === 0 && (key === "url" || key === "type")) {
          return false;
        }
        return true;
      });

      if (filteredEntries.length === 0) {
        return <Text style={{ color: "#999", fontSize: "12px" }}>-</Text>;
      }

      return (
        <div style={{ overflow: "auto", maxWidth: "100%" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: currentDepth === 0 ? "6px" : "3px",
              fontSize: "12px",
              tableLayout: "fixed",
            }}
          >
            <tbody>
              {filteredEntries.map(([key, value], index) => (
                <tr
                  key={key}
                  style={{
                    borderBottom:
                      index === filteredEntries.length - 1
                        ? "none"
                        : "1px solid #e9ecef",
                  }}
                >
                  <td
                    style={{
                      padding: "8px 6px",
                      fontWeight: "600",
                      color: "#495057",
                      width: "20%",
                      verticalAlign: "top",
                      textTransform: "capitalize",
                      wordBreak: "break-word",
                      minWidth: "100px",
                      fontSize: "12px",
                      lineHeight: "1.4",
                    }}
                  >
                    {key.replace(/_/g, " ")}
                  </td>
                  <td
                    style={{
                      verticalAlign: "top",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      fontSize: "12px",
                      lineHeight: "1.4",
                    }}
                  >
                    {renderValue(value, currentDepth + 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    // Main rendering logic
    if (Array.isArray(data)) {
      if (data.length === 0) return <Text>-</Text>;
      return renderValue(data, depth);
    }

    if (typeof data === "object") {
      return renderNestedObject(data, depth);
    }

    return <Text>{String(data)}</Text>;
  };

  // Convert documents to the format expected by FileUrlDisplay
  // Handle both nested and flattened ocr_data structures
  const documentsWithParams = documents.map((doc) => {
    // Check if we have params already (from props) or need to construct it
    if (doc.params) {
      return {
        id: doc.id,
        params: doc.params,
      };
    }

    // Reconstruct ocr_data if it's flattened
    let ocrData = doc.ocr_data;

    // If ocr_data is not an object or is null, try to reconstruct from flattened properties
    if (!ocrData || typeof ocrData !== "object") {
      // Check if we have flattened properties (common in AdminJS)
      const flattenedKeys = Object.keys(doc).filter((key) =>
        key.startsWith("ocr_data.")
      );

      if (flattenedKeys.length > 0) {
        ocrData = {};
        flattenedKeys.forEach((key) => {
          const path = key.replace("ocr_data.", "").split(".");
          let current = ocrData;

          for (let i = 0; i < path.length - 1; i++) {
            const segment = path[i];
            const nextSegment = path[i + 1];

            // Check if next segment is a number (array index)
            const isNextArray = !isNaN(parseInt(nextSegment));

            if (!current[segment]) {
              // Create array if next segment is numeric, otherwise create object
              current[segment] = isNextArray ? [] : {};
            }
            current = current[segment];
          }

          const lastSegment = path[path.length - 1];
          current[lastSegment] = doc[key];
        });

        // Convert objects with numeric keys to arrays
        const convertToArrays = (obj) => {
          if (typeof obj !== "object" || obj === null) return obj;

          // Check if object has only numeric keys
          const keys = Object.keys(obj);
          const isArrayLike =
            keys.length > 0 && keys.every((k) => !isNaN(parseInt(k)));

          if (isArrayLike) {
            // Convert to array
            const arr = [];
            keys.forEach((k) => {
              arr[parseInt(k)] = convertToArrays(obj[k]);
            });
            return arr;
          }

          // Recursively process nested objects
          const result = {};
          for (const [key, value] of Object.entries(obj)) {
            result[key] = convertToArrays(value);
          }
          return result;
        };

        ocrData = convertToArrays(ocrData);
      }
    }

    return {
      id: doc.id,
      params: {
        file_url: doc.file_url,
        file_name: doc.file_name,
        ocr_data: ocrData,
        document_type: doc.document_type,
      },
    };
  });

  return (
    <Box style={{ maxWidth: "100%", overflow: "hidden" }}>
      <Header.H5 style={{ marginBottom: "1.5rem" }}>
        Documents ({documentsWithParams.length})
      </Header.H5>
      {documentsWithParams.map((doc, index) => (
        <Box
          key={doc.id}
          mb={index === documentsWithParams.length - 1 ? "" : "xxl"}
          p="lg"
          style={{
            borderLeft: "3px solid #4C6FFF",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          {/* Document Header */}
          <Box
            mb="default"
            flex
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            style={{ gap: "12px" }}
          >
            <Box mb="lg" style={{ minWidth: 0, flex: "1 1 auto" }}>
              <Label variant="light">Id</Label>
              <Link
                href={`/admin/resources/documents/records/${doc.id}/show`}
                style={{
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={doc.id}
              >
                {doc.id}
              </Link>
            </Box>
            {doc.params.document_type && (
              <Box
                style={{
                  padding: "4px 12px",
                  backgroundColor: "#4C6FFF",
                  color: "white",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                }}
              >
                {doc.params.document_type.replace(/_/g, " ")}
              </Box>
            )}
          </Box>

          {/* File URL Display */}
          <Box mb="lg">
            <FileUrlDisplay record={doc} where={"show"} />
          </Box>

          {/* OCR Data */}
          <Box>
            <Label variant="light" mb="default">
              OCR Data
            </Label>
            {renderOcrData(doc.params.ocr_data)}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default ClaimDocuments;
