import { useState, useCallback } from 'react';
import { z } from 'zod';

interface ValidationState {
  errors: Record<string, string[]>;
  isValid: boolean;
  hasErrors: boolean;
}

interface UseFormValidationOptions {
  schema?: z.ZodSchema<any>;
  customValidators?: Record<string, (value: any) => string | null>;
  validateOnChange?: boolean;
  debounceMs?: number;
}

export function useFormValidation(options: UseFormValidationOptions = {}) {
  const {
    schema,
    customValidators = {},
    validateOnChange = false,
    debounceMs = 300,
  } = options;

  const [validation, setValidation] = useState<ValidationState>({
    errors: {},
    isValid: true,
    hasErrors: false,
  });

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setValidation({
      errors: {},
      isValid: true,
      hasErrors: false,
    });
  }, []);

  // Clear errors for specific fields
  const clearFieldErrors = useCallback((fieldNames: string | string[]) => {
    const fields = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
    
    setValidation(prev => {
      const newErrors = { ...prev.errors };
      fields.forEach(field => {
        delete newErrors[field];
      });
      
      const hasErrors = Object.keys(newErrors).length > 0;
      return {
        errors: newErrors,
        isValid: !hasErrors,
        hasErrors,
      };
    });
  }, []);

  // Add custom error
  const addError = useCallback((field: string, message: string) => {
    setValidation(prev => ({
      errors: {
        ...prev.errors,
        [field]: prev.errors[field] ? [...prev.errors[field], message] : [message],
      },
      isValid: false,
      hasErrors: true,
    }));
  }, []);

  // Validate a single field
  const validateField = useCallback(
    (fieldName: string, value: any, allValues?: Record<string, any>) => {
      let fieldErrors: string[] = [];

      // Schema validation
      if (schema) {
        try {
          const fieldSchema = (schema as any).shape?.[fieldName];
          if (fieldSchema) {
            fieldSchema.parse(value);
          }
        } catch (error) {
          if (error instanceof z.ZodError) {
            fieldErrors = error.issues.map(issue => issue.message);
          }
        }
      }

      // Custom validation
      if (customValidators[fieldName]) {
        const customError = customValidators[fieldName](value);
        if (customError) {
          fieldErrors.push(customError);
        }
      }

      // Update validation state
      setValidation(prev => {
        const newErrors = { ...prev.errors };
        if (fieldErrors.length > 0) {
          newErrors[fieldName] = fieldErrors;
        } else {
          delete newErrors[fieldName];
        }

        const hasErrors = Object.keys(newErrors).length > 0;
        return {
          errors: newErrors,
          isValid: !hasErrors,
          hasErrors,
        };
      });

      return fieldErrors;
    },
    [schema, customValidators]
  );

  // Validate entire form
  const validateForm = useCallback(
    (values: Record<string, any>) => {
      let allErrors: Record<string, string[]> = {};

      // Schema validation
      if (schema) {
        try {
          schema.parse(values);
        } catch (error) {
          if (error instanceof z.ZodError) {
            error.issues.forEach(issue => {
              const fieldName = issue.path.join('.');
              if (!allErrors[fieldName]) {
                allErrors[fieldName] = [];
              }
              allErrors[fieldName].push(issue.message);
            });
          }
        }
      }

      // Custom validation
      Object.entries(customValidators).forEach(([fieldName, validator]) => {
        const error = validator(values[fieldName]);
        if (error) {
          if (!allErrors[fieldName]) {
            allErrors[fieldName] = [];
          }
          allErrors[fieldName].push(error);
        }
      });

      const hasErrors = Object.keys(allErrors).length > 0;
      const newValidation = {
        errors: allErrors,
        isValid: !hasErrors,
        hasErrors,
      };

      setValidation(newValidation);
      return newValidation;
    },
    [schema, customValidators]
  );

  // Debounced field validation for onChange events
  const validateFieldDebounced = useCallback(
    (fieldName: string, value: any, allValues?: Record<string, any>) => {
      if (!validateOnChange) return;

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(() => {
        validateField(fieldName, value, allValues);
      }, debounceMs);

      setDebounceTimer(timer);
    },
    [validateField, validateOnChange, debounceMs, debounceTimer]
  );

  // Get errors for specific field
  const getFieldErrors = useCallback(
    (fieldName: string) => validation.errors[fieldName] || [],
    [validation.errors]
  );

  // Check if specific field has errors
  const hasFieldErrors = useCallback(
    (fieldName: string) => Boolean(validation.errors[fieldName]?.length),
    [validation.errors]
  );

  // Get all errors as flat array
  const getAllErrors = useCallback(() => {
    const allErrors: string[] = [];
    Object.values(validation.errors).forEach(fieldErrors => {
      allErrors.push(...fieldErrors);
    });
    return allErrors;
  }, [validation.errors]);

  return {
    // State
    errors: validation.errors,
    isValid: validation.isValid,
    hasErrors: validation.hasErrors,

    // Actions
    validateField,
    validateFieldDebounced,
    validateForm,
    clearErrors,
    clearFieldErrors,
    addError,

    // Helpers
    getFieldErrors,
    hasFieldErrors,
    getAllErrors,
  };
}

export default useFormValidation;