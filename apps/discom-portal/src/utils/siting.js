/**
 * Frontend Siting Algorithm
 * Scores nearby transformers for EV charging station placement
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate distance between two lat/lng points (Haversine)
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Get area name from lat/lng (approximate based on known Bengaluru zones)
 */
export function getAreaName(lat, lng) {
  const areas = [
    { name: 'Whitefield',       lat: 12.9698, lng: 77.7499 },
    { name: 'Koramangala',      lat: 12.9352, lng: 77.6245 },
    { name: 'Electronic City',  lat: 12.8456, lng: 77.6603 },
    { name: 'Indiranagar',      lat: 12.9784, lng: 77.6408 },
    { name: 'JP Nagar',         lat: 12.9063, lng: 77.5857 },
    { name: 'Marathahalli',     lat: 12.9591, lng: 77.6971 },
    { name: 'HSR Layout',       lat: 12.9082, lng: 77.6476 },
    { name: 'Jayanagar',        lat: 12.9250, lng: 77.5938 },
    { name: 'Rajajinagar',      lat: 12.9905, lng: 77.5519 },
    { name: 'Yeshwanthpur',     lat: 13.0245, lng: 77.5519 },
    { name: 'Hebbal',           lat: 13.0350, lng: 77.5970 },
    { name: 'Yelahanka',        lat: 13.1007, lng: 77.5963 },
    { name: 'Bannerghatta',     lat: 12.8648, lng: 77.6028 },
    { name: 'Nagarbhavi',       lat: 12.9570, lng: 77.5032 },
    { name: 'Bellandur',        lat: 12.9260, lng: 77.6762 },
  ];

  let closest = areas[0];
  let minDist = haversineDistance(lat, lng, areas[0].lat, areas[0].lng);
  for (const a of areas.slice(1)) {
    const d = haversineDistance(lat, lng, a.lat, a.lng);
    if (d < minDist) { minDist = d; closest = a; }
  }
  return closest.name;
}

/**
 * Score a transformer for siting
 * Returns score 0–100 and sub-scores
 */
export function scoreTransformer(transformer, allTransformers) {
  const rated_kw = transformer.capacity_kva * 0.8;
  const spare_capacity_kw = Math.max(0, rated_kw - transformer.current_load_kw);

  const maxSpare = Math.max(...allTransformers.map(t =>
    Math.max(0, t.capacity_kva * 0.8 - t.current_load_kw)
  ));

  // Capacity score: how much spare capacity (weight 40%)
  const capacityScore = maxSpare > 0 ? (spare_capacity_kw / maxSpare) : 0;

  // Demand score: inverse of station density (weight 30%)
  const demandScore = 1 / (transformer.station_count + 1);
  const maxDemand = Math.max(...allTransformers.map(t => 1 / (t.station_count + 1)));
  const demandScoreNorm = maxDemand > 0 ? demandScore / maxDemand : 0;

  // Access score: fixed factor for infrastructure (weight 30%)
  const accessScore = 0.7;

  const totalScore = (capacityScore * 0.4) + (demandScoreNorm * 0.3) + (accessScore * 0.3);

  return {
    total: parseFloat((totalScore * 100).toFixed(1)),
    capacity: parseFloat((capacityScore * 100).toFixed(1)),
    demand: parseFloat((demandScoreNorm * 100).toFixed(1)),
    access: parseFloat((accessScore * 100).toFixed(1)),
    spare_capacity_kw: parseFloat(spare_capacity_kw.toFixed(0)),
  };
}

/**
 * Find top 3 siting recommendations near a clicked point
 */
export function getSitingRecommendations(clickedLat, clickedLng, transformers, radiusKm = 2.5) {
  const nearby = transformers
    .map(t => ({
      ...t,
      distance_km: haversineDistance(clickedLat, clickedLng, t.lat, t.lng),
    }))
    .filter(t => t.distance_km <= radiusKm && t.status !== 'RED') // don't recommend RED transformers
    .sort((a, b) => {
      const sa = scoreTransformer(a, transformers).total;
      const sb = scoreTransformer(b, transformers).total;
      return sb - sa;
    });

  // If fewer than 3 nearby, expand radius
  const candidates = nearby.length >= 3 ? nearby : transformers
    .map(t => ({
      ...t,
      distance_km: haversineDistance(clickedLat, clickedLng, t.lat, t.lng),
    }))
    .filter(t => t.status !== 'RED')
    .sort((a, b) => {
      const sa = scoreTransformer(a, transformers).total;
      const sb = scoreTransformer(b, transformers).total;
      return sb - sa;
    });

  return candidates.slice(0, 3).map((t, i) => ({
    rank: i + 1,
    transformer: t,
    scores: scoreTransformer(t, transformers),
    area_name: getAreaName(t.lat, t.lng),
    distance_km: parseFloat(t.distance_km.toFixed(2)),
    medal: ['gold', 'silver', 'bronze'][i],
  }));
}
