/**
 * Enhanced password generation utilities with pronounceable and secure options
 */

// Consonants and vowels for pronounceable passwords
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
const VOWELS = 'aeiou';
const NUMBERS = '0123456789';
const SPECIAL_CHARS = '!@#$%^&*';

/**
 * Generate a pronounceable password that's easier to remember
 * Format: consonant-vowel pairs + numbers + special char
 * Example: "Kopine47#"
 */
export function generatePronounceablePassword(
  length: number = 10,
  includeNumbers: boolean = true,
  includeSpecial: boolean = true
): string {
  let password = '';
  
  // Start with capital letter
  password += CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)].toUpperCase();
  password += VOWELS[Math.floor(Math.random() * VOWELS.length)];
  
  // Add consonant-vowel pairs
  const pairsNeeded = Math.floor((length - 2 - (includeNumbers ? 2 : 0) - (includeSpecial ? 1 : 0)) / 2);
  for (let i = 0; i < pairsNeeded; i++) {
    password += CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)];
    password += VOWELS[Math.floor(Math.random() * VOWELS.length)];
  }
  
  // Add numbers if requested
  if (includeNumbers) {
    password += NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
    password += NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  }
  
  // Add special character if requested
  if (includeSpecial) {
    password += SPECIAL_CHARS[Math.floor(Math.random() * SPECIAL_CHARS.length)];
  }
  
  return password;
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(
  length: number = 12,
  options: {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    special?: boolean;
  } = {}
): string {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    special = true
  } = options;
  
  let charset = '';
  if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) charset += '0123456789';
  if (special) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  if (charset.length === 0) {
    throw new Error('At least one character type must be enabled');
  }
  
  let password = '';
  const array = new Uint8Array(length);
  
  // Use crypto for secure random generation
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for Node.js environment
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  
  // Ensure at least one character from each enabled type
  const requiredChars: string[] = [];
  if (uppercase) requiredChars.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]);
  if (lowercase) requiredChars.push('abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]);
  if (numbers) requiredChars.push('0123456789'[Math.floor(Math.random() * 10)]);
  if (special) requiredChars.push('!@#$%^&*'[Math.floor(Math.random() * 8)]);
  
  // Replace random positions with required characters
  for (let i = 0; i < requiredChars.length && i < password.length; i++) {
    const position = Math.floor(Math.random() * password.length);
    password = password.substring(0, position) + requiredChars[i] + password.substring(position + 1);
  }
  
  return password;
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number; // 0-4
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];
  
  // Length check
  if (password.length >= 8) score++;
  else feedback.push('Password should be at least 8 characters long');
  
  if (password.length >= 12) score++;
  
  // Character type checks
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Add lowercase letters');
  
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Add uppercase letters');
  
  if (/[0-9]/.test(password)) score++;
  else feedback.push('Add numbers');
  
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push('Add special characters');
  
  // Common patterns check
  if (!/(.)\1{2,}/.test(password)) score++; // No repeated characters
  else feedback.push('Avoid repeated characters');
  
  if (!/^(123|abc|qwerty|password)/i.test(password)) score++;
  else feedback.push('Avoid common patterns');
  
  // Calculate final score (0-4 scale)
  const finalScore = Math.min(4, Math.floor(score / 2));
  
  const strengthMap = {
    0: 'weak',
    1: 'fair',
    2: 'good',
    3: 'strong',
    4: 'very-strong'
  } as const;
  
  return {
    score: finalScore,
    strength: strengthMap[finalScore as keyof typeof strengthMap],
    feedback
  };
}

/**
 * Validate password against requirements
 */
export function validatePassword(
  password: string,
  requirements: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecial?: boolean;
    preventCommon?: boolean;
  } = {}
): {
  valid: boolean;
  errors: string[];
} {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecial = false,
    preventCommon = true
  } = requirements;
  
  const errors: string[] = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (requireSpecial && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  if (preventCommon) {
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123',
      'monkey', '1234567', 'letmein', 'trustno1', 'dragon'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common, please choose a more unique password');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate password expiry date
 */
export function getPasswordExpiryDate(daysValid: number = 90): Date {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysValid);
  return expiryDate;
}

/**
 * Check if password is expired or expiring soon
 */
export function checkPasswordExpiry(
  expiryDate: Date | string,
  warningDays: number = 7
): {
  expired: boolean;
  expiringSoon: boolean;
  daysRemaining: number;
  message?: string;
} {
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const now = new Date();
  const daysRemaining = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const expired = daysRemaining < 0;
  const expiringSoon = !expired && daysRemaining <= warningDays;
  
  let message: string | undefined;
  if (expired) {
    message = 'Your password has expired. Please change it immediately.';
  } else if (expiringSoon) {
    message = `Your password will expire in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Please consider changing it soon.`;
  }
  
  return {
    expired,
    expiringSoon,
    daysRemaining,
    message
  };
}