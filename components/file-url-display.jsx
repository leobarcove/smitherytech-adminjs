import React, { useState } from "react";
import { Box, Link, Text, Label } from "@adminjs/design-system";

const FileUrlDisplay = (props) => {
  const { record, property, where } = props;
  const [imageError, setImageError] = useState(false);

  const isShowView = where === "show";
  const fileUrl = record?.params?.file_url || "";
  const fileName = record?.params?.file_name || "";

  if (!fileUrl) {
    return (
      <Box>
        <Text color="grey40">No file</Text>
      </Box>
    );
  }

  // Check if the URL is an image (common image extensions)
  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".bmp",
  ];
  const isImage = imageExtensions.some((ext) =>
    fileUrl.toLowerCase().includes(ext.toLowerCase())
  );

  // Determine if we should show a thumbnail
  const showThumbnail = isImage && !imageError;

  // Render hyperlink with URL and share icon
  const renderHyperlink = () => (
    <Link
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        textDecoration: "none",
        color: "#4C6FFF",
        maxWidth: isShowView ? "100%" : "400px",
      }}
    >
      <Text
        style={{
          fontSize: "14px",
          maxWidth: isShowView ? "100%" : "150px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textDecoration: "underline",
        }}
      >
        {fileName}
      </Text>
      {/* Share/External Link Icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
      </svg>
    </Link>
  );

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginBottom: isShowView ? "24px" : "0",
      }}
    >
      {/* Label when in show view */}
      {isShowView && <Label variant="light">Document File</Label>}

      {/* Thumbnail (only for images) */}
      {showThumbnail && (
        <Link
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            textDecoration: "none",
            width: "fit-content",
          }}
        >
          <Box
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "6px",
              overflow: "hidden",
              border: "1px solid #e0e0e0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f5f5f5",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <img
              src={fileUrl}
              alt="Thumbnail"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              onError={() => {
                setImageError(true);
              }}
            />
          </Box>
        </Link>
      )}

      {/* Hyperlink (for all files) */}
      {renderHyperlink()}
    </Box>
  );
};

export default FileUrlDisplay;
