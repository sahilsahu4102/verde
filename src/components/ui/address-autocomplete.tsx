"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type GeocodedAddress = {
    display_name: string;
    lat: number;
    lon: number;
};

type NominatimResult = {
    display_name: string;
    lat: string;
    lon: string;
    place_id: number;
};

interface AddressAutocompleteProps {
    value: string;
    onChange: (address: string) => void;
    onSelect: (result: GeocodedAddress) => void;
    placeholder?: string;
    className?: string;
}

export function AddressAutocomplete({
    value,
    onChange,
    onSelect,
    placeholder = "Start typing your address...",
    className,
}: AddressAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchAddress = useCallback(async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`,
                {
                    headers: { "Accept-Language": "en" },
                }
            );
            const data: NominatimResult[] = await res.json();
            setSuggestions(data);
            setShowDropdown(data.length > 0);
        } catch {
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchAddress(val), 400);
    };

    const handleSelect = (result: NominatimResult) => {
        onChange(result.display_name);
        onSelect({
            display_name: result.display_name,
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon),
        });
        setShowDropdown(false);
        setSuggestions([]);
    };

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                    placeholder={placeholder}
                    className={cn("pl-9 bg-background", className)}
                    autoComplete="off"
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>

            {showDropdown && suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map((s) => (
                        <button
                            key={s.place_id}
                            type="button"
                            onClick={() => handleSelect(s)}
                            className="flex items-start gap-2 w-full px-3 py-2.5 text-left text-sm hover:bg-accent transition-colors border-b last:border-b-0"
                        >
                            <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                            <span className="line-clamp-2">{s.display_name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
