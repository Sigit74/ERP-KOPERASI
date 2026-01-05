
import React, { useEffect, useRef } from 'react';

declare const L: any; // Leaflet comes from CDN

interface MapViewerProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{
    lat: number;
    lng: number;
    title: string;
    description?: string;
  }>;
  polygons?: Array<{
    coordinates: any; // GeoJSON coordinates array or standard latlng array
    color?: string;
    title?: string; // Popup content
    label?: string; // Permanent label content (Name, Area)
  }>;
  fitBounds?: boolean; // Trigger auto zoom to fit content
}

export const MapViewer: React.FC<MapViewerProps> = ({ center, zoom = 13, markers = [], polygons = [], fitBounds = true }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const featureGroupRef = useRef<any>(null); // To store markers/polys for clearing later
  const layerControlRef = useRef<any>(null);

  useEffect(() => {
    if (typeof L === 'undefined') {
      console.warn("Leaflet Library (L) not found.");
      return;
    }

    // 1. INITIALIZE MAP (Run Only Once)
    if (mapContainerRef.current && !mapInstanceRef.current) {
      
      // Define Base Layers
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      });

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 17
      });

      // Init Map with custom zoom control position
      const map = L.map(mapContainerRef.current, {
        scrollWheelZoom: true,
        dragging: true,
        zoomControl: false, // Disable default top-left zoom
        layers: [osmLayer] // Default to OSM
      }).setView(center, zoom);

      // Add Zoom Control to Bottom Right
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      // Add Scale Control (Metric)
      L.control.scale({
        imperial: false,
        metric: true,
        position: 'bottomright'
      }).addTo(map);

      // Add Layer Control (Toggle between Street & Satellite)
      const baseMaps = {
        "Peta Jalan": osmLayer,
        "Satelit (Citra)": satelliteLayer
      };
      
      layerControlRef.current = L.control.layers(baseMaps, {}, { position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
      featureGroupRef.current = L.featureGroup().addTo(map);
    }

    // 2. UPDATE MAP CONTENT (Run on props change)
    if (mapInstanceRef.current && featureGroupRef.current) {
      const map = mapInstanceRef.current;
      const fg = featureGroupRef.current;
      
      // Clear previous items to prevent duplicates
      fg.clearLayers();

      // Add Markers (Only if provided)
      if (markers && markers.length > 0) {
          markers.forEach(m => {
              const marker = L.marker([m.lat, m.lng]);
              if (m.title) marker.bindPopup(`<b>${m.title}</b><br>${m.description || ''}`);
              marker.addTo(fg);
          });
      }

      // Add Polygons
      if (polygons && polygons.length > 0) {
          polygons.forEach(p => {
              if (p.coordinates) {
                  try {
                      let latlngs = p.coordinates;
                      
                      // Handle GeoJSON format conversion
                      if (p.coordinates.type === 'Polygon' && p.coordinates.coordinates) {
                          latlngs = p.coordinates.coordinates[0].map((coord: any) => [coord[1], coord[0]]);
                      }

                      const poly = L.polygon(latlngs, {
                          color: p.color || '#2563eb', // Default Blue
                          fillColor: p.color || '#3b82f6',
                          fillOpacity: 0.4,
                          weight: 2
                      });
                      
                      // Bind Popup (Click)
                      if (p.title) poly.bindPopup(p.title);

                      // Bind Permanent Label (Tooltip)
                      if (p.label) {
                          poly.bindTooltip(p.label, {
                              permanent: true,
                              direction: "center",
                              className: "map-polygon-label", // Custom class for styling
                              opacity: 1
                          });
                      }
                      
                      poly.addTo(fg);
                  } catch (e) {
                      console.error("Failed to draw polygon", e);
                  }
              }
          });
      }

      // Auto-Zoom Logic (Smart Fly)
      // Only zoom if explicit fitBounds is true AND there is data
      if (fitBounds && (markers.length > 0 || polygons.length > 0)) {
          const bounds = fg.getBounds();
          if (bounds.isValid()) {
              // Use flyToBounds for smooth transition
              map.flyToBounds(bounds, { 
                  padding: [50, 50], 
                  maxZoom: 16,
                  duration: 1.5 // Animation duration in seconds
              });
          }
      } else if (fitBounds) {
          // If no data but fitBounds requested, go to center
          map.flyTo(center, zoom);
      }
    }
  }, [center, zoom, markers, polygons, fitBounds]);

  return (
    <>
      {/* Inject Custom CSS for Map Labels */}
      <style>{`
        .map-polygon-label {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          color: #0f172a;
          font-weight: 700;
          font-size: 11px;
          text-align: center;
          white-space: pre-line;
          padding: 2px 4px;
        }
        .leaflet-tooltip {
            background-color: transparent;
            border: none;
            box-shadow: none;
        }
        .leaflet-tooltip-left:before, .leaflet-tooltip-right:before, .leaflet-tooltip-top:before, .leaflet-tooltip-bottom:before {
            display: none;
        }
      `}</style>
      
      <div className="relative w-full h-full min-h-[300px] bg-slate-100 rounded-lg overflow-hidden z-0">
        <div ref={mapContainerRef} className="absolute inset-0 z-0" id="map-container"></div>
        {typeof L === 'undefined' && (
           <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
              <p className="text-slate-400 font-medium animate-pulse">Memuat Peta...</p>
           </div>
        )}
        
        {/* Controls Instructions */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur px-4 py-3 rounded-xl shadow-lg border border-slate-200 z-[20] pointer-events-none max-w-[200px]">
           <span className="font-bold text-xs text-slate-800 block mb-1">Kontrol Peta:</span>
           <ul className="text-[10px] text-slate-600 space-y-1 list-disc list-inside">
             <li>Geser & Zoom Bebas</li>
             <li>Klik Layer (↗) untuk Satelit</li>
           </ul>
        </div>
      </div>
    </>
  );
};
