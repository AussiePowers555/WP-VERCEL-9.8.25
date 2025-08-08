"use server";

// Simplified email generation without AI dependencies
// AI features temporarily disabled to resolve build warnings
// Can be re-enabled by reinstalling @genkit-ai packages

export type GenerateAiAssistedEmailTemplatesInput = {
    caseDetails: string;
    tone: 'professional' | 'firm' | 'friendly' | 'formal' | 'urgent' | 'apologetic' | 'persuasive';
    purpose: string;
};

export async function generateEmailAction(input: GenerateAiAssistedEmailTemplatesInput) {
    try {
        // Simplified template generation without AI
        const templates = generateTemplatesByTone(input);
        return { success: true, data: templates };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: `Failed to generate email: ${errorMessage}` };
    }
}

function generateTemplatesByTone(input: GenerateAiAssistedEmailTemplatesInput) {
    const { caseDetails, tone, purpose } = input;
    
    const templates: Record<string, string> = {
        professional: `Dear [Client Name],

We are writing regarding ${purpose} for ${caseDetails}.

We kindly request your attention to this matter at your earliest convenience.

Best regards,
PBikeRescue Team`,
        
        firm: `URGENT: ${purpose}

Re: ${caseDetails}

This matter requires immediate attention. Please respond within 48 hours to avoid further action.

Regards,
PBikeRescue Collections`,
        
        friendly: `Hi [Client Name],

Hope you're doing well! Just a quick note about ${purpose} regarding ${caseDetails}.

Let us know if you have any questions - we're here to help!

Cheers,
PBikeRescue Team`,

        formal: `To Whom It May Concern,

Re: ${caseDetails}

We formally request your attention to ${purpose}.

Please acknowledge receipt of this correspondence.

Sincerely,
PBikeRescue Legal Department`,

        urgent: `IMMEDIATE ACTION REQUIRED

${caseDetails}

This is a time-sensitive matter regarding ${purpose}. Response required within 24 hours.

PBikeRescue Urgent Response Team`,

        apologetic: `Dear [Client Name],

We sincerely apologize for any inconvenience regarding ${caseDetails}.

We're reaching out about ${purpose} and want to resolve this matter promptly.

With apologies,
PBikeRescue Customer Care`,

        persuasive: `Dear [Client Name],

We have an important opportunity regarding ${caseDetails}.

${purpose} - We believe this will be mutually beneficial and urge you to consider our proposal.

Looking forward to your positive response,
PBikeRescue Team`
    };
    
    const selectedTone = templates[tone] || templates.professional;
    
    return {
        templates: Object.entries(templates).map(([t, content]) => ({ tone: t, content })),
        selectedTemplate: selectedTone
    };
}