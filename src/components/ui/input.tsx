import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, value, onChange, readOnly, ...props }, ref) => {
    const inputProps: any = {
      type,
      className: cn(
        "glass-input flex h-10 w-full rounded-xl px-4 py-2 text-base text-white placeholder:text-gray-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white",
        className
      ),
      ref,
      ...props
    };

    // Only add value prop if onChange is provided or readOnly is true
    if (onChange || readOnly) {
      inputProps.value = value || '';
    } else if (value !== undefined) {
      // Use defaultValue for uncontrolled components
      inputProps.defaultValue = value || '';
    }

    if (onChange) {
      inputProps.onChange = onChange;
    }

    if (readOnly) {
      inputProps.readOnly = readOnly;
    }

    return <input {...inputProps} />
  }
)
Input.displayName = "Input"

export { Input }
