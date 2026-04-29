/* ============================================================
   Dow RunWalk Interactive Volunteer Map — app.js
   Vanilla ES6+ | No dependencies
   ============================================================ */

(function () {
  'use strict';

  // ── DOM References ──────────────────────────────────────
  const mapContainer   = document.getElementById('mapContainer');
  const raceMapImg     = document.getElementById('raceMapImg');

  // Desktop tooltip
  const tooltip        = document.getElementById('tooltip');
  const tooltipArrow   = document.getElementById('tooltipArrow');
  const tooltipHeader  = document.getElementById('tooltipHeader');
  const tooltipBody    = document.getElementById('tooltipBody');
  const tooltipSpinner = document.getElementById('tooltipSpinner');
  const tooltipImg     = document.getElementById('tooltipImg');
  const tooltipFallback = document.getElementById('tooltipFallback');

  // Mobile modal
  const modalOverlay   = document.getElementById('modalOverlay');
  const modal          = document.getElementById('modal');
  const modalTitle     = document.getElementById('modalTitle');
  const modalClose     = document.getElementById('modalClose');
  const modalBody      = document.getElementById('modalBody');
  const modalSpinner   = document.getElementById('modalSpinner');
  const modalImg       = document.getElementById('modalImg');
  const modalFallback  = document.getElementById('modalFallback');

  // ── State ───────────────────────────────────────────────
  const imageCache = {};          // cached Image objects keyed by station id
  let tooltipLeaveTimer = null;   // delay timer for hover-out
  let activeMarker = null;        // currently active marker element
  let lastFocusedMarker = null;   // for restoring focus after modal close

  // ── Helpers ─────────────────────────────────────────────
  const isMobile = () => window.innerWidth < 768;

  // ── Initialisation ──────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    try {
      const resp = await fetch('data/stations.json');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      createMarkers(data.stations);
      bindGlobalEvents();
    } catch (err) {
      console.error('Failed to load station data:', err);
    }
  }

  // ── Create Marker Buttons ──────────────────────────────
  function createMarkers(stations) {
    // Sort by numeric id for logical tab order
    stations.sort((a, b) => parseFloat(a.id) - parseFloat(b.id));

    stations.forEach((station) => {
      const btn = document.createElement('button');
      btn.className = 'station-marker';
      btn.textContent = station.id;
      btn.style.left = station.xPct + '%';
      btn.style.top  = station.yPct + '%';
      btn.setAttribute('aria-label', `Station ${station.id}: ${station.name}`);
      btn.dataset.stationId    = station.id;
      btn.dataset.stationName  = station.name;
      btn.dataset.stationImage = station.image;

      // Desktop hover events
      btn.addEventListener('mouseenter', onMarkerEnter);
      btn.addEventListener('mouseleave', onMarkerLeave);

      // Mobile tap / keyboard events
      btn.addEventListener('click', onMarkerClick);
      btn.addEventListener('keydown', onMarkerKeydown);

      mapContainer.appendChild(btn);
    });
  }

  // ── Global Events ──────────────────────────────────────
  function bindGlobalEvents() {
    // Close modal on backdrop click
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    // Close modal on × button
    modalClose.addEventListener('click', closeModal);

    // Escape key closes tooltip or modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!modalOverlay.classList.contains('visible')) {
          hideTooltip();
        } else {
          closeModal();
        }
      }
    });

    // Keep tooltip open when hovering over it
    tooltip.addEventListener('mouseenter', () => clearTimeout(tooltipLeaveTimer));
    tooltip.addEventListener('mouseleave', () => {
      tooltipLeaveTimer = setTimeout(hideTooltip, 100);
    });
  }

  // ============================================================
  //  DESKTOP — Hover Tooltip
  // ============================================================
  function onMarkerEnter(e) {
    if (isMobile()) return;
    clearTimeout(tooltipLeaveTimer);

    const btn = e.currentTarget;
    setActiveMarker(btn);
    showTooltip(btn);
  }

  function onMarkerLeave() {
    if (isMobile()) return;
    tooltipLeaveTimer = setTimeout(hideTooltip, 150);
  }

  function showTooltip(btn) {
    const id    = btn.dataset.stationId;
    const name  = btn.dataset.stationName;
    const image = btn.dataset.stationImage;

    // Header
    tooltipHeader.textContent = `Station ${id} — ${name}`;

    // Reset body
    tooltipImg.style.display     = 'none';
    tooltipFallback.style.display = 'none';
    tooltipSpinner.classList.remove('hidden');

    // Link via aria
    tooltip.id = 'tooltip';
    btn.setAttribute('aria-describedby', 'tooltip');

    // Position & show
    positionTooltip(btn);
    tooltip.classList.add('visible');
    tooltip.setAttribute('aria-hidden', 'false');

    // Load image
    loadStationImage(id, image, tooltipImg, tooltipSpinner, tooltipFallback, `Setup instructions for Station ${id}`);
  }

  function hideTooltip() {
    tooltip.classList.remove('visible');
    tooltip.setAttribute('aria-hidden', 'true');
    clearActiveMarker();
  }

  function positionTooltip(btn) {
    const containerRect = mapContainer.getBoundingClientRect();
    const btnRect       = btn.getBoundingClientRect();

    // Marker center relative to container
    const markerCX = btnRect.left + btnRect.width / 2 - containerRect.left;
    const markerCY = btnRect.top  + btnRect.height / 2 - containerRect.top;

    // Tooltip dimensions (estimate; use actual after render)
    const tw = 380;
    const th = 300;
    const gap = 12;

    // Remove old position classes
    tooltip.classList.remove('pos-above', 'pos-below', 'pos-left', 'pos-right');

    // Decide vertical vs horizontal placement
    let left, top, posClass;

    // Prefer above
    if (markerCY - th - gap > 0) {
      posClass = 'pos-above';
      left = markerCX - tw / 2;
      top  = markerCY - th - gap - btnRect.height / 2;
    }
    // Below
    else if (markerCY + th + gap + btnRect.height / 2 < containerRect.height) {
      posClass = 'pos-below';
      left = markerCX - tw / 2;
      top  = markerCY + gap + btnRect.height / 2;
    }
    // Right
    else if (markerCX + tw + gap + btnRect.width / 2 < containerRect.width) {
      posClass = 'pos-right';
      left = markerCX + gap + btnRect.width / 2;
      top  = markerCY - 30;
    }
    // Left
    else {
      posClass = 'pos-left';
      left = markerCX - tw - gap - btnRect.width / 2;
      top  = markerCY - 30;
    }

    // Clamp horizontal
    if (left < 8) left = 8;
    if (left + tw > containerRect.width - 8) left = containerRect.width - tw - 8;

    // Clamp vertical
    if (top < 8) top = 8;

    tooltip.classList.add(posClass);
    tooltip.style.left = left + 'px';
    tooltip.style.top  = top + 'px';
    tooltip.style.width = tw + 'px';
  }

  // ============================================================
  //  MOBILE — Tap Modal
  // ============================================================
  function onMarkerClick(e) {
    if (!isMobile()) return;
    e.preventDefault();

    const btn = e.currentTarget;
    lastFocusedMarker = btn;
    openModal(btn);
  }

  function openModal(btn) {
    const id    = btn.dataset.stationId;
    const name  = btn.dataset.stationName;
    const image = btn.dataset.stationImage;

    // Title
    modalTitle.textContent = `Station ${id} — ${name}`;

    // Reset body
    modalImg.style.display      = 'none';
    modalFallback.style.display = 'none';
    modalSpinner.classList.remove('hidden');

    // Show overlay
    modalOverlay.classList.add('visible');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    // Focus the close button
    setTimeout(() => modalClose.focus(), 50);

    // Trap focus inside modal
    modal.addEventListener('keydown', trapFocus);

    // Load image
    loadStationImage(id, image, modalImg, modalSpinner, modalFallback, `Setup instructions for Station ${id}`);
  }

  function closeModal() {
    modalOverlay.classList.remove('visible');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    modal.removeEventListener('keydown', trapFocus);

    // Restore focus
    if (lastFocusedMarker) {
      lastFocusedMarker.focus();
      lastFocusedMarker = null;
    }
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;

    const focusable = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // ============================================================
  //  Keyboard on Markers
  // ============================================================
  function onMarkerKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const btn = e.currentTarget;
      if (isMobile()) {
        lastFocusedMarker = btn;
        openModal(btn);
      } else {
        showTooltip(btn);
      }
    }
  }

  // ============================================================
  //  Lazy Image Loading with Cache
  // ============================================================
  function loadStationImage(id, filename, imgEl, spinnerEl, fallbackEl, altText) {
    // Already cached
    if (imageCache[id]) {
      spinnerEl.classList.add('hidden');
      imgEl.src = imageCache[id];
      imgEl.alt = altText;
      imgEl.style.display = 'block';
      return;
    }

    const src = 'images/stations/' + filename;
    const tempImg = new Image();

    tempImg.onload = () => {
      imageCache[id] = src;
      spinnerEl.classList.add('hidden');
      imgEl.src = src;
      imgEl.alt = altText;
      imgEl.style.display = 'block';
    };

    tempImg.onerror = () => {
      spinnerEl.classList.add('hidden');
      fallbackEl.style.display = 'block';
    };

    tempImg.src = src;
  }

  // ============================================================
  //  Active Marker Styling
  // ============================================================
  function setActiveMarker(btn) {
    clearActiveMarker();
    btn.classList.add('active');
    activeMarker = btn;
  }

  function clearActiveMarker() {
    if (activeMarker) {
      activeMarker.classList.remove('active');
      activeMarker.removeAttribute('aria-describedby');
      activeMarker = null;
    }
  }

})();
