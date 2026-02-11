import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Contact, AudienceFilters } from '@/types';
import { Filter, ChevronDown, X } from 'lucide-react';

const SQFT_OPTIONS = [
  { label: "500 sq ft", value: "500" },
  { label: "1,000 sq ft", value: "1000" },
  { label: "1,500 sq ft", value: "1500" },
  { label: "2,000 sq ft", value: "2000" },
  { label: "2,500 sq ft", value: "2500" },
  { label: "3,000 sq ft", value: "3000" },
  { label: "3,500 sq ft", value: "3500" },
  { label: "4,000 sq ft", value: "4000" },
  { label: "5,000+ sq ft", value: "5000" },
];

const BUDGET_OPTIONS = [
  { label: "₹30L", value: "3000000" },
  { label: "₹50L", value: "5000000" },
  { label: "₹1Cr", value: "10000000" },
  { label: "₹2Cr", value: "20000000" },
  { label: "₹3Cr", value: "30000000" },
  { label: "₹5Cr", value: "50000000" },
  { label: "₹10Cr", value: "100000000" },
  { label: "₹20Cr", value: "200000000" },
  { label: "₹50Cr", value: "500000000" },
];

interface AudienceFilterPanelProps {
  contacts: Contact[];
  filters: AudienceFilters;
  onFiltersChange: (filters: AudienceFilters) => void;
  onApplyFilters: () => void;
  matchingCount: number;
}

export function AudienceFilterPanel({
  contacts,
  filters,
  onFiltersChange,
  onApplyFilters,
  matchingCount,
}: AudienceFilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Compute distinct values from contacts
  const distinctValues = useMemo(() => {
    const propertyTypes = new Set<string>();
    const bedrooms = new Set<number>();
    const bathrooms = new Set<number>();
    const locations = new Set<string>();

    contacts.forEach((contact) => {
      if (contact.property_type) propertyTypes.add(contact.property_type);
      if (contact.bedrooms) bedrooms.add(contact.bedrooms);
      if (contact.bathrooms) bathrooms.add(contact.bathrooms);
      if (contact.preferred_location) locations.add(contact.preferred_location);
    });

    return {
      propertyTypes: Array.from(propertyTypes).sort(),
      bedrooms: Array.from(bedrooms).sort((a, b) => a - b),
      bathrooms: Array.from(bathrooms).sort((a, b) => a - b),
      locations: Array.from(locations).sort(),
    };
  }, [contacts]);

  const handlePropertyTypeToggle = (type: string) => {
    const current = filters.property_type || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onFiltersChange({ ...filters, property_type: updated.length ? updated : undefined });
  };

  const handleBedroomToggle = (num: number) => {
    const current = filters.bedrooms || [];
    const updated = current.includes(num)
      ? current.filter((n) => n !== num)
      : [...current, num];
    onFiltersChange({ ...filters, bedrooms: updated.length ? updated : undefined });
  };

  const handleBathroomToggle = (num: number) => {
    const current = filters.bathrooms || [];
    const updated = current.includes(num)
      ? current.filter((n) => n !== num)
      : [...current, num];
    onFiltersChange({ ...filters, bathrooms: updated.length ? updated : undefined });
  };

  const handleLocationToggle = (loc: string) => {
    const current = filters.preferred_location || [];
    const updated = current.includes(loc)
      ? current.filter((l) => l !== loc)
      : [...current, loc];
    onFiltersChange({ ...filters, preferred_location: updated.length ? updated : undefined });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : v !== '')
  );

  return (
    <div className="border rounded-lg bg-muted/30">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">Contact Filters</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {matchingCount} matching
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''
                  }`}
              />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4">
            {/* Property Type */}
            {distinctValues.propertyTypes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase">
                  Property Type
                </Label>
                <div className="flex flex-wrap gap-2">
                  {distinctValues.propertyTypes.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted transition-colors text-sm"
                    >
                      <Checkbox
                        checked={filters.property_type?.includes(type)}
                        onCheckedChange={() => handlePropertyTypeToggle(type)}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Bedrooms & Bathrooms */}
            <div className="grid grid-cols-2 gap-4">
              {distinctValues.bedrooms.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase">
                    Bedrooms
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {distinctValues.bedrooms.map((num) => (
                      <label
                        key={num}
                        className="flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted transition-colors text-sm"
                      >
                        <Checkbox
                          checked={filters.bedrooms?.includes(num)}
                          onCheckedChange={() => handleBedroomToggle(num)}
                        />
                        {num}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {distinctValues.bathrooms.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase">
                    Bathrooms
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {distinctValues.bathrooms.map((num) => (
                      <label
                        key={num}
                        className="flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted transition-colors text-sm"
                      >
                        <Checkbox
                          checked={filters.bathrooms?.includes(num)}
                          onCheckedChange={() => handleBathroomToggle(num)}
                        />
                        {num}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Budget Range */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase">
                Budget Range
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select
                    value={filters.budget_min?.toString() || ''}
                    onValueChange={(value) =>
                      onFiltersChange({
                        ...filters,
                        budget_min: value === "none" ? undefined : Number(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Min Budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {BUDGET_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={filters.budget_max?.toString() || ''}
                    onValueChange={(value) =>
                      onFiltersChange({
                        ...filters,
                        budget_max: value === "none" ? undefined : Number(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Max Budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {BUDGET_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Square Feet Range */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase">
                Square Feet
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select
                    value={filters.square_feet_min?.toString() || ''}
                    onValueChange={(value) =>
                      onFiltersChange({
                        ...filters,
                        square_feet_min: value === "none" ? undefined : Number(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Min Sq Ft" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {SQFT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={filters.square_feet_max?.toString() || ''}
                    onValueChange={(value) =>
                      onFiltersChange({
                        ...filters,
                        square_feet_max: value === "none" ? undefined : Number(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Max Sq Ft" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {SQFT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Preferred Location */}
            {distinctValues.locations.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase">
                  Preferred Location
                </Label>
                <div className="flex flex-wrap gap-2">
                  {distinctValues.locations.map((loc) => (
                    <label
                      key={loc}
                      className="flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted transition-colors text-sm"
                    >
                      <Checkbox
                        checked={filters.preferred_location?.includes(loc)}
                        onCheckedChange={() => handleLocationToggle(loc)}
                      />
                      {loc}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
              >
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </Button>
              <Button size="sm" onClick={onApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
