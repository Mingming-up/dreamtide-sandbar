import "./landing.css";
import { createSplashCursor } from "./splashCursor.js";
import { createClickSpark } from "./clickSpark.js";

// 改为 "legacy" 即可恢复原来的第二屏，原有 HTML、样式和交互均保留。
const WORLD_SECTION_VARIANT = "legacy";
const useGameplayWorld = WORLD_SECTION_VARIANT === "gameplay";
document.documentElement.classList.toggle("world-gameplay-enabled", useGameplayWorld);
document.querySelectorAll(".world-legacy-content").forEach((element) => {
  element.hidden = useGameplayWorld;
});
const gameplayShowcase = document.querySelector(".gameplay-showcase");
if (gameplayShowcase) gameplayShowcase.hidden = !useGameplayWorld;

const featureCards = [...document.querySelectorAll(".feature-card")];
const worldSection = document.querySelector(".world-section");
const selectedFeatureTitle = document.querySelector("#selected-feature-title");
const selectedFeatureDetail = document.querySelector("#selected-feature-detail");
const revealItems = [...document.querySelectorAll(".reveal-on-scroll")];
const splitTextTitles = [...document.querySelectorAll(".split-text-title")];
const variableProximityTitles = [...document.querySelectorAll(".variable-proximity-title")];
const specularButtons = [...document.querySelectorAll(".specular-button")];
const borderGlowTargets = [...document.querySelectorAll(".border-glow-target")];
const hero = document.querySelector(".hero");
const heroPrimaryButton = document.querySelector(".hero-actions .primary-button");
const pageStage = document.querySelector(".page-stage");
const pagePanels = [...document.querySelectorAll(".page-panel")];
const pageNav = document.querySelector(".page-nav");
const pageNavButtons = [...document.querySelectorAll("[data-page-target]")];
const trailerDialog = document.querySelector(".trailer-dialog");
const trailerTrigger = document.querySelector(".trailer-trigger");
const trailerClose = document.querySelector(".trailer-close");
const trailerVideo = trailerDialog?.querySelector("video");

function warmTrailerVideo() {
  if (!trailerVideo || trailerVideo.dataset.warmed === "true") return;
  trailerVideo.dataset.warmed = "true";
  trailerVideo.preload = "auto";
  trailerVideo.load();
}

function setTrailerLoading(isLoading) {
  trailerDialog?.classList.toggle("is-video-loading", isLoading);
  trailerVideo?.setAttribute("aria-busy", String(isLoading));
}

trailerTrigger?.addEventListener("pointerenter", warmTrailerVideo, { once: true });
trailerTrigger?.addEventListener("focus", warmTrailerVideo, { once: true });
trailerVideo?.addEventListener("waiting", () => {
  if (trailerDialog?.open) setTrailerLoading(true);
});
trailerVideo?.addEventListener("canplay", () => setTrailerLoading(false));
trailerVideo?.addEventListener("playing", () => setTrailerLoading(false));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const destroySplashCursor = reducedMotion.matches
  ? () => {}
  : createSplashCursor({ COLOR: "#EAB308", RAINBOW_MODE: false });
const destroyClickSpark = reducedMotion.matches
  ? () => {}
  : createClickSpark({ color: "#f6d99e" });

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    destroySplashCursor();
    destroyClickSpark();
  });
}

let activePage = 0;
let transitionLocked = false;

function syncSharedCtaPosition() {
  if (!heroPrimaryButton || !pageStage) return;
  const stageBounds = pageStage.getBoundingClientRect();
  const buttonBounds = heroPrimaryButton.getBoundingClientRect();
  pageStage.style.setProperty("--shared-cta-left", `${buttonBounds.left - stageBounds.left}px`);
  pageStage.style.setProperty("--shared-cta-top", `${buttonBounds.top - stageBounds.top}px`);
}

splitTextTitles.forEach((title) => {
  let splitTextIndex = 0;
  title.querySelectorAll(":scope > span").forEach((line) => {
    const characters = [...line.textContent];
    line.setAttribute("aria-hidden", "true");
    line.replaceChildren(
      ...characters.map((character) => {
        const span = document.createElement("span");
        span.className = "split-text-char";
        span.style.setProperty("--split-index", splitTextIndex++);
        span.textContent = character;
        return span;
      }),
    );
  });
});

if (!reducedMotion.matches) {
  variableProximityTitles.forEach((variableProximityTitle) => {
    const proximityCharacters = [];
    const textWalker = document.createTreeWalker(variableProximityTitle, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (textWalker.nextNode()) textNodes.push(textWalker.currentNode);

    textNodes.forEach((node) => {
      const fragment = document.createDocumentFragment();
      [...node.textContent].forEach((character) => {
        const span = document.createElement("span");
        span.className = "proximity-char";
        span.setAttribute("aria-hidden", "true");
        span.textContent = character;
        proximityCharacters.push(span);
        fragment.append(span);
      });
      node.replaceWith(fragment);
    });

    let proximityFrameId = 0;
    let proximityCenters = [];
    variableProximityTitle.addEventListener("pointerenter", () => {
      proximityCenters = proximityCharacters.map((character) => {
        const bounds = character.getBoundingClientRect();
        return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
      });
    });

    variableProximityTitle.addEventListener("pointermove", (event) => {
      if (proximityFrameId) return;
      const pointerX = event.clientX;
      const pointerY = event.clientY;

      proximityFrameId = requestAnimationFrame(() => {
        proximityCharacters.forEach((character, index) => {
          const center = proximityCenters[index];
          if (!center) return;
          const distance = Math.hypot(pointerX - center.x, pointerY - center.y);
          const proximity = Math.max(0, 1 - distance / 150);
          const easedProximity = proximity * proximity * (3 - 2 * proximity);
          character.style.setProperty("--proximity", easedProximity.toFixed(3));
        });
        proximityFrameId = 0;
      });
    });

    variableProximityTitle.addEventListener("pointerleave", () => {
      if (proximityFrameId) cancelAnimationFrame(proximityFrameId);
      proximityFrameId = 0;
      proximityCharacters.forEach((character) => {
        character.style.setProperty("--proximity", "0");
      });
    });
  });
}

function selectFeature(card) {
  const shouldCollapse = card.classList.contains("is-active");

  featureCards.forEach((item) => {
    const selected = !shouldCollapse && item === card;
    item.classList.toggle("is-active", selected);
    item.setAttribute("aria-pressed", String(selected));
    item.setAttribute("aria-expanded", String(selected));
  });

  worldSection?.classList.toggle("has-expanded-feature", !shouldCollapse);
  if (!shouldCollapse) {
    selectedFeatureTitle.textContent = card.dataset.title;
    selectedFeatureDetail.textContent = card.dataset.detail;
  }
}

featureCards.forEach((card) => {
  card.addEventListener("click", () => selectFeature(card));
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    selectFeature(card);
  });

  card.addEventListener("pointermove", (event) => {
    const bounds = card.getBoundingClientRect();
    card.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
    card.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.removeProperty("--pointer-x");
    card.style.removeProperty("--pointer-y");
  });
});

if (!reducedMotion.matches) {
  specularButtons.forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const bounds = button.getBoundingClientRect();
      button.style.setProperty("--specular-x", `${event.clientX - bounds.left}px`);
      button.style.setProperty("--specular-y", `${event.clientY - bounds.top}px`);
    });

    button.addEventListener("pointerleave", () => {
      button.style.removeProperty("--specular-x");
      button.style.removeProperty("--specular-y");
    });
  });

  borderGlowTargets.forEach((target) => {
    let glowFrameId = 0;
    target.addEventListener("pointermove", (event) => {
      if (glowFrameId) return;
      const pointerX = event.clientX;
      const pointerY = event.clientY;

      glowFrameId = requestAnimationFrame(() => {
        const bounds = target.getBoundingClientRect();
        const localX = pointerX - bounds.left;
        const localY = pointerY - bounds.top;
        const edgeDistance = Math.min(localX, bounds.width - localX, localY, bounds.height - localY);
        const edgeStrength = Math.max(0, 1 - edgeDistance / 140);
        target.style.setProperty("--border-glow-x", `${localX}px`);
        target.style.setProperty("--border-glow-y", `${localY}px`);
        target.style.setProperty("--border-glow-opacity", (0.5 + edgeStrength * 0.5).toFixed(3));
        glowFrameId = 0;
      });
    });

    target.addEventListener("pointerleave", () => {
      if (glowFrameId) cancelAnimationFrame(glowFrameId);
      glowFrameId = 0;
      target.style.removeProperty("--border-glow-x");
      target.style.removeProperty("--border-glow-y");
      target.style.removeProperty("--border-glow-opacity");
    });
  });
}

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -6%" },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

if (hero && !reducedMotion.matches) {
  let frameId = 0;

  hero.addEventListener("pointermove", (event) => {
    if (frameId) return;
    frameId = requestAnimationFrame(() => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      hero.style.setProperty("--hero-shift-x", `${x * 8}px`);
      hero.style.setProperty("--hero-shift-y", `${y * 5}px`);
      frameId = 0;
    });
  });
}

function showPage(nextPage) {
  const boundedPage = Math.max(0, Math.min(pagePanels.length - 1, nextPage));
  if (boundedPage === activePage || transitionLocked) return;

  const direction = boundedPage > activePage ? 1 : -1;
  activePage = boundedPage;
  transitionLocked = true;
  pageStage.dataset.activePage = String(activePage);
  pageStage.dataset.direction = direction > 0 ? "forward" : "backward";
  pageStage.classList.add("is-switching");

  pagePanels.forEach((panel, index) => {
    const active = index === activePage;
    panel.classList.toggle("is-active", active);
    panel.classList.toggle("is-before", index < activePage);
    panel.classList.toggle("is-after", index > activePage);
    panel.setAttribute("aria-hidden", String(!active));
    panel.inert = !active;
    if (active) {
      panel.querySelectorAll(".reveal-on-scroll").forEach((item) => item.classList.add("is-visible"));
      const splitTextTitle = panel.querySelector(".split-text-title");
      if (splitTextTitle && !reducedMotion.matches) {
        splitTextTitle.classList.remove("is-split-playing");
        void splitTextTitle.offsetWidth;
        splitTextTitle.classList.add("is-split-playing");
      }
    }
  });

  pageNavButtons.forEach((button, index) => {
    const active = index === activePage;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });

  history.replaceState(null, "", `#${pagePanels[activePage].id}`);

  window.setTimeout(() => {
    transitionLocked = false;
    pageStage.classList.remove("is-switching");
  }, reducedMotion.matches ? 50 : 780);
}

if (pageNav && !reducedMotion.matches) {
  let navFrameId = 0;

  pageNav.addEventListener("pointermove", (event) => {
    if (navFrameId) return;
    const pointerX = event.clientX;

    navFrameId = requestAnimationFrame(() => {
      pageNavButtons.forEach((button) => {
        const bounds = button.getBoundingClientRect();
        const distance = Math.abs(pointerX - (bounds.left + bounds.width / 2));
        const proximity = Math.max(0, 1 - distance / 92);
        const smoothProximity = proximity * proximity * (3 - 2 * proximity);
        button.style.setProperty("--nav-proximity", smoothProximity.toFixed(3));
        button.style.setProperty("--nav-shift-y", `${(smoothProximity * 5).toFixed(2)}px`);
      });
      navFrameId = 0;
    });
  });

  pageNav.addEventListener("pointerleave", () => {
    if (navFrameId) cancelAnimationFrame(navFrameId);
    navFrameId = 0;
    pageNavButtons.forEach((button) => {
      button.style.removeProperty("--nav-proximity");
      button.style.removeProperty("--nav-shift-y");
    });
  });
}

pageNavButtons.forEach((button) => {
  button.addEventListener("click", () => showPage(Number(button.dataset.pageTarget)));
});

trailerTrigger?.addEventListener("click", () => {
  warmTrailerVideo();
  trailerDialog.showModal();
  trailerVideo.currentTime = 0;
  setTrailerLoading(trailerVideo.readyState < HTMLMediaElement.HAVE_FUTURE_DATA);
  trailerVideo.play().catch(() => {});
});

trailerClose?.addEventListener("click", () => trailerDialog.close());
trailerDialog?.addEventListener("click", (event) => {
  if (event.target === trailerDialog) trailerDialog.close();
});
trailerDialog?.addEventListener("close", () => {
  setTrailerLoading(false);
  trailerVideo.pause();
  trailerVideo.currentTime = 0;
  trailerTrigger?.focus();
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetIndex = pagePanels.findIndex((panel) => `#${panel.id}` === link.getAttribute("href"));
    if (targetIndex < 0) return;
    event.preventDefault();
    showPage(targetIndex);
  });
});

window.addEventListener(
  "wheel",
  (event) => {
    if (trailerDialog?.open) return;
    if (Math.abs(event.deltaY) < 18) return;
    event.preventDefault();
    showPage(activePage + (event.deltaY > 0 ? 1 : -1));
  },
  { passive: false },
);

window.addEventListener("keydown", (event) => {
  if (trailerDialog?.open) return;
  if (["ArrowDown", "PageDown"].includes(event.key)) {
    event.preventDefault();
    showPage(activePage + 1);
  } else if (["ArrowUp", "PageUp"].includes(event.key)) {
    event.preventDefault();
    showPage(activePage - 1);
  } else if (event.key === "Home") {
    event.preventDefault();
    showPage(0);
  } else if (event.key === "End") {
    event.preventDefault();
    showPage(pagePanels.length - 1);
  }
});

const initialHashIndex = pagePanels.findIndex((panel) => `#${panel.id}` === window.location.hash);
syncSharedCtaPosition();
if (initialHashIndex > 0) showPage(initialHashIndex);
window.addEventListener("resize", () => {
  if (activePage === 0) syncSharedCtaPosition();
});
document.fonts?.ready.then(() => {
  if (activePage === 0) syncSharedCtaPosition();
});
