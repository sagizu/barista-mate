'use client';

import { useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface HybridDateInputProps {
  id?: string;
  value?: string; // yyyy-MM-dd
  onChange: (newDate: string) => void; // yyyy-MM-dd
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function HybridDateInput({
  id,
  value,
  onChange,
  placeholder = 'בחר תאריך',
  disabled = false,
  className,
}: HybridDateInputProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const displayValue = value ? format(parseISO(value), 'dd/MM/yyyy') : '';

  const handleWrapperClick = () => {
    if (disabled) return;
    try {
      dateInputRef.current?.showPicker();
    } catch (err) {
      console.error("Couldn't show date picker:", err);
    }
  };

  return (
    <div
      className={cn(
        'relative w-full',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      )}
      onClick={handleWrapperClick}
    >
      <Input
        id={id}
        readOnly
        value={displayValue}
        placeholder={placeholder}
        className={cn(
          'text-lg p-4 w-full block text-right disabled:opacity-70',
          className
        )}
        dir="rtl"
        disabled={disabled}
      />
      <input
        ref={dateInputRef}
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="opacity-0 absolute inset-0 w-full h-full"
        aria-hidden="true"
        tabIndex={-1}
        disabled={disabled}
        data-testid={id ? `hidden-date-input-${id}` : 'hidden-date-input'}
      />
    </div>
  );
}
