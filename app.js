/* =====================================================
   MPA ANALYSER — APPLICATION LOGIC
   Three.js Hero · SVG Map · Stats Engine · Animations
   ===================================================== */

'use strict';

// ── Global State ──────────────────────────────────────
let zones           = [];
let selectedZone    = null;
let activeFilter    = null;
let statsRevealDone = false;
let statCardsAnimDone = false;
let revealObserver  = null;       // singleton observer
let globe = null;

// ── Persistence ──────────────────────────────────────
const STORAGE_KEY = 'mpa-analyser-v1';

function saveState() {
  const overrides = {};
  zones.forEach(z => { overrides[z.id] = z.mpaStatus; });
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

function loadState(zonesArr) {
  // Uses sessionStorage so changes only persist within the tab session.
  // Fresh page loads always start from ocean_zones.json values.
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (saved) zonesArr.forEach(z => { if (z.id in saved) z.mpaStatus = saved[z.id]; });
  } catch(e) { /* ignore */ }
}

function resetState() {
  sessionStorage.removeItem(STORAGE_KEY);
  location.reload();
}


const FALLBACK_DATA = { "zones": [
  { "id": "Z01", "name": "Arctic Basin", "gridX": 0, "gridY": 0, "lat": 80, "lng": 0, "speciesRichness": { "habitatComplexity": 3.1, "resourceAvailability": 4.3, "stability": 4.8 }, "fishingPressure": { "effort": 1.2, "frequency": 1.9, "gearImpact": "line" }, "mpaStatus": false, "area": 35000, "depth": 3800, "habitatType": "deep_sea" },
  { "id": "Z02", "name": "N. Atlantic Ridge", "gridX": 1, "gridY": 0, "lat": 45, "lng": -40, "speciesRichness": { "habitatComplexity": 6.2, "resourceAvailability": 7.1, "stability": 5.2 }, "fishingPressure": { "effort": 5.2, "frequency": 4.1, "gearImpact": "nets" }, "mpaStatus": false, "area": 28000, "depth": 2100, "habitatType": "seamount" },
  { "id": "Z03", "name": "Norwegian Sea", "gridX": 2, "gridY": 0, "lat": 68, "lng": 5, "speciesRichness": { "habitatComplexity": 5.2, "resourceAvailability": 5.8, "stability": 4.3 }, "fishingPressure": { "effort": 8.2, "frequency": 7.1, "gearImpact": "nets" }, "mpaStatus": false, "area": 22000, "depth": 1800, "habitatType": "pelagic" },
  { "id": "Z04", "name": "Barents Zone", "gridX": 3, "gridY": 0, "lat": 75, "lng": 40, "speciesRichness": { "habitatComplexity": 7.2, "resourceAvailability": 6.9, "stability": 7.1 }, "fishingPressure": { "effort": 8.2, "frequency": 7.9, "gearImpact": "nets" }, "mpaStatus": false, "area": 18000, "depth": 350, "habitatType": "pelagic" },
  { "id": "Z05", "name": "Greenland Current", "gridX": 4, "gridY": 0, "lat": 70, "lng": -20, "speciesRichness": { "habitatComplexity": 5.1, "resourceAvailability": 4.8, "stability": 5.3 }, "fishingPressure": { "effort": 3.2, "frequency": 2.9, "gearImpact": "line" }, "mpaStatus": false, "area": 31000, "depth": 2200, "habitatType": "deep_sea" },
  { "id": "Z06", "name": "Labrador Basin", "gridX": 5, "gridY": 0, "lat": 55, "lng": -50, "speciesRichness": { "habitatComplexity": 3.2, "resourceAvailability": 2.9, "stability": 3.1 }, "fishingPressure": { "effort": 5.2, "frequency": 4.1, "gearImpact": "line" }, "mpaStatus": false, "area": 25000, "depth": 2900, "habitatType": "deep_sea" },
  { "id": "Z07", "name": "N. Pacific Gyre", "gridX": 0, "gridY": 1, "lat": 30, "lng": -140, "speciesRichness": { "habitatComplexity": 2.3, "resourceAvailability": 3.1, "stability": 4.2 }, "fishingPressure": { "effort": 3.1, "frequency": 3.2, "gearImpact": "line" }, "mpaStatus": false, "area": 45000, "depth": 4200, "habitatType": "pelagic" },
  { "id": "Z08", "name": "California Current", "gridX": 1, "gridY": 1, "lat": 35, "lng": -125, "speciesRichness": { "habitatComplexity": 9.1, "resourceAvailability": 8.2, "stability": 7.2 }, "fishingPressure": { "effort": 9.2, "frequency": 8.1, "gearImpact": "trawling" }, "mpaStatus": false, "area": 12000, "depth": 300, "habitatType": "kelp_forest" },
  { "id": "Z09", "name": "Gulf of Mexico", "gridX": 2, "gridY": 1, "lat": 25, "lng": -90, "speciesRichness": { "habitatComplexity": 7.1, "resourceAvailability": 6.8, "stability": 7.3 }, "fishingPressure": { "effort": 8.3, "frequency": 7.8, "gearImpact": "nets" }, "mpaStatus": false, "area": 15000, "depth": 450, "habitatType": "coral_reef" },
  { "id": "Z10", "name": "Sargasso Sea", "gridX": 3, "gridY": 1, "lat": 28, "lng": -65, "speciesRichness": { "habitatComplexity": 5.3, "resourceAvailability": 7.2, "stability": 6.1 }, "fishingPressure": { "effort": 5.1, "frequency": 4.2, "gearImpact": "line" }, "mpaStatus": false, "area": 33000, "depth": 5000, "habitatType": "pelagic" },
  { "id": "Z11", "name": "N. Mediterranean", "gridX": 4, "gridY": 1, "lat": 40, "lng": 15, "speciesRichness": { "habitatComplexity": 8.2, "resourceAvailability": 8.1, "stability": 7.9 }, "fishingPressure": { "effort": 9.1, "frequency": 8.3, "gearImpact": "trawling" }, "mpaStatus": false, "area": 8000, "depth": 500, "habitatType": "seagrass" },
  { "id": "Z12", "name": "Black Sea Inlet", "gridX": 5, "gridY": 1, "lat": 43, "lng": 35, "speciesRichness": { "habitatComplexity": 5.2, "resourceAvailability": 4.8, "stability": 5.3 }, "fishingPressure": { "effort": 8.1, "frequency": 7.2, "gearImpact": "nets" }, "mpaStatus": false, "area": 5000, "depth": 200, "habitatType": "seagrass" },
  { "id": "Z13", "name": "Coral Triangle", "gridX": 0, "gridY": 2, "lat": -5, "lng": 120, "speciesRichness": { "habitatComplexity": 9.8, "resourceAvailability": 10.0, "stability": 9.9 }, "fishingPressure": { "effort": 9.2, "frequency": 8.9, "gearImpact": "trawling" }, "mpaStatus": false, "area": 9000, "depth": 200, "habitatType": "coral_reef" },
  { "id": "Z14", "name": "Philippine Sea", "gridX": 1, "gridY": 2, "lat": 15, "lng": 130, "speciesRichness": { "habitatComplexity": 9.2, "resourceAvailability": 8.9, "stability": 9.1 }, "fishingPressure": { "effort": 7.2, "frequency": 7.9, "gearImpact": "purse_seine" }, "mpaStatus": true, "area": 14000, "depth": 800, "habitatType": "coral_reef" },
  { "id": "Z15", "name": "South China Sea", "gridX": 2, "gridY": 2, "lat": 12, "lng": 115, "speciesRichness": { "habitatComplexity": 8.1, "resourceAvailability": 7.9, "stability": 8.3 }, "fishingPressure": { "effort": 9.8, "frequency": 10.0, "gearImpact": "trawling" }, "mpaStatus": false, "area": 11000, "depth": 350, "habitatType": "coral_reef" },
  { "id": "Z16", "name": "Indian Ocean Mid", "gridX": 3, "gridY": 2, "lat": -15, "lng": 75, "speciesRichness": { "habitatComplexity": 5.3, "resourceAvailability": 7.1, "stability": 6.1 }, "fishingPressure": { "effort": 4.2, "frequency": 5.1, "gearImpact": "nets" }, "mpaStatus": false, "area": 42000, "depth": 3800, "habitatType": "pelagic" },
  { "id": "Z17", "name": "Arabian Sea", "gridX": 4, "gridY": 2, "lat": 15, "lng": 65, "speciesRichness": { "habitatComplexity": 7.3, "resourceAvailability": 6.8, "stability": 7.1 }, "fishingPressure": { "effort": 8.2, "frequency": 7.3, "gearImpact": "trawling" }, "mpaStatus": true, "area": 16000, "depth": 600, "habitatType": "pelagic" },
  { "id": "Z18", "name": "Bay of Bengal", "gridX": 5, "gridY": 2, "lat": 12, "lng": 85, "speciesRichness": { "habitatComplexity": 8.3, "resourceAvailability": 7.9, "stability": 8.1 }, "fishingPressure": { "effort": 7.2, "frequency": 8.1, "gearImpact": "nets" }, "mpaStatus": false, "area": 13000, "depth": 400, "habitatType": "mangrove" },
  { "id": "Z19", "name": "Great Barrier W.", "gridX": 0, "gridY": 3, "lat": -18, "lng": 147, "speciesRichness": { "habitatComplexity": 10.0, "resourceAvailability": 8.9, "stability": 8.2 }, "fishingPressure": { "effort": 7.2, "frequency": 5.9, "gearImpact": "nets" }, "mpaStatus": false, "area": 20000, "depth": 150, "habitatType": "coral_reef" },
  { "id": "Z20", "name": "Coral Sea East", "gridX": 1, "gridY": 3, "lat": -15, "lng": 155, "speciesRichness": { "habitatComplexity": 9.2, "resourceAvailability": 7.1, "stability": 8.3 }, "fishingPressure": { "effort": 5.3, "frequency": 4.8, "gearImpact": "nets" }, "mpaStatus": false, "area": 17000, "depth": 300, "habitatType": "coral_reef" },
  { "id": "Z21", "name": "Tasman Basin", "gridX": 2, "gridY": 3, "lat": -35, "lng": 160, "speciesRichness": { "habitatComplexity": 4.2, "resourceAvailability": 5.1, "stability": 6.3 }, "fishingPressure": { "effort": 5.2, "frequency": 4.1, "gearImpact": "line" }, "mpaStatus": false, "area": 22000, "depth": 2800, "habitatType": "deep_sea" },
  { "id": "Z22", "name": "Maldives Zone", "gridX": 3, "gridY": 3, "lat": 3, "lng": 73, "speciesRichness": { "habitatComplexity": 9.8, "resourceAvailability": 9.2, "stability": 8.3 }, "fishingPressure": { "effort": 8.3, "frequency": 7.9, "gearImpact": "nets" }, "mpaStatus": true, "area": 7000, "depth": 100, "habitatType": "coral_reef" },
  { "id": "Z23", "name": "Persian Gulf", "gridX": 4, "gridY": 3, "lat": 26, "lng": 52, "speciesRichness": { "habitatComplexity": 3.1, "resourceAvailability": 3.9, "stability": 5.2 }, "fishingPressure": { "effort": 9.2, "frequency": 8.9, "gearImpact": "trawling" }, "mpaStatus": false, "area": 6000, "depth": 50, "habitatType": "seagrass" },
  { "id": "Z24", "name": "Red Sea", "gridX": 5, "gridY": 3, "lat": 20, "lng": 38, "speciesRichness": { "habitatComplexity": 9.1, "resourceAvailability": 7.2, "stability": 8.3 }, "fishingPressure": { "effort": 8.2, "frequency": 7.1, "gearImpact": "nets" }, "mpaStatus": false, "area": 9500, "depth": 300, "habitatType": "coral_reef" },
  { "id": "Z25", "name": "S. Pacific Gyre", "gridX": 0, "gridY": 4, "lat": -40, "lng": -120, "speciesRichness": { "habitatComplexity": 1.3, "resourceAvailability": 2.1, "stability": 3.2 }, "fishingPressure": { "effort": 1.1, "frequency": 1.2, "gearImpact": "line" }, "mpaStatus": false, "area": 50000, "depth": 4500, "habitatType": "pelagic" },
  { "id": "Z26", "name": "Ross Sea", "gridX": 1, "gridY": 4, "lat": -75, "lng": -175, "speciesRichness": { "habitatComplexity": 7.2, "resourceAvailability": 6.9, "stability": 7.1 }, "fishingPressure": { "effort": 2.1, "frequency": 2.3, "gearImpact": "line" }, "mpaStatus": false, "area": 38000, "depth": 800, "habitatType": "deep_sea" },
  { "id": "Z27", "name": "Weddell Sea", "gridX": 2, "gridY": 4, "lat": -70, "lng": -45, "speciesRichness": { "habitatComplexity": 6.1, "resourceAvailability": 5.8, "stability": 6.3 }, "fishingPressure": { "effort": 1.2, "frequency": 0.9, "gearImpact": "line" }, "mpaStatus": false, "area": 35000, "depth": 600, "habitatType": "deep_sea" },
  { "id": "Z28", "name": "Antarctic Ridge", "gridX": 3, "gridY": 4, "lat": -60, "lng": 0, "speciesRichness": { "habitatComplexity": 5.2, "resourceAvailability": 4.9, "stability": 5.1 }, "fishingPressure": { "effort": 2.3, "frequency": 1.8, "gearImpact": "line" }, "mpaStatus": false, "area": 28000, "depth": 3200, "habitatType": "seamount" },
  { "id": "Z29", "name": "Cape Basin", "gridX": 4, "gridY": 4, "lat": -35, "lng": 10, "speciesRichness": { "habitatComplexity": 6.2, "resourceAvailability": 5.9, "stability": 6.1 }, "fishingPressure": { "effort": 6.2, "frequency": 5.9, "gearImpact": "nets" }, "mpaStatus": false, "area": 18000, "depth": 2100, "habitatType": "pelagic" },
  { "id": "Z30", "name": "Benguela Current", "gridX": 5, "gridY": 4, "lat": -25, "lng": 12, "speciesRichness": { "habitatComplexity": 8.2, "resourceAvailability": 7.9, "stability": 8.1 }, "fishingPressure": { "effort": 8.1, "frequency": 7.2, "gearImpact": "nets" }, "mpaStatus": false, "area": 12000, "depth": 200, "habitatType": "kelp_forest" }
] };

// ── Helpers ───────────────────────────────────────────
const $  = id => document.getElementById(id);
const fmt = n => n.toLocaleString();

// ── Sub-factor scoring ────────────────────────────────
const GEAR_MAP = { line: 3, nets: 6, purse_seine: 7, trawling: 10 };

function fpScore(z) {
  const fp = z.fishingPressure;
  const raw = (fp.effort + fp.frequency + (GEAR_MAP[fp.gearImpact] || 5)) / 3;
  return Math.min(10, raw);
}

function srScore(z) {
  const sr = z.speciesRichness;
  const raw = (sr.habitatComplexity + sr.resourceAvailability + sr.stability) / 3;
  return Math.min(10, raw);
}

// Ranking score: pressure-biased (0.6) so most-fished zones surface first in Gap Analysis
const score = z => parseFloat(((srScore(z) * 0.4 + fpScore(z) * 0.6) * 10).toFixed(2));

// ── Custom Smooth Scroll (fixed 0.75s duration) ──────
function smoothScrollTo(targetEl, duration = 750) {
  if (!targetEl) return;
  const start = window.scrollY;
  let end = start + targetEl.getBoundingClientRect().top;
  
  // Hardcode fixed document positions for sticky elements so they scroll correctly
  if (targetEl.id === 'hero') end = 0;
  if (targetEl.id === 'overview') end = window.innerHeight;

  const startTime = performance.now();
  function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
  function step(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, start + (end - start) * ease(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
// Classification: zones with a combined weighted score >= 75/100 are critical
const isCritical = z => score(z) >= 75;

// ── Stats Engine ──────────────────────────────────────
function computeStats() {
  const criticalZones       = zones.filter(isCritical);
  const protectedCritical   = criticalZones.filter(z => z.mpaStatus);
  const unprotectedCritical = criticalZones.filter(z => !z.mpaStatus);
  const protectedTotal      = zones.filter(z => z.mpaStatus);

  // Area-weighted coverage (km²)
  const criticalArea      = criticalZones.reduce((s, z) => s + z.area, 0);
  const protCritArea      = protectedCritical.reduce((s, z) => s + z.area, 0);
  const coveragePct       = criticalArea ? Math.round(protCritArea / criticalArea * 100) : 0;
  const protectedAreaKm   = protectedTotal.reduce((s, z) => s + z.area, 0);
  const critProtectedKm   = protCritArea;   // critical habitat area under protection

  return { criticalZones, protectedCritical, unprotectedCritical, protectedTotal, coveragePct, protectedAreaKm, critProtectedKm };
}

function getTop5Gaps() {
  return zones.filter(z => isCritical(z) && !z.mpaStatus)
              .sort((a,b) => score(b) - score(a))
              .slice(0,5);
}

function getAllCritical() {
  return zones.filter(isCritical).sort((a,b) => score(b) - score(a));
}

// ── Animated Counter ──────────────────────────────────
function counter(el, from, to, ms, suffix = '') {
  const start = performance.now();
  const tick = now => {
    const p = Math.min((now - start) / ms, 1);
    const e = 1 - Math.pow(1 - p, 3);             // ease-out cubic
    el.textContent = Math.round(from + (to - from) * e) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ── Update All Stats ──────────────────────────────────
function updateStats(animate) {
  const s = computeStats();

  // Hero
  if (animate) {
    counter($('hero-coverage'), 0, s.coveragePct,            2400, '%');
    counter($('hero-total'),    0, zones.length,             1800, '');
    counter($('hero-critical'), 0, s.criticalZones.length,   2000, '');
    counter($('hero-protected'),0, s.protectedTotal.length,  2200, '');
  } else {
    $('hero-coverage').textContent  = s.coveragePct + '%';
    $('hero-total').textContent     = zones.length;
    $('hero-critical').textContent  = s.criticalZones.length;
    $('hero-protected').textContent = s.protectedTotal.length;
  }

  // Overview cards text
  if ($('stat-coverage'))    $('stat-coverage').textContent    = s.coveragePct + '%';
  if ($('stat-protected'))   $('stat-protected').textContent   = s.protectedTotal.length;
  if ($('stat-critical'))    $('stat-critical').textContent    = s.criticalZones.length;
  if ($('stat-unprotected')) $('stat-unprotected').textContent = s.unprotectedCritical.length;

  // Critical habitat area protected km² (stat card 5)
  const areaEl = $('stat-area-km');
  if (areaEl) {
    const km = s.critProtectedKm;
    areaEl.textContent = km >= 1000000 ? (km/1000000).toFixed(1)+'M'
                       : km >= 1000    ? (km/1000).toFixed(0)+'K'
                       : String(km);
  }

  // Bars
  setTimeout(() => {
    $('fill-coverage').style.width    = s.coveragePct + '%';
    $('fill-protected').style.width   = (s.protectedTotal.length / zones.length * 100) + '%';
    $('fill-critical').style.width    = (s.criticalZones.length / zones.length * 100) + '%';
    $('fill-unprotected').style.width = (s.unprotectedCritical.length / zones.length * 100) + '%';
  }, 450);

  // Re-render dynamic sections
  updateGlobeData();
  renderZoneList();
  renderCriticalGrid();
  renderGapAnalysis();

  // Update panel if a zone is selected
  if (selectedZone) {
    const updated = zones.find(z => z.id === selectedZone.id);
    if (updated) showPanel(updated);
  }
}
// ── Zone Colour Mapping ───────────────────────────────
const HABITAT_EMOJI = {
  coral_reef: '🐠', seagrass: '🌱', pelagic: '🌊',
  mangrove: '🌴', kelp_forest: '🌿', deep_sea: '💠', seamount: '⛰️'
};

function zoneColors(z) {
  if (z.mpaStatus)    return { stroke: '#00E676' };       // protected
  if (isCritical(z))  return { stroke: '#FF6B6B' };       // critical
  const s = score(z);
  if (s >= 42 || fpScore(z) >= 7) return { stroke: '#FFB347' };  // moderate
  return { stroke: '#00D4FF' };                            // low priority
}

// ── Filter helpers ────────────────────────────────────
function matchesFilter(z) {
  if (!activeFilter) return true;
  switch (activeFilter) {
    case 'protected': return z.mpaStatus;
    case 'critical':  return !z.mpaStatus && isCritical(z);
    case 'moderate':  return !z.mpaStatus && !isCritical(z) && (score(z) >= 42 || fpScore(z) >= 7);
    case 'low':       return !z.mpaStatus && !isCritical(z) && score(z) < 42 && fpScore(z) < 7;
  }
  return true;
}

function setFilter(type) {
  activeFilter = (activeFilter === type) ? null : type;
  document.querySelectorAll('.filter-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.filter === activeFilter)
  );
  // Clear selection if selected zone no longer matches the new filter
  if (selectedZone && !matchesFilter(selectedZone)) {
    selectedZone = null;
    document.getElementById('zl-inline-detail')?.remove();
    document.querySelectorAll('.zl-item').forEach(el => el.classList.remove('zl-active'));
  }
  updateGlobeData();
  renderZoneList();
}

// ── 3D Globe ──────────────────────────────────────────
function initGlobe() {
  const container = document.getElementById('globe-container');
  if (!container || typeof Globe === 'undefined') return;

  // Realistic Earth with space background
  globe = Globe()
    (container)
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
    .showAtmosphere(false)
    .pointAltitude(0.01)
    .pointRadius(0.8)
    .pointResolution(32)
    .pointColor(z => zoneColors(z).stroke)
    .pointLabel(z => {
      const c  = zoneColors(z).stroke;
      const s  = score(z);
      const sr = srScore(z).toFixed(2);
      const fp = fpScore(z).toFixed(2);
      return `
        <div style="background: rgba(4,13,26,0.9); padding: 10px; border-radius: 8px; border: 1px solid ${c}; color: #fff; font-family: 'Space Grotesk', sans-serif; box-shadow: 0 0 15px ${c}44; pointer-events: none;">
          <strong style="color:${c}; font-size: 14px;">${z.id} — ${z.name}</strong><br>
          <span style="font-size: 12px; color: #88A0C0;">Status: ${z.mpaStatus ? 'Protected' : 'Unprotected'}</span><br>
          <span style="font-size: 12px; color: #88A0C0;">R ${sr} · P ${fp} · Score: ${s}</span>
        </div>
      `;
    })
    .onPointClick(z => {
      // Toggle off if same item clicked again
      if (selectedZone?.id === z.id && document.getElementById('zl-inline-detail')) {
        document.getElementById('zl-inline-detail').remove();
        selectedZone = null;
        document.querySelectorAll('.zl-item').forEach(l => l.classList.remove('zl-active'));
        // Resume auto-rotation on deselect
        globe.controls().autoRotate = true;
        updateGlobeData();
        return;
      }

      selectedZone = z;
      // Stop auto-rotation when a zone is selected
      globe.controls().autoRotate = false;
      const li = document.getElementById(`zli-${z.id}`);
      if (li) {
        document.querySelectorAll('.zl-item').forEach(l => l.classList.remove('zl-active'));
        li.classList.add('zl-active');
        li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        showPanel(z); // show detail in right panel
      }
      // Rotate globe to point
      globe.pointOfView({ lat: z.lat, lng: z.lng, altitude: 1.5 }, 1000);
      updateGlobeData();
    });

  // Controls
  globe.controls().autoRotate = true;
  globe.controls().autoRotateSpeed = 0.5;
  globe.controls().enableZoom = true;         // Scroll-wheel zoom enabled
  globe.controls().minDistance = 150;         // Can't zoom into the surface
  globe.controls().maxDistance = 600;         // Can't zoom too far out
  globe.controls().zoomSpeed   = 0.8;

  // Rings for Critical + Selected
  globe
    .ringColor(z => z.id === selectedZone?.id ? '#ffffff' : zoneColors(z).stroke)
    .ringMaxRadius(z => z.id === selectedZone?.id ? 4 : 2)
    .ringPropagationSpeed(1)
    .ringRepeatPeriod(800);

  // Realistic Lighting (Sun/Shadows)
  const globeScene = globe.scene();
  // Remove default lights created by globe.gl to have full control
  globeScene.children = globeScene.children.filter(c => !(c instanceof THREE.AmbientLight || c instanceof THREE.DirectionalLight));
  // Dim ambient light for the dark side
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  globeScene.add(ambientLight);
  // Strong directional light acting as the Sun
  const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
  dirLight.position.set(-1, 0.5, 1); // Sun from top left
  globeScene.add(dirLight);

  // Resize listener
  const resizeGlobe = () => {
    if (container.clientWidth > 0 && container.clientHeight > 0) {
      globe.width(container.clientWidth);
      globe.height(container.clientHeight);
    }
  };
  window.addEventListener('resize', resizeGlobe);
  
  // Force resize calculation after CSS layout completes
  setTimeout(resizeGlobe, 100);
  setTimeout(resizeGlobe, 500);

  updateGlobeData();
}

// ── Globe Zoom Buttons ────────────────────────────────
function zoomGlobe(direction) {
  if (!globe) return;
  const pov = globe.pointOfView();
  const step = 0.25;
  const minAlt = 0.2;
  const maxAlt = 4.0;
  const newAlt = Math.min(maxAlt, Math.max(minAlt, pov.altitude + direction * step));
  globe.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: newAlt }, 350);
}

function updateGlobeData() {
  if (!globe) return;
  const filtered = zones.filter(matchesFilter);
  globe.pointsData(filtered);
  
  // Highlight selected and critical zones with animated rings
  globe.ringsData(filtered.filter(z => isCritical(z) || z.id === selectedZone?.id));
}

// ── Sub-factor toggle state ───────────────────────────
let openSubfactor = null; // 'richness' | 'pressure' | null

// ── Zone List inline detail injector ─────────────────
function injectListDetail(z, afterItem) {
  document.getElementById('zl-inline-detail')?.remove();
  openSubfactor = null;
  const s   = score(z).toFixed(2);
  const sr  = srScore(z).toFixed(2);
  const fp  = fpScore(z).toFixed(2);
  const gearNum = GEAR_MAP[z.fishingPressure.gearImpact] || 5;

  const statusTxt = z.mpaStatus
    ? '<span style="color:var(--green)">Protected</span>'
    : '<span style="color:var(--coral)">Unprotected</span>';
  const btnClass = z.mpaStatus ? 'protect-btn btn-remove' : 'protect-btn btn-add';
  const btnLabel = z.mpaStatus ? '🔓 Remove Protection' : '🛡️ Add MPA Protection';

  const det = document.createElement('div');
  det.id = 'zl-inline-detail';
  det.className = 'zl-inline-detail';
  det.innerHTML = `
    <div class="zd-name">${z.name}</div>
    <div class="zd-meta"><span class="zd-zone-id">${z.id}</span> · ${statusTxt} · Score <strong>${s}</strong></div>

    <div class="zd-metrics-row">
      <div class="zd-mc zd-mc-toggle" id="sf-btn-richness" onclick="toggleSF('richness')">
        <div class="zd-mc-lbl">Richness <span class="sf-arrow" id="sf-arrow-richness">▾</span></div>
        <div class="zd-mc-val">${sr}/10</div>
      </div>
      <div class="zd-mc zd-mc-toggle" id="sf-btn-pressure" onclick="toggleSF('pressure')">
        <div class="zd-mc-lbl">Pressure <span class="sf-arrow" id="sf-arrow-pressure">▾</span></div>
        <div class="zd-mc-val">${fp}/10</div>
      </div>
    </div>

    <div class="zd-subfactors" id="sf-richness">
      <div class="zd-sf-row"><span class="zd-sf-lbl">Habitat Complexity</span><span class="zd-sf-val">${z.speciesRichness.habitatComplexity}/10</span></div>
      <div class="zd-sf-row"><span class="zd-sf-lbl">Resource Availability</span><span class="zd-sf-val">${z.speciesRichness.resourceAvailability}/10</span></div>
      <div class="zd-sf-row"><span class="zd-sf-lbl">Environmental Stability</span><span class="zd-sf-val">${z.speciesRichness.stability}/10</span></div>
    </div>

    <div class="zd-subfactors" id="sf-pressure">
      <div class="zd-sf-row"><span class="zd-sf-lbl">Effort</span><span class="zd-sf-val">${z.fishingPressure.effort}/10</span></div>
      <div class="zd-sf-row"><span class="zd-sf-lbl">Frequency</span><span class="zd-sf-val">${z.fishingPressure.frequency}/10</span></div>
      <div class="zd-sf-row"><span class="zd-sf-lbl">Gear Impact (${z.fishingPressure.gearImpact})</span><span class="zd-sf-val">${gearNum}/10</span></div>
    </div>

    <div class="zd-extra-row">
      <div class="zd-extra"><span class="zd-extra-lbl">Area</span><span class="zd-extra-val">${z.area.toLocaleString()} km²</span></div>
      <div class="zd-extra"><span class="zd-extra-lbl">Depth</span><span class="zd-extra-val">${z.depth}m</span></div>
      <div class="zd-extra"><span class="zd-extra-lbl">Habitat</span><span class="zd-extra-val">${z.habitatType.replace(/_/g,' ')}</span></div>
    </div>
    <button class="protect-btn ${btnClass}" id="protect-btn" onclick="toggleProtection()">${btnLabel}</button>
  `;
  afterItem.insertAdjacentElement('afterend', det);
  setTimeout(() => det.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
}

// ── Sub-factor toggle handler ─────────────────────────
function toggleSF(type) {
  const panel  = document.getElementById(`sf-${type}`);
  const arrow  = document.getElementById(`sf-arrow-${type}`);
  const other  = type === 'richness' ? 'pressure' : 'richness';
  const oPanel = document.getElementById(`sf-${other}`);
  const oArrow = document.getElementById(`sf-arrow-${other}`);

  // Collapse the other one first
  if (oPanel && oPanel.classList.contains('sf-open')) {
    oPanel.classList.remove('sf-open');
    if (oArrow) oArrow.textContent = '▾';
  }

  if (!panel) return;
  const isOpen = panel.classList.toggle('sf-open');
  if (arrow) arrow.textContent = isOpen ? '▴' : '▾';
  openSubfactor = isOpen ? type : null;
}

// ── Zone List (right panel) ───────────────────────────
function renderZoneList() {
  const list = $('zone-list');
  if (!list) return;
  list.innerHTML = '';

  const filtered = zones.filter(matchesFilter);
  const countEl  = $('zone-panel-count');
  if (countEl) countEl.textContent = filtered.length + ' ZONES';

  filtered.forEach(z => {
    const c    = zoneColors(z);
    const sr   = srScore(z).toFixed(2);
    const fp   = fpScore(z).toFixed(2);
    const item = document.createElement('div');
    item.className = 'zl-item' + (selectedZone?.id === z.id ? ' zl-active' : '');
    item.id = `zli-${z.id}`;
    item.innerHTML = `
      <span class="zl-dot" style="background:${c.stroke};box-shadow:0 0 6px ${c.stroke}88"></span>
      <span class="zl-id">${z.id}</span>
      <div class="zl-info">
        <div class="zl-name">${z.name}</div>
        <div class="zl-rp">R ${sr}/10 · P ${fp}/10</div>
      </div>
    `;
    item.addEventListener('click', () => {
      // Toggle off if same item clicked again
      if (selectedZone?.id === z.id && document.getElementById('zl-inline-detail')) {
        document.getElementById('zl-inline-detail').remove();
        selectedZone = null;
        item.classList.remove('zl-active');
        if (globe) {
          // Resume auto-rotation on deselect
          globe.controls().autoRotate = true;
          updateGlobeData();
        }
        return;
      }
      selectedZone = z;
      document.querySelectorAll('.zl-item').forEach(l => l.classList.remove('zl-active'));
      item.classList.add('zl-active');
      injectListDetail(z, item);
      if (globe) {
        // Stop auto-rotation when a zone is selected
        globe.controls().autoRotate = false;
        globe.pointOfView({ lat: z.lat, lng: z.lng, altitude: 1.5 }, 1000);
        updateGlobeData();
      }
    });
    list.appendChild(item);
  });

  // Re-inject inline detail after list re-render if a zone is selected
  if (selectedZone) {
    const item = $(`zli-${selectedZone.id}`);
    if (item) injectListDetail(selectedZone, item);
  }
}

// ── Zone Detail Panel ─────────────────────────────────
function showPanel(z) {
  // Refresh the inline list detail if it's open
  const item = $(`zli-${z.id}`);
  if (item) injectListDetail(z, item);
}

// ── Toggle Protection ─────────────────────────────────
function toggleProtection() {
  if (!selectedZone) return;

  const z = selectedZone;
  z.mpaStatus = !z.mpaStatus;

  saveState();
  showToast(z.mpaStatus
    ? `🛡️ ${z.name} is now a Marine Protected Area!`
    : `🔓 ${z.name} MPA status removed.`);

  // If active filter no longer includes this zone, clear selection
  if (activeFilter && !matchesFilter(z)) {
    selectedZone = null;
    document.getElementById('zl-inline-detail')?.remove();
  }

  updateStats(false); // re-renders grid + list (re-injects detail if selectedZone still set)
}

// ── Toast ─────────────────────────────────────────────
function showToast(msg) {
  $('toast-msg').textContent = msg;
  $('toast').classList.add('show');
  setTimeout(() => $('toast').classList.remove('show'), 3600);
}

// ── Critical Habitat Grid ─────────────────────────────
function renderCriticalGrid() {
  const critical = getAllCritical();
  const grid = $('critical-grid');
  grid.innerHTML = '';

  critical.forEach((z, i) => {
    const s  = score(z);
    const card = document.createElement('div');
    card.className = `critical-card${z.mpaStatus ? ' is-protected' : ''} crit-reveal`;

    card.innerHTML = `
      <div class="cc-header">
        <span class="cc-rank">#${i+1} RANKED</span>
        <div><span class="cc-score-val">${s}</span><span class="cc-score-unit">/100</span></div>
      </div>
      <div class="cc-name">${z.name}</div>
      <div class="cc-habitat">${HABITAT_EMOJI[z.habitatType]||''} ${z.habitatType.replace(/_/g,' ')}</div>
      <div class="cc-metrics">
        <div class="cc-metric"><div class="cc-metric-val">${srScore(z).toFixed(2)}</div><div class="cc-metric-lbl">Richness</div></div>
        <div class="cc-metric"><div class="cc-metric-val">${fpScore(z).toFixed(2)}</div><div class="cc-metric-lbl">Pressure</div></div>
        <div class="cc-metric"><div class="cc-metric-val">${(z.area/1000).toFixed(0)}k</div><div class="cc-metric-lbl">km²</div></div>
      </div>
      <div class="cc-footer">
        <span class="cc-badge ${z.mpaStatus ? 'protected' : 'unprotected'}">${z.mpaStatus ? '✅ Protected' : '⚠️ Unprotected'}</span>
        <span class="cc-area">${z.depth}m depth</span>
      </div>
    `;

    // 3D tilt on mousemove
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left) / r.width  - 0.5;
      const y  = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `translateY(-6px) rotateX(${-y*9}deg) rotateY(${x*9}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });

    grid.appendChild(card);
  });

  // Observe the grid as a whole — animate row by row
  setTimeout(() => initCritReveal(grid), 80);
}

function initCritReveal(grid) {
  if (grid.dataset.critObserved) {
    // Already set up — just re-reveal if grid re-rendered while in view
    const r = grid.getBoundingClientRect();
    if (r.top < window.innerHeight) revealCriticalRows(grid);
    return;
  }
  grid.dataset.critObserved = '1';
  const obs = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    revealCriticalRows(grid);
    obs.disconnect();
  }, { threshold: 0.08 });
  obs.observe(grid);
}

function revealCriticalRows(grid) {
  const cards = [...grid.querySelectorAll('.crit-reveal')];
  if (!cards.length) return;
  // Group cards by their top offset (= same row)
  const rows = [];
  cards.forEach(card => {
    const top = card.getBoundingClientRect().top;
    let row = rows.find(r => Math.abs(r.top - top) < 4);
    if (!row) { row = { top, cards: [] }; rows.push(row); }
    row.cards.push(card);
  });
  rows.sort((a, b) => a.top - b.top);
  rows.forEach((row, ri) => {
    row.cards.forEach(card => {
      setTimeout(() => card.classList.add('crit-visible'), ri * 110);
    });
  });
}

// ── Gap Analysis Bento UI ───────────────────────────────
function renderGapAnalysis() {
  const top5  = getTop5Gaps();
  const maxSc = top5.length ? score(top5[0]) : 100;
  const grid  = $('gap-bento-grid');
  if (!grid) return;
  grid.innerHTML = '';

  // Empty / success state
  if (top5.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: span 3; text-align: center; padding: 100px 0;">
        <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
        <div style="font-family: var(--font-display); font-size: 28px; font-weight: 700; color: var(--txt-1); margin-bottom: 10px;">All Critical Gaps Closed!</div>
        <div style="font-size: 15px; color: var(--txt-3);">Every unprotected critical zone now has MPA coverage. Outstanding conservation work!</div>
      </div>`;
    setTimeout(initReveal, 80);
    return;
  }

  top5.forEach((z, i) => {
    const s = score(z);
    const pct = (s / maxSc * 100);
    const item = document.createElement('div');
    item.className = 'bento-card reveal-up';
    item.style.transitionDelay = (i * 100) + 'ms';
    
    const emoji = HABITAT_EMOJI[z.habitatType] || '🌊';
    const type  = z.habitatType.replace(/_/g,' ');

    item.innerHTML = `
      <div class="bento-rank">${i+1}</div>
      <div class="bento-content">
        <div class="bento-header">
          <div>
            <div class="bento-title">${z.name}</div>
            <div class="bento-subtitle"><span style="font-size: 16px">${emoji}</span> ${type}</div>
          </div>
        </div>
        
        <div class="bento-stats">
          <div class="bento-stat">
            <div class="bento-stat-val">${fmt(z.area)} <span style="font-size:10px;color:var(--txt-3)">km²</span></div>
            <div class="bento-stat-lbl">Area</div>
          </div>
          <div class="bento-stat">
            <div class="bento-stat-val">${srScore(z).toFixed(2)}/10</div>
            <div class="bento-stat-lbl">Richness</div>
          </div>
          <div class="bento-stat">
            <div class="bento-stat-val">${fpScore(z).toFixed(2)}/10</div>
            <div class="bento-stat-lbl">Pressure</div>
          </div>
        </div>

        <div style="margin-top: auto;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <span class="bento-metric-lbl">Priority Score</span>
            <span class="bento-mini-score">${s}</span>
          </div>
          <div class="bento-bar-track">
            <div class="bento-bar-fill bento-anim-bar" style="width: 0%;" data-width="${pct}%"></div>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(item);
  });

  setTimeout(initReveal, 80);
}

function autoResolveGaps() {
  const top5 = getTop5Gaps();
  if (!top5.length) return;
  top5.forEach(z => z.mpaStatus = true);
  saveState();
  updateStats(true);
  showToast('🛡️ Auto-resolved top 5 critical gaps!');
  smoothScrollTo($('map-section'), 800);
}

// ── Scroll Reveal (IntersectionObserver) ─────────────
function initReveal() {                              // Bug 3 fix: singleton — one observer total
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');

        // Animate bento ring and bars inside revealed elements
        entry.target.querySelectorAll('.bento-anim-ring').forEach(ring => {
          setTimeout(() => { ring.style.strokeDashoffset = ring.dataset.offset; }, 300);
        });
        entry.target.querySelectorAll('.bento-anim-bar').forEach(bar => {
          setTimeout(() => { bar.style.width = bar.dataset.width; }, 300);
        });

        // Animate stat bars (once) when overview section enters view
        if (entry.target.id === 'overview' && !statsRevealDone) {
          statsRevealDone = true;
          animateStatCards();
          const s = computeStats();
          setTimeout(() => {
            $('fill-coverage').style.width    = s.coveragePct + '%';
            $('fill-protected').style.width   = (s.protectedTotal.length / zones.length * 100) + '%';
            $('fill-critical').style.width    = (s.criticalZones.length / zones.length * 100) + '%';
            $('fill-unprotected').style.width = (s.unprotectedCritical.length / zones.length * 100) + '%';
          }, 400);
        }
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    const ov = $('overview');
    if (ov) revealObserver.observe(ov);
  }
  // Register any new .reveal-up elements not yet observed
  document.querySelectorAll('.reveal-up:not(.visible)').forEach(el => revealObserver.observe(el));
}

// ── Navbar Scroll Blur + Active Link Spy ─────────────
function initNavbar() {
  const navbar = $('navbar');
  const NAV_MAP = [
    ['overview',          $('nav-overview')],
    ['map-section',       $('nav-map')],
    ['critical-section',  $('nav-critical')],
    ['gap-section',       $('nav-gap')],
  ];

  // Intercept nav link clicks → custom 0.75s scroll
  for (const [id, link] of NAV_MAP) {
    if (link) link.addEventListener('click', e => {
      e.preventDefault();
      smoothScrollTo($(id), 750);
    });
  }

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);

    // Scroll-spy: highlight the section whose top is nearest above viewport centre
    let current = '';
    for (const [id] of NAV_MAP) {
      const el = $(id);
      if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.45) current = id;
    }
    for (const [id, link] of NAV_MAP) {
      if (link) link.classList.toggle('active', id === current);
    }
  }, { passive: true });
}

// ── Three.js Hero Scene ───────────────────────────────
function initThreeJS() {
  if (typeof THREE === 'undefined') { console.warn('Three.js not loaded'); return; }

  const canvas   = $('hero-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 5.5);

  // ── Particle cloud (bioluminescent plankton) ──
  const COUNT = 900;
  const pos   = new Float32Array(COUNT * 3);
  const col   = new Float32Array(COUNT * 3);           // Bug 7 fix: removed unused sz array

  for (let i = 0; i < COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 3 + Math.random() * 6;
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i*3+2] = r * Math.cos(phi);

    const t = Math.random();
    if      (t < 0.55) { col[i*3]=0;   col[i*3+1]=0.83; col[i*3+2]=1;    } // cyan
    else if (t < 0.80) { col[i*3]=0;   col[i*3+1]=1;    col[i*3+2]=0.82; } // teal
    else               { col[i*3]=0.6; col[i*3+1]=0.44; col[i*3+2]=0.86; } // purple
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

  const pMat = new THREE.PointsMaterial({
    size: 0.055, vertexColors: true, transparent: true, opacity: 0.72,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);



  // ── Mouse parallax ──
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // ── Resize handler ──
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }, { passive: true });

  // ── Animate ──
  let t = 0;
  (function animate() {
    requestAnimationFrame(animate);
    t += 0.006;

    particles.rotation.y = t * 0.06;
    particles.rotation.x = t * 0.025;
    particles.rotation.z = Math.sin(t * 0.4) * 0.04;

    // Smooth camera parallax
    camera.position.x += (mouseX * 0.35 - camera.position.x) * 0.04;
    camera.position.y += (-mouseY * 0.25 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  })();
}

// ── Load Data ─────────────────────────────────────────
async function loadData() {
  try {
    const res  = await fetch('ocean_zones.json');
    const data = await res.json();
    zones = data.zones;
  } catch {
    // Apply small decimal offsets so composites look natural (not .00/.33/.67)
    const d = [0.1,-0.1,0.2,-0.2,0.1,0.3,-0.1,0.2,-0.2,0.1,0.3,-0.1,0.2,0.1,-0.2,0.3,0.1,-0.1,0.2,-0.3,0.1,0.3,-0.1,0.2,-0.2,0.1,0.3,-0.1,0.2,-0.3];
    zones = FALLBACK_DATA.zones.map((z, i) => {
      const o = d[i];
      return {
        ...z,
        speciesRichness: {
          habitatComplexity:      Math.min(10, +(z.speciesRichness.habitatComplexity      + o + 0.1).toFixed(1)),
          resourceAvailability:   Math.min(10, +(z.speciesRichness.resourceAvailability   + o - 0.1).toFixed(1)),
          stability:              Math.min(10, +(z.speciesRichness.stability               + o + 0.2).toFixed(1))
        },
        fishingPressure: {
          ...z.fishingPressure,
          effort:    Math.min(10, +(z.fishingPressure.effort    + o + 0.2).toFixed(1)),
          frequency: Math.min(10, +(z.fishingPressure.frequency + o - 0.1).toFixed(1))
        }
      };
    });
  }
  loadState(zones);
  initApp();
}

// ── Hero Video Scroll Animation ───────────────────────
function initHeroScroll() {
  const video   = document.getElementById('hero-video');
  const content = document.querySelector('.hero-content');
  const hero    = document.getElementById('hero');
  if (!video || !hero) return;

  let rafId = null;

  function onScroll() {
    if (rafId) return;                          // throttle to rAF
    rafId = requestAnimationFrame(() => {
      rafId = null;
      const heroH   = hero.offsetHeight;
      const scrollY = window.scrollY;
      // progress: 0 at top, 1 when hero is fully scrolled past
      const progress = Math.min(scrollY / heroH, 1);

      // Video: zoom in + fade out
      const scale   = 1 + progress * 0.14;     // 1.0 → 1.14
      const opacity = 1 - progress * 1.4;      // full → gone at ~71% scroll
      if (video) {
        video.style.transform = `scale(${scale})`;
        video.style.opacity   = Math.max(opacity, 0);
      }

      // Hero content: subtle lift + fade
      if (content) {
        const translateY = progress * -55;      // floats up 55px
        const cOpacity   = 1 - progress * 2.2; // fades out faster
        content.style.transform = `translateY(${translateY}px)`;
        content.style.opacity   = Math.max(cOpacity, 0);
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // initialise on load
}

// ── Stat Card Counters on Scroll ─────────────────────
function animateStatCards() {
  if (statCardsAnimDone) return;
  statCardsAnimDone = true;
  const s = computeStats();
  setTimeout(() => {
    counter($('stat-coverage'),    0, s.coveragePct,                1800, '%');
    counter($('stat-protected'),   0, s.protectedTotal.length,      1600, '');
    counter($('stat-critical'),    0, s.criticalZones.length,       1700, '');
    counter($('stat-unprotected'), 0, s.unprotectedCritical.length, 1900, '');
    const km = s.critProtectedKm;
    const val = km >= 1000000 ? +(km/1000000).toFixed(1) : km >= 1000 ? Math.round(km/1000) : km;
    const sfx = km >= 1000000 ? 'M' : km >= 1000 ? 'K' : '';
    counter($('stat-area-km'), 0, val, 2000, sfx);
  }, 350);
}

// ── Scroll Dot Nav ────────────────────────────────────
function initScrollNav() {
  const dots     = document.querySelectorAll('.snav-dot');
  const sections = ['hero','overview','map-section','critical-section','gap-section'];

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const el = document.getElementById(dot.dataset.target);
      if (el) smoothScrollTo(el, 750);
    });
  });

  // getDocTop is now global (defined near top of file)

  function updateDots() {
    let current = 'hero';
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.45) current = id;
    }
    dots.forEach(dot => dot.classList.toggle('active', dot.dataset.target === current));
  }

  window.addEventListener('scroll', updateDots, { passive: true });
  updateDots();
}


// ── Floating Particles ────────────────────────────────
function initParticles() {
  const containers = document.querySelectorAll('.particles-container');
  containers.forEach(container => {
    const count = parseInt(container.dataset.count) || 40;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      const size = Math.random() * 6 + 2;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.animationDuration = (Math.random() * 10 + 10) + 's';
      p.style.animationDelay = (Math.random() * -15) + 's';
      p.style.setProperty('--drift', (Math.random() * 200 - 100) + 'px');
      // Drastically lower opacity so they don't overshadow the 4k background image
      p.style.setProperty('--max-opacity', Math.random() * 0.15 + 0.05);
      container.appendChild(p);
    }
  });
}

// ── 3D Card Tilt ──────────────────────────────────────
function initCardTilt() {
  const cards = document.querySelectorAll('#overview .stat-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -10; // Max tilt 10deg
      const rotateY = ((x - centerX) / centerX) * 10;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      card.style.transition = 'none'; // Instant tracking
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s var(--ease-spring), box-shadow 0.5s var(--ease-spring)';
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease-out';
    });
  });
}

// ── Init App ──────────────────────────────────────────
function initApp() {
  updateStats(false);
  initNavbar();
  initReveal();
  initPanelScroll();
  initGlobe();
  initHeroScroll();
  initScrollNav();
  initParticles();
  initCardTilt();
  initSectionFades();
  setTimeout(animateHeroCounters, 800);
}

// ── Scroll-driven Section Darkening ───────────────────
// Same principle as hero: fade the section itself as you scroll past it
function initSectionFades() {
  const sections = [
    document.getElementById('overview-wrapper'),
    document.getElementById('map-section'),
    document.getElementById('critical-section'),
    document.getElementById('gap-section')
  ].filter(Boolean);

  function onScroll() {
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const h = section.offsetHeight;
      const vh = window.innerHeight;

      // How far the section top has scrolled above the viewport
      const scrolled = Math.max(-rect.top, 0);
      const progress = scrolled / h;

      if (progress > 0.35 && progress < 1) {
        // Darken in the second half of scrolling through
        const fade = Math.min((progress - 0.35) / 0.45, 1) * 0.7;
        section.style.filter = `brightness(${1 - fade})`;
      } else {
        section.style.filter = '';
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── Isolate right-panel scroll ────────────────────────
function initPanelScroll() {
  const panel = $('zone-panel');
  const list  = $('zone-list');
  if (!panel || !list) return;
  panel.addEventListener('wheel', e => {
    e.preventDefault();
    list.scrollTop += e.deltaY;
  }, { passive: false });
}

// ── Hero Counter Animation ────────────────────────────
function animateHeroCounters() {            // Bug 1 fix: extracted from updateStats(true)
  const s = computeStats();
  counter($('hero-coverage'), 0, s.coveragePct,           2400, '%');
  counter($('hero-total'),    0, zones.length,            1800, '');
  counter($('hero-critical'), 0, s.criticalZones.length,  2000, '');
  counter($('hero-protected'),0, s.protectedTotal.length, 2200, '');
}

// ── Theme Toggle ─────────────────────────────────────────
const MOON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const SUN_SVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  localStorage.setItem('mpa-theme', isLight ? 'light' : 'dark');
  _applyThemeIcon(isLight);
}

function _applyThemeIcon(isLight) {
  const btn = $('theme-toggle');
  if (!btn) return;
  btn.innerHTML = isLight ? MOON_SVG : SUN_SVG;
  btn.title     = isLight ? 'Switch to dark mode' : 'Switch to light mode';
}

function restoreTheme() {
  const saved = localStorage.getItem('mpa-theme');
  if (saved === 'light') { document.body.classList.add('light'); _applyThemeIcon(true); }
  else { _applyThemeIcon(false); }
}

// ── Boot ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  restoreTheme();
  loadData();
  
  // Wait for video to load before starting animations
  const video = document.getElementById('hero-video');
  const hero = document.getElementById('hero');
  if (video && hero) {
    if (video.readyState >= 3) {
      hero.classList.add('video-loaded');
    } else {
      video.addEventListener('canplay', () => hero.classList.add('video-loaded'));
    }
  }

  // Initialize UI features
  if (typeof initNavbar === 'function') initNavbar();
  if (typeof initScrollNav === 'function') initScrollNav();
  if (typeof initParticles === 'function') initParticles();
  if (typeof initSectionFades === 'function') initSectionFades();
  if (typeof initPanelScroll === 'function') initPanelScroll();
  if (typeof initThreeJS === 'function') initThreeJS();
  if (typeof initGlobe === 'function') initGlobe();
});
