import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// fix default marker icon path issues with bundlers (Vite, webpack, etc.)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
}

export const MapPicker = ({ lat, lng, zoom = 16, onChange }) => {
  const defaultPos = lat && lng ? [Number(lat), Number(lng)] : [11.0168, 76.9558];
  const [markerPos, setMarkerPos] = useState(defaultPos);

  useEffect(() => {
    if (lat && lng) setMarkerPos([Number(lat), Number(lng)]);
  }, [lat, lng]);

  const handleDragEnd = (e) => {
    const marker = e.target;
    const position = marker.getLatLng();
    setMarkerPos([position.lat, position.lng]);
    if (onChange) onChange({ lat: String(position.lat), lng: String(position.lng) });
  };

  // custom div icon for a modern pin (rounded + drop shadow + pulse)
  const pinHtml = '<span class="cf-pin"><span class="cf-pin-inner"></span></span>';
  const pinIcon = L.divIcon({ className: 'cf-pin-wrap', html: pinHtml, iconSize: [30, 42], iconAnchor: [15, 42] });

  function LocateControl({ onLocated }) {
    const map = useMap();
    useEffect(() => {
      const control = L.control({ position: 'topleft' });
      const container = L.DomUtil.create('div', 'leaflet-bar map-locate-control');
      const btn = L.DomUtil.create('a', 'map-locate-btn', container);
      btn.href = '#';
      btn.title = 'Center map to your location';
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M21 12a9 9 0 0 0-9-9"></path></svg>';

      control.onAdd = function() { return container; };
      control.addTo(map);

      L.DomEvent.on(btn, 'click', (e) => {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        map.locate({ setView: true, maxZoom: 18 });
      });

      function onLocationFound(e) {
        const latlng = e.latlng;
        if (onLocated) onLocated(latlng);
      }

      map.on('locationfound', onLocationFound);

      return () => {
        control.remove();
        map.off('locationfound', onLocationFound);
      };
    }, [onLocated]);
    return null;
  }

  return (
    <div className="w-full h-44 rounded-2xl overflow-hidden relative">
      <MapContainer whenCreated={setMap} center={markerPos} zoom={zoom} style={{ height: '100%', width: '100%' }} className="cf-leaflet">
        <Recenter position={markerPos} />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &amp; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <LocateControl onLocated={(latlng) => {
          setMarkerPos([latlng.lat, latlng.lng]);
          if (onChange) onChange({ lat: String(latlng.lat), lng: String(latlng.lng) });
        }} />

        <Marker position={markerPos} icon={pinIcon} draggable={true} eventHandlers={{ dragend: handleDragEnd }}>
          <Popup>
            Drag to adjust location
          </Popup>
        </Marker>
      </MapContainer>

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <button
          className="cf-zoom-btn"
          onClick={(e) => { e.preventDefault(); map && map.zoomIn(); }}
          aria-label="Zoom in"
        >+</button>
        <button
          className="cf-zoom-btn"
          onClick={(e) => { e.preventDefault(); map && map.zoomOut(); }}
          aria-label="Zoom out"
        >−</button>
      </div>

      {/* Mini-map overview */}
      <div className="absolute bottom-3 right-3 z-20 w-28 h-20 rounded-lg overflow-hidden border border-slate-100 shadow-sm bg-white">
        <MapContainer center={markerPos} zoom={Math.max(zoom - 3, 10)} style={{ height: '100%', width: '100%' }} dragging={false} doubleClickZoom={false} scrollWheelZoom={false} attributionControl={false} zoomControl={false} touchZoom={false} className="cf-mini-map">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <Marker position={markerPos} icon={pinIcon} interactive={false} />
        </MapContainer>
      </div>

    </div>
  );
};

export default MapPicker;
