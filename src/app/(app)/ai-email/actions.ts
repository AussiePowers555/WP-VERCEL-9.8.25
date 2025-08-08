"use server";

// Simplified email generation without AI dependencies
// AI features temporarily disabled to resolve build warnings
// Can be re-enabled by reinstalling @genkit-ai packages

export type GenerateAiAssistedEmailTemplatesInput = {
    caseDetails: string;
    tone: 'professional' | 'firm' | 'friendly';
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
    
    const templates = {
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
PBikeRescue Team`
    };
    
    return {
        templates: [
            { tone: 'professional', content: templates.professional },
            { tone: 'firm', content: templates.firm },
            { tone: 'friendly', content: templates.friendly }
        ],
        selectedTemplate: templates[tone]
    };
}