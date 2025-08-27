'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { authenticatedFetch } from '@/lib/utils';
import { Customer } from '@/types';
import { Search, X, User, Building2, Phone, Mail } from 'lucide-react';

interface CustomerAutocompleteProps {
  onChange: (value: string) => void;
  onCustomerSelect?: (customer: Customer | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowCreate?: boolean;
}

export function CustomerAutocomplete({
  onChange,
  onCustomerSelect,
  placeholder = 'Search customers...',
  className = '',
  disabled = false,
  allowCreate = false,
}: CustomerAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isSelecting, setIsSelecting] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    console.log('useEffect triggered:', {
      searchQuery,
      isSelecting,
      selectedCustomer: selectedCustomer?.name,
    });

    if (isSelecting) {
      setIsSelecting(false);
      return;
    }

    // Don't search if we have a selected customer
    if (selectedCustomer) {
      console.log('Customer selected, preventing search');
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (searchQuery.trim().length >= 2) {
      searchCustomers(searchQuery);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, isSelecting, selectedCustomer]);

  const searchCustomers = async (query: string) => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `/api/customers/search?q=${encodeURIComponent(query)}&limit=10`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuggestions(data.data);
          // Only open dropdown if we don't have a selected customer
          if (!selectedCustomer) {
            setIsOpen(data.data.length > 0);
          }
        }
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    console.log('Customer selected:', customer.name);
    // Immediately close dropdown and clear suggestions
    setIsOpen(false);
    setSuggestions([]);

    setSelectedCustomer(customer);
    setIsSelecting(true);
    onChange(customer.name);
    onCustomerSelect?.(customer);

    // Set search query after a small delay to avoid triggering useEffect
    setTimeout(() => {
      setSearchQuery(customer.name);
    }, 50);
  };

  const handleClear = () => {
    setSelectedCustomer(null);
    setSearchQuery('');
    onChange('');
    onCustomerSelect?.(null);
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);

    // Clear selected customer if user types something different
    if (selectedCustomer && newValue !== selectedCustomer.name) {
      setSelectedCustomer(null);
      onCustomerSelect?.(null);
    }

    if (!newValue) {
      setSelectedCustomer(null);
      onCustomerSelect?.(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Enter' &&
      allowCreate &&
      searchQuery.trim() &&
      suggestions.length === 0
    ) {
      e.preventDefault();
      // Create a temporary customer object for new customer
      const newCustomer: Customer = {
        _id: 'temp-' + Date.now(),
        name: searchQuery.trim(),
        phone: '',
        customerType: 'retail',
        creditLimit: 0,
        paymentTerms: 'immediate',
        isActive: true,
        tags: [],
        createdBy: '',
        updateHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      handleCustomerSelect(newCustomer);
    }
  };

  const getCustomerTypeIcon = (type: string) => {
    switch (type) {
      case 'corporate':
        return <Building2 className="h-4 w-4 text-purple-600" />;
      case 'wholesale':
        return <Building2 className="h-4 w-4 text-green-600" />;
      default:
        return <User className="h-4 w-4 text-blue-600" />;
    }
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'retail':
        return 'bg-blue-900 text-blue-200';
      case 'wholesale':
        return 'bg-green-900 text-green-200';
      case 'corporate':
        return 'bg-purple-900 text-purple-200';
      default:
        return 'bg-gray-700 text-gray-200';
    }
  };

  return (
    <TooltipProvider>
      <div
        ref={wrapperRef}
        className={`relative ${className}`}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-10 pr-10"
            onFocus={() => {
              // Only open dropdown if we have suggestions and no customer is selected
              if (suggestions.length > 0 && !selectedCustomer) {
                setIsOpen(true);
              } else if (selectedCustomer) {
                // If customer is selected, keep dropdown closed
                setIsOpen(false);
                setSuggestions([]);
              }
            }}
          />
          {selectedCustomer && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && !selectedCustomer && (
          <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center text-gray-400 text-sm">
                Searching...
              </div>
            ) : suggestions.length > 0 ? (
              <div className="py-1">
                {suggestions.map((customer) => (
                  <div
                    key={customer._id}
                    className="px-3 py-2.5 hover:bg-gray-800 cursor-pointer transition-colors duration-150 border-b border-gray-700 last:border-b-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCustomerSelect(customer);
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex-shrink-0">
                        {getCustomerTypeIcon(customer.customerType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-medium text-gray-100 truncate text-sm block max-w-[200px]">
                                {customer.name}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{customer.name}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Badge
                            className={`text-xs px-1.5 py-0.5 ${getCustomerTypeColor(
                              customer.customerType,
                            )}`}
                          >
                            {customer.customerType}
                          </Badge>
                        </div>

                        <div className="flex flex-col gap-1 text-xs text-gray-400">
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{customer.phone}</span>
                            </div>
                          )}

                          {customer.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="truncate block max-w-[200px]">
                                    {customer.email}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{customer.email}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          )}

                          {customer.company && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {customer.company}
                              </span>
                            </div>
                          )}

                          {customer.gstNumber && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">
                                GST: {customer.gstNumber}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim().length >= 2 ? (
              <div className="p-3 text-center text-gray-400 text-sm">
                {allowCreate ? (
                  <>No customers found. Press Enter to create new customer.</>
                ) : (
                  'No customers found.'
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
