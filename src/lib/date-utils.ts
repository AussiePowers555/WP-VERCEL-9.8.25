/**
 * Safe date formatting utilities that prevent hydration mismatches
 */

import { useEffect, useState } from 'react';

/**
 * Format a date string safely for SSR/hydration
 * Returns a placeholder during SSR and the formatted date after hydration
 */
export function useSafeDate(dateString: string | Date | null | undefined, format: 'date' | 'datetime' | 'time' = 'date') {
  const [formattedDate, setFormattedDate] = useState<string>('—');
  
  useEffect(() => {
    if (!dateString) {
      setFormattedDate('—');
      return;
    }
    
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      setFormattedDate('Invalid date');
      return;
    }
    
    try {
      switch (format) {
        case 'datetime':
          setFormattedDate(date.toLocaleString());
          break;
        case 'time':
          setFormattedDate(date.toLocaleTimeString());
          break;
        case 'date':
        default:
          setFormattedDate(date.toLocaleDateString());
          break;
      }
    } catch (error) {
      setFormattedDate('—');
    }
  }, [dateString, format]);
  
  return formattedDate;
}

/**
 * Get current date/time values safely for form defaults
 * Returns empty string during SSR to prevent hydration mismatches
 */
export function useCurrentDateTime() {
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  
  useEffect(() => {
    const now = new Date();
    setCurrentDate(now.toISOString().split('T')[0]);
    setCurrentTime(now.toTimeString().slice(0, 5));
  }, []);
  
  return { currentDate, currentTime };
}

/**
 * Format a date without hydration issues (for server components)
 * Returns a consistent string that won't change between server and client
 */
export function formatDateSafe(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Use ISO format which is consistent between server and client
    return date.toISOString().split('T')[0];
  } catch {
    return '—';
  }
}