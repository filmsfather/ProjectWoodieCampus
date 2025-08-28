import React, { forwardRef } from 'react';
import { Stack, Grid } from '../layout/index';

// Form Container
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  layout?: 'stack' | 'grid';
  className?: string;
}

export const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ children, layout = 'stack', className = '', ...props }, ref) => {
    return (
      <form ref={ref} className={`space-y-6 ${className}`} {...props}>
        {layout === 'stack' ? (
          <Stack gap="lg">{children}</Stack>
        ) : (
          <div className="space-y-6">{children}</div>
        )}
      </form>
    );
  }
);

Form.displayName = 'Form';

// Form Group - responsive layout
interface FormGroupProps {
  children: React.ReactNode;
  columns?: 1 | 2;
  className?: string;
}

export function FormGroup({ children, columns = 1, className = '' }: FormGroupProps) {
  if (columns === 1) {
    return <Stack gap="md" className={className}>{children}</Stack>;
  }

  return (
    <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
      {children}
    </div>
  );
}

// Form Field
interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
  className = ''
}: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label 
        htmlFor={htmlFor}
        className="block text-fluid-sm font-medium text-neutral-900"
      >
        {label}
        {required && <span className="text-error ml-1" aria-label="필수 입력">*</span>}
      </label>
      
      {hint && (
        <p className="text-fluid-xs text-neutral-600 reading-leading">
          {hint}
        </p>
      )}
      
      <div className="relative">
        {children}
      </div>
      
      {error && (
        <p className="text-fluid-xs text-error reading-leading" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Input Components
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, className = '', ...props }, ref) => {
    const baseClasses = `
      block w-full h-input px-3 py-2 border rounded-md shadow-sm
      text-fluid-base placeholder-neutral-400
      focus:outline-none focus:ring-2 focus:ring-role-primary focus:border-role-primary
      disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed
      transition-colors duration-200
    `;
    
    const stateClasses = error 
      ? 'border-error focus:border-error focus:ring-error' 
      : 'border-neutral-300 hover:border-neutral-400';
    
    return (
      <input
        ref={ref}
        className={`${baseClasses} ${stateClasses} ${className}`.trim()}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error = false, className = '', rows = 4, ...props }, ref) => {
    const baseClasses = `
      block w-full px-3 py-2 border rounded-md shadow-sm resize-vertical
      text-fluid-base placeholder-neutral-400
      focus:outline-none focus:ring-2 focus:ring-role-primary focus:border-role-primary
      disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed
      transition-colors duration-200
    `;
    
    const stateClasses = error 
      ? 'border-error focus:border-error focus:ring-error' 
      : 'border-neutral-300 hover:border-neutral-400';
    
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`${baseClasses} ${stateClasses} ${className}`.trim()}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error = false, className = '', children, ...props }, ref) => {
    const baseClasses = `
      block w-full h-input px-3 py-2 pr-8 border rounded-md shadow-sm
      text-fluid-base bg-white
      focus:outline-none focus:ring-2 focus:ring-role-primary focus:border-role-primary
      disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed
      transition-colors duration-200
      appearance-none bg-no-repeat bg-right
    `;
    
    const stateClasses = error 
      ? 'border-error focus:border-error focus:ring-error' 
      : 'border-neutral-300 hover:border-neutral-400';
    
    return (
      <div className="relative">
        <select
          ref={ref}
          className={`${baseClasses} ${stateClasses} ${className}`.trim()}
          {...props}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';

// Checkbox
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error = false, className = '', ...props }, ref) => {
    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="checkbox"
            className={`
              w-4 h-4 text-role-primary border-neutral-300 rounded
              focus:ring-2 focus:ring-role-primary focus:ring-offset-0
              transition-colors duration-200
              ${error ? 'border-error' : ''}
              ${className}
            `.trim()}
            {...props}
          />
        </div>
        <div className="ml-3 text-fluid-sm">
          <label htmlFor={props.id} className="text-neutral-700 cursor-pointer">
            {label}
          </label>
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// Form Actions
interface FormActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
  className?: string;
}

export function FormActions({ 
  children, 
  align = 'right',
  className = '' 
}: FormActionsProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div className={`flex gap-3 pt-4 ${alignClasses[align]} ${className}`}>
      {children}
    </div>
  );
}

export default Form;