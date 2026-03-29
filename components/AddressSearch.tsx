'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DAWAAutocompleteResult } from '@/lib/types';

interface AddressSearchProps {
  size?: 'normal' | 'large';
  placeholder?: string;
  onSelect?: (id: string, tekst: string) => void;
  autoFocus?: boolean;
}

export function AddressSearch({
  size = 'normal',
  placeholder = 'Søg dansk adresse...',
  onSelect,
  autoFocus = false,
}: AddressSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<DAWAAutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    try {
      const res = await fetch(`/api/address?q=${encodeURIComponent(q)}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error('Søgning fejlede');
      const data: DAWAAutocompleteResult[] = await res.json();
      setSuggestions(data);
      setIsOpen(data.length > 0);
      setHighlightedIndex(-1);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setSuggestions([]);
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 200);
  }, [fetchSuggestions]);

  const handleSelect = useCallback((suggestion: DAWAAutocompleteResult) => {
    setQuery(suggestion.tekst);
    setSuggestions([]);
    setIsOpen(false);

    const id = suggestion.adresse.id;
    if (onSelect) {
      onSelect(id, suggestion.tekst);
    } else {
      router.push(`/analyse/${encodeURIComponent(id)}`);
    }
  }, [onSelect, router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSelect(suggestions[highlightedIndex]);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }, [isOpen, suggestions, highlightedIndex, handleSelect]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const inputClasses = size === 'large'
    ? 'w-full px-5 py-4 text-lg rounded-xl border-2 border-border focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/10 bg-white shadow-sm font-sans text-ink placeholder-gray-400 transition-all'
    : 'w-full px-4 py-2.5 text-base rounded-lg border border-border focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 bg-white font-sans text-ink placeholder-gray-400 transition-all';

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          className={inputClasses}
          aria-label="Adressesøgning"
          aria-autocomplete="list"
          aria-expanded={isOpen}
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-ocean border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && query.length === 0 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-lg">
            🔍
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-border rounded-xl shadow-xl overflow-hidden"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.adresse.id}
              role="option"
              aria-selected={index === highlightedIndex}
              className={`px-4 py-3 cursor-pointer text-sm font-sans transition-colors ${
                index === highlightedIndex
                  ? 'bg-ocean-light text-ocean'
                  : 'text-ink hover:bg-surface-1'
              } ${index > 0 ? 'border-t border-border' : ''}`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-400 flex-shrink-0">📍</span>
                <span>
                  <span className="font-medium">{suggestion.adresse.vejnavn} {suggestion.adresse.husnr}</span>
                  {suggestion.adresse.etage && <span>, {suggestion.adresse.etage}.</span>}
                  {suggestion.adresse.dør && <span> {suggestion.adresse.dør}</span>}
                  <span className="text-gray-500">, {suggestion.adresse.postnr} {suggestion.adresse.postnrnavn}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
