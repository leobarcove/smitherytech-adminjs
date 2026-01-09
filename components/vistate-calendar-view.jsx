import { useEffect, useState } from "react";
import {
    Box,
    Text,
    Loader,
    Button,
    Modal,
    Label,
    Input,
    Select,
    Icon,
} from "@adminjs/design-system";
import { useNotice } from "adminjs";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { projectConfig } from "../config/project.js";
import { VISTATE_BUSINESS_HOURS } from "../resources/vistate.js";

const colorPrimary =
    projectConfig?.branding?.theme?.colors?.primary100 || "#3040D6";

const timeOptions = [];
const { startHour, endHour } = VISTATE_BUSINESS_HOURS;

for (let i = startHour; i <= endHour; i++) {
    const h = i.toString().padStart(2, '0');
    timeOptions.push({ value: `${h}:00`, label: `${h}:00` });
    if (i !== endHour) {
        timeOptions.push({ value: `${h}:30`, label: `${h}:30` });
    }
}

const VistateCalendarView = (props) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleTime, setRescheduleTime] = useState("");
    const [rescheduleDuration, setRescheduleDuration] = useState(30); // minutes default
    const [availabilityStatus, setAvailabilityStatus] = useState(null); // 'available', 'conflict', null
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [agents, setAgents] = useState([]);
    const [targetAgentId, setTargetAgentId] = useState("");
    const [showMoreActions, setShowMoreActions] = useState(false);
    const addNotice = useNotice();

    useEffect(() => {
        fetchAppointments();
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const response = await fetch("/admin/api/vistate/agents");
            const data = await response.json();
            if (data.success) {
                setAgents(data.agents.map(a => ({ value: a.id, label: a.name })));
            }
        } catch (error) {
            console.error("Error fetching agents:", error);
        }
    };

    const fetchAppointments = async () => {
        try {
            const response = await fetch("/admin/api/vistate/appointments");
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
            no_show: { bg: "#9CA3AF", border: "#4B5563" }
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
        const now = new Date();

        if (start < now) {
            setAvailabilityStatus("past");
            return;
        }

        const dayOfWeek = start.getDay();
        // Adjust for Sunday being 0 if needed, but standard JS getDay returns 0-6 (Sun-Sat)
        // VISTATE_BUSINESS_HOURS.days uses 1-6 for Mon-Sat, usually ensuring 0 is excluded
        if (!VISTATE_BUSINESS_HOURS.days.includes(dayOfWeek)) {
            setAvailabilityStatus("closed");
            return;
        }

        const hasConflict = events.some((event) => {
            if (event.id === selectedEvent.id) return false; // Ignore current event
            if (event.status === "cancelled") return false;

            // Only check conflicts for the same agent if an agent is assigned
            // If we want to check property availability too, we might need more logic
            // For now, assuming pure time slot overlap global check or agent check
            // Ideally we check if the AGENT is free.
            if (selectedEvent.agentId && event.extendedProps.agentId !== selectedEvent.agentId) {
                return false; // different agents, no conflict
            }

            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);

            return start < eventEnd && end > eventStart;
        });

        setAvailabilityStatus(hasConflict ? "conflict" : "available");
    };

    const confirmReschedule = async () => {
        try {
            const newStart = new Date(`${rescheduleDate}T${rescheduleTime}`);
            // newEnd calculated on server or via duration, but here we just send start_time usually
            // backend needs to know duration or end_time. Vistate uses duration_minutes column.

            const response = await fetch(
                `/admin/api/vistate/appointments/${selectedEvent.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        scheduled_datetime: newStart.toISOString(),
                        // duration is assumed unchanged or we could send it
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
        if (!selectedEvent) return;

        try {
            const response = await fetch(
                `/admin/api/vistate/appointments/${selectedEvent.id}/cancel`,
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

    const handleComplete = async () => {
        if (!selectedEvent) return;

        try {
            const response = await fetch(
                `/admin/api/vistate/appointments/${selectedEvent.id}/complete`,
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
                    message: "Appointment marked as completed",
                    type: "success",
                });
                setShowModal(false);
                fetchAppointments(); // Refresh the calendar
            } else {
                addNotice({
                    message: data.message || "Failed to complete appointment",
                    type: "error",
                });
            }
        } catch (error) {
            console.error("Error completing appointment:", error);
            addNotice({
                message: "Error completing appointment",
                type: "error",
            });
        }
    };

    const handleReassignClick = () => {
        if (!selectedEvent) return;
        setTargetAgentId(selectedEvent.agentId || "");
        setShowModal(false);
        setShowReassignModal(true);
    };

    const confirmReassign = async () => {
        if (!selectedEvent || !targetAgentId) return;

        try {
            const response = await fetch(
                `/admin/api/vistate/appointments/${selectedEvent.id}/reassign`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        agentId: targetAgentId,
                    }),
                }
            );

            const data = await response.json();

            if (data.success) {
                addNotice({
                    message: "Appointment reassigned successfully",
                    type: "success",
                });
                setShowReassignModal(false);
                fetchAppointments();
            } else {
                addNotice({
                    message: data.message || "Failed to reassign appointment",
                    type: "error",
                });
            }
        } catch (error) {
            console.error("Error reassigning appointment:", error);
            addNotice({
                message: "Error reassigning appointment",
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
                            Vistate Calendar
                        </Text>
                        <Text fontSize="sm" color="grey60" style={{ marginTop: "4px" }}>
                            {events.length} viewing{events.length !== 1 ? "s" : ""}{" "}
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
                            <Box style={{ padding: "2px 4px", overflow: "hidden", cursor: "pointer" }}>
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
                            {/* Booking Ref */}
                            <Box>
                                <Label
                                    style={{
                                        marginBottom: "4px",
                                        fontSize: "12px",
                                        color: "#718096",
                                    }}
                                >
                                    Booking Reference
                                </Label>
                                <Text fontWeight="600">{selectedEvent.bookingReference || "N/A"}</Text>
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

                            {/* Property */}
                            <Box>
                                <Label
                                    style={{
                                        marginBottom: "4px",
                                        fontSize: "12px",
                                        color: "#718096",
                                    }}
                                >
                                    Property
                                </Label>
                                <Text fontWeight="600">
                                    {selectedEvent.propertyTitle || "N/A"}
                                </Text>
                                <Text fontSize="xs" color="grey60">
                                    {selectedEvent.propertyAddress || "N/A"}
                                </Text>
                            </Box>

                            {/* Agent */}
                            <Box>
                                <Label
                                    style={{
                                        marginBottom: "4px",
                                        fontSize: "12px",
                                        color: "#718096",
                                    }}
                                >
                                    Assigned Agent
                                </Label>
                                <Text>{selectedEvent.agentName || "Unassigned"}</Text>
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
                            justifyContent="space-between"
                            alignItems="center"
                            style={{ marginTop: "24px" }}
                        >
                            {/* Left: Cancel */}
                            <Button
                                onClick={handleCancel}
                                variant="text"
                                color="danger"
                                disabled={
                                    selectedEvent?.status === "cancelled" ||
                                    selectedEvent?.status === "completed"
                                }
                            >
                                <Icon icon="Trash2" style={{ marginRight: '8px' }} />
                                Cancel
                            </Button>

                            {/* Right: More Actions + Complete */}
                            <Box flex style={{ gap: "8px" }}>
                                {/* More Actions Dropdown */}
                                <Box style={{ position: "relative" }}>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowMoreActions(!showMoreActions)}
                                        disabled={
                                            selectedEvent?.status === "cancelled" ||
                                            selectedEvent?.status === "completed"
                                        }
                                    >
                                        More Actions ▾
                                    </Button>

                                    {showMoreActions && (
                                        <Box
                                            style={{
                                                position: "absolute",
                                                bottom: "100%",
                                                right: 0,
                                                marginBottom: "8px",
                                                backgroundColor: "white",
                                                border: "1px solid #e2e8f0",
                                                borderRadius: "4px",
                                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                                zIndex: 10,
                                                minWidth: "180px",
                                                overflow: "hidden"
                                            }}
                                        >
                                            <Box
                                                onClick={() => {
                                                    setShowMoreActions(false);
                                                    handleReassignClick();
                                                }}
                                                style={{
                                                    padding: "12px 16px",
                                                    cursor: "pointer",
                                                    fontSize: "14px",
                                                    color: "#2D3748",
                                                    borderBottom: "1px solid #edf2f7",
                                                    transition: "background-color 0.2s"
                                                }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = "#f7fafc"}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                                            >
                                                Reassign Agent
                                            </Box>
                                            <Box
                                                onClick={() => {
                                                    setShowMoreActions(false);
                                                    handleRescheduleClick();
                                                }}
                                                style={{
                                                    padding: "12px 16px",
                                                    cursor: "pointer",
                                                    fontSize: "14px",
                                                    color: "#2D3748",
                                                    transition: "background-color 0.2s"
                                                }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = "#f7fafc"}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                                            >
                                                Reschedule
                                            </Box>
                                        </Box>
                                    )}
                                    {/* Overlay to close dropdown when clicking outside */}
                                    {showMoreActions && (
                                        <div
                                            style={{
                                                position: "fixed",
                                                top: 0,
                                                left: 0,
                                                width: "100vw",
                                                height: "100vh",
                                                zIndex: 5,
                                            }}
                                            onClick={() => setShowMoreActions(false)}
                                        />
                                    )}
                                </Box>

                                <Button
                                    onClick={handleComplete}
                                    variant="primary"
                                    disabled={
                                        selectedEvent?.status === "cancelled" ||
                                        selectedEvent?.status === "completed"
                                    }
                                >
                                    Complete
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Modal>
            )}

            {/* Reassign Modal */}
            {showReassignModal && selectedEvent && (
                <Modal
                    isOpen={showReassignModal}
                    onClose={() => setShowReassignModal(false)}
                    title="Reassign Agent"
                >
                    <Box p="lg">
                        <Box mb="xl">
                            <Text>
                                Select a new agent for the viewing with <strong>{selectedEvent.clientName}</strong> at <strong>{selectedEvent.propertyTitle}</strong>.
                            </Text>
                        </Box>
                        <Box mb="xl">
                            <Label required>Assign To</Label>
                            <Select
                                value={agents.find(a => a.value === targetAgentId)}
                                onChange={(selected) => setTargetAgentId(selected ? selected.value : "")}
                                options={agents}
                                menuPortalTarget={document.body}
                                styles={{
                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                    control: (provided) => ({ ...provided, width: "100%" }),
                                }}
                            />
                        </Box>
                        <Box flex justifyContent="flex-end" style={{ gap: "8px" }}>
                            <Button onClick={() => setShowReassignModal(false)} variant="light">
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmReassign}
                                variant="primary"
                                disabled={!targetAgentId || targetAgentId === selectedEvent.agentId}
                            >
                                Confirm Reassign
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
                                ({selectedEvent.propertyTitle || "Property"})
                            </Text>
                        </Box>

                        <Box style={{ borderTop: "1px solid #e2e8f0", margin: "16px 0" }} />

                        <Box style={{ display: "grid", gap: "16px" }}>
                            <Box>
                                <Label required>New Date</Label>
                                <Input
                                    type="date"
                                    min={new Date().toLocaleDateString('en-CA')}
                                    value={rescheduleDate}
                                    onChange={(e) => setRescheduleDate(e.target.value)}
                                    width="100%"
                                />
                            </Box>

                            <Box>
                                <Label required>New Time</Label>
                                <Box flex alignItems="center" style={{ gap: "12px" }}>
                                    <Box flexGrow={1}>
                                        <Select
                                            value={timeOptions.find((o) => o.value === rescheduleTime)}
                                            onChange={(selected) => setRescheduleTime(selected ? selected.value : "")}
                                            options={timeOptions}
                                            menuPortalTarget={document.body}
                                            styles={{
                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                control: (provided) => ({ ...provided, width: "100%" }),
                                            }}
                                        />
                                    </Box>
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
                                        border: `1px solid ${availabilityStatus === "available" ? "#10B981" : "#EF4444"
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
                                            : availabilityStatus === "past"
                                                ? "⚠ Error: Cannot select past time"
                                                : availabilityStatus === "closed"
                                                    ? "⚠ Error: Business is closed on this day"
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
                                    !availabilityStatus || availabilityStatus !== "available"
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
                                    Date:
                                </Text>
                                <Text fontWeight="600" fontSize="sm">
                                    {formatDateTime(selectedEvent.start)}
                                </Text>
                            </Box>
                        </Box>

                        <Text>Are you sure you want to cancel this appointment?</Text>
                        <Text fontSize="sm" color="grey60" mt="sm">
                            This action cannot be undone.
                        </Text>

                        <Box
                            flex
                            justifyContent="flex-end"
                            style={{ gap: "8px", marginTop: "24px" }}
                        >
                            <Button
                                onClick={() => setShowCancelModal(false)}
                                variant="light"
                            >
                                No, Keep it
                            </Button>
                            <Button onClick={confirmCancel} variant="danger">
                                Yes, Cancel Appointment
                            </Button>
                        </Box>
                    </Box>
                </Modal>
            )}
        </Box>
    );
};

export default VistateCalendarView;
