import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X, Globe, Building2, Navigation } from 'lucide-react';
import { LocationResult, searchGlobalPlaces } from '@/lib/geoService';
import { calculateDistanceKm } from '@/lib/store';

export interface LocationSearchProps {
  onSelectLocation: (loc: LocationResult) => void;
  userCoords?: { latitude: number; longitude: number } | null;
  placeholder?: string;
  initialValue?: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  onSelectLocation,
  userCoords,
  placeholder = 'Buscá tu cancha, complejo o predio en cualquier país...',
  initialValue = '',
}) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchGlobalPlaces(query, userCoords);
        setResults(data);
      } catch (e) {
        console.error('Error fetching global places:', e);
      } finally {
        setLoading(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [query, userCoords]);

  // Close when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSelect = (item: LocationResult) => {
    setQuery(item.name);
    setIsOpen(false);
    onSelectLocation(item);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-[#00F0FF]">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-[#1E2228] text-white border border-[#2A2F37] focus:border-[#00F0FF] rounded-2xl pl-10 pr-9 py-2.5 text-xs font-semibold placeholder-[#A0AAB4] focus:outline-none transition-all shadow-inner caret-[#00E676]"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 p-1 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-[#1E2228] border border-[#2A2F37] rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
          {/* Header pill indicator */}
          <div className="px-3 py-2 bg-[#121417] border-b border-[#2A2F37] flex items-center justify-between text-[10px] font-bold text-[#A0AAB4]">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#00F0FF]" /> Búsqueda Global (Sin restricción de país)
            </span>
            {loading && <span className="text-[#00F0FF]">Buscando canchas...</span>}
          </div>

          {results.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#A0AAB4] space-y-1">
              {loading ? (
                <p>Consultando satélites y geocodificadores...</p>
              ) : query.length >= 2 ? (
                <>
                  <p className="font-bold text-gray-300">No encontramos resultados para "{query}"</p>
                  <p className="text-[11px]">Podés probar con el nombre de la calle, barrio o ciudad.</p>
                </>
              ) : (
                <p>Escribí el nombre de un club, complejo o ciudad para autocompletar.</p>
              )}
            </div>
          ) : (
            results.map((item) => {
              const distance =
                userCoords && typeof item.lat === 'number' && typeof item.lng === 'number'
                  ? calculateDistanceKm(
                      userCoords.latitude,
                      userCoords.longitude,
                      item.lat,
                      item.lng
                    )
                  : null;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full text-left p-3 hover:bg-[#252B33] border-b border-[#2A2F37]/50 flex items-start justify-between gap-3 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-[#121417] border border-[#2A2F37] text-[#00F0FF] group-hover:bg-[#0F4C3A] group-hover:text-white transition-colors shrink-0 mt-0.5">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-white group-hover:text-[#00F0FF] transition-colors truncate">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-[#A0AAB4] line-clamp-1">
                        {item.formattedAddress}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.city && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#121417] text-gray-300 border border-[#2A2F37]">
                            {item.city}
                          </span>
                        )}
                        {item.country && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#0F4C3A]/40 text-emerald-300 border border-[#1b6a52]">
                            {item.country}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {distance !== null && (
                      <span className="text-[10px] font-bold text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded-full border border-[#00F0FF]/20 flex items-center gap-0.5">
                        <Navigation className="w-2.5 h-2.5" />
                        {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
