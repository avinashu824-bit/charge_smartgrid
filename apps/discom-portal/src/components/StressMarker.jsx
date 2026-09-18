import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

/**
 * StressMarker — renders a custom circle marker on the Leaflet map
 * Uses direct Leaflet API (not react-leaflet) for maximum control
 *
 * Props:
 *   map: Leaflet map instance
 *   transformer: transformer data object
 *   projected: (optional) projected transformer data for simulation view
 *   showProjected: boolean — whether to show projected vs current
 */

const STATUS_CONFIG = {
  GREEN:  { color: '#10B981', fillColor: '#10B981', fillOpacity: 0.85, weight: 1.5 },
  YELLOW: { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.85, weight: 1.5 },
  RED:    { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.9,  weight: 2 },
};

function getRadius(capacity_kva) {
  if (capacity_kva >= 800) return 12;
  if (capacity_kva >= 500) return 10;
  if (capacity_kva >= 315) return 8;
  return 7;
}

function buildPopup(t, projected) {
  const stress_pct = Math.round((t.stress_score || 0) * 100);
  const proj_stress_pct = projected ? Math.round((projected.projected_stress || 0) * 100) : null;

  const statusColor = {
    GREEN: '#10B981', YELLOW: '#F59E0B', RED: '#EF4444'
  };
  const sc = statusColor[t.status] || '#64748B';

  const projRow = projected ? `
    <tr>
      <td style="color:#64748B;padding:3px 0">Projected Status</td>
      <td style="text-align:right;color:${statusColor[projected.projected_status] || '#fff'};font-weight:600">
        ${projected.projected_status} (${proj_stress_pct}%)
      </td>
    </tr>
    <tr>
      <td style="color:#64748B;padding:3px 0">Projected Load</td>
      <td style="text-align:right;color:#E2E8F0">${projected.projected_load_kw?.toFixed(0)} kW</td>
    </tr>
  ` : '';

  return `
    <div style="font-family:'Inter',sans-serif;min-width:230px;padding:4px 0">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="width:10px;height:10px;border-radius:50%;background:${sc};flex-shrink:0"></div>
        <div>
          <div style="font-weight:700;font-size:14px;color:#F1F5F9">${t.name}</div>
          <div style="font-size:11px;color:#64748B">${t.feeder_id} · ${t.zone}</div>
        </div>
      </div>
      <table style="width:100%;font-size:12px;border-collapse:collapse">
        <tr>
          <td style="color:#64748B;padding:3px 0">Status</td>
          <td style="text-align:right;color:${sc};font-weight:600">${t.status} (${stress_pct}%)</td>
        </tr>
        <tr>
          <td style="color:#64748B;padding:3px 0">Capacity</td>
          <td style="text-align:right;color:#E2E8F0">${t.capacity_kva} kVA</td>
        </tr>
        <tr>
          <td style="color:#64748B;padding:3px 0">Current Load</td>
          <td style="text-align:right;color:#E2E8F0">${t.current_load_kw} kW</td>
        </tr>
        <tr>
          <td style="color:#64748B;padding:3px 0">Stations</td>
          <td style="text-align:right;color:#E2E8F0">${t.station_count} stations</td>
        </tr>
        ${projRow}
      </table>
      ${t.predicted_breach_hours ? `
        <div style="margin-top:10px;padding:6px 8px;background:rgba(239,68,68,0.12);border-radius:6px;border:1px solid rgba(239,68,68,0.25);font-size:11px;color:#FCA5A5">
          ⚠️ Predicted breach in ${t.predicted_breach_hours.toFixed(1)}h
        </div>
      ` : ''}
    </div>
  `;
}

export function addTransformerMarkers(map, transformers, { showProjected = false, projectedData = [] } = {}) {
  const markers = [];

  transformers.forEach((t, i) => {
    const proj = projectedData[i];
    const displayStatus = (showProjected && proj?.projected_status) ? proj.projected_status : t.status;
    const config = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.GREEN;
    const radius = getRadius(t.capacity_kva);

    const marker = L.circleMarker([t.lat, t.lng], {
      radius,
      color: config.color,
      fillColor: config.fillColor,
      fillOpacity: showProjected ? 0.7 : config.fillOpacity,
      weight: config.weight,
      opacity: 1,
    });

    // Tooltip (hover)
    marker.bindTooltip(`<span style="font-family:'Inter',sans-serif;font-size:12px;font-weight:600;color:#E2E8F0">${t.id} — ${t.zone}</span>`, {
      className: 'leaflet-dark-tooltip',
      direction: 'top',
      offset: [0, -8],
    });

    // Popup (click)
    marker.bindPopup(buildPopup(t, showProjected ? proj : null), {
      maxWidth: 280,
      className: 'cs-popup',
    });

    marker.addTo(map);
    markers.push(marker);
  });

  return markers;
}

// React wrapper for use in functional components
export function useTransformerMarkers(mapRef, transformers, options = {}) {
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add new
    const added = addTransformerMarkers(mapRef.current, transformers, options);
    markersRef.current = added;

    return () => {
      added.forEach(m => m.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef, transformers, options.showProjected, options.projectedData]);

  return markersRef;
}
