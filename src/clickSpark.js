// Adapted from React Bits Click Spark:
// https://reactbits.dev/animations/click-spark
export function createClickSpark({
  color = "#f6d99e",
  sparkCount = 8,
  sparkSize = 9,
  sparkRadius = 24,
  duration = 420,
} = {}) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return () => {};

  canvas.className = "click-spark-layer";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    zIndex: "55",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
  });
  document.body.append(canvas);

  let frameId = 0;
  let viewportWidth = window.innerWidth;
  let viewportHeight = window.innerHeight;
  const bursts = [];

  function resize() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    canvas.width = Math.round(viewportWidth * pixelRatio);
    canvas.height = Math.round(viewportHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function draw(now) {
    context.clearRect(0, 0, viewportWidth, viewportHeight);

    for (let burstIndex = bursts.length - 1; burstIndex >= 0; burstIndex -= 1) {
      const burst = bursts[burstIndex];
      const progress = Math.min((now - burst.startedAt) / duration, 1);
      if (progress >= 1) {
        bursts.splice(burstIndex, 1);
        continue;
      }

      const eased = 1 - (1 - progress) ** 3;
      const distance = eased * sparkRadius;
      const lineLength = sparkSize * (1 - progress);
      context.globalAlpha = 1 - progress;
      context.strokeStyle = color;
      context.lineWidth = 1.6;
      context.lineCap = "round";

      for (let sparkIndex = 0; sparkIndex < sparkCount; sparkIndex += 1) {
        const angle = burst.rotation + (Math.PI * 2 * sparkIndex) / sparkCount;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        context.beginPath();
        context.moveTo(burst.x + cosine * distance, burst.y + sine * distance);
        context.lineTo(burst.x + cosine * (distance + lineLength), burst.y + sine * (distance + lineLength));
        context.stroke();
      }
    }

    context.globalAlpha = 1;
    frameId = bursts.length ? requestAnimationFrame(draw) : 0;
  }

  function handlePointerDown(event) {
    if (event.button !== 0) return;
    bursts.push({
      x: event.clientX,
      y: event.clientY,
      rotation: Math.random() * Math.PI,
      startedAt: performance.now(),
    });
    if (!frameId) frameId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  document.addEventListener("pointerdown", handlePointerDown, { capture: true });

  return () => {
    if (frameId) cancelAnimationFrame(frameId);
    window.removeEventListener("resize", resize);
    document.removeEventListener("pointerdown", handlePointerDown, { capture: true });
    canvas.remove();
  };
}
