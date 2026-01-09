import React, { useState } from "react";
import { Box, Button, Icon, Text } from "@adminjs/design-system";

const TelegramRegistrationLink = (props) => {
    const { record } = props;
    const registrationCode = record?.params?.telegram_registration_code;
    const [copied, setCopied] = useState(false);

    // The primary color from projectConfig
    const colorPrimary = "#1A365D";

    if (!registrationCode) {
        return (
            <Text italic color="grey60" fontSize="sm">
                Pending registration
            </Text>
        );
    }

    const url = `https://t.me/vistate_agent_bot?start=${registrationCode}`;

    const copyToClipboard = (e) => {
        e.stopPropagation();
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Box display="flex" alignItems="center">
            <Box
                bg="#F7FAFC"
                border="1px solid"
                borderColor="#E2E8F0"
                px="md"
                py="xs"
                borderRadius="20px"
                mr="sm"
                maxWidth="260px"
                display="flex"
                alignItems="center"
                style={{
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.02)",
                    overflow: "hidden",
                }}
            >
                <Icon icon="ExternalLink" size={14} color={colorPrimary} style={{ marginRight: '8px', flexShrink: 0 }} />
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                    <Text size="sm" color={colorPrimary} fontWeight="500">
                        {url.replace("https://", "")}
                    </Text>
                </a>
            </Box>
            <Button
                variant="light"
                size="icon"
                onClick={copyToClipboard}
                title={copied ? "Copied!" : "Copy to clipboard"}
                style={{
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    minWidth: "32px",
                    backgroundColor: copied ? "#EBFFFF" : "transparent"
                }}
            >
                <Icon
                    icon={copied ? "Check" : "Copy"}
                    size={16}
                    color={copied ? "#059669" : "grey60"}
                />
            </Button>
        </Box>
    );
};

export default TelegramRegistrationLink;
