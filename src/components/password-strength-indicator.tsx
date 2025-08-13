'use client';

import { useEffect, useState } from 'react';
import { checkPasswordStrength } from '@/lib/password-generator';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  showFeedback?: boolean;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  showFeedback = true,
  className
}: PasswordStrengthIndicatorProps) {
  const [strength, setStrength] = useState<ReturnType<typeof checkPasswordStrength> | null>(null);

  useEffect(() => {
    if (password) {
      setStrength(checkPasswordStrength(password));
    } else {
      setStrength(null);
    }
  }, [password]);

  if (!strength) return null;

  const strengthColors = {
    'weak': 'bg-red-500',
    'fair': 'bg-orange-500',
    'good': 'bg-yellow-500',
    'strong': 'bg-green-500',
    'very-strong': 'bg-green-600'
  };

  const strengthLabels = {
    'weak': 'Weak',
    'fair': 'Fair',
    'good': 'Good',
    'strong': 'Strong',
    'very-strong': 'Very Strong'
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Password strength:</span>
        <span className={cn(
          "text-sm font-medium",
          strength.strength === 'weak' && "text-red-500",
          strength.strength === 'fair' && "text-orange-500",
          strength.strength === 'good' && "text-yellow-600",
          strength.strength === 'strong' && "text-green-500",
          strength.strength === 'very-strong' && "text-green-600"
        )}>
          {strengthLabels[strength.strength]}
        </span>
      </div>
      
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={cn(
              "h-2 flex-1 rounded-full transition-all",
              index <= strength.score
                ? strengthColors[strength.strength]
                : "bg-muted"
            )}
          />
        ))}
      </div>

      {showFeedback && strength.feedback.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1">
          {strength.feedback.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}