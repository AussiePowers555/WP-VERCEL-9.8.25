'use client';

import { useState, useEffect } from 'react';
import { InteractionFilters, InteractionSortOptions } from '@/types/interaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CalendarIcon, 
  X, 
  Search, 
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface InteractionFiltersPanelProps {
  filters: InteractionFilters;
  onFiltersChange: (filters: InteractionFilters) => void;
  sort: InteractionSortOptions;
  onSortChange: (sort: InteractionSortOptions) => void;
}

export function InteractionFiltersPanel({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
}: InteractionFiltersPanelProps) {
  const [localFilters, setLocalFilters] = useState<InteractionFilters>(filters);
  const [searchInput, setSearchInput] = useState(filters.searchQuery || '');

  // Sync local filters with parent
  useEffect(() => {
    setLocalFilters(filters);
    setSearchInput(filters.searchQuery || '');
  }, [filters]);

  // Apply filters
  const applyFilters = () => {
    onFiltersChange({
      ...localFilters,
      searchQuery: searchInput.trim() || undefined,
    });
  };

  // Clear filters
  const clearFilters = () => {
    const clearedFilters: InteractionFilters = {};
    setLocalFilters(clearedFilters);
    setSearchInput('');
    onFiltersChange(clearedFilters);
  };

  // Update local filter
  const updateFilter = <K extends keyof InteractionFilters>(
    key: K,
    value: InteractionFilters[K]
  ) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  // Remove filter
  const removeFilter = <K extends keyof InteractionFilters>(key: K) => {
    setLocalFilters(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  // Toggle array filter value
  const toggleArrayFilter = <K extends keyof InteractionFilters>(
    key: K,
    value: string
  ) => {
    const currentArray = (localFilters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    
    if (newArray.length === 0) {
      removeFilter(key);
    } else {
      updateFilter(key, newArray as InteractionFilters[K]);
    }
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    return Object.keys(localFilters).filter(key => {
      const value = localFilters[key as keyof InteractionFilters];
      return value !== undefined && value !== null && 
             (Array.isArray(value) ? value.length > 0 : true);
    }).length + (searchInput.trim() ? 1 : 0);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Filters & Sort
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">{getActiveFiltersCount()}</Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="text-xs"
          >
            Clear All
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Interactions</Label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search in situation, action, or outcome..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                className="pl-9"
              />
            </div>
            <Button onClick={applyFilters} size="sm" className="px-6">
              Search
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Case Number Filter */}
          <div className="space-y-2">
            <Label>Case Number</Label>
            <Input
              placeholder="e.g., 2025-001"
              value={localFilters.caseNumber || ''}
              onChange={(e) => updateFilter('caseNumber', e.target.value || undefined)}
            />
          </div>

          {/* Interaction Type Filter */}
          <div className="space-y-2">
            <Label>Interaction Type</Label>
            <div className="space-y-2">
              {['call', 'email', 'meeting', 'sms', 'note', 'document'].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={(localFilters.interactionType || []).includes(type as any)}
                    onCheckedChange={() => toggleArrayFilter('interactionType', type)}
                  />
                  <Label htmlFor={type} className="capitalize text-sm">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="space-y-2">
              {['urgent', 'high', 'medium', 'low'].map((priority) => (
                <div key={priority} className="flex items-center space-x-2">
                  <Checkbox
                    id={priority}
                    checked={(localFilters.priority || []).includes(priority as any)}
                    onCheckedChange={() => toggleArrayFilter('priority', priority)}
                  />
                  <Label htmlFor={priority} className="capitalize text-sm">
                    {priority}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="space-y-2">
              {['pending', 'in_progress', 'completed', 'follow_up_required'].map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={status}
                    checked={(localFilters.status || []).includes(status as any)}
                    onCheckedChange={() => toggleArrayFilter('status', status)}
                  />
                  <Label htmlFor={status} className="capitalize text-sm">
                    {status.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !localFilters.dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.dateFrom ? (
                    format(new Date(localFilters.dateFrom), 'PPP')
                  ) : (
                    "Select date"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={localFilters.dateFrom ? new Date(localFilters.dateFrom) : undefined}
                  onSelect={(date) => 
                    updateFilter('dateFrom', date ? date.toISOString() : undefined)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !localFilters.dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.dateTo ? (
                    format(new Date(localFilters.dateTo), 'PPP')
                  ) : (
                    "Select date"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={localFilters.dateTo ? new Date(localFilters.dateTo) : undefined}
                  onSelect={(date) => 
                    updateFilter('dateTo', date ? date.toISOString() : undefined)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Sort Options */}
        <div className="space-y-2">
          <Label>Sort By</Label>
          <div className="flex space-x-2">
            <Select
              value={sort.field}
              onValueChange={(value) => 
                onSortChange({ ...sort, field: value as any })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timestamp">Date & Time</SelectItem>
                <SelectItem value="caseNumber">Case Number</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => 
                onSortChange({ 
                  ...sort, 
                  direction: sort.direction === 'asc' ? 'desc' : 'asc' 
                })
              }
              className="flex items-center gap-2"
            >
              {sort.direction === 'asc' ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
              {sort.direction === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>
        </div>

        {/* Apply/Cancel Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div className="flex space-x-2">
            <Button onClick={applyFilters}>
              Apply Filters
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
          
          {/* Active Filters Summary */}
          {getActiveFiltersCount() > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} active
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}