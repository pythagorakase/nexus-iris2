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
  const zoneColors = [
    "#00ff4120", // Neon green
    "#ff00ff20", // Magenta
    "#00ffff20", // Cyan
    "#ffff0020", // Yellow
    "#ff008020", // Pink
  ];

  const getZoneColor = (zoneId: number) => {
    return zoneColors[zoneId % zoneColors.length];
  };

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

          {/* Placeholder landmass - abstract coastline */}
          <g id="landmass">
            <path
              d="M 150 200 Q 250 150, 350 180 T 450 220 Q 520 250, 550 350 L 520 450 Q 450 480, 350 460 L 250 420 Q 180 380, 150 300 Z"
              fill="none"
              stroke="#00ff00"
              strokeWidth="0.5"
              className="terminal-glow"
              opacity="0.8"
            />
            <path
              d="M 600 100 Q 650 80, 700 120 L 720 200 Q 680 250, 620 220 L 600 150 Z"
              fill="none"
              stroke="#00ff00"
              strokeWidth="0.5"
              className="terminal-glow"
              opacity="0.8"
            />
            <path
              d="M 80 400 Q 120 380, 160 420 L 140 480 Q 100 490, 70 460 Z"
              fill="none"
              stroke="#00ff00"
              strokeWidth="0.5"
              className="terminal-glow"
              opacity="0.8"
            />
          </g>

          {/* Zones (when they exist) */}
          {zones.map((zone) => {
            // Parse boundary coordinates if they exist
            let points = "";
            if (zone.boundary) {
              try {
                const boundary = zone.boundary as any;
                if (boundary && boundary.coordinates) {
                  points = boundary.coordinates;
                }
              } catch (e) {
                // Invalid boundary data
                console.error('Failed to parse zone boundary:', e);
              }
            }
            
            if (!zone.boundary || !points) {
              return null;
            }
            
            return (
              <g key={zone.id}>
                <polygon
                  points={points}
                  fill={getZoneColor(zone.id)}
                  stroke="#00ff00"
                  strokeWidth="0.5"
                  opacity={hoveredZone === zone.id ? 0.4 : 0.2}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                  className="cursor-pointer transition-opacity"
                  data-testid={`zone-${zone.id}`}
                />
              </g>
            );
          })}

          {/* Places */}
          {places.map((place) => {
            const x = place.longitude ? parseFloat(place.longitude) * 4 + 400 : 400;
            const y = place.latitude ? 300 - parseFloat(place.latitude) * 4 : 300;

            return (
              <g
                key={place.id}
                className="cursor-pointer"
                onClick={() => setSelectedPlace(place)}
                data-testid={`place-${place.id}`}
              >
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#00ff00"
                  className="terminal-glow animate-pulse"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="transparent"
                  stroke="#00ff00"
                  strokeWidth="0.5"
                  opacity="0.5"
                  className="terminal-glow"
                />
                <text
                  x={x}
                  y={y - 12}
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
          {!isLoading && places.length === 0 && zones.length === 0 && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              fill="#00ff0080"
              fontSize="14"
              className="font-mono"
            >
              [NO DATA AVAILABLE]
            </text>
          )}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-card/80 border border-border p-3 rounded-md font-mono text-xs">
          <div className="text-primary terminal-glow mb-2">[LEGEND]</div>
          <div className="space-y-1 text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-primary" />
              <span>Places</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary/20 border border-primary/50" />
              <span>Zones</span>
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
              {zones.find((z) => z.id === hoveredZone)?.summary}
            </div>
          </div>
        )}
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
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}