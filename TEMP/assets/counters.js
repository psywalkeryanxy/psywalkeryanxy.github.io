// counters.js — view + click tracking for Quarto on GitHub Pages
// Backend: counterapi.dev (free, no auth)

(function () {
  // CHANGE THIS to anything unique to your site/post.
  // It namespaces your counters so they don't collide with other people's.
  const NAMESPACE = "yan-polysemanticity-2026";

  const API = (key) =>
    `https://api.counterapi.dev/v1/${NAMESPACE}/${encodeURIComponent(key)}/up`;

  // ---- 1. Page view ----
  async function trackView() {
    try {
      const res = await fetch(API("page-view"));
      const data = await res.json();
      const badge = document.getElementById("view-count");
      if (badge && typeof data.count === "number") {
        badge.textContent = data.count.toLocaleString();
      }
    } catch (e) {
      // Fail silently — don't break the page if the counter is down.
      console.warn("View counter failed:", e);
    }
  }

  // ---- 2. Click tracking (fire-and-forget) ----
  function logClick(key) {
    // keepalive lets the request finish even if the user is navigating away
    fetch(API(key), { keepalive: true }).catch(() => {});
  }

  function attachClickHandlers() {
    // Outbound links: anything <a href> pointing off-domain
    document.querySelectorAll("a[href]").forEach((a) => {
      try {
        const url = new URL(a.href, window.location.href);
        if (url.host && url.host !== window.location.host) {
          a.addEventListener("click", () => {
            // Sanitize host into a counter key
            const key = "out-" + url.host.replace(/[^a-z0-9]/gi, "-");
            logClick(key);
          });
        }
      } catch (_) {
        /* malformed href — ignore */
      }
    });

    // Figure images (Quarto wraps them in <figure>)
    document.querySelectorAll("figure img, .figure img").forEach((img, i) => {
      img.addEventListener("click", () => {
        // Use alt text if present, else index
        const alt = (img.alt || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
        logClick("fig-" + (alt || i));
      });
    });

    // Any element you explicitly mark with class="track-click" data-track="some-name"
    document.querySelectorAll(".track-click").forEach((el) => {
      el.addEventListener("click", () => {
        const name = el.dataset.track || "unnamed-button";
        logClick("btn-" + name);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      trackView();
      attachClickHandlers();
    });
  } else {
    trackView();
    attachClickHandlers();
  }
})();
