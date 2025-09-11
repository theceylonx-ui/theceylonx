import { useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Eye, EyeOff, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
  type?: 'error' | 'warning';
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface EnhancedInputProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  validationRules?: ValidationRule[];
  showValidation?: boolean;
  className?: string;
  autoComplete?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
}

export function EnhancedInput({
  label,
  id,
  value,
  onChange,
  type = 'text',
  placeholder,
  description,
  required = false,
  disabled = false,
  validationRules = [],
  showValidation = true,
  className,
  autoComplete,
  maxLength,
  showCharacterCount = false
}: EnhancedInputProps) {
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  // Validate input when value changes
  useEffect(() => {
    if (!showValidation || !hasBeenTouched) return;

    const errors: string[] = [];
    const warnings: string[] = [];

    validationRules.forEach(rule => {
      if (!rule.test(value)) {
        if (rule.type === 'warning') {
          warnings.push(rule.message);
        } else {
          errors.push(rule.message);
        }
      }
    });

    setValidation({
      isValid: errors.length === 0,
      errors,
      warnings
    });
  }, [value, validationRules, showValidation, hasBeenTouched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setHasBeenTouched(true);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;
  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;
  const showValidationMessages = hasBeenTouched && showValidation;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label 
          htmlFor={id}
          className={cn(
            'text-sm font-medium',
            required && 'after:content-["*"] after:text-destructive after:ml-1',
            hasErrors && 'text-destructive'
          )}
        >
          {label}
        </Label>
        {showCharacterCount && maxLength && (
          <span className={cn(
            'text-xs',
            value.length > maxLength * 0.9 ? 'text-warning' : 'text-text-muted',
            value.length >= maxLength && 'text-destructive'
          )}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      {description && (
        <p className="text-sm text-text-muted" id={`${id}-description`}>
          {description}
        </p>
      )}

      <div className="relative">
        <Input
          id={id}
          type={inputType}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={cn(
            'transition-all duration-200',
            isFocused && 'ring-2 ring-brand ring-offset-2',
            hasErrors && 'border-destructive focus:ring-destructive',
            hasWarnings && !hasErrors && 'border-warning focus:ring-warning',
            validation.isValid && hasBeenTouched && 'border-success',
            type === 'password' && 'pr-10'
          )}
          aria-invalid={hasErrors}
          aria-describedby={cn(
            description && `${id}-description`,
            (hasErrors || hasWarnings) && `${id}-validation`
          )}
          data-testid={`input-${id}`}
        />

        {/* Password toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 rounded"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            data-testid={`password-toggle-${id}`}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}

        {/* Validation indicator */}
        {showValidationMessages && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {hasErrors ? (
              <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
            ) : validation.isValid && value.length > 0 ? (
              <CheckCircle className="h-4 w-4 text-success" aria-hidden="true" />
            ) : hasWarnings ? (
              <Info className="h-4 w-4 text-warning" aria-hidden="true" />
            ) : null}
          </div>
        )}
      </div>

      {/* Validation messages */}
      {showValidationMessages && (hasErrors || hasWarnings) && (
        <div id={`${id}-validation`} className="space-y-1" role="alert">
          {validation.errors.map((error, index) => (
            <p key={`error-${index}`} className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
              {error}
            </p>
          ))}
          {validation.warnings.map((warning, index) => (
            <p key={`warning-${index}`} className="text-sm text-warning flex items-center gap-1">
              <Info className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
              {warning}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

interface EnhancedTextareaProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  showCharacterCount?: boolean;
  validationRules?: ValidationRule[];
  showValidation?: boolean;
  className?: string;
  resize?: boolean;
}

export function EnhancedTextarea({
  label,
  id,
  value,
  onChange,
  placeholder,
  description,
  required = false,
  disabled = false,
  rows = 4,
  maxLength,
  showCharacterCount = false,
  validationRules = [],
  showValidation = true,
  className,
  resize = true
}: EnhancedTextareaProps) {
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });
  const [isFocused, setIsFocused] = useState(false);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  // Validate input when value changes
  useEffect(() => {
    if (!showValidation || !hasBeenTouched) return;

    const errors: string[] = [];
    const warnings: string[] = [];

    validationRules.forEach(rule => {
      if (!rule.test(value)) {
        if (rule.type === 'warning') {
          warnings.push(rule.message);
        } else {
          errors.push(rule.message);
        }
      }
    });

    setValidation({
      isValid: errors.length === 0,
      errors,
      warnings
    });
  }, [value, validationRules, showValidation, hasBeenTouched]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setHasBeenTouched(true);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;
  const showValidationMessages = hasBeenTouched && showValidation;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label 
          htmlFor={id}
          className={cn(
            'text-sm font-medium',
            required && 'after:content-["*"] after:text-destructive after:ml-1',
            hasErrors && 'text-destructive'
          )}
        >
          {label}
        </Label>
        {showCharacterCount && maxLength && (
          <span className={cn(
            'text-xs',
            value.length > maxLength * 0.9 ? 'text-warning' : 'text-text-muted',
            value.length >= maxLength && 'text-destructive'
          )}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      {description && (
        <p className="text-sm text-text-muted" id={`${id}-description`}>
          {description}
        </p>
      )}

      <div className="relative">
        <Textarea
          id={id}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={cn(
            'transition-all duration-200',
            isFocused && 'ring-2 ring-brand ring-offset-2',
            hasErrors && 'border-destructive focus:ring-destructive',
            hasWarnings && !hasErrors && 'border-warning focus:ring-warning',
            validation.isValid && hasBeenTouched && 'border-success',
            !resize && 'resize-none'
          )}
          aria-invalid={hasErrors}
          aria-describedby={cn(
            description && `${id}-description`,
            (hasErrors || hasWarnings) && `${id}-validation`
          )}
          data-testid={`textarea-${id}`}
        />

        {/* Validation indicator */}
        {showValidationMessages && (
          <div className="absolute right-3 top-3">
            {hasErrors ? (
              <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
            ) : validation.isValid && value.length > 0 ? (
              <CheckCircle className="h-4 w-4 text-success" aria-hidden="true" />
            ) : hasWarnings ? (
              <Info className="h-4 w-4 text-warning" aria-hidden="true" />
            ) : null}
          </div>
        )}
      </div>

      {/* Validation messages */}
      {showValidationMessages && (hasErrors || hasWarnings) && (
        <div id={`${id}-validation`} className="space-y-1" role="alert">
          {validation.errors.map((error, index) => (
            <p key={`error-${index}`} className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
              {error}
            </p>
          ))}
          {validation.warnings.map((warning, index) => (
            <p key={`warning-${index}`} className="text-sm text-warning flex items-center gap-1">
              <Info className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
              {warning}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    test: (value) => value.trim().length > 0,
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    test: (value) => value.length >= min,
    message: message || `Must be at least ${min} characters`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    test: (value) => value.length <= max,
    message: message || `Must be no more than ${max} characters`
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    test: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    test: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    test: (value) => {
      const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
      return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
    },
    message
  }),

  password: {
    minLength: (min = 8, message?: string): ValidationRule => ({
      test: (value) => value.length >= min,
      message: message || `Password must be at least ${min} characters`
    }),

    hasUppercase: (message = 'Password must contain at least one uppercase letter'): ValidationRule => ({
      test: (value) => /[A-Z]/.test(value),
      message
    }),

    hasLowercase: (message = 'Password must contain at least one lowercase letter'): ValidationRule => ({
      test: (value) => /[a-z]/.test(value),
      message
    }),

    hasNumber: (message = 'Password must contain at least one number'): ValidationRule => ({
      test: (value) => /\d/.test(value),
      message
    }),

    hasSpecialChar: (message = 'Password must contain at least one special character'): ValidationRule => ({
      test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
      message
    }),

    strength: (message = 'Password should be stronger'): ValidationRule => ({
      test: (value) => {
        const score = [
          /[a-z]/.test(value),
          /[A-Z]/.test(value),
          /\d/.test(value),
          /[!@#$%^&*(),.?":{}|<>]/.test(value),
          value.length >= 8
        ].filter(Boolean).length;
        return score >= 3;
      },
      message,
      type: 'warning'
    })
  }
};