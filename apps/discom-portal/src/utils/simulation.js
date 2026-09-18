/**
 * Frontend EV Growth Simulation Logic
 * Projects transformer stress levels based on EV adoption growth
 */

/**
 * Run simulation for a set of transformers
 * @param {Array} transformers - current transformer list
 * @param {number} ev_growth_pct - EV adoption growth percentage (0-100)
 * @param {number} months_ahead - projection period in months (1-24)
 * @returns {Array} projected transformer list with updated stress
 */
export function runSimulation(transformers, ev_growth_pct, months_ahead) {
  const growthFactor = Math.pow(1 + ev_growth_pct / 100, months_ahead / 12);
  const evShare = 0.30; // 30% of transformer load is EV-related

  return transformers.map(t => {
    const additionalEvLoad = t.current_load_kw * evShare * (growthFactor - 1);
    const projectedLoad = t.current_load_kw + additionalEvLoad;
    const ratedCapacity = t.capacity_kva * 0.8; // 80% rated capacity
    const projectedStress = projectedLoad / ratedCapacity;

    let projectedStatus;
    if (projectedStress >= 0.85) projectedStatus = 'RED';
    else if (projectedStress >= 0.65) projectedStatus = 'YELLOW';
    else projectedStatus = 'GREEN';

    const spare_capacity_kw = Math.max(0, ratedCapacity - projectedLoad);

    return {
      ...t,
      projected_load_kw: parseFloat(projectedLoad.toFixed(1)),
      projected_stress: parseFloat(projectedStress.toFixed(3)),
      projected_status: projectedStatus,
      spare_capacity_kw: parseFloat(spare_capacity_kw.toFixed(1)),
      additional_load_kw: parseFloat(additionalEvLoad.toFixed(1)),
    };
  });
}

/**
 * Calculate simulation summary statistics
 */
export function getSimulationSummary(original, projected, ev_growth_pct, months_ahead) {
  const origRed    = original.filter(t => t.status === 'RED').length;
  const origYellow = original.filter(t => t.status === 'YELLOW').length;
  const origGreen  = original.filter(t => t.status === 'GREEN').length;

  const projRed    = projected.filter(t => t.projected_status === 'RED').length;
  const projYellow = projected.filter(t => t.projected_status === 'YELLOW').length;
  const projGreen  = projected.filter(t => t.projected_status === 'GREEN').length;

  const newRed = projRed - origRed;
  const totalAdditionalKw = projected.reduce((s, t) => s + (t.additional_load_kw || 0), 0);
  const additionalMw = parseFloat((totalAdditionalKw / 1000).toFixed(2));

  // Total required upgrade capacity (for transformers that go RED)
  const newlyRedTransformers = projected.filter(
    t => t.projected_status === 'RED' && t.status !== 'RED'
  );
  const upgradeCapacity = newlyRedTransformers.reduce(
    (s, t) => s + (t.capacity_kva * 0.5), 0
  );

  return {
    original: { red: origRed, yellow: origYellow, green: origGreen },
    projected: { red: projRed, yellow: projYellow, green: projGreen },
    new_red_count: newRed,
    additional_mw: additionalMw,
    upgrade_capacity_kva: parseFloat(upgradeCapacity.toFixed(0)),
    ev_growth_pct,
    months_ahead,
    growthFactor: parseFloat(Math.pow(1 + ev_growth_pct / 100, months_ahead / 12).toFixed(3)),
  };
}

/**
 * Get top 10 most stressed transformers for bar chart
 */
export function getTopStressedForChart(original, projected) {
  const combined = original.map((t, i) => ({
    name: t.id,
    current: parseFloat((t.stress_score * 100).toFixed(1)),
    projected: parseFloat(((projected[i]?.projected_stress ?? t.stress_score) * 100).toFixed(1)),
    status: t.status,
    projectedStatus: projected[i]?.projected_status ?? t.status,
  }));

  return combined
    .sort((a, b) => b.projected - a.projected)
    .slice(0, 10);
}
