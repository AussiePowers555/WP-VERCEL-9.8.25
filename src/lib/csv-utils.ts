export interface UserCSVRow {
  email: string;
  name: string;
  role?: string;
  workspace?: string;
}

export interface CredentialCSVRow {
  name: string;
  email: string;
  password: string;
  workspace: string;
  loginUrl: string;
  createdAt?: string;
}

/**
 * Parse CSV text to extract user data
 */
export function parseUserCSV(csvText: string): UserCSVRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }

  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["\s]/g, ''));
  
  // Find column indices
  const emailIndex = headers.findIndex(h => h.includes('email'));
  const nameIndex = headers.findIndex(h => h.includes('name'));
  const roleIndex = headers.findIndex(h => h.includes('role'));
  const workspaceIndex = headers.findIndex(h => h.includes('workspace'));

  if (emailIndex === -1) {
    throw new Error('CSV must contain an email column');
  }

  // Parse data rows
  const users: UserCSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length > emailIndex) {
      const email = values[emailIndex]?.trim();
      if (email && isValidEmail(email)) {
        users.push({
          email: email.toLowerCase(),
          name: nameIndex >= 0 ? values[nameIndex]?.trim() || extractNameFromEmail(email) : extractNameFromEmail(email),
          role: roleIndex >= 0 ? values[roleIndex]?.trim() || 'user' : 'user',
          workspace: workspaceIndex >= 0 ? values[workspaceIndex]?.trim() : undefined
        });
      }
    }
  }

  return users;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Generate CSV from user credentials
 */
export function generateCredentialsCSV(credentials: CredentialCSVRow[]): string {
  const headers = ['Name', 'Email', 'Password', 'Workspace', 'Login URL'];
  const rows = credentials.map(cred => [
    escapeCSVValue(cred.name),
    escapeCSVValue(cred.email),
    escapeCSVValue(cred.password),
    escapeCSVValue(cred.workspace),
    escapeCSVValue(cred.loginUrl)
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Escape CSV value
 */
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract name from email
 */
function extractNameFromEmail(email: string): string {
  const [localPart] = email.split('@');
  return localPart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Generate sample CSV template
 */
export function generateSampleCSVTemplate(): string {
  const headers = 'Email,Name,Role,Workspace';
  const sampleData = [
    'john.doe@example.com,John Doe,user,Main Workspace',
    'jane.smith@example.com,Jane Smith,user,Main Workspace',
    'bob.johnson@example.com,Bob Johnson,admin,Admin Workspace'
  ];
  
  return [headers, ...sampleData].join('\n');
}

/**
 * Validate CSV structure
 */
export function validateCSVStructure(csvText: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
      errors.push('CSV file must contain headers and at least one data row');
      return { isValid: false, errors };
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    if (!headers.some(h => h.includes('email'))) {
      errors.push('CSV must contain an email column');
    }
    
    // Check for data rows
    if (lines.length === 1) {
      errors.push('CSV file contains no data rows');
    }
    
    return { isValid: errors.length === 0, errors };
  } catch (error) {
    errors.push('Failed to parse CSV file');
    return { isValid: false, errors };
  }
}