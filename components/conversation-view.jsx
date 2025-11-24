import React, { useEffect, useState, useRef } from 'react';
import { Box, Text, Loader, Icon } from '@adminjs/design-system';
import { ApiClient, useNotice } from 'adminjs';

const api = new ApiClient();

const ConversationView = (props) => {
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
      const response = await fetch(`/admin/api/conversations/${sessionId}/messages`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages || []);
        setSession(data.session);
      } else {
        addNotice({
          message: 'Failed to load messages',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      addNotice({
        message: 'Error loading conversation',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 48) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }) + ' ' + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#10B981',
      completed: '#6B7280',
      archived: '#9CA3AF'
    };
    return colors[status] || '#6B7280';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = (e) => {
    const container = e.target;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollButton(!isAtBottom);
  };

  if (loading) {
    return (
      <Box
        flex
        justifyContent="center"
        alignItems="center"
        style={{ minHeight: '400px' }}
      >
        <Loader />
      </Box>
    );
  }

  return (
    <Box style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box
        bg="white"
        p="lg"
        borderBottom="default"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        }}
      >
        <Box flex alignItems="center" justifyContent="space-between">
          <Box>
            <Box flex alignItems="center" style={{ gap: '12px' }}>
              <Box
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#4C6FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                }}
              >
                {session?.telegram_user_id ? String(session.telegram_user_id).slice(0, 2).toUpperCase() : 'U'}
              </Box>
              <Box>
                <Text fontSize="lg" fontWeight="600" color="grey100">
                  Telegram User {session?.telegram_user_id || 'Unknown'}
                </Text>
                <Box flex alignItems="center" style={{ gap: '8px', marginTop: '4px' }}>
                  <Box
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(session?.status),
                    }}
                  />
                  <Text fontSize="sm" color="grey60">
                    {session?.status || 'Unknown'} • {messages.length} messages
                  </Text>
                </Box>
              </Box>
            </Box>
          </Box>

          {session?.created_at && (
            <Text fontSize="sm" color="grey60">
              Started {formatDate(session.created_at)}
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
          maxWidth: '1200px',
          margin: '0 auto',
          maxHeight: 'calc(100vh - 250px)',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        {messages.length === 0 ? (
          <Box
            flex
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            style={{ minHeight: '400px', gap: '16px' }}
          >
            <Icon icon="MessageCircle" color="grey40" style={{ fontSize: '64px' }} />
            <Text fontSize="lg" color="grey60">
              No messages in this conversation yet
            </Text>
          </Box>
        ) : (
          <Box flex flexDirection="column" style={{ gap: '12px' }}>
            {messages.map((message, index) => {
              // Determine if message is from bot and extract content
              let messageContent = message.content;
              let isBot = false;

              // Check if content is already an object with a message field
              if (typeof message.content === 'object' && message.content !== null && message.content.message) {
                messageContent = message.content.message;
                isBot = true;
              }
              // Check if content is a JSON string
              else if (typeof message.content === 'string') {
                // First check if it looks like JSON (starts with '{')
                if (message.content.trim().startsWith('{')) {
                  try {
                    const parsed = JSON.parse(message.content);
                    if (parsed && parsed.message) {
                      messageContent = parsed.message;
                      isBot = true;
                    }
                  } catch (e) {
                    // JSON parsing failed, treat as plain text user message
                    messageContent = message.content;
                    isBot = false;
                  }
                } else {
                  // Plain text user message
                  messageContent = message.content;
                  isBot = false;
                }
              }

              return (
                <Box
                  key={message.id || index}
                  flex
                  justifyContent={isBot ? 'flex-start' : 'flex-end'}
                  style={{ width: '100%' }}
                >
                  <Box
                    style={{
                      maxWidth: '70%',
                      backgroundColor: isBot ? 'white' : '#4C6FFF',
                      borderRadius: isBot ? '0 16px 16px 16px' : '16px 0 16px 16px',
                      padding: '12px 16px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                    }}
                  >
                    {/* Message Content */}
                    <Text
                      style={{
                        color: isBot ? '#1a1a1a' : 'white',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {messageContent}
                    </Text>

                    {/* Timestamp */}
                    <Box
                      flex
                      alignItems="center"
                      justifyContent="flex-end"
                      style={{ marginTop: '6px', gap: '4px' }}
                    >
                      <Text
                        style={{
                          color: isBot ? '#9ca3af' : 'rgba(255,255,255,0.7)',
                          fontSize: '11px',
                        }}
                      >
                        {formatDate(message.created_at)}
                      </Text>

                      {/* Read receipt for user messages */}
                      {!isBot && (
                        <Box style={{ color: 'rgba(255,255,255,0.7)' }}>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                          >
                            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                          </svg>
                        </Box>
                      )}
                    </Box>
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
              position: 'fixed',
              bottom: '100px',
              right: '40px',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#4C6FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(76, 111, 255, 0.4)',
              zIndex: 1000,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(76, 111, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 111, 255, 0.4)';
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
            position: 'sticky',
            bottom: 0,
            marginTop: '24px',
          }}
        >
          <Box flex alignItems="center" justifyContent="center" style={{ gap: '24px' }}>
            <Text fontSize="sm" color="grey60">
              Session ID: {session.id}
            </Text>
            {session.last_message_at && (
              <Text fontSize="sm" color="grey60">
                Last message: {formatDate(session.last_message_at)}
              </Text>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ConversationView;
