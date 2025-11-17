'use client';
import React from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  disabled = false,
  helpText,
  rows = 4,
  min,
  max,
  step,
}) => {
  const commonProps = {
    id: name,
    name,
    value: value ?? '',
    onChange,
    onBlur,
    placeholder,
    disabled,
    className: error ? 'border-red-500 focus:ring-red-500' : '',
    ...(type === 'number' && { min, max, step }),
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <Textarea {...commonProps} rows={rows} />
      ) : (
        <Input {...commonProps} type={type} />
      )}

      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
          {error}
        </p>
      )}
    </div>
  );
};
