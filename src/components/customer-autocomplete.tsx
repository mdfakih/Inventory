'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { authenticatedFetch } from '@/lib/utils';
import { Customer } from '@/types';
import { Search, X, User, Building2, Phone, Mail } from 'lucide-react';

interface CustomerAutocompleteProps {
  onChange: (value: string) => void;
  onCustomerSelect?: (customer: Customer | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomerAutocomplete({
  onChange,
  onCustomerSelect,
  placeholder = "Search customers...",
  className = "",
  disabled = false
}: CustomerAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchCustomers(searchQuery);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [searchQuery]);

  const searchCustomers = async (query: string) => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/customers/search?q=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuggestions(data.data);
          setIsOpen(data.data.length > 0);
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
    setSelectedCustomer(customer);
    setSearchQuery(customer.name);
    onChange(customer.name);
    onCustomerSelect?.(customer);
    setIsOpen(false);
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
    
    if (!newValue) {
      setSelectedCustomer(null);
      onCustomerSelect?.(null);
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
      case 'retail': return 'bg-blue-100 text-blue-800';
      case 'wholesale': return 'bg-green-100 text-green-800';
      case 'corporate': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-10"
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
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
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <div>
              {suggestions.map((customer) => (
                <div
                  key={customer._id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <div className="flex items-center gap-3">
                    {getCustomerTypeIcon(customer.customerType)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {customer.name}
                        </span>
                        <Badge className={`text-xs ${getCustomerTypeColor(customer.customerType)}`}>
                          {customer.customerType}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{customer.phone}</span>
                        </div>
                        
                        {customer.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                        
                        {customer.company && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{customer.company}</span>
                          </div>
                        )}
                        
                        {customer.gstNumber && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
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
            <div className="p-4 text-center text-gray-500">
              No customers found. Press Enter to create new customer.
            </div>
          ) : null}
        </div>
      )}

      {/* Selected Customer Info */}
      {selectedCustomer && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getCustomerTypeIcon(selectedCustomer.customerType)}
              <div>
                <div className="font-medium text-blue-900">
                  {selectedCustomer.name}
                </div>
                <div className="text-sm text-blue-700">
                  {selectedCustomer.phone}
                  {selectedCustomer.email && ` • ${selectedCustomer.email}`}
                  {selectedCustomer.company && ` • ${selectedCustomer.company}`}
                  {selectedCustomer.gstNumber && ` • GST: ${selectedCustomer.gstNumber}`}
                </div>
              </div>
            </div>
            <Badge className={getCustomerTypeColor(selectedCustomer.customerType)}>
              {selectedCustomer.customerType}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
