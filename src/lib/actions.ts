"use server";

import { revalidatePath } from "next/cache";
import { DatabaseService, ensureDatabaseInitialized } from "./database";
// Import from unified schema - SINGLE SOURCE OF TRUTH
import type {
  ContactFrontend as Contact,
  WorkspaceFrontend as Workspace
} from "./database-schema";

export async function addContact(contact: Omit<Contact, "id">) {
  try {
    ensureDatabaseInitialized();
    // Remove undefined values
    const cleanContact = Object.fromEntries(
      Object.entries(contact).filter(([_, value]) => value !== undefined)
    ) as Omit<Contact, "id">;
    console.log("Saving contact:", cleanContact);
        const newContact = await DatabaseService.createContact(cleanContact);
    console.log("Contact saved with ID:", newContact.id);
    revalidatePath("/contacts");
    return newContact;
  } catch (error) {
    console.error("Error adding contact: ", error);
    let errorMessage = "Failed to add contact to database";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

export async function updateContact(id: string, contact: Omit<Contact, "id">) {
  try {
    ensureDatabaseInitialized();
    // Remove undefined values and prepare updates
    const cleanContact = Object.fromEntries(
      Object.entries(contact).filter(([_, value]) => value !== undefined)
    ) as Partial<Contact>;

    await DatabaseService.updateContact(id, cleanContact);
    revalidatePath("/contacts");
  } catch (error) {
    console.error("Error updating contact: ", error);
    let errorMessage = "Failed to update contact";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

export async function deleteContact(id: string) {
  try {
    ensureDatabaseInitialized();
    await DatabaseService.deleteContact(id);
    revalidatePath("/contacts");
  } catch (error) {
    console.error("Error deleting contact: ", error);
    let errorMessage = "Failed to delete contact";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

export async function addWorkspace(workspace: Omit<Workspace, "id">) {
    try {
        ensureDatabaseInitialized();
                const newWorkspace = await DatabaseService.createWorkspace(workspace);
        revalidatePath("/workspaces");
        return newWorkspace;
    } catch (error) {
        console.error("Error adding workspace: ", error);
        let errorMessage = "Failed to add workspace";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        throw new Error(errorMessage);
    }
}

export async function updateWorkspace(id: string, workspace: Omit<Workspace, "id">) {
    try {
        ensureDatabaseInitialized();
                await DatabaseService.updateWorkspace(id, workspace);
        revalidatePath("/workspaces");
    } catch (error) {
        console.error("Error updating workspace: ", error);
        let errorMessage = "Failed to update workspace";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        throw new Error(errorMessage);
    }
}

export async function deleteWorkspace(id: string) {
    try {
        ensureDatabaseInitialized();
                await DatabaseService.deleteWorkspace(id);
        revalidatePath("/workspaces");
    } catch (error) {
        console.error("Error deleting workspace: ", error);
        let errorMessage = "Failed to delete workspace";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        throw new Error(errorMessage);
    }
}
