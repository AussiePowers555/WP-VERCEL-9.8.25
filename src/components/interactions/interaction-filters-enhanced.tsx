'use client';

import { useState, useEffect } from 'react';
import { InteractionFilters, InteractionSortOptions } from '@/types/interaction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Filter, 
  ArrowUpDown, 
  Calendar,
  Search,
  Building2,
  Briefcase,
  Car,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractionFiltersPanelProps {
  filters: InteractionFilters;
  onFiltersChange: (filters: InteractionFilters) => void;
  sort: InteractionSortOptions;
  onSortChange: (sort: InteractionSortOptions) => void;
  onExport?: () => void;
  insuranceCompanies?: string[];
  lawyers?: string[];
  rentalCompanies?: string[];
  caseNumbers?: string[];
}

export function InteractionFiltersPanelEnhanced({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  onExport,
  insuranceCompanies = [],
  lawyers = [],
  rentalCompanies = [],
  caseNumbers = []
}: InteractionFiltersPanelProps) {
  const [localFilters, setLocalFilters] = useState<InteractionFilters>(filters);
  const [isOpen, setIsOpen] = useState(false);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof InteractionFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const clearFilters = () => {
    const emptyFilters: InteractionFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const handleSortChange = (field: string) => {
    if (field === 'lastModified') {
      onSortChange({ field: 'timestamp', direction: 'desc' });
    } else {
      onSortChange({
        field: field as any,
        direction: sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc'
      });
    }
  };

  const activeFilterCount = Object.keys(localFilters).filter(key => {
    const value = localFilters[key as keyof InteractionFilters];
    return value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0);
  }).length;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filters & Sorting
            </CardTitle>
            <CardDescription>
              Filter and sort interactions by various criteria
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick Sort Buttons */}
            <Button
              variant={sort.field === 'timestamp' && sort.direction === 'desc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('lastModified')}
              className="gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              Last Modified
            </Button>
            
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export to Excel
              </Button>
            )}
            
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Case Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Case Number
            </Label>
            <Select
              value={localFilters.caseNumber || ''}
              onValueChange={(value) => handleFilterChange('caseNumber', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All cases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All cases</SelectItem>
                {caseNumbers.map(caseNum => (
                  <SelectItem key={caseNum} value={caseNum}>
                    {caseNum}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Insurance Company Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Insurance Company
            </Label>
            <Select
              value={localFilters.insuranceCompany || ''}
              onValueChange={(value) => handleFilterChange('insuranceCompany', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All insurance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All insurance</SelectItem>
                {insuranceCompanies.map(company => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lawyer Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Lawyer Assigned
            </Label>
            <Select
              value={localFilters.lawyerAssigned || ''}
              onValueChange={(value) => handleFilterChange('lawyerAssigned', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All lawyers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All lawyers</SelectItem>
                {lawyers.map(lawyer => (
                  <SelectItem key={lawyer} value={lawyer}>
                    {lawyer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rental Company Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Rental Company
            </Label>
            <Select
              value={localFilters.rentalCompany || ''}
              onValueChange={(value) => handleFilterChange('rentalCompany', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All rental companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All rental companies</SelectItem>
                {rentalCompanies.map(company => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interaction Type Filter */}
          <div className="space-y-2">
            <Label>Interaction Type</Label>
            <Select
              value={localFilters.interactionType?.[0] || ''}
              onValueChange={(value) => handleFilterChange('interactionType', value ? [value] : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="call">Phone Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="document">Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={localFilters.priority?.[0] || ''}
              onValueChange={(value) => handleFilterChange('priority', value ? [value] : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={localFilters.status?.[0] || ''}
              onValueChange={(value) => handleFilterChange('status', value ? [value] : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="follow_up_required">Follow-up Required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Query */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Label>
            <Input
              type="text"
              placeholder="Search in content..."
              value={localFilters.searchQuery || ''}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value || undefined)}
            />
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date From
            </Label>
            <Input
              type="date"
              value={localFilters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date To
            </Label>
            <Input
              type="date"
              value={localFilters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocalFilters(filters)}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
            
            <Button
              size="sm"
              onClick={applyFilters}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}