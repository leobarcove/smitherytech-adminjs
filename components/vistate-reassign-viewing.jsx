import React, { useState, useEffect } from "react";
import { Box, Button, Text, Label, Select, Loader, Icon } from "@adminjs/design-system";
import { useNotice } from "adminjs";

const VistateReassignViewing = (props) => {
    const { record } = props;
    const [agents, setAgents] = useState([]);
    const [targetAgentId, setTargetAgentId] = useState("");
    const [loading, setLoading] = useState(false);
    const addNotice = useNotice();

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const response = await fetch("/admin/api/vistate/agents");
            const data = await response.json();
            if (data.success) {
                setAgents(data.agents.map((a) => ({ value: a.id, label: a.name })));
            }
        } catch (error) {
            console.error("Error fetching agents:", error);
        }
    };

    const handleReassign = async () => {
        if (!targetAgentId) return;
        setLoading(true);

        try {
            const response = await fetch(
                `/admin/api/vistate/appointments/${record.id}/reassign`,
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
                // Reload page to reflect changes
                window.location.reload();
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box p="xl">
            <Box flex justifyContent="space-between" alignItems="center" mb="lg">
                <Text fontSize="xl" fontWeight="bold">
                    Reassign Viewing
                </Text>
                <Button variant="text" size="icon" onClick={() => window.history.back()}>
                    <Icon icon="X" />
                </Button>
            </Box>

            <Box mb="xl" p="default" bg="grey20" style={{ borderRadius: "4px" }}>
                <Label>Booking Reference</Label>
                <Text fontWeight="600" mb="lg">{record.params.booking_reference}</Text>

                <Label>Current Status</Label>
                <Text fontWeight="600" style={{ textTransform: 'capitalize' }}>{record.params.status}</Text>
            </Box>

            <Box mb="xl">
                <Label required>Assign To New Agent</Label>
                <Select
                    value={agents.find((a) => a.value === targetAgentId)}
                    onChange={(selected) =>
                        setTargetAgentId(selected ? selected.value : "")
                    }
                    options={agents}
                    menuPortalTarget={document.body}
                    styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        control: (provided) => ({ ...provided, width: "100%" }),
                    }}
                />
                <Text fontSize="sm" color="grey60" mt="sm">
                    Select the agent who will take over this viewing.
                </Text>
            </Box>

            <Button
                onClick={handleReassign}
                variant="primary"
                disabled={!targetAgentId || loading}
            >
                {loading ? <Loader size={16} /> : "Confirm Reassignment"}
            </Button>
        </Box>
    );
};

export default VistateReassignViewing;
