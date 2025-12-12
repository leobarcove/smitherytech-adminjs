import { useEffect, useState, useRef } from "react";
import { Box, Text, Loader, Icon } from "@adminjs/design-system";
import { useNotice } from "adminjs";

import { projectConfig } from "../config/project.js";

const colorPrimary =
  projectConfig?.branding?.theme?.colors?.primary100 || "#3040D6";

const LendLyxConversationView = (props) => {
  const { record } = props;
  const sessionId = record?.params?.id;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const addNotice = useNotice();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (sessionId) {
      fetchMessages();
    }
  }, [sessionId]);

  // Auto-scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `/admin/api/lendlyx/conversations/${sessionId}/messages`
      );
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages || []);
        setSession(data.session);
      } else {
        addNotice({
          message: "Failed to load messages",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      addNotice({
        message: "Error loading conversation",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return (
        "Yesterday " +
        date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } else {
      return (
        date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }) +
        " " +
        date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? "#10B981" : "#6B7280";
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = (e) => {
    const container = e.target;
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;
    setShowScrollButton(!isAtBottom);
  };

  if (loading) {
    return (
      <Box
        flex
        justifyContent="center"
        alignItems="center"
        style={{ minHeight: "400px" }}
      >
        <Loader />
      </Box>
    );
  }

  return (
    <Box style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      {/* Header */}
      <Box
        bg="white"
        p="lg"
        borderBottom="default"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        }}
      >
        <Box flex alignItems="center" justifyContent="space-between">
          <Box>
            <Box flex alignItems="center" style={{ gap: "12px" }}>
              <Box
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: colorPrimary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                {session?.telegram_user_name
                  ? session.telegram_user_name.slice(0, 2).toUpperCase()
                  : "U"}
              </Box>
              <Box>
                <Text fontSize="lg" fontWeight="600" color="grey100">
                  {session?.telegram_user_name || "Unknown User"}
                </Text>
                <Box
                  flex
                  alignItems="center"
                  style={{ gap: "8px", marginTop: "4px" }}
                >
                  <Box
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: getStatusColor(session?.is_active),
                    }}
                  />
                  <Text fontSize="sm" color="grey60">
                    {session?.is_active ? "Active" : "Inactive"} &nbsp;•{" "}
                    {messages.length} messages
                  </Text>
                </Box>
              </Box>
            </Box>
          </Box>

          {session?.started_at && (
            <Text fontSize="sm" color="grey60">
              Started {formatDate(session.started_at)}
            </Text>
          )}
        </Box>
      </Box>

      {/* Messages Container */}
      <Box
        ref={messagesContainerRef}
        onScroll={handleScroll}
        p="lg"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          maxHeight: "calc(100vh - 250px)",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {messages.length === 0 ? (
          <Box
            flex
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            style={{ minHeight: "400px", gap: "16px" }}
          >
            <Icon
              icon="MessageCircle"
              color="grey40"
              style={{ fontSize: "64px" }}
            />
            <Text fontSize="lg" color="grey60">
              No messages in this conversation yet
            </Text>
          </Box>
        ) : (
          <Box flex flexDirection="column" style={{ gap: "12px" }}>
            {messages.map((message, index) => {
              const isBot =
                message.role === "assistant" ||
                message.role === "system" ||
                message.role === "bot";
              const isSystem = message.role === "system";

              return (
                <Box
                  key={message.id || index}
                  flex
                  justifyContent={
                    isSystem ? "center" : isBot ? "flex-start" : "flex-end"
                  }
                  style={{ width: "100%" }}
                >
                  <Box
                    style={{
                      maxWidth: isSystem ? "90%" : "70%",
                      backgroundColor: isSystem
                        ? "#f3f4f6"
                        : isBot
                        ? "white"
                        : colorPrimary,
                      borderRadius: isSystem
                        ? "8px"
                        : isBot
                        ? "0 16px 16px 16px"
                        : "16px 0 16px 16px",
                      padding: "12px 16px",
                      boxShadow: isSystem
                        ? "none"
                        : "0 1px 2px rgba(0,0,0,0.08)",
                      border: isSystem ? "1px solid #e5e7eb" : "none",
                    }}
                  >
                    {/* Message Content */}
                    <Text
                      style={{
                        color: isSystem
                          ? "#6b7280"
                          : isBot
                          ? "#1a1a1a"
                          : "white",
                        fontSize: isSystem ? "12px" : "14px",
                        lineHeight: "1.5",
                        wordWrap: "break-word",
                        whiteSpace: "pre-wrap",
                        textAlign: isSystem ? "center" : "left",
                        fontStyle: isSystem ? "italic" : "normal",
                      }}
                    >
                      {message.content}
                    </Text>

                    {/* Timestamp relative to message created_at */}
                    {!isSystem && (
                      <Box
                        flex
                        alignItems="center"
                        justifyContent="flex-end"
                        style={{ marginTop: "6px", gap: "4px" }}
                      >
                        <Text
                          style={{
                            color: isBot ? "#9ca3af" : "rgba(255,255,255,0.7)",
                            fontSize: "11px",
                          }}
                        >
                          {formatDate(message.created_at)}
                        </Text>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
            {/* Invisible element for auto-scroll */}
            <div ref={messagesEndRef} />
          </Box>
        )}

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <Box
            onClick={scrollToBottom}
            style={{
              position: "fixed",
              bottom: "100px",
              right: "40px",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: colorPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.4)",
              zIndex: 1000,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.boxShadow =
                "0 6px 16px rgba(139, 92, 246, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(139, 92, 246, 0.4)";
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </Box>
        )}
      </Box>

      {/* Footer Info */}
      {session && (
        <Box
          bg="white"
          p="lg"
          borderTop="default"
          style={{
            position: "sticky",
            bottom: 0,
          }}
        >
          <Box
            flex
            alignItems="center"
            justifyContent="center"
            style={{ gap: "24px" }}
          >
            <Text fontSize="sm" color="grey60">
              Session ID: {session.id}
            </Text>
            {session.last_interacted_at && (
              <Text fontSize="sm" color="grey60">
                Last message: {formatDate(session.last_interacted_at)}
              </Text>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default LendLyxConversationView;
