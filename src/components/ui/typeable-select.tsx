'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, X } from 'lucide-react';

interface TypeableSelectOption {
  value: string;
  label: string;
}

interface TypeableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: TypeableSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function TypeableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  loading = false,
  className = '',
}: TypeableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] =
    useState<TypeableSelectOption[]>(options);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Find the selected option
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchQuery, options]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);

    // If user types an exact match, select it
    const exactMatch = options.find(
      (option) => option.label.toLowerCase() === newValue.toLowerCase(),
    );
    if (exactMatch) {
      onChange(exactMatch.value);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleOptionSelect = (option: TypeableSelectOption) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onChange('');
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length === 1) {
        handleOptionSelect(filteredOptions[0]);
      } else if (filteredOptions.length > 0) {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
    >
      <div className="relative">
        <Input
          value={isOpen ? searchQuery : selectedOption?.label || ''}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (!disabled && !loading) {
              setIsOpen(true);
              setSearchQuery('');
            }
          }}
          placeholder={loading ? 'Loading...' : placeholder}
          disabled={disabled || loading}
          className="pr-20"
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {value && !loading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled || loading}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled || loading}
            className="h-6 w-6 p-0 hover:bg-muted"
          >
            <ChevronDown
              className={`h-3 w-3 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </Button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            <div className="py-1">
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => handleOptionSelect(option)}
                >
                  <span className="text-sm">{option.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No options found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
