'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateInteractionData, InteractionFeedView } from '@/types/interaction';
import { createInteraction } from '@/lib/actions/interactions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Mail, 
  Users, 
  FileText, 
  MessageSquare,
  Smartphone,
  Loader2,
  Plus,
  X,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Form validation schema
const interactionSchema = z.object({
  caseId: z.string().min(1, 'Please select a case'),
  interactionType: z.enum(['call', 'email', 'meeting', 'sms', 'note', 'document']),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  situation: z.string().min(10, 'Situation must be at least 10 characters'),
  actionTaken: z.string().min(10, 'Action taken must be at least 10 characters'),
  outcome: z.string().min(10, 'Outcome must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed', 'follow_up_required']).default('completed'),
  tags: z.array(z.string()).default([]),
});

type InteractionFormData = z.infer<typeof interactionSchema>;

interface Case {
  id: string;
  caseNumber: string;
  clientName: string;
  status: string;
}

interface InteractionCreateEnhancedProps {
  workspaceId?: string;
  contactId?: string;
  isWorkspaceUser?: boolean;
  onSuccess?: (interaction: InteractionFeedView) => void;
  onCancel?: () => void;
  open?: boolean;
}

export function InteractionCreateEnhanced({
  workspaceId,
  contactId,
  isWorkspaceUser,
  onSuccess,
  onCancel,
  open = true,
}: InteractionCreateEnhancedProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch cases for the user
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoadingCases(true);
        
        // Build query params based on user type
        const params = new URLSearchParams();
        if (isWorkspaceUser && contactId) {
          // For workspace users, get cases assigned to them
          params.append('contactId', contactId);
        } else if (workspaceId && workspaceId !== 'MAIN') {
          // For admins with specific workspace
          params.append('workspaceId', workspaceId);
        }
        
        const response = await fetch(`/api/cases?${params.toString()}`);
        const data = await response.json();
        
        if (data.success && data.cases) {
          // Filter to only show cases this user can post to
          const filteredCases = isWorkspaceUser && contactId
            ? data.cases.filter((c: any) => 
                c.assigned_lawyer_id === contactId || 
                c.assigned_rental_company_id === contactId
              )
            : data.cases;
            
          setCases(filteredCases.map((c: any) => ({
            id: c.id,
            caseNumber: c.caseNumber,
            clientName: c.clientName,
            status: c.status
          })));
        }
      } catch (error) {
        console.error('Failed to fetch cases:', error);
        toast({
          title: 'Error',
          description: 'Failed to load cases. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoadingCases(false);
      }
    };

    if (open) {
      fetchCases();
    }
  }, [open, isWorkspaceUser, contactId, workspaceId, toast]);

  const form = useForm<InteractionFormData>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      caseId: '',
      interactionType: 'call',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      situation: '',
      actionTaken: '',
      outcome: '',
      priority: 'medium',
      status: 'completed',
      tags: [],
    },
  });

  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues('tags');
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue('tags', [...currentTags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(t => t !== tag));
  };

  const onSubmit = async (data: InteractionFormData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create an interaction.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Find the selected case
      const selectedCase = cases.find(c => c.id === data.caseId);
      if (!selectedCase) {
        throw new Error('Selected case not found');
      }

      const interactionData: CreateInteractionData = {
        caseNumber: selectedCase.caseNumber,
        caseId: parseInt(data.caseId),
        interactionType: data.interactionType,
        contactName: data.contactName || undefined,
        contactPhone: data.contactPhone || undefined,
        contactEmail: data.contactEmail || undefined,
        situation: data.situation,
        actionTaken: data.actionTaken,
        outcome: data.outcome,
        priority: data.priority,
        status: data.status,
        tags: data.tags,
      };

      const result = await createInteraction(interactionData, user.id, workspaceId || 'MAIN');

      if (result.success && result.data) {
        toast({
          title: 'Success',
          description: 'Interaction logged successfully.',
        });

        // Create a feed view for the new interaction
        const feedView: InteractionFeedView = {
          ...result.data,
          caseHirerName: selectedCase.clientName,
          caseStatus: selectedCase.status,
          insuranceCompany: '',
          lawyerAssigned: '',
          rentalCompany: '',
          incidentDate: new Date(),
          createdByName: user.name || user.email || 'Unknown',
          createdByEmail: user.email || '',
        };

        onSuccess?.(feedView);
        form.reset();
      } else {
        throw new Error(result.error || 'Failed to create interaction');
      }
    } catch (error) {
      console.error('Error creating interaction:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create interaction. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onCancel?.()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Log New Interaction
          </DialogTitle>
          <DialogDescription>
            Record a customer interaction for your assigned cases.
          </DialogDescription>
        </DialogHeader>

        {loadingCases ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : cases.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No cases available. {isWorkspaceUser 
                ? "You need to be assigned to a case to log interactions." 
                : "Please create a case first."}
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Case Selection */}
              <FormField
                control={form.control}
                name="caseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Case *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a case to log interaction for" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cases.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.caseNumber} - {c.clientName} ({c.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the case this interaction relates to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Interaction Type */}
              <FormField
                control={form.control}
                name="interactionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interaction Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select interaction type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="call">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone Call
                          </div>
                        </SelectItem>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="meeting">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Meeting
                          </div>
                        </SelectItem>
                        <SelectItem value="sms">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            SMS/Text
                          </div>
                        </SelectItem>
                        <SelectItem value="document">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Document
                          </div>
                        </SelectItem>
                        <SelectItem value="note">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Note
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+61 400 000 000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Situation, Action, Outcome */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="situation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situation *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the current situation, context, or issue that prompted this interaction..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        What was happening? What was the context or background?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="actionTaken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action Taken *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the specific actions, steps, or interventions taken during this interaction..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        What did you do? What steps were taken?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="outcome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outcome *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the result, resolution, or next steps from this interaction..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        What was the result? What are the next steps?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Priority and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="follow_up_required">Follow-up Required</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tags */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a tag..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={addTag}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <FormDescription>
                      Add tags to categorize this interaction
                    </FormDescription>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Interaction'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}