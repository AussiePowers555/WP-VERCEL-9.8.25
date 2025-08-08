
"use client";

import { useState, useEffect } from 'react';

// Simplified hook for global data storage. Workspace scoping has been removed.

function getValue<T>(key: string, initialValue: T | (() => T)): T {
  if (typeof window === 'undefined') {
    return initialValue instanceof Function ? initialValue() : initialValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : (initialValue instanceof Function ? initialValue() : initialValue);
  } catch (error) {
    console.warn(`Error reading localStorage key “${key}”:`, error);
    return initialValue instanceof Function ? initialValue() : initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Always use initial value during SSR and initial hydration
  const [storedValue, setStoredValue] = useState<T>(() => {
    return initialValue instanceof Function ? initialValue() : initialValue;
  });
  const [isHydrated, setIsHydrated] = useState(false);

  // After hydration, sync with localStorage
  useEffect(() => {
    setIsHydrated(true);
    setStoredValue(getValue(key, initialValue));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    // Only write to localStorage after hydration
    if (typeof window !== 'undefined' && isHydrated) {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue, isHydrated]);

  return [storedValue, setStoredValue];
}
