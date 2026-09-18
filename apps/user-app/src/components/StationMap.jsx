import React, { useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet';

const STATUS_COLOR = {
  GREEN: '#10B981',
  YELLOW: '#F59E0B',
  RED: '#EF4444',
};

function MapClickHandler({ onStationClick }) {
  useMapEvents({ click: () => {} });
  return null;
}

export default function StationMap({ stations, onStationSelect, selectedStation }) {
  return (
    <MapContainer
      center={[12.9716, 77.5946]}
      zoom={12}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        className="map-tiles"
        maxZoom={19}
      />

      {stations.map((station) => (
        <CircleMarker
          key={station.id}
          center={[station.lat, station.lng]}
          radius={selectedStation?.id === station.id ? 14 : 10}
          pathOptions={{
            color: STATUS_COLOR[station.status],
            fillColor: STATUS_COLOR[station.status],
            fillOpacity: 0.85,
            weight: selectedStation?.id === station.id ? 3 : 1.5,
          }}
          eventHandlers={{
            click: () => onStationSelect(station),
          }}
        >
          <Popup className="station-popup">
            <div className="text-gray-900 min-w-[160px]">
              <p className="font-bold text-sm">{station.name}</p>
              <p className="text-xs text-gray-600">{station.zone}</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs">💰 ₹{station.currentPriceInr}/kWh</p>
                <p className="text-xs">🔌 {station.availableSlots}/{station.totalSlots} slots free</p>
                {station.avgWaitMinutes > 0 && (
                  <p className="text-xs">⏱ ~{station.avgWaitMinutes}m wait</p>
                )}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
