import "./landing.css";
import { createSplashCursor } from "./splashCursor.js";

const featureCards = [...document.querySelectorAll(".feature-card")];
const selectedFeatureTitle = document.querySelector("#selected-feature-title");
const selectedFeatureDetail = document.querySelector("#selected-feature-detail");
const revealItems = [...document.querySelectorAll(".reveal-on-scroll")];
const hero = document.querySelector(".hero");
const pageStage = document.querySelector(".page-stage");
const pagePanels = [...document.querySelectorAll(".page-panel")];
const pageNav = document.querySelector(".page-nav");
const pageNavButtons = [...document.querySelectorAll("[data-page-target]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const destroySplashCursor = reducedMotion.matches
  ? () => {}
  : createSplashCursor({ COLOR: "#EAB308", RAINBOW_MODE: false });

if (import.meta.hot) import.meta.hot.dispose(destroySplashCursor);

let activePage = 0;
let transitionLocked = false;

function selectFeature(card) {
  featureCards.forEach((item) => {
    const selected = item === card;
    item.classList.toggle("is-active", selected);
    item.setAttribute("aria-pressed", String(selected));
  });

  selectedFeatureTitle.textContent = card.dataset.title;
  selectedFeatureDetail.textContent = card.dataset.detail;
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
    if (Math.abs(event.deltaY) < 18) return;
    event.preventDefault();
    showPage(activePage + (event.deltaY > 0 ? 1 : -1));
  },
  { passive: false },
);

window.addEventListener("keydown", (event) => {
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
if (initialHashIndex > 0) showPage(initialHashIndex);
