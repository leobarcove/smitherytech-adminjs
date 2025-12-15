import { useEffect, useState } from "react";
import {
  Box,
  Text,
  Loader,
  Button,
  Modal,
  Label,
  Input,
  Icon,
} from "@adminjs/design-system";
import { useNotice } from "adminjs";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { projectConfig } from "../config/project.js";

const colorPrimary =
  projectConfig?.branding?.theme?.colors?.primary100 || "#3040D6";

const CalendarView = (props) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleDuration, setRescheduleDuration] = useState(60); // minutes
  const [availabilityStatus, setAvailabilityStatus] = useState(null); // 'available', 'conflict', null
  const addNotice = useNotice();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/admin/api/slotiva/appointments");
      const data = await response.json();

      if (data.success) {
        setEvents(data.appointments || []);
      } else {
        addNotice({
          message: "Failed to load appointments",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      addNotice({
        message: "Error loading appointments",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (info) => {
    const event = info.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      ...event.extendedProps,
    });
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: { bg: "#10B981", border: "#059669" },
      cancelled: { bg: "#EF4444", border: "#DC2626" },
      completed: { bg: "#3B82F6", border: "#2563EB" },
      pending: { bg: "#F59E0B", border: "#D97706" },
    };
    return colors[status] || { bg: "#6B7280", border: "#4B5563" };
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (showRescheduleModal && rescheduleDate && rescheduleTime) {
      checkAvailability();
    } else {
      setAvailabilityStatus(null);
    }
  }, [rescheduleDate, rescheduleTime]);

  const handleRescheduleClick = () => {
    if (!selectedEvent) return;

    const startDate = new Date(selectedEvent.start);
    const endDate = new Date(selectedEvent.end);
    const durationMinutes = (endDate - startDate) / (1000 * 60);

    setRescheduleDuration(durationMinutes);
    setRescheduleDate(startDate.toISOString().split("T")[0]);
    setRescheduleTime(startDate.toTimeString().split(" ")[0].substring(0, 5));

    setShowModal(false);
    setShowRescheduleModal(true);
  };

  const checkAvailability = () => {
    if (!rescheduleDate || !rescheduleTime) return;

    const start = new Date(`${rescheduleDate}T${rescheduleTime}`);
    const end = new Date(start.getTime() + rescheduleDuration * 60000);

    const hasConflict = events.some((event) => {
      if (event.id === selectedEvent.id) return false; // Ignore current event
      if (event.status === "cancelled") return false;

      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      return start < eventEnd && end > eventStart;
    });

    setAvailabilityStatus(hasConflict ? "conflict" : "available");
  };

  const confirmReschedule = async () => {
    try {
      const newStart = new Date(`${rescheduleDate}T${rescheduleTime}`);
      const newEnd = new Date(newStart.getTime() + rescheduleDuration * 60000);

      const response = await fetch(
        `/admin/api/slotiva/appointments/${
          selectedEvent.id || selectedEvent.bookingId
        }`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        addNotice({
          message: "Appointment rescheduled successfully",
          type: "success",
        });
        setShowRescheduleModal(false);
        fetchAppointments();
      } else {
        addNotice({
          message: data.message || "Failed to reschedule appointment",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      addNotice({
        message: "Error rescheduling appointment",
        type: "error",
      });
    }
  };

  const handleCancel = () => {
    if (!selectedEvent) return;
    setShowModal(false);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    console.log(selectedEvent);
    if (!selectedEvent) return;

    try {
      const response = await fetch(
        `/admin/api/slotiva/appointments/${
          selectedEvent.id || selectedEvent.bookingId
        }/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        addNotice({
          message: "Appointment cancelled successfully",
          type: "success",
        });
        setShowCancelModal(false);
        fetchAppointments(); // Refresh the calendar
      } else {
        addNotice({
          message: data.message || "Failed to cancel appointment",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      addNotice({
        message: "Error cancelling appointment",
        type: "error",
      });
    }
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
    <Box
      style={{
        padding: "20px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <Box
        bg="white"
        p="lg"
        mb="lg"
        style={{
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Box flex alignItems="center" justifyContent="space-between">
          <Box>
            <Text fontSize="xl" fontWeight="600" color="grey100">
              Appointment Calendar
            </Text>
            <Text fontSize="sm" color="grey60" style={{ marginTop: "4px" }}>
              {events.length} appointment{events.length !== 1 ? "s" : ""}{" "}
              scheduled
            </Text>
          </Box>
          <Button onClick={fetchAppointments} variant="primary" size="sm">
            Refresh
          </Button>
        </Box>

        {/* Legend */}
        <Box
          flex
          style={{
            gap: "16px",
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <Box flex alignItems="center" style={{ gap: "6px" }}>
            <Box
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                backgroundColor: "#10B981",
              }}
            />
            <Text fontSize="sm" color="grey60">
              Confirmed
            </Text>
          </Box>
          <Box flex alignItems="center" style={{ gap: "6px" }}>
            <Box
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                backgroundColor: "#EF4444",
              }}
            />
            <Text fontSize="sm" color="grey60">
              Cancelled
            </Text>
          </Box>
          <Box flex alignItems="center" style={{ gap: "6px" }}>
            <Box
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                backgroundColor: "#3B82F6",
              }}
            />
            <Text fontSize="sm" color="grey60">
              Completed
            </Text>
          </Box>
          <Box flex alignItems="center" style={{ gap: "6px" }}>
            <Box
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                backgroundColor: "#F59E0B",
              }}
            />
            <Text fontSize="sm" color="grey60">
              Pending
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Calendar */}
      <Box
        bg="white"
        p="lg"
        style={{
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          eventClick={handleEventClick}
          height="auto"
          eventDisplay="block"
          displayEventTime={true}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: "short",
          }}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          nowIndicator={true}
          eventContent={(arg) => {
            return (
              <Box style={{ padding: "2px 4px", overflow: "hidden" }}>
                <Text
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "white",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {arg.timeText && (
                    <span style={{ marginRight: "4px" }}>{arg.timeText}</span>
                  )}
                  {arg.event.title}
                </Text>
              </Box>
            );
          }}
        />
      </Box>

      {/* Event Details Modal */}
      {showModal && selectedEvent && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Appointment Details"
        >
          <Box p="lg">
            <Box style={{ display: "grid", gap: "16px" }}>
              {/* Booking ID */}
              <Box>
                <Label
                  style={{
                    marginBottom: "4px",
                    fontSize: "12px",
                    color: "#718096",
                  }}
                >
                  Booking ID
                </Label>
                <Text fontWeight="600">{selectedEvent.bookingId || "N/A"}</Text>
              </Box>

              {/* Client Name */}
              <Box>
                <Label
                  style={{
                    marginBottom: "4px",
                    fontSize: "12px",
                    color: "#718096",
                  }}
                >
                  Client Name
                </Label>
                <Text fontWeight="600">
                  {selectedEvent.clientName || "N/A"}
                </Text>
              </Box>

              {/* Contact Information */}
              <Box
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <Box>
                  <Label
                    style={{
                      marginBottom: "4px",
                      fontSize: "12px",
                      color: "#718096",
                    }}
                  >
                    Phone
                  </Label>
                  <Text>{selectedEvent.phone || "N/A"}</Text>
                </Box>
                <Box>
                  <Label
                    style={{
                      marginBottom: "4px",
                      fontSize: "12px",
                      color: "#718096",
                    }}
                  >
                    Email
                  </Label>
                  <Text>{selectedEvent.email || "N/A"}</Text>
                </Box>
              </Box>

              {/* Service Type */}
              <Box>
                <Label
                  style={{
                    marginBottom: "4px",
                    fontSize: "12px",
                    color: "#718096",
                  }}
                >
                  Service Type
                </Label>
                <Text>{selectedEvent.serviceType || "N/A"}</Text>
              </Box>

              {/* Date & Time */}
              <Box
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <Box>
                  <Label
                    style={{
                      marginBottom: "4px",
                      fontSize: "12px",
                      color: "#718096",
                    }}
                  >
                    Start Time
                  </Label>
                  <Text>{formatDateTime(selectedEvent.start)}</Text>
                </Box>
                <Box>
                  <Label
                    style={{
                      marginBottom: "4px",
                      fontSize: "12px",
                      color: "#718096",
                    }}
                  >
                    End Time
                  </Label>
                  <Text>{formatDateTime(selectedEvent.end)}</Text>
                </Box>
              </Box>

              {/* Status */}
              <Box>
                <Label
                  style={{
                    marginBottom: "4px",
                    fontSize: "12px",
                    color: "#718096",
                  }}
                >
                  Status
                </Label>
                <Box
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    backgroundColor: getStatusColor(selectedEvent.status).bg,
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {selectedEvent.status || "N/A"}
                </Box>
              </Box>

              {/* Notes */}
              {selectedEvent.notes && (
                <Box>
                  <Label
                    style={{
                      marginBottom: "4px",
                      fontSize: "12px",
                      color: "#718096",
                    }}
                  >
                    Notes
                  </Label>
                  <Text style={{ whiteSpace: "pre-wrap" }}>
                    {selectedEvent.notes}
                  </Text>
                </Box>
              )}
            </Box>

            {/* Actions */}
            <Box
              flex
              justifyContent="flex-end"
              style={{ gap: "8px", marginTop: "24px" }}
            >
              <Button
                onClick={handleCancel}
                variant="danger"
                disabled={
                  selectedEvent?.status === "cancelled" ||
                  selectedEvent?.status === "completed"
                }
              >
                Cancel
              </Button>
              <Button
                onClick={handleRescheduleClick}
                variant="primary"
                disabled={
                  selectedEvent?.status === "cancelled" ||
                  selectedEvent?.status === "completed"
                }
              >
                Reschedule
              </Button>
            </Box>
          </Box>
        </Modal>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedEvent && (
        <Modal
          isOpen={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          title="Reschedule Appointment"
        >
          <Box p="lg">
            <Box
              mb="xl"
              p="default"
              bg="grey20"
              style={{ borderRadius: "4px" }}
            >
              <Label style={{ marginBottom: "8px" }}>Current Appointment</Label>
              <Text fontSize="sm" color="grey80">
                {formatDateTime(selectedEvent.start)} -{" "}
                {formatDateTime(selectedEvent.end)}
              </Text>
              <Text fontSize="xs" color="grey60" mt="sm">
                ({selectedEvent.serviceType || "Service"})
              </Text>
            </Box>

            <Box style={{ borderTop: "1px solid #e2e8f0", margin: "16px 0" }} />

            <Box style={{ display: "grid", gap: "16px" }}>
              <Box>
                <Label required>New Date</Label>
                <Input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  width="100%"
                />
              </Box>

              <Box>
                <Label required>New Time</Label>
                <Box flex alignItems="center" style={{ gap: "12px" }}>
                  <Input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    width="100%"
                  />
                  <Text
                    style={{
                      whiteSpace: "nowrap",
                      fontSize: "13px",
                      color: "#718096",
                    }}
                  >
                    ({Math.floor(rescheduleDuration)} mins)
                  </Text>
                </Box>
              </Box>

              {availabilityStatus && (
                <Box
                  p="default"
                  bg={
                    availabilityStatus === "available" ? "success20" : "error20"
                  }
                  style={{
                    borderRadius: "4px",
                    border: `1px solid ${
                      availabilityStatus === "available" ? "#10B981" : "#EF4444"
                    }`,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Box
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor:
                        availabilityStatus === "available"
                          ? "#10B981"
                          : "#EF4444",
                    }}
                  />
                  <Text
                    color={
                      availabilityStatus === "available"
                        ? "success100"
                        : "error100"
                    }
                    fontWeight="500"
                  >
                    {availabilityStatus === "available"
                      ? "✓ Slot is available"
                      : "⚠ Conflict: Slot is not available"}
                  </Text>
                </Box>
              )}
            </Box>

            <Box
              flex
              justifyContent="flex-end"
              style={{ gap: "8px", marginTop: "24px" }}
            >
              <Button
                onClick={() => setShowRescheduleModal(false)}
                variant="light"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmReschedule}
                variant="primary"
                disabled={
                  !availabilityStatus || availabilityStatus === "conflict"
                }
              >
                Confirm Reschedule
              </Button>
            </Box>
          </Box>
        </Modal>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedEvent && (
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="⚠️ Cancel Appointment?"
        >
          <Box p="lg">
            <Box
              mb="xl"
              p="default"
              bg="grey20"
              style={{ borderRadius: "4px" }}
            >
              <Box
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "8px 24px",
                }}
              >
                <Text color="grey60" fontSize="sm">
                  Client:
                </Text>
                <Text fontWeight="600" fontSize="sm">
                  {selectedEvent.clientName}
                </Text>

                <Text color="grey60" fontSize="sm">
                  Time:
                </Text>
                <Text fontWeight="600" fontSize="sm">
                  {new Date(selectedEvent.start).toLocaleString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Text>

                <Text color="grey60" fontSize="sm">
                  Service:
                </Text>
                <Text fontWeight="600" fontSize="sm">
                  {selectedEvent.serviceType || "Consultation"}
                </Text>
              </Box>
            </Box>

            <Box mb="xl">
              <Text mb="md" fontWeight="600">
                This action will:
              </Text>
              <Box style={{ display: "grid", gap: "8px" }}>
                <Box flex alignItems="center" style={{ gap: "8px" }}>
                  <Icon icon="Check" color="success" />
                  <Text fontSize="sm">Change status to "Cancelled"</Text>
                </Box>
                <Box flex alignItems="center" style={{ gap: "8px" }}>
                  <Icon icon="Check" color="success" />
                  <Text fontSize="sm">Free up the time slot</Text>
                </Box>
                <Box flex alignItems="center" style={{ gap: "8px" }}>
                  <Icon icon="Check" color="success" />
                  <Text fontSize="sm">Send cancellation email to client</Text>
                </Box>
              </Box>
            </Box>

            <Box
              flex
              justifyContent="flex-end"
              style={{ gap: "8px", marginTop: "24px" }}
            >
              <Button onClick={() => setShowCancelModal(false)} variant="light">
                No
              </Button>
              <Button onClick={confirmCancel} variant="danger">
                Yes, Cancel
              </Button>
            </Box>
          </Box>
        </Modal>
      )}

      {/* Custom Styles */}
      <style>{`
        .fc {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .fc .fc-button {
          background-color: ${colorPrimary + "ee"};
          border-color: ${colorPrimary + "ee"};
          text-transform: capitalize;
          font-weight: 500;
        }
        .fc .fc-button:hover {
          background-color: ${colorPrimary + "cc"};
          border-color: ${colorPrimary + "cc"};
        }
        .fc .fc-button-active {
          background-color: ${colorPrimary + "ee"};
          border-color: ${colorPrimary + "ee"};
        }
        .fc .fc-button:focus {
          box-shadow: 0 0 0 0.2rem rgba(76, 111, 255, 0.25);
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: #e2e8f0;
        }
        .fc-theme-standard .fc-scrollgrid {
          border-color: #e2e8f0;
        }
        .fc .fc-col-header-cell {
          background-color: #f7fafc;
          font-weight: 600;
          color: #2d3748;
          padding: 12px 0;
        }
        .fc .fc-daygrid-day-number {
          color: #2d3748;
          font-weight: 500;
          padding: 8px;
        }
        .fc .fc-day-today {
          background-color: #ebf8ff !important;
        }
        .fc-event {
          cursor: pointer;
          border-radius: 4px;
          border: none;
          padding: 2px;
        }
        .fc-event:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .fc-timegrid-slot {
          height: 3em;
        }
        .fc-timegrid-event {
          border-radius: 4px;
        }
      `}</style>
    </Box>
  );
};

export default CalendarView;
