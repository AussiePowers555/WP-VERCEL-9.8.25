'use client';

import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { InteractionFeedView } from '@/types/interaction';
import { updateInteraction, deleteInteraction } from '@/lib/actions/interactions';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Phone, 
  Mail, 
  Users, 
  FileText, 
  MessageSquare,
  Smartphone,
  MoreHorizontal,
  Edit,
  Trash,
  Clock,
  User,
  Building,
  AlertCircle,
  CheckCircle,
  Clock4,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface InteractionCardProps {
  interaction: InteractionFeedView;
  onUpdate?: (interaction: InteractionFeedView) => void;
  onDelete?: (interactionId: number) => void;
  compact?: boolean;
  showActions?: boolean;
}

export function InteractionCard({ 
  interaction, 
  onUpdate, 
  onDelete, 
  compact = false,
  showActions = true
}: InteractionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  // Get interaction type icon and styling
  const getInteractionTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'sms':
        return <Smartphone className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getInteractionTypeColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'email':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'meeting':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'sms':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'document':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Get priority styling
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'in_progress':
        return <Clock4 className="h-3 w-3" />;
      case 'follow_up_required':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteInteraction(interaction.id);
      
      if (result.success) {
        toast({
          title: "Interaction deleted",
          description: "The interaction has been removed successfully.",
        });
        onDelete?.(interaction.id);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete interaction",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Get user initials
  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md",
        interaction.priority === 'urgent' && "border-red-200 shadow-red-50",
        compact && "shadow-sm"
      )}>
        <CardHeader className={cn(
          "pb-3",
          compact && "pb-2 pt-3"
        )}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <Avatar className={cn("h-8 w-8", compact && "h-6 w-6")}>
                <AvatarImage src="#" alt={interaction.createdByName} />
                <AvatarFallback className="text-xs">
                  {getUserInitials(interaction.createdByName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                {/* Header Info */}
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm truncate">
                    {interaction.createdByName || 'Unknown User'}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs px-2 py-0.5 gap-1",
                      getInteractionTypeColor(interaction.interactionType)
                    )}
                  >
                    {getInteractionTypeIcon(interaction.interactionType)}
                    {interaction.interactionType.charAt(0).toUpperCase() + interaction.interactionType.slice(1)}
                  </Badge>
                </div>
                
                {/* Case and Contact Info */}
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Building className="h-3 w-3" />
                    <span className="font-medium">Case {interaction.caseNumber}</span>
                  </div>
                  {interaction.contactName && (
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{interaction.contactName}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span title={format(new Date(interaction.timestamp), 'PPpp')}>
                      {formatDistanceToNow(new Date(interaction.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions and Priority */}
            <div className="flex items-center space-x-2">
              {/* Priority Badge */}
              <Badge 
                variant="outline" 
                className={cn("text-xs", getPriorityColor(interaction.priority))}
              >
                {interaction.priority}
              </Badge>
              
              {/* Status */}
              <div className={cn(
                "flex items-center space-x-1 text-xs px-2 py-1 rounded-full",
                interaction.status === 'completed' && "bg-green-100 text-green-700",
                interaction.status === 'in_progress' && "bg-blue-100 text-blue-700",
                interaction.status === 'follow_up_required' && "bg-orange-100 text-orange-700",
                interaction.status === 'pending' && "bg-gray-100 text-gray-700"
              )}>
                {getStatusIcon(interaction.status)}
                <span>{interaction.status.replace('_', ' ')}</span>
              </div>
              
              {/* Actions Menu */}
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Interaction
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="gap-2 text-red-600"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash className="h-4 w-4" />
                      Delete Interaction
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className={cn("space-y-4", compact && "pt-0 space-y-2")}>
          {/* Situation */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Situation
            </h4>
            <p className={cn(
              "text-sm text-gray-700 dark:text-gray-300 leading-relaxed",
              compact && "line-clamp-2"
            )}>
              {interaction.situation}
            </p>
          </div>
          
          {!compact && (
            <>
              {/* Action */}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  Action Taken
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {interaction.actionTaken}
                </p>
              </div>
              
              {/* Outcome */}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Outcome
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {interaction.outcome}
                </p>
              </div>
              
              {/* Tags */}
              {interaction.tags && interaction.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {interaction.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Contact Details */}
              {(interaction.contactPhone || interaction.contactEmail) && (
                <div className="flex items-center space-x-4 pt-2 text-xs text-muted-foreground border-t">
                  {interaction.contactPhone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>{interaction.contactPhone}</span>
                    </div>
                  )}
                  {interaction.contactEmail && (
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3 w-3" />
                      <span>{interaction.contactEmail}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this interaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}