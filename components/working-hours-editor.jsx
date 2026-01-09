import React, { useState, useEffect } from 'react';
import { Box, Label, Input, CheckBox, Text } from '@adminjs/design-system';

const DAYS = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
];

const WorkingHoursEditor = (props) => {
    const { property, record, onChange } = props;

    // Extract initial value
    const getInitialValue = () => {
        const rawValue = record.params[property.name];

        // 1. If it's already an object (ideal case)
        if (typeof rawValue === 'object' && rawValue !== null) {
            return rawValue;
        }

        // 2. If we have flattened keys in record.params (AdminJS default behavior for JSON)
        // Check for keys starting with `working_hours.` (or property.name)
        const flattenPrefix = `${property.name}.`;
        const flattenedData = {};
        let foundFlattened = false;

        Object.keys(record.params).forEach(key => {
            if (key.startsWith(flattenPrefix)) {
                foundFlattened = true;
                // key example: "working_hours.monday.start"
                // path example: "monday.start"
                const path = key.substring(flattenPrefix.length);
                const [day, field] = path.split('.');

                if (day && field) {
                    if (!flattenedData[day]) flattenedData[day] = {};
                    flattenedData[day][field] = record.params[key];
                }
            }
        });

        if (foundFlattened) {
            return flattenedData;
        }

        // 3. If it's a string (AdminJS sometimes serializes JSON)
        try {
            return rawValue ? JSON.parse(rawValue) : {};
        } catch (e) {
            return {};
        }
    };

    const [value, setValue] = useState(getInitialValue());

    // Update parent record when value changes, ONLY if onChange is defined (Edit mode)
    useEffect(() => {
        if (onChange) {
            onChange(property.name, value);
        }
    }, [value]);

    const handleToggleDay = (day) => {
        if (!onChange) return; // Prevent edits in show mode
        setValue((prev) => {
            const currentDayConfig = prev[day];
            if (currentDayConfig) {
                return { ...prev, [day]: null };
            } else {
                return {
                    ...prev,
                    [day]: { start: '09:00', end: '18:00' },
                };
            }
        });
    };

    const handleTimeChange = (day, field, timeVal) => {
        if (!onChange) return; // Prevent edits in show mode
        setValue((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: timeVal,
            },
        }));
    };

    const isReadOnly = !onChange;

    return (
        <Box mb="xl">
            <Label style={{ color: 'rgb(137, 138, 154)' }}>Working Hours</Label>
            <Box variant={"card"} p={isReadOnly ? "0" : "lg"} style={{ display: 'grid', gap: '16px' }}>
                {DAYS.map((day) => {
                    const dayConfig = value[day];
                    const isWorking = !!dayConfig;

                    // In show mode, maybe only show working days? Or show all with status.
                    // Let's show all for consistency but make it look read-only.

                    return (
                        <Box
                            key={day}
                            flex
                            alignItems="center"
                            style={{
                                gap: '16px',
                                opacity: isWorking ? 1 : 0.6,
                                paddingBottom: '8px',
                                borderBottom: '1px solid #eee'
                            }}
                        >
                            {/* Day Name and Toggle */}
                            <Box flex alignItems="center" width="150px">
                                {!isReadOnly && (
                                    <CheckBox
                                        id={`toggle-${day}`}
                                        checked={isWorking}
                                        onChange={() => handleToggleDay(day)}
                                    />
                                )}
                                <Label
                                    htmlFor={!isReadOnly ? `toggle-${day}` : undefined}
                                    style={{
                                        marginBottom: 0,
                                        marginLeft: !isReadOnly ? '8px' : '0',
                                        textTransform: 'capitalize',
                                        cursor: isReadOnly ? 'default' : 'pointer'
                                    }}
                                >
                                    {day}
                                </Label>
                            </Box>

                            {/* Time Inputs */}
                            {isWorking ? (
                                <Box flex alignItems="center" style={{ gap: '8px', flexGrow: 1 }}>
                                    {isReadOnly ? (
                                        <Text>{dayConfig?.start} - {dayConfig?.end}</Text>
                                    ) : (
                                        <>
                                            <Input
                                                type="time"
                                                value={dayConfig?.start || ''}
                                                onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                                            />
                                            <Text>-</Text>
                                            <Input
                                                type="time"
                                                value={dayConfig?.end || ''}
                                                onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                                            />
                                        </>
                                    )}
                                </Box>
                            ) : (
                                <Box flexGrow={1}>
                                    <Text color="grey60" fontStyle="italic">Not Working/Closed</Text>
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default WorkingHoursEditor;
