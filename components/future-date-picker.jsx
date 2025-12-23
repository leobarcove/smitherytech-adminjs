import React, { useState } from 'react';
import { DatePicker, FormGroup, Label, FormMessage, Box } from '@adminjs/design-system';

const FutureDatePicker = (props) => {
    const { property, record, onChange } = props;
    const [internalError, setInternalError] = useState(null);

    const propertyPath = property.path || property.name;
    const value = record.params[propertyPath];

    const businessHours = property.custom?.businessHours;
    let minTime, maxTime;

    if (businessHours) {
        const now = new Date();
        minTime = new Date(now.setHours(businessHours.startHour, 0, 0, 0));
        maxTime = new Date(now.setHours(businessHours.endHour, 0, 0, 0));
    }

    const isDateAvailable = (date) => {
        if (!businessHours || !date) return true;
        const day = date.getDay();
        return businessHours.days.includes(day);
    };

    const handleChange = (date) => {
        // If the date picker returns null/undefined (cleared), clear error
        if (!date) {
            setInternalError(null);
            onChange(propertyPath, date);
            return;
        }

        setInternalError(null);

        onChange(propertyPath, date);
    };

    const error = internalError || (record.errors && record.errors[propertyPath]?.message);

    return (
        <Box mb="xl">
            <Label>{property.custom?.name}</Label>
            <DatePicker
                value={value}
                onChange={handleChange}
                minDate={new Date()}
                minTime={minTime}
                maxTime={maxTime}
                showTimeSelect
                filterDate={isDateAvailable}
            />
            {error && <FormMessage>{error}</FormMessage>}
        </Box>
    );
};

export default FutureDatePicker;
