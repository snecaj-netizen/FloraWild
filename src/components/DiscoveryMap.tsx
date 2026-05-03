import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plant } from '../types';
import { MapPin, Info, Navigation, Layers } from 'lucide-react';
import { cn } from '../lib/utils';

// Fix Leaflet marker icons in React
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface DiscoveryMapProps {
  plants: Plant[];
  onSelectPlant: (plant: Plant) => void;
}

function RecenterMap({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords);
  }, [coords, map]);
  return null;
}

export function DiscoveryMap({ plants, onSelectPlant }: DiscoveryMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.9028, 12.4964]); // Default Rome

  const plantsWithLocation = plants.filter(p => p.location);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
          setMapCenter([lat, lng]);
        },
        (error) => console.log('Geolocation error:', error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const goToMyLocation = () => {
    if (userLocation) {
      setMapCenter(userLocation);
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] w-full rounded-3xl overflow-hidden shadow-xl border border-nature-100 relative group bg-nature-50">
      {/* Search overlay or filters can go here */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <button 
          onClick={goToMyLocation}
          className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg text-brand-600 hover:bg-white transition-all active:scale-95 border border-white"
          title="La mia posizione"
        >
          <Navigation size={20} className={cn(userLocation ? "opacity-100" : "opacity-40")} />
        </button>
      </div>

      <div className="absolute top-4 right-4 z-[1000]">
        <div className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white text-xs font-bold text-nature-600 flex items-center gap-2">
           <Layers size={14} />
           {plantsWithLocation.length} Ritrovamenti
        </div>
      </div>

      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <RecenterMap coords={mapCenter} />

        {userLocation && (
          <Marker position={userLocation}>
            <Popup>Sei qui</Popup>
          </Marker>
        )}

        {plantsWithLocation.map((plant) => (
          <Marker 
            key={plant.id} 
            position={[plant.location!.lat, plant.location!.lng]}
            eventHandlers={{
              click: () => {},
            }}
          >
            <Popup className="custom-popup">
              <div className="w-48 overflow-hidden rounded-xl">
                <div className="h-24 w-full relative">
                  <img 
                    src={plant.imageUrl} 
                    alt={plant.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1 rounded-lg">
                    {plant.category === 'mushroom' ? '🍄' : '🌿'}
                  </div>
                </div>
                <div className="p-3 bg-white">
                  <h4 className="font-bold text-nature-900 text-sm mb-1">{plant.name}</h4>
                  <p className="text-[10px] text-nature-400 italic leading-tight mb-2 truncate">{plant.scientificName}</p>
                  <button 
                    onClick={() => onSelectPlant(plant)}
                    className="w-full flex items-center justify-center gap-2 bg-brand-500 text-white p-2 rounded-lg text-[10px] font-bold hover:bg-brand-600 transition-colors"
                  >
                    <Info size={12} />
                    Dettagli
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {plantsWithLocation.length === 0 && (
        <div className="absolute inset-x-4 bottom-4 z-[1000] p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-white shadow-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-nature-100 rounded-xl flex items-center justify-center text-nature-600">
            <MapPin size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-nature-900">Nessuna coordinata salvata</h3>
            <p className="text-[11px] text-nature-500">I tuoi futuri ritrovamenti appariranno qui se attivi la geolocalizzazione.</p>
          </div>
        </div>
      )}
    </div>
  );
}
