'use client';

import { useState, useEffect, useCallback } from 'react';
import { InteractionFeedView, InteractionFilters, InteractionSortOptions } from '@/types/interaction';
import { getInteractions } from '@/lib/actions/interactions';
import { InteractionCard } from './interaction-card';
import { InteractionFiltersPanel } from './interaction-filters';
import { InteractionCreateForm } from './interaction-create-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Plus, 
  RefreshCw, 
  Filter,
  MessageSquare,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractionFeedProps {
  workspaceId?: number;
  caseId?: number;
  initialFilters?: InteractionFilters;
  compact?: boolean;
  showCreateForm?: boolean;
  maxHeight?: string;
}

export function InteractionFeed({ 
  workspaceId, 
  caseId,
  initialFilters = {}, 
  compact = false,
  showCreateForm = true,
  maxHeight = 'calc(100vh - 300px)'
}: InteractionFeedProps) {
  const [interactions, setInteractions] = useState<InteractionFeedView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Filter and sort state
  const [filters, setFilters] = useState<InteractionFilters>({
    ...initialFilters,
    ...(caseId && { caseId: caseId.toString() })
  });
  const [sort, setSort] = useState<InteractionSortOptions>({
    field: 'timestamp',
    direction: 'desc'
  });

  // Fetch interactions
  const fetchInteractions = useCallback(async (pageNum: number = 1, reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setRefreshing(true);
      }

      const result = await getInteractions(pageNum, 20, filters, sort, workspaceId);
      
      if (result.success && result.data) {
        if (reset) {
          setInteractions(result.data.interactions);
        } else {
          setInteractions(prev => [...prev, ...result.data!.interactions]);
        }
        setHasMore(result.data.hasMore);
        setTotalCount(result.data.totalCount);
        setPage(pageNum);
      } else {
        setError(result.error || 'Failed to load interactions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, sort, workspaceId]);

  // Load more interactions
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchInteractions(page + 1, false);
    }
  };

  // Refresh interactions
  const refresh = () => {
    fetchInteractions(1, true);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: InteractionFilters) => {
    setFilters(newFilters);
  };

  // Handle sort changes
  const handleSortChange = (newSort: InteractionSortOptions) => {
    setSort(newSort);
  };

  // Handle interaction created
  const handleInteractionCreated = (newInteraction: InteractionFeedView) => {
    setInteractions(prev => [newInteraction, ...prev]);
    setTotalCount(prev => prev + 1);
    setShowCreateDialog(false);
  };

  // Handle interaction updated
  const handleInteractionUpdated = (updatedInteraction: InteractionFeedView) => {
    setInteractions(prev => 
      prev.map(int => int.id === updatedInteraction.id ? updatedInteraction : int)
    );
  };

  // Handle interaction deleted
  const handleInteractionDeleted = (interactionId: number) => {
    setInteractions(prev => prev.filter(int => int.id !== interactionId));
    setTotalCount(prev => prev - 1);
  };

  // Initial load and filter/sort changes
  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  // Auto-refresh every 30 seconds for real-time feel
  useEffect(() => {
    if (!compact) {
      const interval = setInterval(() => {
        fetchInteractions(1, true);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchInteractions, compact]);

  if (loading && interactions.length === 0) {
    return <InteractionFeedSkeleton compact={compact} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {!compact && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Interactions Feed
            </h2>
            <p className="text-muted-foreground">
              {totalCount > 0 ? (
                <>Real-time feed of all customer interactions • {totalCount} total</>
              ) : (
                'No interactions have been logged yet'
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {Object.keys(filters).length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {Object.keys(filters).length}
                </Badge>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              Refresh
            </Button>
            
            {showCreateForm && (
              <Button
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Log Interaction
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && !compact && (
        <InteractionFiltersPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          sort={sort}
          onSortChange={handleSortChange}
        />
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {interactions.length === 0 && !loading && !error && (
        <Card>
          <CardHeader className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>No Interactions Yet</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              {filters && Object.keys(filters).length > 0 
                ? 'No interactions match your current filters. Try adjusting your search criteria.'
                : 'Start logging customer interactions to build a comprehensive record of all communications and actions.'
              }
            </CardDescription>
            {showCreateForm && (
              <Button 
                className="mt-4 gap-2" 
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Log First Interaction
              </Button>
            )}
          </CardHeader>
        </Card>
      )}

      {/* Interactions List */}
      {interactions.length > 0 && (
        <div 
          className={cn(
            "space-y-4",
            compact && "max-h-96 overflow-y-auto"
          )}
          style={{ maxHeight: compact ? undefined : maxHeight }}
        >
          {interactions.map((interaction, index) => (
            <InteractionCard
              key={`${interaction.id}-${index}`}
              interaction={interaction}
              onUpdate={handleInteractionUpdated}
              onDelete={handleInteractionDeleted}
              compact={compact}
            />
          ))}
          
          {/* Load More Button */}
          {hasMore && !compact && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={refreshing}
                className="gap-2"
              >
                {refreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    Load More ({totalCount - interactions.length} remaining)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Stats Footer */}
      {interactions.length > 0 && !compact && (
        <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Last updated: {new Date().toLocaleTimeString()}
            </span>
            <span>
              Showing {interactions.length} of {totalCount} interactions
            </span>
          </div>
          {refreshing && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Refreshing...
            </div>
          )}
        </div>
      )}

      {/* Create Interaction Dialog */}
      {showCreateDialog && showCreateForm && (
        <InteractionCreateForm
          caseId={caseId}
          workspaceId={workspaceId}
          onSuccess={handleInteractionCreated}
          onCancel={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
}

// Loading skeleton component
function InteractionFeedSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-6">
      {!compact && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      )}
      
      <div className="space-y-4">
        {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}