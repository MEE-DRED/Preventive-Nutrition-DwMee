// src/utils/spinner.js
// ─────────────────────────────────────────────────────────────
// Loading state helpers for Dine With Mee
// Works on buttons, containers, and full-page overlays
// ─────────────────────────────────────────────────────────────

// ── Button loading ───────────────────────────────────────────

/**
 * setButtonLoading(button, loading, loadingText?)
 * Disables a button and shows a spinner while loading.
 * Stores original text on the element to restore it.
 */
export function setButtonLoading(button, loading, loadingText = "Loading…") {
  if (!button) return;

  if (loading) {
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
      <span class="dwm-btn-spinner" style="
        display:inline-block;
        width:1em;height:1em;
        border:2px solid rgba(255,255,255,0.35);
        border-top-color:#fff;
        border-radius:50%;
        animation:dwm-spin 0.7s linear infinite;
        vertical-align:middle;
        margin-right:0.4em;
      "></span>${loadingText}`;
    _ensureSpinnerKeyframe();
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || loadingText;
    delete button.dataset.originalText;
  }
}

// ── Section / container skeleton loading ─────────────────────

/**
 * showSkeleton(container, count = 6)
 * Fills a container with skeleton meal cards while data loads.
 */
export function showSkeleton(container, count = 6) {
  if (!container) return;
  _injectSkeletonStyles();

  container.innerHTML = Array.from({ length: count })
    .map(
      () => `
      <div class="dwm-skeleton-card">
        <div class="dwm-skeleton dwm-skeleton-img"></div>
        <div class="dwm-skeleton-body">
          <div class="dwm-skeleton dwm-skeleton-title"></div>
          <div class="dwm-skeleton dwm-skeleton-text"></div>
          <div class="dwm-skeleton dwm-skeleton-text short"></div>
        </div>
      </div>`
    )
    .join("");
}

/**
 * hideSkeleton(container)
 * Clears skeleton cards from a container (content will replace it).
 */
export function hideSkeleton(container) {
  if (!container) return;
  container.innerHTML = "";
}

// ── Full-page overlay ────────────────────────────────────────

let _overlay = null;

/**
 * showOverlay(message?)
 * Shows a full-page loading overlay.
 */
export function showOverlay(message = "Loading…") {
  if (_overlay) return;
  _ensureSpinnerKeyframe();

  _overlay = document.createElement("div");
  _overlay.id = "dwm-overlay";
  _overlay.style.cssText = `
    position:fixed;inset:0;z-index:99998;
    background:rgba(10,35,20,0.82);
    display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    gap:1rem;color:#fff;font-size:1rem;font-weight:500;
  `;
  _overlay.innerHTML = `
    <div style="
      width:48px;height:48px;
      border:4px solid rgba(200,168,75,0.25);
      border-top-color:#c8a84b;
      border-radius:50%;
      animation:dwm-spin 0.8s linear infinite;
    "></div>
    <span>${message}</span>
  `;
  document.body.appendChild(_overlay);
}

/**
 * hideOverlay()
 */
export function hideOverlay() {
  if (_overlay) {
    _overlay.remove();
    _overlay = null;
  }
}

// ── Internal helpers ─────────────────────────────────────────

function _ensureSpinnerKeyframe() {
  if (document.getElementById("dwm-spin-keyframe")) return;
  const style = document.createElement("style");
  style.id = "dwm-spin-keyframe";
  style.textContent = `@keyframes dwm-spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

function _injectSkeletonStyles() {
  if (document.getElementById("dwm-skeleton-styles")) return;
  const style = document.createElement("style");
  style.id = "dwm-skeleton-styles";
  style.textContent = `
    .dwm-skeleton-card {
      border-radius: 12px;
      overflow: hidden;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .dwm-skeleton {
      background: linear-gradient(90deg,
        rgba(255,255,255,0.06) 25%,
        rgba(255,255,255,0.12) 50%,
        rgba(255,255,255,0.06) 75%);
      background-size: 200% 100%;
      animation: dwm-shimmer 1.5s infinite;
      border-radius: 6px;
    }
    @keyframes dwm-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .dwm-skeleton-img   { height: 180px; border-radius: 0; }
    .dwm-skeleton-body  { padding: 1rem; display:flex;flex-direction:column;gap:0.6rem; }
    .dwm-skeleton-title { height: 20px; width: 70%; }
    .dwm-skeleton-text  { height: 14px; width: 90%; }
    .dwm-skeleton-text.short { width: 50%; }
  `;
  document.head.appendChild(style);
}
