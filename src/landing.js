import "./landing.css";

const featureCards = [...document.querySelectorAll(".feature-card")];
const selectedFeatureTitle = document.querySelector("#selected-feature-title");
const selectedFeatureDetail = document.querySelector("#selected-feature-detail");

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
});
