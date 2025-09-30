import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Place, Zone } from "@shared/schema";

export function MapTab() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [hoveredZone, setHoveredZone] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 800, height: 600 });

  // Fetch places
  const { data: places = [], isLoading: placesLoading } = useQuery<Place[]>({
    queryKey: ["/api/places"],
  });

  // Fetch zones
  const { data: zones = [], isLoading: zonesLoading } = useQuery<Zone[]>({
    queryKey: ["/api/zones"],
  });

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current?.parentElement) {
        const { width, height } = svgRef.current.parentElement.getBoundingClientRect();
        setMapDimensions({ width, height });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isLoading = placesLoading || zonesLoading;

  // Zone colors - cyberpunk inspired
  const zoneColors: Record<number, string> = {
    10: "#00ff4120", // Mid-Atlantic Region - Neon green
    11: "#ff00ff20", // Night City Center - Magenta
    12: "#00ffff20", // Night City District 07 - Cyan
    13: "#ffff0020", // Night City Suburbs - Yellow
    14: "#ff008020", // Night City Outskirts - Pink
    15: "#00ff8020", // Virginia Beach - Lime
    17: "#8000ff20", // Frederick - Purple
    18: "#ff804020", // The Badlands - Orange
    19: "#40ff8020", // Outer Wastes - Mint
    20: "#0080ff20", // Northeast US - Blue
    30: "#ff004020", // Southeast US - Red
    31: "#40008020", // New Orleans - Deep purple
    35: "#ffff8020", // Atlanta - Light yellow
    40: "#ff80ff20", // Western US - Light pink
    50: "#80ff0020", // West Europe - Light green
    60: "#0040ff20", // East Asia - Deep blue
    70: "#004080a0", // Atlantic Ocean - Ocean blue
    74: "#00008080", // The Abyss - Dark blue
    75: "#0080ffa0", // Pacific Ocean - Light ocean blue
    79: "#ffffff20", // Antarctic - White
  };

  const getZoneColor = (zoneId: number) => {
    return zoneColors[zoneId] || "#ffffff10";
  };

  // Transform coordinates for SVG display
  // Using a simple mercator-like projection
  const transformCoordinates = (lng: number, lat: number) => {
    // Map longitude from [-180, 180] to viewport width
    // Map latitude from [-90, 90] to viewport height
    // Focus on US East Coast area: roughly -85 to -70 lng, 25 to 45 lat
    const minLng = -85;
    const maxLng = -70;
    const minLat = 25;
    const maxLat = 45;
    
    const x = ((lng - minLng) / (maxLng - minLng)) * mapDimensions.width;
    const y = mapDimensions.height - ((lat - minLat) / (maxLat - minLat)) * mapDimensions.height;
    
    return { x, y };
  };

  // Parse zone boundary and convert to SVG polygon points
  const getZonePolygonPoints = (boundary: any): string => {
    if (!boundary) return "";
    
    try {
      if (boundary.type === 'MultiPolygon' && boundary.coordinates) {
        // Get the first polygon from the multipolygon
        const firstPolygon = boundary.coordinates[0]?.[0];
        if (firstPolygon && Array.isArray(firstPolygon)) {
          // Convert coordinates to SVG points
          const points = firstPolygon.map((coord: number[]) => {
            if (coord.length >= 2) {
              const transformed = transformCoordinates(coord[0], coord[1]);
              return `${transformed.x},${transformed.y}`;
            }
            return null;
          }).filter(Boolean).join(' ');
          
          return points;
        }
      }
    } catch (e) {
      console.error('Failed to parse zone boundary:', e);
    }
    
    return "";
  };

  // Get place coordinates
  const getPlaceCoordinates = (place: Place): { x: number; y: number } | null => {
    if (place.longitude && place.latitude) {
      const lng = parseFloat(place.longitude);
      const lat = parseFloat(place.latitude);
      if (!isNaN(lng) && !isNaN(lat)) {
        return transformCoordinates(lng, lat);
      }
    }
    return null;
  };

  // Filter zones and places with valid coordinates
  const visibleZones = zones.filter(zone => zone.boundary);
  const visiblePlaces = places.filter(place => place.longitude && place.latitude);

  return (
    <div className="flex h-full bg-background">
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Background */}
          <rect width="100%" height="100%" fill="#000000" />

          {/* Grid pattern for cyberpunk aesthetic */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="#00ff0010"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Zones */}
          {visibleZones.map((zone) => {
            const points = getZonePolygonPoints(zone.boundary);
            
            if (!points) {
              return null;
            }
            
            return (
              <g key={zone.id}>
                <polygon
                  points={points}
                  fill={getZoneColor(zone.id)}
                  stroke="#00ff00"
                  strokeWidth="0.5"
                  opacity={hoveredZone === zone.id ? 0.6 : 0.3}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                  className="cursor-pointer transition-opacity"
                  data-testid={`zone-${zone.id}`}
                />
              </g>
            );
          })}

          {/* Places */}
          {visiblePlaces.map((place) => {
            const coords = getPlaceCoordinates(place);
            
            if (!coords) {
              return null;
            }

            return (
              <g
                key={place.id}
                className="cursor-pointer"
                onClick={() => setSelectedPlace(place)}
                data-testid={`place-${place.id}`}
              >
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r="3"
                  fill="#00ff00"
                  className="terminal-glow animate-pulse"
                />
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r="8"
                  fill="transparent"
                  stroke="#00ff00"
                  strokeWidth="0.5"
                  opacity="0.5"
                  className="terminal-glow"
                />
                <text
                  x={coords.x}
                  y={coords.y - 12}
                  fill="#00ff00"
                  fontSize="10"
                  textAnchor="middle"
                  className="font-mono terminal-glow"
                  style={{ userSelect: "none" }}
                >
                  {place.name}
                </text>
              </g>
            );
          })}

          {/* Empty state message */}
          {!isLoading && visiblePlaces.length === 0 && visibleZones.length === 0 && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              fill="#00ff0080"
              fontSize="14"
              className="font-mono"
            >
              [NO LOCATION DATA AVAILABLE]
            </text>
          )}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-card/80 border border-border p-3 rounded-md font-mono text-xs">
          <div className="text-primary terminal-glow mb-2">[LEGEND]</div>
          <div className="space-y-1 text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-primary" />
              <span>Places ({visiblePlaces.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary/20 border border-primary/50" />
              <span>Zones ({visibleZones.length})</span>
            </div>
          </div>
        </div>

        {/* Zone info on hover */}
        {hoveredZone && zones.find((z) => z.id === hoveredZone) && (
          <div className="absolute top-4 right-4 bg-card/90 border border-border p-3 rounded-md font-mono text-xs max-w-xs">
            <div className="text-primary terminal-glow mb-1">
              {zones.find((z) => z.id === hoveredZone)?.name}
            </div>
            <div className="text-muted-foreground">
              {zones.find((z) => z.id === hoveredZone)?.summary || "No description available"}
            </div>
          </div>
        )}
        
        {/* Data info */}
        <div className="absolute top-4 left-4 bg-card/80 border border-border p-2 rounded-md font-mono text-xs">
          <div className="text-primary">
            [DATA STATUS]
          </div>
          <div className="text-muted-foreground mt-1">
            Zones: {zones.length} loaded
          </div>
          <div className="text-muted-foreground">
            Places: {places.length} loaded
          </div>
        </div>
      </div>

      {/* Place Details Modal */}
      <Dialog open={!!selectedPlace} onOpenChange={() => setSelectedPlace(null)}>
        <DialogContent className="bg-card border-primary/50 max-w-md font-mono">
          <DialogHeader>
            <DialogTitle className="text-primary terminal-glow">
              {selectedPlace?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3 text-sm">
              {selectedPlace?.type && (
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  <span className="text-foreground">{selectedPlace.type}</span>
                </div>
              )}
              {selectedPlace?.zoneId && (
                <div>
                  <span className="text-muted-foreground">Zone: </span>
                  <span className="text-foreground">
                    {zones.find(z => z.id === selectedPlace.zoneId)?.name || `Zone ${selectedPlace.zoneId}`}
                  </span>
                </div>
              )}
              {selectedPlace?.district && (
                <div>
                  <span className="text-muted-foreground">District: </span>
                  <span className="text-foreground">{selectedPlace.district}</span>
                </div>
              )}
              {selectedPlace?.address && (
                <div>
                  <span className="text-muted-foreground">Address: </span>
                  <span className="text-foreground">{selectedPlace.address}</span>
                </div>
              )}
              {selectedPlace?.description && (
                <div>
                  <span className="text-muted-foreground">Description: </span>
                  <div className="text-foreground mt-1">{selectedPlace.description}</div>
                </div>
              )}
              {selectedPlace?.summary && (
                <div>
                  <span className="text-muted-foreground">Summary: </span>
                  <div className="text-foreground mt-1">{selectedPlace.summary}</div>
                </div>
              )}
              {selectedPlace?.elevation && (
                <div>
                  <span className="text-muted-foreground">Elevation: </span>
                  <span className="text-foreground">{selectedPlace.elevation}m</span>
                </div>
              )}
              {selectedPlace?.latitude && selectedPlace?.longitude && (
                <div>
                  <span className="text-muted-foreground">Coordinates: </span>
                  <span className="text-foreground">
                    {parseFloat(selectedPlace.latitude).toFixed(4)}, {parseFloat(selectedPlace.longitude).toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}