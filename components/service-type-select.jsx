import React, { useEffect, useState } from "react";
import { Box, Select, Label } from "@adminjs/design-system";

const ServiceTypeSelect = (props) => {
  const { property, record, onChange } = props;
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handle cases where property might be undefined
  if (!property) {
    return null;
  }

  // Get property path - handle both method and property access
  let propertyPath = "slotiva_service_type"

  const currentValue = record?.params?.[propertyPath] || "";

  useEffect(() => {
    // Load service types from API
    const loadServiceTypes = async () => {
      try {
        setError(null);
        const response = await fetch("/admin/api/slotiva/service-types");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.serviceTypes) {
            setServiceTypes(data.serviceTypes);
          } else {
            setError("Failed to load service types");
          }
        } else {
          setError("Failed to load service types");
        }
      } catch (error) {
        console.error("Error loading service types:", error);
        setError("Error loading service types");
      } finally {
        setLoading(false);
      }
    };

    loadServiceTypes();
  }, []);

  const handleChange = (selectedOption) => {
    try {
      const selectedValue = selectedOption ? selectedOption.value : null;

      console.log("selectedValue ", selectedValue)
      console.log("propertyPath ", propertyPath)

      // Call the onChange handler - this is the proper way to update AdminJS forms
      if (onChange && propertyPath) {
        onChange(propertyPath, selectedValue);
      }
    } catch (error) {
      console.error("Error handling change:", error);
    }
  };

  const options = serviceTypes.map((st) => ({
    value: st.id,
    label: st.name,
  }));

  // Handle UUID comparison - ensure both values are strings
  const selectedOption = options.find(
    (opt) => String(opt.value) === String(currentValue)
  ) || null;

  // Get label - handle both method and property access
  let label;
  try {
    label = typeof property.label === "function"
      ? property.label()
      : property.label || property.name || "Service Type";
  } catch (err) {
    console.error("Error getting property label:", err);
    label = property.name || "Service Type";
  }

  if (error) {
    return (
      <Box>
        <Label>{label}</Label>
        <Box color="error">Error loading service types. Please refresh the page.</Box>
      </Box>
    );
  }

  return (
    <Box mb="xl">
      <Label>Service Type</Label>
      <Select
        value={selectedOption}
        options={options}
        onChange={handleChange}
        isDisabled={loading}
        placeholder={loading ? "Loading..." : "Select a service type"}
        isClearable
      />
    </Box>
  );
};

export default ServiceTypeSelect;
