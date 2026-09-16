export interface LocationResult {
  id: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  country?: string;
  city?: string;
  source: 'google_places' | 'openstreetmap' | 'local_verified';
}

// Global cached sports complexes to ensure immediate instant results for popular queries
const POPULAR_GLOBAL_VENUES: LocationResult[] = [
  // Argentina
  {
    id: 'salguero-palermo',
    name: 'Salguero Fútbol',
    formattedAddress: 'Jerónimo Salguero 3450, Palermo, Buenos Aires, Argentina',
    lat: -34.5772,
    lng: -58.4061,
    country: 'Argentina',
    city: 'Buenos Aires',
    source: 'local_verified',
  },
  {
    id: 'el-predio-palermo',
    name: 'Complejo El Predio',
    formattedAddress: 'Av. Dorrego 2800, Palermo, Buenos Aires, Argentina',
    lat: -34.5715,
    lng: -58.431,
    country: 'Argentina',
    city: 'Buenos Aires',
    source: 'local_verified',
  },
  {
    id: 'la-cancha-villa-urquiza',
    name: 'La Cancha Fútbol 5',
    formattedAddress: 'Monroe 5120, Villa Urquiza, Buenos Aires, Argentina',
    lat: -34.5732,
    lng: -58.487,
    country: 'Argentina',
    city: 'Buenos Aires',
    source: 'local_verified',
  },
  {
    id: 'canchas-ribera-vicente-lopez',
    name: 'Canchas de la Ribera',
    formattedAddress: 'Laprida 150, Vicente López, Buenos Aires, Argentina',
    lat: -34.5262,
    lng: -58.4682,
    country: 'Argentina',
    city: 'Vicente López',
    source: 'local_verified',
  },
  // España / Europa
  {
    id: 'complejo-madrid-rio',
    name: 'Instalación Deportiva Madrid Río',
    formattedAddress: 'Paseo de la Virgen del Puerto, Madrid, España',
    lat: 40.4132,
    lng: -3.7225,
    country: 'España',
    city: 'Madrid',
    source: 'local_verified',
  },
  {
    id: 'complejo-mar-bella-barcelona',
    name: 'Camp Municipal de Futbol Mar Bella',
    formattedAddress: 'Avinguda del Litoral 86, Barcelona, España',
    lat: 41.3995,
    lng: 2.2078,
    country: 'España',
    city: 'Barcelona',
    source: 'local_verified',
  },
  // México / Latam
  {
    id: 'canchas-condesa-cdmx',
    name: 'Deportivo Condesa Fútbol 7',
    formattedAddress: 'Colonia Condesa, Cuauhtémoc, Ciudad de México, México',
    lat: 19.4125,
    lng: -99.1764,
    country: 'México',
    city: 'Ciudad de México',
    source: 'local_verified',
  },
  // Chile
  {
    id: 'club-futbol-las-condes',
    name: 'Canchas Club Oriente Las Condes',
    formattedAddress: 'Av. Las Condes 12340, Santiago, Chile',
    lat: -33.3768,
    lng: -70.5212,
    country: 'Chile',
    city: 'Santiago',
    source: 'local_verified',
  },
  // Uruguay
  {
    id: 'canchas-rambla-montevideo',
    name: 'Complejo Deportivo Rambla Sur',
    formattedAddress: 'Rambla República Argentina, Montevideo, Uruguay',
    lat: -34.9125,
    lng: -56.1784,
    country: 'Uruguay',
    city: 'Montevideo',
    source: 'local_verified',
  },
  // USA
  {
    id: 'urban-soccer-miami',
    name: 'Urban Soccer Five Wynwood',
    formattedAddress: 'NW 24th St, Miami, FL, United States',
    lat: 25.8012,
    lng: -80.1982,
    country: 'United States',
    city: 'Miami',
    source: 'local_verified',
  },
];

/**
 * Searches places globally using Google Places Autocomplete if active and authorized,
 * and transparently falls back to OpenStreetMap / Nominatim (free, open source, no quota limits).
 * IMPORTANT: No 'components: country:ar' restriction to ensure worldwide coverage.
 */
export async function searchGlobalPlaces(
  query: string,
  userCoords?: { latitude: number; longitude: number } | null
): Promise<LocationResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return POPULAR_GLOBAL_VENUES.slice(0, 5);
  }

  const results: LocationResult[] = [];
  const queryLower = trimmed.toLowerCase();

  // 1. Check local pre-cached high-quality venues
  const localMatches = POPULAR_GLOBAL_VENUES.filter(
    (v) =>
      v.name.toLowerCase().includes(queryLower) ||
      v.formattedAddress.toLowerCase().includes(queryLower) ||
      (v.city && v.city.toLowerCase().includes(queryLower)) ||
      (v.country && v.country.toLowerCase().includes(queryLower))
  );
  results.push(...localMatches);

  // 2. Try Google Maps Places Autocomplete if available on window
  try {
    if (
      typeof window !== 'undefined' &&
      (window as any).google?.maps?.places?.AutocompleteService
    ) {
      const googleResults = await searchViaGooglePlaces(trimmed, userCoords);
      if (googleResults.length > 0) {
        // Merge without duplicates
        for (const item of googleResults) {
          if (!results.some((r) => r.id === item.id || (Math.abs(r.lat - item.lat) < 0.0005 && Math.abs(r.lng - item.lng) < 0.0005))) {
            results.push(item);
          }
        }
        return results;
      }
    }
  } catch (err) {
    console.warn('[GeoService] Google Places Autocomplete fallback to OpenStreetMap:', err);
  }

  // 3. Robust OpenSource Alternative: OpenStreetMap Nominatim Geocoder
  // Completely free, global, no API key required, supports worldwide complexes & stadiums.
  try {
    const osmResults = await searchViaOpenStreetMap(trimmed);
    for (const item of osmResults) {
      if (!results.some((r) => r.id === item.id || (Math.abs(r.lat - item.lat) < 0.0005 && Math.abs(r.lng - item.lng) < 0.0005))) {
        results.push(item);
      }
    }
  } catch (err) {
    console.warn('[GeoService] OpenStreetMap search error:', err);
  }

  return results.slice(0, 10);
}

/**
 * Searches places via Google Maps AutocompleteService without any country restriction
 */
function searchViaGooglePlaces(
  query: string,
  userCoords?: { latitude: number; longitude: number } | null
): Promise<LocationResult[]> {
  return new Promise((resolve) => {
    const google = (window as any).google;
    const service = new google.maps.places.AutocompleteService();

    // Query configuration without country restriction for true international search
    const request: any = {
      input: query,
      types: ['establishment', 'geocode'],
      language: 'es',
    };

    // If user coordinates exist, bias (not restrict) towards user location
    if (userCoords) {
      request.location = new google.maps.LatLng(userCoords.latitude, userCoords.longitude);
      request.radius = 50000; // 50km bias
    }

    service.getPlacePredictions(request, (predictions: any[], status: any) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
        resolve([]);
        return;
      }

      // Convert predictions to Geocoded items using PlacesService details or Geocoder
      const geocoder = new google.maps.Geocoder();
      const placePromises = predictions.slice(0, 5).map(
        (pred) =>
          new Promise<LocationResult | null>((res) => {
            geocoder.geocode({ placeId: pred.place_id }, (results: any[], geoStatus: any) => {
              if (geoStatus === 'OK' && results && results[0]) {
                const geo = results[0];
                const countryComp = geo.address_components?.find((c: any) =>
                  c.types.includes('country')
                );
                const cityComp = geo.address_components?.find(
                  (c: any) =>
                    c.types.includes('locality') ||
                    c.types.includes('administrative_area_level_2')
                );

                res({
                  id: pred.place_id,
                  name: pred.structured_formatting?.main_text || pred.description.split(',')[0],
                  formattedAddress: geo.formatted_address || pred.description,
                  lat: geo.geometry.location.lat(),
                  lng: geo.geometry.location.lng(),
                  country: countryComp?.long_name,
                  city: cityComp?.long_name,
                  source: 'google_places',
                });
              } else {
                res(null);
              }
            });
          })
      );

      Promise.all(placePromises).then((items) => {
        resolve(items.filter((item): item is LocationResult => item !== null));
      });
    });
  });
}

/**
 * OpenStreetMap Nominatim Geocoder (Free, OpenSource, International)
 */
async function searchViaOpenStreetMap(query: string): Promise<LocationResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&addressdetails=1&limit=6`;

  const resp = await fetch(url, {
    headers: {
      'Accept-Language': 'es,en',
    },
  });

  if (!resp.ok) return [];
  const data = await resp.json();

  if (!Array.isArray(data)) return [];

  return data.map((item: any) => {
    const addr = item.address || {};
    const country = addr.country;
    const city = addr.city || addr.town || addr.municipality || addr.state;
    const cleanName =
      addr.sports_centre ||
      addr.stadium ||
      addr.pitch ||
      addr.leisure ||
      item.name ||
      item.display_name.split(',')[0];

    return {
      id: `osm-${item.place_id}`,
      name: cleanName,
      formattedAddress: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      country,
      city,
      source: 'openstreetmap',
    };
  });
}

/**
 * Reverse Geocodes coordinates to address + name anywhere in the world
 */
export async function reverseGeocodeGlobal(
  lat: number,
  lng: number
): Promise<{ name: string; formattedAddress: string; country?: string; city?: string }> {
  // 1. Try Google Maps Geocoder if available
  if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
    try {
      const google = (window as any).google;
      const geocoder = new google.maps.Geocoder();
      const res = await new Promise<any>((resolve) => {
        geocoder.geocode({ location: { lat, lng } }, (results: any[], status: any) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results[0]);
          } else {
            resolve(null);
          }
        });
      });

      if (res) {
        const countryComp = res.address_components?.find((c: any) => c.types.includes('country'));
        const cityComp = res.address_components?.find(
          (c: any) =>
            c.types.includes('locality') || c.types.includes('administrative_area_level_2')
        );
        return {
          name: res.formatted_address.split(',')[0],
          formattedAddress: res.formatted_address,
          country: countryComp?.long_name,
          city: cityComp?.long_name,
        };
      }
    } catch {
      // fallback to OSM
    }
  }

  // 2. Fallback to OpenStreetMap Reverse Geocoding
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const resp = await fetch(url, { headers: { 'Accept-Language': 'es,en' } });
    if (resp.ok) {
      const data = await resp.json();
      const addr = data.address || {};
      const name =
        addr.sports_centre ||
        addr.stadium ||
        addr.pitch ||
        addr.road ||
        data.display_name.split(',')[0];
      return {
        name,
        formattedAddress: data.display_name,
        country: addr.country,
        city: addr.city || addr.town || addr.state,
      };
    }
  } catch (err) {
    console.warn('[GeoService] Reverse geocoding error:', err);
  }

  return {
    name: `Cancha (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    formattedAddress: `Coordenadas GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
  };
}
