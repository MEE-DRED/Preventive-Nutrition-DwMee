// src/utils/toast.js
// ─────────────────────────────────────────────────────────────
// Toast / snackbar notification system
// Injects its own styles — no external CSS required
// ─────────────────────────────────────────────────────────────

const TOAST_CONTAINER_ID = "dwm-toast-container";
const DEFAULT_DURATION = 4000;

// ── Inject styles once ───────────────────────────────────────

function injectStyles() {
  if (document.getElementById("dwm-toast-styles")) return;

  const style = document.createElement("style");
  style.id = "dwm-toast-styles";
  style.textContent = `
    #dwm-toast-container {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      max-width: 360px;
      pointer-events: none;
    }
    .dwm-toast {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: 10px;
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.4;
      color: #fff;
      box-shadow: 0 4px 20px rgba(0,0,0,0.18);
      pointer-events: all;
      cursor: pointer;
      transform: translateX(120%);
      opacity: 0;
      transition: transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease;
      max-width: 100%;
      word-break: break-word;
    }
    .dwm-toast.show {
      transform: translateX(0);
      opacity: 1;
    }
    .dwm-toast.hide {
      transform: translateX(120%);
      opacity: 0;
    }
    .dwm-toast--success { background: #1a5c3a; border-left: 4px solid #c8a84b; }
    .dwm-toast--error   { background: #8b1a1a; border-left: 4px solid #ff6b6b; }
    .dwm-toast--info    { background: #1a3a5c; border-left: 4px solid #c8a84b; }
    .dwm-toast--warning { background: #5c4a1a; border-left: 4px solid #c8a84b; }
    .dwm-toast__icon  { font-size: 1.1rem; margin-top: 1px; flex-shrink: 0; }
    .dwm-toast__body  { flex: 1; }
    .dwm-toast__title { font-weight: 700; margin-bottom: 2px; color: #c8a84b; }
    .dwm-toast__msg   { opacity: 0.92; }
    .dwm-toast__close {
      background: none; border: none; color: rgba(255,255,255,0.6);
      font-size: 1.1rem; cursor: pointer; padding: 0; flex-shrink: 0;
      line-height: 1;
    }
    .dwm-toast__close:hover { color: #fff; }
    .dwm-toast__progress {
      position: absolute; bottom: 0; left: 0; height: 3px;
      background: rgba(200,168,75,0.6); border-radius: 0 0 10px 10px;
      transition: width linear;
    }
  `;
  document.head.appendChild(style);
}

// ── Container ────────────────────────────────────────────────

function getContainer() {
  let container = document.getElementById(TOAST_CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = TOAST_CONTAINER_ID;
    document.body.appendChild(container);
  }
  return container;
}

// ── Core show function ───────────────────────────────────────

const ICONS = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
};

const TITLES = {
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info",
};

function show(type, message, options = {}) {
  injectStyles();
  const container = getContainer();
  const duration = options.duration ?? DEFAULT_DURATION;
  const title = options.title ?? TITLES[type];

  const toast = document.createElement("div");
  toast.className = `dwm-toast dwm-toast--${type}`;
  toast.style.position = "relative";
  toast.innerHTML = `
    <span class="dwm-toast__icon">${ICONS[type]}</span>
    <div class="dwm-toast__body">
      <div class="dwm-toast__title">${title}</div>
      <div class="dwm-toast__msg">${message}</div>
    </div>
    <button class="dwm-toast__close" aria-label="Dismiss">✕</button>
    <div class="dwm-toast__progress" style="width:100%"></div>
  `;

  // Dismiss on click
  const dismiss = () => {
    toast.classList.remove("show");
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 350);
  };

  toast.querySelector(".dwm-toast__close").addEventListener("click", dismiss);
  toast.addEventListener("click", dismiss);

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  // Progress bar
  const progressBar = toast.querySelector(".dwm-toast__progress");
  progressBar.style.transitionDuration = `${duration}ms`;
  setTimeout(() => (progressBar.style.width = "0"), 50);

  // Auto dismiss
  const timer = setTimeout(dismiss, duration);
  toast.addEventListener("click", () => clearTimeout(timer));

  return { dismiss };
}

// ── Public API ───────────────────────────────────────────────

const toast = {
  success: (message, options) => show("success", message, options),
  error: (message, options) => show("error", message, options),
  warning: (message, options) => show("warning", message, options),
  info: (message, options) => show("info", message, options),

  /**
   * fromError(error)
   * Convenience: show toast from an API error object.
   */
  fromError(error) {
    const message =
      error?.message ||
      (error?.type === "NETWORK_ERROR"
        ? "Cannot reach server. Check your connection."
        : "Something went wrong. Please try again.");
    show("error", message);
  },
};

export default toast;
