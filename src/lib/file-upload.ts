/*
  lib/file-upload.ts
  ------------------
  Local file system storage helper utilities.

  Why this file?
  1. Centralises all Storage access logic in **one place** so future LLM
     edits are trivial (single-responsibility principle).
  2. Keeps route-handlers lean and readable.

  Public surface (minimal but expressive):
  ---------------------------------------
  • uploadPdfToCase(pdfBuffer, caseNumber, docType)
      ‑ Saves a PDF buffer to file system at
        `uploads/cases/<CASE_NUMBER>/<DOC_TYPE>-<ISO>.pdf` and returns the public URL.

  • ensureCaseFolder(caseNumber)
      ‑ Creates the directory structure if it doesn't exist.
        Idempotent – safe to call repeatedly.
*/
import * as fs from 'fs/promises';
import * as path from 'path';

// Base upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Helper to upload a PDF buffer and get a download URL
export async function uploadPdfToCase(
  pdfBuffer: Buffer,
  caseNumber: string,
  docType: string
): Promise<string> {
  // Create directory structure
  const caseDir = path.join(UPLOAD_DIR, 'cases', caseNumber);
  await fs.mkdir(caseDir, { recursive: true });
  
  const fileName = `${docType}-${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`;
  const filePath = path.join(caseDir, fileName);
  
  // Write file
  await fs.writeFile(filePath, pdfBuffer);
  
  // Return public URL path
  return `/uploads/cases/${caseNumber}/${fileName}`;
}

// Ensure a case folder exists by creating the directory
export async function ensureCaseFolder(caseNumber: string): Promise<void> {
  const caseDir = path.join(UPLOAD_DIR, 'cases', caseNumber);
  await fs.mkdir(caseDir, { recursive: true });
}

// Additional helper to upload any file type
export async function uploadFile(
  fileBuffer: Buffer,
  folder: string,
  fileName: string
): Promise<string> {
  const dirPath = path.join(UPLOAD_DIR, folder);
  await fs.mkdir(dirPath, { recursive: true });
  
  const filePath = path.join(dirPath, fileName);
  await fs.writeFile(filePath, fileBuffer);
  
  return `/uploads/${folder}/${fileName}`;
}

// Helper to delete a file
export async function deleteFile(relativePath: string): Promise<void> {
  const filePath = path.join(UPLOAD_DIR, relativePath);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore if file doesn't exist
    if ((error as any).code !== 'ENOENT') {
      throw error;
    }
  }
}

// Helper to check if file exists
export async function fileExists(relativePath: string): Promise<boolean> {
  const filePath = path.join(UPLOAD_DIR, relativePath);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
