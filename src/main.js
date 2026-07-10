import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import kfcPrimaryLogoUrl from "./assets/kfc-primary-logo.png";
import "./styles.css";

const app = document.querySelector("#app");

const molds = [
  { id: "tower", label: "圆塔模具", icon: "🏰", hint: "堆出厚实圆塔，底部会受潮水侵蚀。" },
  { id: "wall", label: "城墙模具", icon: "🧱", hint: "放置一段城墙，可用旋转按钮改变方向。" },
  { id: "gate", label: "拱门模具", icon: "⛩️", hint: "建一座带通道的入口。" },
  { id: "temple", label: "祈年殿", icon: "🛕", hint: "放置一座三重蓝瓦圆殿，适合做沙洲上的梦幻地标。" },
  { id: "paifang", label: "飞檐门楼", icon: "🏯", hint: "放置一座红柱黑瓦的飞檐门楼，屋角微微上翘。" },
  { id: "pavilion", label: "绿瓦阁楼", icon: "🏮", hint: "放置一座三层绿瓦阁楼，带红灯笼和金色塔刹。" },
  { id: "wenchang", label: "文昌阁", icon: "📜", hint: "放置一座八角三层阁楼，带绿瓦、白色屋脊和红木门窗。" },
  { id: "citygate", label: "城墙楼阁", icon: "🏛️", hint: "放置一座灰砖城墙和黑瓦楼阁组合，底座会压进沙面避免悬空。" },
  { id: "paintedgate", label: "彩绘牌楼", icon: "🎨", hint: "放置一座彩绘三门牌楼，带红瓦飞檐和石础。" },
  { id: "pineapple", label: "菠萝小屋", icon: "🍍", hint: "放置一座菠萝形小屋，带叶冠、圆窗、蓝色门和侧面弯管。" },
  { id: "squidward", label: "章鱼哥", icon: "🗿", hint: "放置一个高瘦的章鱼哥石像屋，带长鼻子、圆窗和木门。" },
  { id: "kfc", label: "肯德基", icon: "🍗", hint: "放置一座双层肯德基街角店，带立柱招牌、外摆区、得来速和屋顶设备。" },
  { id: "moat", label: "护城河铲", icon: "🌊", hint: "在沙面挖出低洼水道，涨潮时会蓄水。" },
  { id: "shell", label: "贝壳", icon: "🐚", hint: "用贝壳给城堡边缘做装饰。" },
  { id: "pebble", label: "鹅卵石", icon: "🪨", hint: "小石头会按地形高度落稳。" },
  { id: "driftwood", label: "浮木", icon: "🪵", hint: "潮水附近放置会轻微漂移。" },
  { id: "seaweed", label: "海藻", icon: "🪸", hint: "柔软海藻会随风和水面摆动。" },
  { id: "palm", label: "棕榈树", icon: "🌴", hint: "种一棵微微倾斜的热带棕榈树。" },
  { id: "flowers", label: "热带花丛", icon: "🌺", hint: "放一簇低矮的热带花草装点沙洲。" },
  { id: "person", label: "游客", icon: "🧍", hint: "放一个会在沙滩上散步的小游客，涨潮时会往内陆跑。" },
  { id: "flag", label: "小旗", icon: "🚩", hint: "给塔楼或城墙插上轻轻摆动的旗帜。" },
];

const state = {
  selected: null,
  rotation: 0,
  tideRise: 0,
  tideSpeed: 0.016,
  lastTideSpeed: 0.016,
  dayTime: 0.28,
  timePaused: false,
  weather: "sunny",
  weatherTimer: 28,
  globalStability: 1,
  mood: 0.86,
  buildCount: 0,
};

const ui = createUi();
app.append(ui.shell, ui.hud, ui.titleToggle, ui.statusToggle, ui.tools, ui.toolToggle, ui.hints, ui.hintToggle, ui.toast);

const scene = new THREE.Scene();
const skyGradient = createSkyGradientTexture();
scene.background = skyGradient.texture;
scene.fog = new THREE.Fog(0xa6d9d2, 36, 94);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
ui.shell.appendChild(renderer.domElement);
renderer.domElement.className = "game-canvas";

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 160);
camera.position.set(16, 18, 22);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.46;
controls.minDistance = 14;
controls.maxDistance = 52;
controls.target.set(0, 0.7, 0);

const sun = new THREE.DirectionalLight(0xffe0aa, 3.4);
sun.position.set(-16, 28, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 28;
sun.shadow.camera.bottom = -28;
scene.add(sun);
const hemiLight = new THREE.HemisphereLight(0xbdeef3, 0xe6c384, 1.75);
scene.add(hemiLight);
const moonLight = new THREE.PointLight(0xc7dcff, 0, 58, 1.45);
moonLight.position.set(18, 18, -22);
scene.add(moonLight);

const materials = {
  sand: new THREE.MeshStandardMaterial({ color: 0xe8c78e, roughness: 0.92, metalness: 0.02 }),
  wetSand: new THREE.MeshStandardMaterial({ color: 0xb89967, roughness: 0.88 }),
  castle: new THREE.MeshStandardMaterial({ color: 0xe9c88f, roughness: 0.96 }),
  castleWet: new THREE.MeshStandardMaterial({ color: 0xbd9e70, roughness: 0.98 }),
  castleTrim: new THREE.MeshStandardMaterial({ color: 0xf5dda4, roughness: 0.94 }),
  castleShadow: new THREE.MeshBasicMaterial({ color: 0x947448, transparent: true, opacity: 0.36 }),
  templeWall: new THREE.MeshStandardMaterial({ color: 0xa94a2b, roughness: 0.74 }),
  templeRoof: new THREE.MeshStandardMaterial({ color: 0x1f4f73, roughness: 0.58, metalness: 0.02 }),
  templeBlueTrim: new THREE.MeshStandardMaterial({ color: 0x2f86a5, roughness: 0.62 }),
  templeGold: new THREE.MeshStandardMaterial({ color: 0xd9a23a, roughness: 0.48, metalness: 0.08 }),
  templeStone: new THREE.MeshStandardMaterial({ color: 0xdedbd0, roughness: 0.86 }),
  pavilionWood: new THREE.MeshStandardMaterial({ color: 0x8f542e, roughness: 0.74 }),
  pavilionRoof: new THREE.MeshStandardMaterial({ color: 0x2f8067, roughness: 0.58 }),
  roofRidgeWhite: new THREE.MeshStandardMaterial({ color: 0xe8ece6, roughness: 0.52 }),
  darkWood: new THREE.MeshStandardMaterial({ color: 0x3a2118, roughness: 0.72 }),
  lantern: new THREE.MeshStandardMaterial({ color: 0xd94832, roughness: 0.56, metalness: 0.02 }),
  cityStone: new THREE.MeshStandardMaterial({ color: 0xb9b9ad, roughness: 0.9 }),
  cityStoneDark: new THREE.MeshStandardMaterial({ color: 0x8d948d, roughness: 0.92 }),
  darkTile: new THREE.MeshStandardMaterial({ color: 0x26313a, roughness: 0.62, metalness: 0.02 }),
  paintedBeam: new THREE.MeshStandardMaterial({ color: 0x2f6ea0, roughness: 0.68 }),
  paintedTile: new THREE.MeshStandardMaterial({ color: 0x8f352b, roughness: 0.64 }),
  blackPillar: new THREE.MeshStandardMaterial({ color: 0x222629, roughness: 0.76 }),
  pineappleShell: new THREE.MeshStandardMaterial({ color: 0xf3bd3f, roughness: 0.76 }),
  pineappleGlow: new THREE.MeshStandardMaterial({ color: 0xffd86d, roughness: 0.72 }),
  pineappleLine: new THREE.MeshStandardMaterial({ color: 0xa85a1e, roughness: 0.88 }),
  pineapplePore: new THREE.MeshStandardMaterial({ color: 0xb96a21, roughness: 0.82 }),
  pineappleMetal: new THREE.MeshStandardMaterial({ color: 0x9fb4d2, roughness: 0.42, metalness: 0.16 }),
  pineappleMetalDark: new THREE.MeshStandardMaterial({ color: 0x637fa6, roughness: 0.48, metalness: 0.2 }),
  pineappleGlass: new THREE.MeshStandardMaterial({ color: 0x63c0d7, roughness: 0.22, metalness: 0.02, transparent: true, opacity: 0.78 }),
  pineappleDoor: new THREE.MeshStandardMaterial({ color: 0x84a8d2, roughness: 0.54, metalness: 0.08 }),
  pineappleLeaf: new THREE.MeshStandardMaterial({ color: 0x28b35f, roughness: 0.72, side: THREE.DoubleSide }),
  pineappleLeafLight: new THREE.MeshStandardMaterial({ color: 0x42c96e, roughness: 0.7, side: THREE.DoubleSide }),
  pineappleLeafDark: new THREE.MeshStandardMaterial({ color: 0x198f45, roughness: 0.76, side: THREE.DoubleSide }),
  squidStone: new THREE.MeshStandardMaterial({ color: 0x24485e, roughness: 0.94 }),
  squidStoneDark: new THREE.MeshStandardMaterial({ color: 0x173246, roughness: 0.96 }),
  squidStoneLight: new THREE.MeshStandardMaterial({ color: 0x5c8191, roughness: 0.9 }),
  squidWindowFrame: new THREE.MeshStandardMaterial({ color: 0x596fd4, roughness: 0.52, metalness: 0.1 }),
  squidGlass: new THREE.MeshStandardMaterial({ color: 0x84bbd8, roughness: 0.24, metalness: 0.04, transparent: true, opacity: 0.78 }),
  squidDoor: new THREE.MeshStandardMaterial({ color: 0xb57430, roughness: 0.72 }),
  squidDoorDark: new THREE.MeshStandardMaterial({ color: 0x633b21, roughness: 0.82 }),
  kfcRed: new THREE.MeshStandardMaterial({ color: 0xe4002b, roughness: 0.48 }),
  kfcRedDark: new THREE.MeshStandardMaterial({ color: 0x8f001c, roughness: 0.58 }),
  kfcWhite: new THREE.MeshStandardMaterial({ color: 0xf1efea, roughness: 0.72 }),
  kfcWhiteTrim: new THREE.MeshStandardMaterial({ color: 0xceccc7, roughness: 0.68 }),
  kfcCharcoal: new THREE.MeshStandardMaterial({ color: 0x24282a, roughness: 0.54, metalness: 0.08 }),
  kfcMetal: new THREE.MeshStandardMaterial({ color: 0x697175, roughness: 0.42, metalness: 0.26 }),
  kfcWood: new THREE.MeshStandardMaterial({ color: 0x86543a, roughness: 0.72 }),
  kfcPavement: new THREE.MeshStandardMaterial({ color: 0xbfc0bb, roughness: 0.9 }),
  kfcAsphalt: new THREE.MeshStandardMaterial({ color: 0x3d4243, roughness: 0.96 }),
  kfcWarm: new THREE.MeshStandardMaterial({ color: 0xffb15a, emissive: 0x7d2b0b, emissiveIntensity: 0.42, roughness: 0.56 }),
  kfcGreen: new THREE.MeshStandardMaterial({ color: 0x527f37, roughness: 0.86 }),
  kfcGlass: new THREE.MeshStandardMaterial({ color: 0x5d9ba4, roughness: 0.18, metalness: 0.06, transparent: true, opacity: 0.58 }),
  kfcRoadLine: new THREE.MeshBasicMaterial({ color: 0xf2efe7 }),
  waterStain: new THREE.MeshBasicMaterial({ color: 0x4aaeb5, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
  silt: new THREE.MeshBasicMaterial({ color: 0x8e7550, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
  pebble: new THREE.MeshStandardMaterial({ color: 0x8c8876, roughness: 0.75 }),
  shell: new THREE.MeshStandardMaterial({ color: 0xffdfbd, roughness: 0.62, metalness: 0.02 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x8f6641, roughness: 0.82 }),
  seaweed: new THREE.MeshStandardMaterial({ color: 0x527a49, roughness: 0.9, side: THREE.DoubleSide }),
  palmLeaf: new THREE.MeshStandardMaterial({ color: 0x3f8f55, roughness: 0.82, side: THREE.DoubleSide }),
  flower: new THREE.MeshStandardMaterial({ color: 0xe26f7b, roughness: 0.72 }),
  personSkin: new THREE.MeshStandardMaterial({ color: 0xd99b73, roughness: 0.72 }),
  personCloth: new THREE.MeshStandardMaterial({ color: 0x4fb4d8, roughness: 0.68 }),
  personShorts: new THREE.MeshStandardMaterial({ color: 0x2f91b5, roughness: 0.7 }),
  flag: new THREE.MeshStandardMaterial({ color: 0xd94a3d, roughness: 0.5, side: THREE.DoubleSide }),
  ghost: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, transparent: true, opacity: 0.42 }),
  ghostInvalid: new THREE.MeshStandardMaterial({ color: 0xd86645, roughness: 0.55, transparent: true, opacity: 0.34 }),
  wallPreview: new THREE.MeshBasicMaterial({ color: 0xfff0bd, transparent: true, opacity: 0.44, depthWrite: false }),
  snapGlow: new THREE.MeshBasicMaterial({ color: 0xfff2a3, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false }),
};

const kfcPrimaryLogoTexture = new THREE.TextureLoader().load(kfcPrimaryLogoUrl);
kfcPrimaryLogoTexture.colorSpace = THREE.SRGBColorSpace;
kfcPrimaryLogoTexture.anisotropy = 8;
const kfcPrimaryLogoMaterial = new THREE.MeshBasicMaterial({
  map: kfcPrimaryLogoTexture,
  transparent: true,
  side: THREE.DoubleSide,
});

const kfcSurfaceMaterials = {
  wordmark: createKfcCanvasMaterial("wordmark"),
  sideWordmark: createKfcCanvasMaterial("side-wordmark"),
  portrait: kfcPrimaryLogoMaterial,
  pylon: kfcPrimaryLogoMaterial,
  pylonLower: createKfcCanvasMaterial("pylon-lower"),
  driveThru: createKfcCanvasMaterial("drive-thru"),
  menu: createKfcCanvasMaterial("menu"),
  window: createKfcWindowMaterial(),
};

const terrain = createTerrain();
scene.add(terrain.mesh);

const ocean = createOcean();
scene.add(ocean.group);

const weatherVisuals = createWeatherVisuals();
scene.add(weatherVisuals.group);

const roots = {
  builds: new THREE.Group(),
  decorations: new THREE.Group(),
  particles: new THREE.Group(),
  scenery: new THREE.Group(),
};
scene.add(roots.builds, roots.decorations, roots.particles, roots.scenery);

const marineLife = [];
addScenery();

const ghost = createGhost();
scene.add(ghost);
const wallPreview = createWallPreview();
const snapMarker = createSnapMarker();
scene.add(wallPreview, snapMarker);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const mouse = new THREE.Vector2();
let hoveredPoint = new THREE.Vector3();
let hasHover = false;
let toastTimer = 0;
const buildObjects = [];
const dynamicDecorations = [];
const sandPuffs = [];
const undoStack = [];
const maxUndoSteps = 12;
const clock = new THREE.Clock();
const moatDrag = {
  active: false,
  pointerId: null,
  lastPoint: new THREE.Vector3(),
  moved: false,
  waterDistance: 0,
};
const wallDrag = {
  active: false,
  pointerId: null,
  startPoint: new THREE.Vector3(),
  lastPoint: new THREE.Vector3(),
  currentPoint: new THREE.Vector3(),
  moved: false,
  closed: false,
  segmentCount: 0,
  segmentDistance: 0,
};

showToast("浏览沙洲，选择模具后再点击沙滩建造。");

window.addEventListener("resize", onResize);
renderer.domElement.addEventListener("pointermove", onPointerMove);
renderer.domElement.addEventListener("pointerdown", onPointerDown);
renderer.domElement.addEventListener("pointerup", onPointerUp);
renderer.domElement.addEventListener("pointercancel", onPointerUp);
renderer.domElement.addEventListener("pointerleave", onPointerUp);
window.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    undoLastAction();
    return;
  }
  if (event.key.toLowerCase() === "r") rotateMold();
  if (event.key === "1") selectMold("tower");
  if (event.key === "2") selectMold("wall");
  if (event.key === "3") selectMold("moat");
});

ui.undoButton.addEventListener("click", undoLastAction);
ui.rotateButton.addEventListener("click", rotateMold);
ui.clearButton.addEventListener("click", () => clearBuilds(true, true));
ui.presetButton.addEventListener("click", buildPresetCastle);
ui.floodTideButton.addEventListener("click", () => setTideSpeed(0.016, "潮水开始上涨。"));
ui.ebbTideButton.addEventListener("click", () => setTideSpeed(-0.016, "潮水开始退去。"));
ui.pauseTideButton.addEventListener("click", () => {
  if (state.tideSpeed === 0) {
    setTideSpeed(state.lastTideSpeed || 0.016, state.lastTideSpeed < 0 ? "继续退潮。" : "继续涨潮。");
  } else {
    state.lastTideSpeed = state.tideSpeed;
    state.tideSpeed = 0;
    updateTideButtons();
    showToast("潮汐已暂停。");
  }
});
ui.pauseTimeButton.addEventListener("click", () => {
  state.timePaused = !state.timePaused;
  updateTimeButton();
  showToast(state.timePaused ? "时间已暂停，昼夜暂时停住。" : "时间继续流动。");
});

animate();

function createUi() {
  const shell = document.createElement("div");
  shell.className = "game-shell";

  const hud = document.createElement("div");
  hud.className = "hud";
  hud.innerHTML = `
    <section class="title-panel">
      <button class="panel-collapse" type="button" data-collapse="title" aria-label="收纳标题">−</button>
      <p class="eyebrow">Tropical Coast Sandbox</p>
      <h1>沙滩城堡</h1>
      <p class="subtitle">在温暖海岸上用模具慢慢建造沙堡。潮水会逐渐上涨，湿沙更稳，淹没太久的墙体会沉降。</p>
      <div class="sky-status" data-sky-status>早晨 · 晴天</div>
    </section>
    <section class="status-panel">
      <button class="panel-collapse" type="button" data-collapse="status" aria-label="收纳状态">−</button>
      <div class="time-meter">
        <div class="meter-label"><span>时间</span><span data-game-time>06:43</span></div>
        <div class="time-phase" data-time-phase>早晨 · 晴天</div>
      </div>
      ${meter("tide", "潮位")}
      ${meter("stability", "稳定度")}
      ${meter("mood", "平静感")}
    </section>
  `;

  const titleToggle = createPanelToggle("标题", "title");
  const statusToggle = createPanelToggle("状态", "status");

  const tools = document.createElement("section");
  tools.className = "tool-panel";
  tools.innerHTML = `
    <button class="panel-collapse" type="button" data-collapse="tools" aria-label="收纳工具栏">−</button>
    <div class="toolbar-header">
      <div>
        <div class="eyebrow">Molds</div>
        <div class="selected-name">当前：浏览视角</div>
      </div>
      <div class="small-actions">
        <button class="action-button" data-action="preset">自动围一座城</button>
        <button class="action-button" data-action="undo" disabled>撤销</button>
        <button class="action-button" data-action="rotate">旋转 R</button>
        <button class="action-button" data-action="flood">涨潮</button>
        <button class="action-button" data-action="ebb">退潮</button>
        <button class="action-button" data-action="tide">暂停潮汐</button>
        <button class="action-button" data-action="time">暂停时间</button>
        <button class="action-button" data-action="clear">清空</button>
      </div>
    </div>
    <div class="mold-picker">
      <div class="mold-scroll">
        <div class="mold-grid"></div>
      </div>
      <input class="mold-slider" type="range" min="0" max="100" value="0" aria-label="上下滚动模具工具栏">
    </div>
  `;
  const toolToggle = createPanelToggle("工具", "tools");

  const moldScroll = tools.querySelector(".mold-scroll");
  const moldSlider = tools.querySelector(".mold-slider");
  const moldGrid = tools.querySelector(".mold-grid");
  for (const mold of molds) {
    const button = document.createElement("button");
    button.className = `mold-button ${mold.id === state.selected ? "active" : ""}`;
    button.type = "button";
    button.dataset.mold = mold.id;
    button.innerHTML = `<span class="mold-icon">${mold.icon}</span><span class="mold-label">${mold.label}</span>`;
    button.title = mold.hint;
    button.addEventListener("click", () => selectMold(mold.id));
    moldGrid.appendChild(button);
  }
  const updateMoldSlider = () => {
    const maxScroll = Math.max(0, moldScroll.scrollHeight - moldScroll.clientHeight);
    moldSlider.disabled = maxScroll === 0;
    moldSlider.value = maxScroll === 0 ? "0" : String((moldScroll.scrollTop / maxScroll) * 100);
  };
  moldScroll.addEventListener("scroll", updateMoldSlider);
  moldSlider.addEventListener("input", () => {
    const maxScroll = Math.max(0, moldScroll.scrollHeight - moldScroll.clientHeight);
    moldScroll.scrollTop = maxScroll * (Number(moldSlider.value) / 100);
  });
  const moldResizeObserver = new ResizeObserver(updateMoldSlider);
  moldResizeObserver.observe(moldScroll);
  moldResizeObserver.observe(moldGrid);
  window.addEventListener("resize", updateMoldSlider);
  requestAnimationFrame(() => requestAnimationFrame(updateMoldSlider));

  const hints = document.createElement("aside");
  hints.className = "hint-panel";
  hints.innerHTML = `
    <button class="hint-close" type="button" aria-label="关闭玩法说明">×</button>
    <strong>玩法：</strong>左键点击放置；按住城墙拖动可连续筑墙；按住护城河铲拖动可连续挖沟；⌘/Ctrl+Z 可撤销上一步；滚轮缩放。靠近塔楼或墙端会自动吸附。
  `;

  const hintToggle = document.createElement("button");
  hintToggle.className = "hint-toggle";
  hintToggle.type = "button";
  hintToggle.textContent = "玩法";
  hintToggle.hidden = false;
  hints.classList.add("hidden");

  hints.querySelector(".hint-close").addEventListener("click", () => {
    hints.classList.add("hidden");
    hintToggle.hidden = false;
  });
  hintToggle.addEventListener("click", () => {
    hints.classList.remove("hidden");
    hintToggle.hidden = true;
  });

  const titlePanel = hud.querySelector(".title-panel");
  const statusPanel = hud.querySelector(".status-panel");
  bindPanelToggle(titlePanel, titleToggle, hud.querySelector('[data-collapse="title"]'));
  bindPanelToggle(statusPanel, statusToggle, hud.querySelector('[data-collapse="status"]'));
  bindPanelToggle(tools, toolToggle, tools.querySelector('[data-collapse="tools"]'));
  toolToggle.addEventListener("click", () => requestAnimationFrame(updateMoldSlider));
  collapsePanel(titlePanel, titleToggle);
  collapsePanel(statusPanel, statusToggle);
  collapsePanel(tools, toolToggle);

  const toast = document.createElement("div");
  toast.className = "toast";

  return {
    shell,
    hud,
    titleToggle,
    statusToggle,
    tools,
    toolToggle,
    hints,
    hintToggle,
    toast,
    selectedName: tools.querySelector(".selected-name"),
    skyStatus: hud.querySelector("[data-sky-status]"),
    gameTime: hud.querySelector("[data-game-time]"),
    timePhase: hud.querySelector("[data-time-phase]"),
    undoButton: tools.querySelector('[data-action="undo"]'),
    rotateButton: tools.querySelector('[data-action="rotate"]'),
    clearButton: tools.querySelector('[data-action="clear"]'),
    presetButton: tools.querySelector('[data-action="preset"]'),
    floodTideButton: tools.querySelector('[data-action="flood"]'),
    ebbTideButton: tools.querySelector('[data-action="ebb"]'),
    pauseTideButton: tools.querySelector('[data-action="tide"]'),
    pauseTimeButton: tools.querySelector('[data-action="time"]'),
    moldScroll,
    moldSlider,
    meters: {
      tide: hud.querySelector('[data-meter="tide"]'),
      stability: hud.querySelector('[data-meter="stability"]'),
      mood: hud.querySelector('[data-meter="mood"]'),
    },
  };
}

function meter(id, label) {
  return `
    <div class="meter">
      <div class="meter-label"><span>${label}</span><span data-meter="${id}-value">0%</span></div>
      <div class="meter-track"><div class="meter-fill ${id}" data-meter="${id}"></div></div>
    </div>
  `;
}

function createPanelToggle(label, panel) {
  const button = document.createElement("button");
  button.className = `panel-toggle panel-toggle-${panel}`;
  button.type = "button";
  button.textContent = label;
  button.hidden = true;
  return button;
}

function bindPanelToggle(panel, toggle, closeButton) {
  closeButton.addEventListener("click", () => {
    collapsePanel(panel, toggle);
  });
  toggle.addEventListener("click", () => {
    panel.classList.remove("collapsed");
    toggle.hidden = true;
  });
}

function collapsePanel(panel, toggle) {
  panel.classList.add("collapsed");
  toggle.hidden = false;
}

function pushUndoSnapshot(label) {
  undoStack.push({
    label,
    buildChildren: [...roots.builds.children],
    decorationChildren: [...roots.decorations.children],
    particleChildren: [...roots.particles.children],
    buildObjects: [...buildObjects],
    dynamicDecorations: [...dynamicDecorations],
    sandPuffs: [...sandPuffs],
    terrainHeights: [...terrain.heights],
    state: {
      buildCount: state.buildCount,
      globalStability: state.globalStability,
      mood: state.mood,
    },
  });
  if (undoStack.length > maxUndoSteps) undoStack.shift();
  updateUndoButton();
}

function undoLastAction() {
  if (moatDrag.active || wallDrag.active) {
    showToast("松开鼠标后再撤销。");
    return;
  }
  const snapshot = undoStack.pop();
  if (!snapshot) {
    showToast("还没有可以撤销的建造动作。");
    return;
  }

  restoreRootChildren(roots.builds, snapshot.buildChildren);
  restoreRootChildren(roots.decorations, snapshot.decorationChildren);
  restoreRootChildren(roots.particles, snapshot.particleChildren);
  restoreArray(buildObjects, snapshot.buildObjects);
  restoreArray(dynamicDecorations, snapshot.dynamicDecorations);
  restoreArray(sandPuffs, snapshot.sandPuffs);
  restoreTerrainHeights(snapshot.terrainHeights);

  state.buildCount = snapshot.state.buildCount;
  state.globalStability = snapshot.state.globalStability;
  state.mood = snapshot.state.mood;
  wallPreview.visible = false;
  snapMarker.visible = false;
  updateUndoButton();
  updateUi();
  showToast(`已撤销：${snapshot.label}。`);
}

function restoreRootChildren(root, children) {
  while (root.children.length) root.remove(root.children[0]);
  for (const child of children) root.add(child);
}

function restoreArray(target, source) {
  target.length = 0;
  target.push(...source);
}

function restoreTerrainHeights(heights) {
  const position = terrain.mesh.geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    terrain.heights[i] = heights[i] ?? terrain.baseHeights[i];
    position.setY(i, terrain.heights[i]);
  }
  terrain.mesh.geometry.computeVertexNormals();
  position.needsUpdate = true;
}

function hasSceneChanges() {
  if (roots.builds.children.length || roots.decorations.children.length || roots.particles.children.length) return true;
  return terrain.heights.some((height, index) => Math.abs(height - terrain.baseHeights[index]) > 0.0001);
}

function updateUndoButton() {
  ui.undoButton.disabled = undoStack.length === 0;
}

function createTerrain() {
  const width = 42;
  const depth = 34;
  const segmentsX = 126;
  const segmentsZ = 102;
  const geometry = new THREE.PlaneGeometry(width, depth, segmentsX, segmentsZ);
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.attributes.position;
  const baseHeights = [];
  const heights = [];
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const radial = Math.sqrt((x / 18) ** 2 + (z / 13.5) ** 2);
    const island = smoothstep(1.28, 0.24, radial);
    const dune = 0.42 * island + 0.28 * Math.sin(x * 0.28 + z * 0.18) * island;
    const shore = -0.72 * smoothstep(0.92, 1.42, radial);
    const ripples = 0.045 * Math.sin(x * 2.2) * Math.cos(z * 2.7);
    const h = dune + shore + ripples;
    baseHeights.push(h);
    heights.push(h);
    position.setY(i, h);
  }
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, materials.sand);
  mesh.receiveShadow = true;
  mesh.userData.isTerrain = true;

  return {
    mesh,
    width,
    depth,
    segmentsX,
    segmentsZ,
    baseHeights,
    heights,
  };
}

function createOcean() {
  const group = new THREE.Group();
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x2aaeb9,
    transmission: 0.15,
    transparent: true,
    opacity: 0.56,
    roughness: 0.28,
    metalness: 0,
    clearcoat: 0.45,
    depthWrite: false,
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200, 120, 120), waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.42;
  water.frustumCulled = false;
  group.add(water);

  const foamCount = 420;
  const foamGeometry = new THREE.BufferGeometry();
  const foamPositions = new Float32Array(foamCount * 3);
  for (let i = 0; i < foamCount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 12.2 + Math.random() * 9.8;
    foamPositions[i * 3] = Math.cos(angle) * radius;
    foamPositions[i * 3 + 1] = 0;
    foamPositions[i * 3 + 2] = Math.sin(angle) * radius * 0.78;
  }
  foamGeometry.setAttribute("position", new THREE.BufferAttribute(foamPositions, 3));
  const foamFlecks = new THREE.Points(
    foamGeometry,
    new THREE.PointsMaterial({
      color: 0xf3feff,
      size: 0.055,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    })
  );
  foamFlecks.rotation.x = -Math.PI / 2;
  foamFlecks.position.y = -0.16;
  foamFlecks.userData.basePositions = foamPositions.slice();
  group.add(foamFlecks);

  return { group, water, foamFlecks };
}

function createCloudPuffTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 62);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.78)");
  gradient.addColorStop(0.42, "rgba(255, 255, 255, 0.46)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSkyGradientTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return { canvas, context, texture };
}

function updateSkyGradient(topColor, horizonColor) {
  const gradient = skyGradient.context.createLinearGradient(0, 0, 0, skyGradient.canvas.height);
  const midColor = topColor.clone().lerp(horizonColor, 0.36);
  gradient.addColorStop(0, `#${topColor.getHexString()}`);
  gradient.addColorStop(0.58, `#${midColor.getHexString()}`);
  gradient.addColorStop(1, `#${horizonColor.getHexString()}`);
  skyGradient.context.fillStyle = gradient;
  skyGradient.context.fillRect(0, 0, skyGradient.canvas.width, skyGradient.canvas.height);
  skyGradient.texture.needsUpdate = true;
}

function createMoonTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const moon = context.createRadialGradient(92, 72, 18, 128, 128, 92);
  moon.addColorStop(0, "rgba(255, 251, 220, 1)");
  moon.addColorStop(0.56, "rgba(250, 236, 185, 0.96)");
  moon.addColorStop(0.86, "rgba(222, 228, 235, 0.78)");
  moon.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = moon;
  context.beginPath();
  context.arc(128, 128, 89, 0, Math.PI * 2);
  context.fill();

  const shade = context.createRadialGradient(160, 116, 18, 152, 128, 108);
  shade.addColorStop(0, "rgba(168, 186, 211, 0.06)");
  shade.addColorStop(0.62, "rgba(126, 151, 186, 0.18)");
  shade.addColorStop(1, "rgba(83, 103, 145, 0)");
  context.fillStyle = shade;
  context.beginPath();
  context.arc(128, 128, 89, 0, Math.PI * 2);
  context.fill();

  context.globalCompositeOperation = "screen";
  context.fillStyle = "rgba(255, 245, 205, 0.22)";
  context.beginPath();
  context.ellipse(104, 94, 42, 70, -0.38, 0, Math.PI * 2);
  context.fill();
  context.globalCompositeOperation = "source-over";

  const craters = [
    [98, 112, 9, 0.12],
    [142, 92, 6, 0.1],
    [158, 143, 12, 0.11],
    [118, 158, 5, 0.08],
    [82, 142, 5, 0.08],
  ];
  for (const [x, y, radius, opacity] of craters) {
    const crater = context.createRadialGradient(x - radius * 0.3, y - radius * 0.35, 1, x, y, radius);
    crater.addColorStop(0, `rgba(255, 248, 216, ${opacity})`);
    crater.addColorStop(1, `rgba(104, 128, 164, ${opacity})`);
    context.fillStyle = crater;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function createMoonHaloTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const glow = context.createRadialGradient(128, 128, 12, 128, 128, 126);
  glow.addColorStop(0, "rgba(255, 246, 212, 0.46)");
  glow.addColorStop(0.28, "rgba(205, 226, 255, 0.2)");
  glow.addColorStop(0.62, "rgba(162, 197, 255, 0.08)");
  glow.addColorStop(1, "rgba(162, 197, 255, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function createPineappleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(88, 76, 18, 146, 148, 190);
  gradient.addColorStop(0, "#ffe078");
  gradient.addColorStop(0.48, "#f2b338");
  gradient.addColorStop(0.82, "#dc811f");
  gradient.addColorStop(1, "#b95f1d");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(143, 78, 24, 0.82)";
  context.lineWidth = 2.25;
  context.lineCap = "round";
  for (let i = -256; i <= 512; i += 34) {
    context.beginPath();
    context.moveTo(i, 0);
    context.lineTo(i + 256, 256);
    context.stroke();
    context.beginPath();
    context.moveTo(i + 256, 0);
    context.lineTo(i, 256);
    context.stroke();
  }

  context.fillStyle = "rgba(158, 80, 21, 0.72)";
  for (let y = 22; y < 250; y += 28) {
    for (let x = 20; x < 250; x += 28) {
      context.beginPath();
      context.ellipse(x + (y % 56 ? 13 : 0), y, 2.8, 2.1, 0.15, 0, Math.PI * 2);
      context.fill();
    }
  }

  const shine = context.createRadialGradient(88, 84, 10, 88, 84, 92);
  shine.addColorStop(0, "rgba(255, 238, 142, 0.36)");
  shine.addColorStop(1, "rgba(255, 238, 142, 0)");
  context.fillStyle = shine;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function createSquidStoneTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(24, 0, 232, 256);
  gradient.addColorStop(0, "#244d63");
  gradient.addColorStop(0.44, "#6f96a6");
  gradient.addColorStop(0.56, "#345f76");
  gradient.addColorStop(1, "#18384f");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 900; i += 1) {
    const shade = Math.random() > 0.5 ? 205 : 24;
    const alpha = 0.08 + Math.random() * 0.18;
    context.fillStyle = `rgba(${shade}, ${shade + 16}, ${shade + 24}, ${alpha})`;
    context.beginPath();
    context.arc(Math.random() * 256, Math.random() * 256, 0.8 + Math.random() * 2.8, 0, Math.PI * 2);
    context.fill();
  }

  context.strokeStyle = "rgba(8, 24, 35, 0.28)";
  context.lineWidth = 2;
  for (let y = 16; y < 250; y += 34) {
    context.beginPath();
    context.moveTo(0, y + Math.sin(y) * 4);
    context.bezierCurveTo(64, y - 10, 150, y + 12, 256, y - 4);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function createWeatherVisuals() {
  const group = new THREE.Group();

  const clouds = new THREE.Group();
  const cloudColors = [0xffffff, 0xffedf7, 0xfff3d8, 0xe7e3ff, 0xdaf8ff];
  const cloudPuffTexture = createCloudPuffTexture();
  for (let i = 0; i < 26; i += 1) {
    const cloud = new THREE.Group();
    const cloudyOnly = i >= 11;
    cloud.position.set((Math.random() - 0.5) * 82, 22 + Math.random() * 11, -42 + Math.random() * 30);
    cloud.scale.setScalar(0.72 + Math.random() * 0.42);
    cloud.userData.speed = 0.22 + Math.random() * 0.55;
    cloud.userData.cloudyOnly = cloudyOnly;
    cloud.userData.baseOpacity = cloudyOnly ? 0.32 + Math.random() * 0.18 : 0.18 + Math.random() * 0.14;
    cloud.userData.float = Math.random() * Math.PI * 2;
    const puffs = 4 + Math.floor(Math.random() * 4);
    const cloudLength = 1.35 + Math.random() * 0.5;
    for (let p = 0; p < puffs; p += 1) {
      const puffMaterial = new THREE.SpriteMaterial({
        map: cloudPuffTexture,
        color: cloudColors[(i + p) % cloudColors.length],
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const puff = new THREE.Sprite(puffMaterial);
      puff.position.set((p - puffs / 2) * cloudLength + (Math.random() - 0.5) * 0.7, Math.random() * 0.62, (Math.random() - 0.5) * 2.1);
      puff.scale.set(2.2 + Math.random() * 2.8, 0.72 + Math.random() * 0.82, 1);
      puff.userData.tint = puffMaterial.color.clone();
      cloud.add(puff);
    }
    clouds.add(cloud);
  }
  group.add(clouds);

  const rainCount = 520;
  const rainGeometry = new THREE.BufferGeometry();
  const rainPositions = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i += 1) {
    rainPositions[i * 3] = (Math.random() - 0.5) * 52;
    rainPositions[i * 3 + 1] = 4 + Math.random() * 22;
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 42;
  }
  rainGeometry.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
  const rain = new THREE.Points(
    rainGeometry,
    new THREE.PointsMaterial({ color: 0xbde6ec, size: 0.045, transparent: true, opacity: 0, depthWrite: false })
  );
  group.add(rain);

  const starCount = 220;
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 36 + Math.random() * 34;
    starPositions[i * 3] = Math.cos(angle) * radius;
    starPositions[i * 3 + 1] = 20 + Math.random() * 24;
    starPositions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: 0xfff5d6, size: 0.08, transparent: true, opacity: 0, depthWrite: false })
  );
  group.add(stars);

  const moon = new THREE.Group();
  moon.position.set(19, 17, -24);
  const moonHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createMoonHaloTexture(),
      color: 0xe8f2ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  moonHalo.scale.set(7.4, 7.4, 1);
  const moonCore = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createMoonTexture(),
      color: 0xfff5d8,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  moonCore.scale.set(2.35, 2.35, 1);
  moon.add(moonHalo, moonCore);
  group.add(moon);

  const sparkleCount = 180;
  const sparkleGeometry = new THREE.BufferGeometry();
  const sparklePositions = new Float32Array(sparkleCount * 3);
  for (let i = 0; i < sparkleCount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * 16;
    sparklePositions[i * 3] = Math.cos(angle) * radius;
    sparklePositions[i * 3 + 1] = 0.8 + Math.random() * 5.4;
    sparklePositions[i * 3 + 2] = Math.sin(angle) * radius * 0.74;
  }
  sparkleGeometry.setAttribute("position", new THREE.BufferAttribute(sparklePositions, 3));
  const sparkles = new THREE.Points(
    sparkleGeometry,
    new THREE.PointsMaterial({
      color: 0xfff1be,
      size: 0.082,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  sparkles.userData.basePositions = sparklePositions.slice();
  group.add(sparkles);

  return { group, clouds, rain, stars, moon, moonCore, moonHalo, sparkles };
}

function addScenery() {
  const coralColors = [0xdf8c6d, 0xf2a66c, 0x77a978, 0xc66d72, 0xd3a95b];
  for (let i = 0; i < 180; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 14 + Math.random() * 18;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius * 0.82;
    const h = sampleHeight(x, z) - 0.03;
    const color = coralColors[Math.floor(Math.random() * coralColors.length)];
    const tuft = new THREE.Group();
    tuft.position.set(x, h, z);
    const pieces = 2 + Math.floor(Math.random() * 4);
    for (let p = 0; p < pieces; p += 1) {
      const geo = new THREE.ConeGeometry(0.05 + Math.random() * 0.08, 0.3 + Math.random() * 0.34, 5);
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
      mesh.position.set((Math.random() - 0.5) * 0.4, 0.1, (Math.random() - 0.5) * 0.4);
      mesh.rotation.set(Math.random() * 0.3, Math.random() * 6, Math.random() * 0.25);
      tuft.add(mesh);
    }
    roots.scenery.add(tuft);
  }

  for (let i = 0; i < 320; i += 1) {
    const x = (Math.random() - 0.5) * 38;
    const z = (Math.random() - 0.5) * 30;
    if (Math.sqrt((x / 18) ** 2 + (z / 13.5) ** 2) > 1.08) continue;
    const pebble = new THREE.Mesh(
      new THREE.SphereGeometry(0.025 + Math.random() * 0.04, 6, 4),
      new THREE.MeshStandardMaterial({ color: 0x8f815f, roughness: 0.9 })
    );
    pebble.position.set(x, sampleHeight(x, z) + 0.025, z);
    pebble.scale.y = 0.38;
    roots.scenery.add(pebble);
  }

  addBeachUmbrella(-10.5, 6.4);
  addPier(14.5, -5.5);
  addMarineLife();
}

function addBeachUmbrella(x, z) {
  const y = sampleHeight(x, z);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.4, 8), materials.wood);
  pole.position.set(x, y + 0.7, z);
  pole.castShadow = true;
  roots.scenery.add(pole);

  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(0.9, 0.44, 18),
    new THREE.MeshStandardMaterial({ color: 0x4fb4d8, roughness: 0.62 })
  );
  canopy.position.set(x, y + 1.42, z);
  canopy.castShadow = true;
  roots.scenery.add(canopy);
}

function addPier(x, z) {
  const group = new THREE.Group();
  group.position.set(x, sampleHeight(x, z) + 0.1, z);
  group.rotation.y = -0.44;
  for (let i = 0; i < 9; i += 1) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.38), materials.wood);
    plank.position.x = i * 0.72;
    plank.castShadow = true;
    group.add(plank);
  }
  roots.scenery.add(group);
}

function addMarineLife() {
  const fishColors = [0xffb35f, 0x65d4e8, 0xff7f9f, 0xf6df6e, 0x8fd26a];
  for (let i = 0; i < 18; i += 1) {
    const center = randomSeaPoint(1.02, 1.24);
    addMarineItem({
      kind: "fish",
      group: createFish(fishColors[i % fishColors.length]),
      center,
      phase: Math.random() * Math.PI * 2,
      speed: 0.46 + Math.random() * 0.32,
      radiusX: 0.9 + Math.random() * 1.2,
      radiusZ: 0.45 + Math.random() * 0.75,
      depth: 0.12 + Math.random() * 0.12,
      seed: Math.random() * Math.PI * 2,
    });
  }

  for (let i = 0; i < 8; i += 1) {
    const center = randomSeaPoint(1, 1.17);
    addMarineItem({
      kind: "shrimp",
      group: createShrimp(),
      center,
      phase: Math.random() * Math.PI * 2,
      speed: 0.34 + Math.random() * 0.22,
      radiusX: 0.55 + Math.random() * 0.65,
      radiusZ: 0.3 + Math.random() * 0.42,
      depth: 0.08 + Math.random() * 0.08,
      seed: Math.random() * Math.PI * 2,
    });
  }

  for (let i = 0; i < 7; i += 1) {
    const center = randomSeaPoint(0.96, 1.1);
    addMarineItem({
      kind: "crab",
      group: createCrab(),
      center,
      phase: Math.random() * Math.PI * 2,
      speed: 0.22 + Math.random() * 0.16,
      radiusX: 0.42 + Math.random() * 0.56,
      radiusZ: 0.28 + Math.random() * 0.42,
      depth: 0.03,
      seed: Math.random() * Math.PI * 2,
    });
  }
}

function addMarineItem(item) {
  item.group.scale.setScalar(item.kind === "fish" ? 0.85 + Math.random() * 0.45 : 0.72 + Math.random() * 0.32);
  roots.scenery.add(item.group);
  marineLife.push(item);
}

function randomSeaPoint(minRadius, maxRadius) {
  const angle = Math.random() * Math.PI * 2;
  const radius = minRadius + Math.random() * (maxRadius - minRadius);
  return new THREE.Vector2(Math.cos(angle) * 17.2 * radius, Math.sin(angle) * 12.8 * radius);
}

function createFish(color) {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.02 });
  const finMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.24), roughness: 0.62 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 6), bodyMaterial);
  body.scale.set(1.55, 0.62, 0.72);
  group.add(body);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.26, 3), finMaterial);
  tail.position.x = -0.33;
  tail.rotation.z = Math.PI / 2;
  tail.userData.tail = true;
  group.add(tail);

  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 3), finMaterial);
  fin.position.set(0.02, 0.13, 0);
  fin.rotation.x = Math.PI;
  group.add(fin);

  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x172636 });
  const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), eyeMaterial);
  eyeLeft.position.set(0.22, 0.035, 0.09);
  const eyeRight = eyeLeft.clone();
  eyeRight.position.z = -0.09;
  group.add(eyeLeft, eyeRight);
  return group;
}

function createShrimp() {
  const group = new THREE.Group();
  const shellMaterial = new THREE.MeshStandardMaterial({ color: 0xff9f8e, roughness: 0.72 });
  const legMaterial = new THREE.MeshBasicMaterial({ color: 0xffd1bc, transparent: true, opacity: 0.74 });
  for (let i = 0; i < 5; i += 1) {
    const segment = new THREE.Mesh(new THREE.SphereGeometry(0.07 - i * 0.004, 8, 5), shellMaterial);
    segment.position.set(i * -0.085, Math.sin(i * 0.8) * 0.025, 0);
    segment.scale.set(1.2, 0.72, 0.82);
    segment.userData.shrimpSegment = true;
    group.add(segment);
  }

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 4), shellMaterial);
  tail.position.x = -0.47;
  tail.rotation.z = -Math.PI / 2;
  tail.userData.tail = true;
  group.add(tail);

  for (const side of [-1, 1]) {
    const whiskerGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0.1, 0.02, side * 0.035),
      new THREE.Vector3(0.38, 0.08, side * 0.18),
    ]);
    const whisker = new THREE.Line(whiskerGeometry, legMaterial);
    whisker.userData.feeler = true;
    group.add(whisker);
  }
  return group;
}

function createCrab() {
  const group = new THREE.Group();
  const shellMaterial = new THREE.MeshStandardMaterial({ color: 0xd76f55, roughness: 0.84 });
  const clawMaterial = new THREE.MeshStandardMaterial({ color: 0xffad7d, roughness: 0.78 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 6), shellMaterial);
  body.scale.set(1.25, 0.44, 0.92);
  group.add(body);

  for (const side of [-1, 1]) {
    const claw = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 5), clawMaterial);
    claw.position.set(0.18, 0.02, side * 0.18);
    claw.scale.set(1.25, 0.65, 0.9);
    claw.userData.claw = side;
    group.add(claw);

    for (let i = 0; i < 3; i += 1) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.28, 5), shellMaterial);
      leg.position.set(-0.08 + i * 0.075, -0.02, side * (0.18 + i * 0.035));
      leg.rotation.x = Math.PI / 2.8 * side;
      leg.rotation.z = Math.PI / 2;
      leg.userData.leg = side * (i + 1);
      group.add(leg);
    }
  }
  return group;
}

function createGhost() {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.45, 1), materials.ghost);
  group.add(mesh);
  group.visible = false;
  return group;
}

function createWallPreview() {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.96, 0.5), materials.wallPreview);
  mesh.position.y = 0.5;
  group.add(mesh);
  group.visible = false;
  return group;
}

function createSnapMarker() {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.025, 8, 36), materials.snapGlow);
  ring.rotation.x = -Math.PI / 2;
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), materials.snapGlow);
  dot.position.y = 0.08;
  group.add(ring, dot);
  group.visible = false;
  return group;
}

function selectMold(id) {
  if (state.selected === id) {
    clearSelection();
    return;
  }
  state.selected = id;
  wallPreview.visible = false;
  snapMarker.visible = false;
  const mold = molds.find((item) => item.id === id);
  ui.selectedName.textContent = `当前：${mold.label}`;
  ui.tools.querySelectorAll(".mold-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mold === id);
  });
  showToast(mold.hint);
  updateGhostShape();
}

function clearSelection(showMessage = true) {
  state.selected = null;
  ui.selectedName.textContent = "当前：浏览视角";
  ui.tools.querySelectorAll(".mold-button").forEach((button) => {
    button.classList.remove("active");
  });
  ghost.visible = false;
  wallPreview.visible = false;
  snapMarker.visible = false;
  if (showMessage) showToast("已取消选中，现在可以拖动画面观察。");
}

function rotateMold() {
  state.rotation = (state.rotation + Math.PI / 2) % (Math.PI * 2);
  ghost.rotation.y = state.rotation;
  showToast("模具已旋转 90 度。");
}

function updateGhostShape() {
  while (ghost.children.length) ghost.remove(ghost.children[0]);
  const id = state.selected;
  if (id === "tower") ghost.add(new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.78, 1.35, 18), materials.ghost));
  else if (id === "wall") ghost.add(new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.9, 0.42), materials.ghost));
  else if (id === "gate") ghost.add(new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.0, 0.58), materials.ghost));
  else if (id === "temple") {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.45, 0.22, 32), materials.ghost);
    base.position.y = 0.05;
    const hall = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.82, 0.74, 24), materials.ghost);
    hall.position.y = 0.58;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.16, 0.56, 32), materials.ghost);
    roof.position.y = 1.18;
    ghost.add(base, hall, roof);
  } else if (id === "paifang") {
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.18, 1.2), materials.ghost);
    base.position.y = 0.04;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.15, 0.2), materials.ghost);
    frame.position.y = 0.72;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.32, 1.0), materials.ghost);
    roof.position.y = 1.42;
    ghost.add(base, frame, roof);
  } else if (id === "pavilion") {
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.2, 2.25), materials.ghost);
    base.position.y = 0.04;
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.2, 1.22), materials.ghost);
    body.position.y = 0.82;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.48, 4), materials.ghost);
    roof.position.y = 1.6;
    roof.rotation.y = Math.PI / 4;
    ghost.add(base, body, roof);
  } else if (id === "wenchang") {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.46, 0.24, 8), materials.ghost);
    base.position.y = 0.04;
    base.rotation.y = Math.PI / 8;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.94, 1.42, 8), materials.ghost);
    body.position.y = 0.84;
    body.rotation.y = Math.PI / 8;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 8), materials.ghost);
    roof.position.y = 1.66;
    roof.rotation.y = Math.PI / 8;
    ghost.add(base, body, roof);
  } else if (id === "citygate") {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.95, 1.05), materials.ghost);
    wall.position.y = 0.52;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.82, 0.9), materials.ghost);
    tower.position.y = 1.18;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.34, 1.12), materials.ghost);
    roof.position.y = 1.78;
    ghost.add(wall, tower, roof);
  } else if (id === "paintedgate") {
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.45, 0.18, 0.92), materials.ghost);
    base.position.y = 0.04;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.25, 0.18), materials.ghost);
    frame.position.y = 0.78;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.28, 0.9), materials.ghost);
    roof.position.y = 1.52;
    ghost.add(base, frame, roof);
  } else if (id === "pineapple") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.9, 20, 14), materials.ghost);
    body.scale.set(0.94, 1.34, 0.88);
    body.position.y = 0.8;
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), materials.ghost);
    leaves.scale.set(1.18, 1.32, 0.9);
    leaves.position.y = 1.98;
    const door = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.32, 5, 10), materials.ghost);
    door.position.set(0, 0.34, 0.72);
    ghost.add(body, leaves, door);
  } else if (id === "squidward") {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.82, 2.24, 24), materials.ghost);
    body.position.y = 0.82;
    body.scale.z = 0.68;
    const brow = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.16, 0.2), materials.ghost);
    brow.position.set(0, 1.36, 0.5);
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.28, 0.9, 4), materials.ghost);
    nose.position.set(0, 0.88, 0.66);
    nose.rotation.y = Math.PI / 4;
    ghost.add(body, brow, nose);
  } else if (id === "kfc") {
    const site = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.12, 3.9), materials.ghost);
    site.position.y = -0.24;
    const building = new THREE.Mesh(new THREE.BoxGeometry(3.05, 2.05, 2.15), materials.ghost);
    building.position.set(-0.12, 0.76, -0.18);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.72, 2.48, 0.68), materials.ghost);
    tower.position.set(-1.36, 0.95, 0.52);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.44, 0.16), materials.ghost);
    sign.position.set(1.95, 0.44, -0.82);
    ghost.add(site, building, tower, sign);
  }
  else if (id === "moat") ghost.add(new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.08, 8, 52), materials.ghost));
  else if (id === "palm") {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.65, 8), materials.ghost);
    trunk.position.y = 0.82;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 8), materials.ghost);
    crown.position.y = 1.72;
    ghost.add(trunk, crown);
  } else if (id === "flowers") {
    const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 8), materials.ghost);
    shrub.scale.y = 0.45;
    shrub.position.y = 0.22;
    ghost.add(shrub);
  } else if (id === "person") {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.34, 4, 8), materials.ghost);
    body.position.y = 0.43;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), materials.ghost);
    head.position.y = 0.78;
    ghost.add(body, head);
  }
  else if (id) ghost.add(new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), materials.ghost));
  ghost.visible = false;
}

function setGhostValid(isValid) {
  const material = isValid ? materials.ghost : materials.ghostInvalid;
  ghost.traverse((child) => {
    if (child.isMesh) child.material = material;
  });
}

function updateSnapMarker(point) {
  const nearest = findNearestSnapPoint(point);
  if (!nearest) return;
  snapMarker.visible = true;
  snapMarker.position.set(nearest.x, sampleHeight(nearest.x, nearest.z) + 0.07, nearest.z);
}

function updateWallPreview(start, end) {
  const distance = horizontalDistance(start, end);
  if (distance < 0.2) return;
  wallPreview.visible = true;
  wallPreview.position.set((start.x + end.x) / 2, sampleHeight((start.x + end.x) / 2, (start.z + end.z) / 2) + 0.04, (start.z + end.z) / 2);
  wallPreview.rotation.y = Math.atan2(start.z - end.z, end.x - start.x);
  wallPreview.children[0].scale.set(Math.max(0.3, distance), 1, 1);
}

function onPointerMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(terrain.mesh, false)[0];
  hasHover = Boolean(hit);
  ghost.visible = hasHover && Boolean(state.selected);
  wallPreview.visible = false;
  snapMarker.visible = false;
  if (!hit) return;
  hoveredPoint.copy(hit.point);
  const snapped = snapToGrid(hoveredPoint);
  const canBuild = Boolean(state.selected) && isBuildableSand(snapped, ["seaweed", "driftwood", "pebble"]);
  const y = sampleHeight(snapped.x, snapped.z);
  ghost.position.set(snapped.x, y + 0.38, snapped.z);
  ghost.rotation.y = state.rotation;
  setGhostValid(canBuild);

  if (state.selected) {
    updateSnapMarker(snapped);
  }

  if (moatDrag.active && state.selected === "moat") {
    const target = hit.point.clone();
    if (!isBuildableSand(target, ["seaweed", "driftwood", "pebble"])) return;
    carveMoatStroke(moatDrag.lastPoint, target);
    moatDrag.lastPoint.copy(target);
    moatDrag.moved = true;
  }

  if (wallDrag.active && state.selected === "wall") {
    if (wallDrag.closed) {
      wallPreview.visible = false;
      return;
    }
    const target = snapWallPoint(hit.point);
    if (!isBuildableSand(target, ["seaweed", "driftwood", "pebble"])) return;
    updateWallPreview(wallDrag.lastPoint, target);
    wallDrag.lastPoint.copy(buildWallStroke(wallDrag.lastPoint, target));
  }
}

function onPointerDown(event) {
  if (event.button !== 0 || !hasHover) return;
  if (!state.selected) return;
  const target = snapToGrid(hoveredPoint);
  if (!isBuildableSand(target, ["seaweed", "driftwood", "pebble"])) {
    showToast("这里离可塑沙滩太远，换到干沙和湿沙交界处试试。");
    return;
  }

  if (state.selected === "moat") {
    startMoatDrag(event, hoveredPoint);
    return;
  }

  if (state.selected === "wall") {
    startWallDrag(event, target);
    return;
  }

  pushUndoSnapshot(`放置${molds.find((mold) => mold.id === state.selected).label}`);
  placeMold(state.selected, target);
  clearSelection(false);
}

function onPointerUp(event) {
  if (moatDrag.active && event.pointerId === moatDrag.pointerId) {
    finishMoatDrag();
  }
  if (wallDrag.active && event.pointerId === wallDrag.pointerId) {
    finishWallDrag();
  }
}

function startMoatDrag(event, point) {
  wallPreview.visible = false;
  pushUndoSnapshot("挖护城河");
  moatDrag.active = true;
  moatDrag.pointerId = event.pointerId;
  moatDrag.lastPoint.copy(point);
  moatDrag.moved = false;
  moatDrag.waterDistance = 0;
  controls.enabled = false;
  renderer.domElement.setPointerCapture(event.pointerId);
  carveMoatBrush(point.x, point.z, 1, true);
  spawnSandPuff(point.x, sampleHeight(point.x, point.z), point.z, 18);
  showToast("按住拖动，像用小铲子一样挖出护城河。");
}

function finishMoatDrag() {
  if (renderer.domElement.hasPointerCapture(moatDrag.pointerId)) {
    renderer.domElement.releasePointerCapture(moatDrag.pointerId);
  }
  moatDrag.active = false;
  moatDrag.pointerId = null;
  controls.enabled = true;
  state.buildCount += 1;
  state.mood = Math.min(1, state.mood + 0.008);
  showToast(moatDrag.moved ? "护城河已经挖好，等涨潮来蓄水。" : "挖出一小段浅沟。");
  clearSelection(false);
}

function startWallDrag(event, point) {
  const startPoint = snapWallPoint(point);
  pushUndoSnapshot("建造城墙");
  wallDrag.active = true;
  wallDrag.pointerId = event.pointerId;
  wallDrag.startPoint.copy(startPoint);
  wallDrag.lastPoint.copy(startPoint);
  wallDrag.currentPoint.copy(startPoint);
  wallDrag.moved = false;
  wallDrag.closed = false;
  wallDrag.segmentCount = 0;
  wallDrag.segmentDistance = 0;
  controls.enabled = false;
  renderer.domElement.setPointerCapture(event.pointerId);
  updateWallPreview(wallDrag.lastPoint, wallDrag.lastPoint.clone().add(new THREE.Vector3(Math.cos(state.rotation) * 1.4, 0, -Math.sin(state.rotation) * 1.4)));
  showToast("按住拖动，城墙会沿着路径一段段接起来。");
}

function finishWallDrag() {
  if (renderer.domElement.hasPointerCapture(wallDrag.pointerId)) {
    renderer.domElement.releasePointerCapture(wallDrag.pointerId);
  }
  closeWallLoopIfReady();
  wallDrag.active = false;
  wallDrag.pointerId = null;
  wallPreview.visible = false;
  controls.enabled = true;
  if (wallDrag.closed) {
    state.mood = Math.min(1, state.mood + 0.025);
    showToast("围城完成！城墙已经自动闭合。");
  } else if (wallDrag.moved) {
    state.mood = Math.min(1, state.mood + 0.01);
    showToast("连续城墙已经接好，靠近端点的地方会自动吸附。");
  } else {
    placeMold("wall", wallDrag.lastPoint);
  }
  clearSelection(false);
}

function placeMold(type, point, quiet = false) {
  if (type === "tower") addBuild(createTower(point.x, point.z));
  if (type === "wall") addBuild(createWall(point.x, point.z, state.rotation));
  if (type === "gate") addBuild(createGate(point.x, point.z, state.rotation));
  if (type === "temple") addBuild(createTemple(point.x, point.z, state.rotation));
  if (type === "paifang") addBuild(createPaifang(point.x, point.z, state.rotation));
  if (type === "pavilion") addBuild(createPavilion(point.x, point.z, state.rotation));
  if (type === "wenchang") addBuild(createWenchangPavilion(point.x, point.z, state.rotation));
  if (type === "citygate") addBuild(createCityGate(point.x, point.z, state.rotation));
  if (type === "paintedgate") addBuild(createPaintedGate(point.x, point.z, state.rotation));
  if (type === "pineapple") addBuild(createPineappleHouse(point.x, point.z, state.rotation));
  if (type === "squidward") addBuild(createSquidwardHouse(point.x, point.z, state.rotation));
  if (type === "kfc") addBuild(createKfcRestaurant(point.x, point.z, state.rotation));
  if (type === "moat") carveMoat(point.x, point.z);
  if (type === "shell") addDecoration(createShell(point.x, point.z));
  if (type === "pebble") addDecoration(createPebble(point.x, point.z));
  if (type === "driftwood") addDecoration(createDriftwood(point.x, point.z, state.rotation));
  if (type === "seaweed") addDecoration(createSeaweed(point.x, point.z));
  if (type === "palm") addStaticDecoration(createPalmTree(point.x, point.z, state.rotation));
  if (type === "flowers") addStaticDecoration(createTropicalFlowers(point.x, point.z));
  if (type === "person") addPerson(createPerson(point.x, point.z));
  if (type === "flag") addDecoration(createFlag(point.x, point.z));
  spawnSandPuff(point.x, sampleHeight(point.x, point.z), point.z, type === "moat" ? 45 : type === "palm" ? 26 : type === "person" ? 10 : 18);
  state.buildCount += 1;
  state.mood = Math.min(1, state.mood + 0.006);
  if (!quiet) showToast(`${molds.find((mold) => mold.id === type).label} 已放置。`);
}

function isBuildableSand(point, exceptions = []) {
  const radial = Math.sqrt((point.x / 19) ** 2 + (point.z / 14.5) ** 2);
  return radial <= 1.14 || exceptions.includes(state.selected);
}

function buildWallStroke(from, to) {
  if (wallDrag.closed) return from;
  wallDrag.currentPoint.copy(to);
  const segmentLength = 2.05;
  const minLength = 1.32;
  const cursor = from.clone();
  let distance = horizontalDistance(cursor, to);
  if (distance < minLength) return cursor;

  let guard = 0;
  while (distance >= minLength && guard < 12) {
    guard += 1;
    const direction = new THREE.Vector3(to.x - cursor.x, 0, to.z - cursor.z).normalize();
    const rawEnd = cursor.clone().addScaledVector(direction, Math.min(segmentLength, distance));
    const end = snapWallPoint(rawEnd, cursor);
    if (horizontalDistance(cursor, end) < minLength) break;
    addBuild(createWallBetween(cursor, end));
    spawnSandPuff(end.x, sampleHeight(end.x, end.z), end.z, 8);
    wallDrag.moved = true;
    wallDrag.segmentCount += 1;
    cursor.copy(end);
    if (wallDrag.segmentCount >= 3 && horizontalDistance(end, wallDrag.startPoint) < 0.55) {
      wallDrag.closed = true;
      snapMarker.visible = true;
      snapMarker.position.set(wallDrag.startPoint.x, sampleHeight(wallDrag.startPoint.x, wallDrag.startPoint.z) + 0.07, wallDrag.startPoint.z);
      break;
    }
    if (horizontalDistance(end, rawEnd) > 0.12) break;
    distance = horizontalDistance(cursor, to);
  }
  return cursor;
}

function closeWallLoopIfReady() {
  if (wallDrag.closed || wallDrag.segmentCount < 3) return;
  if (horizontalDistance(wallDrag.currentPoint, wallDrag.startPoint) > 2.25) return;
  if (horizontalDistance(wallDrag.lastPoint, wallDrag.startPoint) < 0.8) {
    wallDrag.closed = true;
    return;
  }
  addBuild(createWallBetween(wallDrag.lastPoint, wallDrag.startPoint));
  spawnSandPuff(wallDrag.startPoint.x, sampleHeight(wallDrag.startPoint.x, wallDrag.startPoint.z), wallDrag.startPoint.z, 14);
  wallDrag.lastPoint.copy(wallDrag.startPoint);
  wallDrag.closed = true;
  wallDrag.moved = true;
}

function createWallBetween(start, end) {
  const center = new THREE.Vector3((start.x + end.x) / 2, 0, (start.z + end.z) / 2);
  const rotation = Math.atan2(start.z - end.z, end.x - start.x);
  const wall = createWall(center.x, center.z, rotation);
  wall.userData.snapPoints = [snapPoint(start.x, start.z), snapPoint(end.x, end.z)];
  return wall;
}

function snapWallPoint(point, ignorePoint = null) {
  const snapped = snapToGrid(point);
  if (wallDrag.active && wallDrag.segmentCount >= 2 && horizontalDistance(snapped, wallDrag.startPoint) < 1.15) {
    return wallDrag.startPoint.clone();
  }
  const snapPoint = findNearestSnapPoint(snapped, ignorePoint);
  return snapPoint ?? snapped;
}

function findNearestSnapPoint(point, ignorePoint = null) {
  let nearest = null;
  let nearestDistance = 0.82;
  for (const item of buildObjects) {
    const snapPoints = item.group.userData.snapPoints ?? [];
    for (const candidate of snapPoints) {
      if (ignorePoint && horizontalDistance(candidate, ignorePoint) < 0.65) continue;
      const distance = horizontalDistance(point, candidate);
      if (distance < nearestDistance) {
        nearest = candidate;
        nearestDistance = distance;
      }
    }
  }
  return nearest ? nearest.clone() : null;
}

function horizontalDistance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function snapPoint(x, z) {
  return new THREE.Vector3(x, sampleHeight(x, z), z);
}

function radialSnapPoints(x, z, radius, count) {
  const points = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    points.push(snapPoint(x + Math.cos(angle) * radius, z + Math.sin(angle) * radius));
  }
  return points;
}

function wallEndpointSnapPoints(x, z, rotation, length) {
  const halfLength = length / 2;
  const dx = Math.cos(rotation) * halfLength;
  const dz = -Math.sin(rotation) * halfLength;
  return [snapPoint(x - dx, z - dz), snapPoint(x + dx, z + dz)];
}

function createErosionVisual(group) {
  const config = group.userData.erosion;
  if (!config) return null;

  const stainGeometry =
    config.shape === "round"
      ? new THREE.CircleGeometry(config.radius, 28)
      : new THREE.PlaneGeometry(config.width, config.depth, 1, 1);
  const siltGeometry =
    config.shape === "round"
      ? new THREE.RingGeometry(config.radius * 0.72, config.radius * 1.12, 34)
      : new THREE.PlaneGeometry(config.width * 1.08, config.depth * 1.25, 1, 1);

  const stain = new THREE.Mesh(stainGeometry, materials.waterStain.clone());
  const silt = new THREE.Mesh(siltGeometry, materials.silt.clone());
  for (const mesh of [silt, stain]) {
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = config.localY;
    mesh.renderOrder = 2;
    group.add(mesh);
  }
  silt.position.y += 0.002;
  stain.position.y += 0.004;

  return { stain, silt };
}

function markCastleParts(group) {
  group.traverse((child) => {
    if (child.isMesh && child.material === materials.castle) {
      child.userData.castlePart = true;
    }
  });
}

function addBuild(group) {
  roots.builds.add(group);
  const erosionVisual = createErosionVisual(group);
  buildObjects.push({
    group,
    baseY: group.position.y,
    erosionVisual,
    stability: 1,
    wetness: 0,
    collapse: 0,
    dripCooldown: 0.4 + Math.random() * 0.8,
    seed: Math.random() * 100,
  });
}

function addDecoration(group) {
  roots.decorations.add(group);
  dynamicDecorations.push({
    group,
    velocity: new THREE.Vector3((Math.random() - 0.5) * 0.015, 0, (Math.random() - 0.5) * 0.015),
    bob: Math.random() * Math.PI * 2,
  });
}

function addStaticDecoration(group) {
  roots.decorations.add(group);
}

function addPerson(group) {
  roots.decorations.add(group);
  dynamicDecorations.push({
    group,
    kind: "person",
    velocity: new THREE.Vector3(),
    target: pickPersonTarget(group.position),
    panic: 0,
    bob: Math.random() * Math.PI * 2,
    retargetAt: 0,
  });
}

function addTowerBand(group, y, radius) {
  const band = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.022, 8, 36), materials.castleTrim);
  band.rotation.x = Math.PI / 2;
  band.position.y = y;
  band.castShadow = true;
  group.add(band);
}

function addTowerWindows(group, count, y, radius) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + Math.PI / count;
    const window = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.22), materials.castleShadow);
    window.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    window.rotation.y = Math.PI / 2 - angle;
    group.add(window);

    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.045), materials.castleTrim);
    sill.position.set(Math.cos(angle) * (radius + 0.01), y - 0.13, Math.sin(angle) * (radius + 0.01));
    sill.rotation.y = -angle;
    sill.castShadow = true;
    group.add(sill);
  }
}

function createTower(x, z) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.72, z);
  group.userData.baseRadius = 0.92;
  group.userData.mass = 1.45;
  group.userData.snapPoints = radialSnapPoints(x, z, 1.08, 8);
  group.userData.erosion = { shape: "round", radius: 1.05, localY: -0.72 };

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.82, 1.45, 24), materials.castle);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  addTowerBand(group, 0.1, 0.73);
  addTowerBand(group, 0.72, 0.64);
  addTowerWindows(group, 4, 0.34, 0.64);

  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.66, 0.24, 24), materials.castle);
  top.position.y = 0.82;
  top.castShadow = true;
  group.add(top);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.69, 0.025, 8, 36), materials.castleTrim);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.94;
  rim.castShadow = true;
  group.add(rim);

  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.2), materials.castle);
    block.position.set(Math.cos(angle) * 0.62, 1.05, Math.sin(angle) * 0.62);
    block.rotation.y = angle;
    block.castShadow = true;
    group.add(block);
  }

  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.42, 18), materials.castle);
  cone.position.y = 1.31;
  cone.castShadow = true;
  group.add(cone);

  const roofTip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 6), materials.castleTrim);
  roofTip.position.y = 1.54;
  roofTip.castShadow = true;
  group.add(roofTip);

  markCastleParts(group);
  compactSandUnder(x, z, 0.95, 0.1);
  return group;
}

function createWall(x, z, rotation) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.46, z);
  group.rotation.y = rotation;
  group.userData.baseRadius = 1.35;
  group.userData.mass = 1;
  group.userData.snapPoints = wallEndpointSnapPoints(x, z, rotation, 2.45);
  group.userData.erosion = { shape: "wall", width: 2.68, depth: 0.72, localY: -0.44 };

  const wall = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.86, 0.45), materials.castle);
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  const lowerTrim = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 0.49), materials.castleTrim);
  lowerTrim.position.y = -0.25;
  lowerTrim.castShadow = true;
  group.add(lowerTrim);

  for (let i = -1; i <= 1; i += 1) {
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.012), materials.castleShadow);
    slit.position.set(i * 0.55, 0.06, 0.232);
    group.add(slit);
  }

  for (let i = -2; i <= 2; i += 1) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.25, 0.48), materials.castle);
    block.position.set(i * 0.5, 0.55, 0);
    block.castShadow = true;
    group.add(block);
  }
  markCastleParts(group);
  compactSandUnder(x, z, 1.25, 0.07);
  return group;
}

function createGate(x, z, rotation) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.62, z);
  group.rotation.y = rotation;
  group.userData.baseRadius = 1.1;
  group.userData.mass = 1.1;
  group.userData.snapPoints = wallEndpointSnapPoints(x, z, rotation, 1.65);
  group.userData.erosion = { shape: "wall", width: 1.86, depth: 0.82, localY: -0.55 };

  const left = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.05, 0.55), materials.castle);
  const right = left.clone();
  left.position.x = -0.62;
  right.position.x = 0.62;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.35, 0.55), materials.castle);
  lintel.position.y = 0.42;
  for (const part of [left, right, lintel]) {
    part.castShadow = true;
    part.receiveShadow = true;
    group.add(part);
  }
  const doorway = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.82), materials.castleShadow);
  doorway.position.set(0, -0.22, 0.282);
  group.add(doorway);
  const lintelTrim = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.08, 0.6), materials.castleTrim);
  lintelTrim.position.y = 0.62;
  lintelTrim.castShadow = true;
  group.add(lintelTrim);
  for (let i = -1; i <= 1; i += 2) {
    const sideCap = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.6), materials.castleTrim);
    sideCap.position.set(i * 0.62, -0.1, 0);
    sideCap.castShadow = true;
    group.add(sideCap);
  }
  markCastleParts(group);
  compactSandUnder(x, z, 1.05, 0.07);
  return group;
}

function createTemple(x, z, rotation) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.42, z);
  group.rotation.y = rotation;
  group.userData.baseRadius = 1.55;
  group.userData.mass = 1.85;
  group.userData.snapPoints = radialSnapPoints(x, z, 1.62, 12);
  group.userData.erosion = { shape: "round", radius: 1.66, localY: -0.4 };

  addTempleBase(group);
  addTempleHall(group);
  addTempleRoof(group, 1.08, 0.52, 1.0);
  addTempleUpperHall(group, 0.58, 1.22);
  addTempleRoof(group, 0.78, 0.4, 1.5);
  addTempleUpperHall(group, 0.38, 1.66);
  addTempleRoof(group, 0.5, 0.32, 1.9);
  addTempleFinial(group);

  compactSandUnder(x, z, 1.55, 0.11);
  return group;
}

function addTempleBase(group) {
  const levels = [
    [1.58, 1.72, -0.29],
    [1.35, 1.48, -0.15],
    [1.1, 1.22, -0.01],
  ];
  for (const [topRadius, bottomRadius, y] of levels) {
    const level = new THREE.Mesh(new THREE.CylinderGeometry(topRadius, bottomRadius, 0.12, 48), materials.templeStone);
    level.position.y = y;
    level.castShadow = true;
    level.receiveShadow = true;
    group.add(level);
  }

  for (let i = 0; i < 28; i += 1) {
    const angle = (i / 28) * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.24, 6), materials.templeStone);
    post.position.set(Math.cos(angle) * 1.48, 0.06, Math.sin(angle) * 1.48);
    post.castShadow = true;
    group.add(post);
    if (i % 2 === 0) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.045), materials.templeStone);
      rail.position.set(Math.cos(angle + Math.PI / 28) * 1.48, 0.12, Math.sin(angle + Math.PI / 28) * 1.48);
      rail.rotation.y = -angle;
      rail.castShadow = true;
      group.add(rail);
    }
  }
}

function addTempleHall(group) {
  const hall = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.86, 0.66, 36), materials.templeWall);
  hall.position.y = 0.38;
  hall.castShadow = true;
  hall.receiveShadow = true;
  group.add(hall);

  const trimTop = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.84, 0.12, 36), materials.templeBlueTrim);
  trimTop.position.y = 0.78;
  trimTop.castShadow = true;
  group.add(trimTop);

  const trimBottom = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.025, 8, 48), materials.templeGold);
  trimBottom.rotation.x = Math.PI / 2;
  trimBottom.position.y = 0.08;
  group.add(trimBottom);

  for (let i = 0; i < 18; i += 1) {
    const angle = (i / 18) * Math.PI * 2;
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.54, 0.05), materials.templeGold);
    pillar.position.set(Math.cos(angle) * 0.86, 0.38, Math.sin(angle) * 0.86);
    pillar.rotation.y = -angle;
    pillar.castShadow = true;
    group.add(pillar);
  }
}

function addTempleUpperHall(group, radius, y) {
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.05, 0.26, 32), materials.templeBlueTrim);
  wall.position.y = y;
  wall.castShadow = true;
  group.add(wall);
  for (let i = 0; i < 14; i += 1) {
    const angle = (i / 14) * Math.PI * 2;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.15, 0.025), materials.templeGold);
    panel.position.set(Math.cos(angle) * (radius + 0.02), y, Math.sin(angle) * (radius + 0.02));
    panel.rotation.y = -angle;
    group.add(panel);
  }
}

function addTempleRoof(group, radius, height, y) {
  const eave = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.04, 0.08, 48), materials.templeRoof);
  eave.position.y = y;
  eave.castShadow = true;
  group.add(eave);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.82, height, 48), materials.templeRoof);
  roof.position.y = y + height * 0.46;
  roof.castShadow = true;
  group.add(roof);

  const goldRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.76, 0.018, 8, 48), materials.templeGold);
  goldRing.rotation.x = Math.PI / 2;
  goldRing.position.y = y + 0.055;
  group.add(goldRing);

  for (let i = 0; i < 24; i += 1) {
    const angle = (i / 24) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.02, radius * 0.64), materials.templeBlueTrim);
    rib.position.set(Math.cos(angle) * radius * 0.32, y + height * 0.26, Math.sin(angle) * radius * 0.32);
    rib.rotation.y = -angle;
    rib.rotation.x = 0.34;
    group.add(rib);
  }
}

function addTempleFinial(group) {
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.22, 12), materials.templeGold);
  stem.position.y = 2.18;
  stem.castShadow = true;
  const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 10), materials.templeGold);
  pearl.position.y = 2.34;
  pearl.castShadow = true;
  group.add(stem, pearl);
}

function createPaifang(x, z, rotation) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.34, z);
  group.rotation.y = rotation;
  group.userData.baseRadius = 1.55;
  group.userData.mass = 1.65;
  group.userData.snapPoints = wallEndpointSnapPoints(x, z, rotation, 2.55);
  group.userData.erosion = { shape: "wall", width: 3.15, depth: 1.45, localY: -0.32 };

  addPaifangBase(group);
  addPaifangFrame(group);
  addPaifangRoof(group, 0, 1.46, 2.85, 1.08, 0.36);
  addPaifangRoof(group, -1.02, 1.1, 1.18, 0.82, 0.28);
  addPaifangRoof(group, 1.02, 1.1, 1.18, 0.82, 0.28);
  compactSandUnder(x, z, 1.55, 0.09);
  return group;
}

function addPaifangBase(group) {
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.18, 1.3), materials.templeStone);
  base.position.y = -0.25;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const step = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.44), materials.templeStone);
  step.position.set(0, -0.16, 0.86);
  step.castShadow = true;
  group.add(step);
  for (let i = 0; i < 3; i += 1) {
    const stair = new THREE.Mesh(new THREE.BoxGeometry(0.72 + i * 0.18, 0.035, 0.14), materials.templeStone);
    stair.position.set(0, -0.09 + i * 0.035, 1.05 + i * 0.12);
    stair.castShadow = true;
    group.add(stair);
  }
}

function addPaifangFrame(group) {
  const postPositions = [-1.2, -0.48, 0.48, 1.2];
  for (const x of postPositions) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 1.35, 10), materials.templeWall);
    post.position.set(x, 0.42, -0.32);
    post.rotation.z = x * -0.05;
    post.castShadow = true;
    group.add(post);

    const frontPost = post.clone();
    frontPost.position.z = 0.32;
    group.add(frontPost);

    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.08, 10), materials.templeGold);
    foot.position.set(x, -0.19, -0.32);
    foot.castShadow = true;
    group.add(foot);
    const frontFoot = foot.clone();
    frontFoot.position.z = 0.32;
    group.add(frontFoot);
  }

  const beams = [
    [0, 0.9, -0.34, 2.7],
    [0, 0.9, 0.34, 2.7],
    [0, 0.58, -0.34, 2.35],
    [0, 0.58, 0.34, 2.35],
  ];
  for (const [x, y, z, width] of beams) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, 0.1), materials.templeWall);
    beam.position.set(x, y, z);
    beam.castShadow = true;
    group.add(beam);
  }

  const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.24, 0.035), materials.templeBlueTrim);
  plaque.position.set(0, 0.74, 0.405);
  plaque.castShadow = true;
  group.add(plaque);
  for (let i = -1; i <= 1; i += 2) {
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.74, 6), materials.templeWall);
    brace.position.set(i * 1.16, 0.42, 0.42);
    brace.rotation.z = i * 0.26;
    brace.castShadow = true;
    group.add(brace);
  }
}

function addPaifangRoof(group, x, y, width, depth, height) {
  const roof = new THREE.Group();
  roof.position.set(x, y, 0);

  const left = new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, depth * 0.58), materials.templeRoof);
  left.position.set(0, 0.04, -depth * 0.18);
  left.rotation.x = -0.34;
  left.castShadow = true;
  roof.add(left);
  const right = left.clone();
  right.position.z = depth * 0.18;
  right.rotation.x = 0.34;
  roof.add(right);

  const ridge = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.07, 0.08), materials.castleShadow);
  ridge.position.y = height * 0.42;
  ridge.castShadow = true;
  roof.add(ridge);

  const eaveFront = new THREE.Mesh(new THREE.BoxGeometry(width * 1.06, 0.08, 0.08), materials.templeRoof);
  eaveFront.position.set(0, -0.08, depth * 0.52);
  eaveFront.castShadow = true;
  roof.add(eaveFront);
  const eaveBack = eaveFront.clone();
  eaveBack.position.z = -depth * 0.52;
  roof.add(eaveBack);

  for (const side of [-1, 1]) {
    const corner = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.34, 4), materials.templeRoof);
    corner.position.set(side * width * 0.56, 0.02, depth * 0.52);
    corner.rotation.z = -side * 1.05;
    corner.rotation.x = Math.PI / 2;
    corner.castShadow = true;
    roof.add(corner);
    const backCorner = corner.clone();
    backCorner.position.z = -depth * 0.52;
    backCorner.rotation.x = -Math.PI / 2;
    roof.add(backCorner);
  }

  for (let i = -5; i <= 5; i += 1) {
    const tile = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.025, depth * 0.92), materials.castleShadow);
    tile.position.x = (i / 5) * width * 0.42;
    tile.position.y = 0.02;
    tile.castShadow = true;
    roof.add(tile);
  }

  const trim = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.07, 0.1), materials.templeGold);
  trim.position.y = -0.18;
  trim.castShadow = true;
  roof.add(trim);
  group.add(roof);
}

function createWenchangPavilion(x, z, rotation) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.46, z);
  group.rotation.y = rotation;
  group.userData.baseRadius = 1.48;
  group.userData.mass = 1.9;
  group.userData.snapPoints = radialSnapPoints(x, z, 1.52, 8);
  group.userData.erosion = { shape: "wall", width: 3.1, depth: 3.1, localY: -0.46 };

  addWenchangBase(group);
  addWenchangFloor(group, 0.98, 0, 0.6, true);
  addWenchangRoof(group, 1.2, 0.46, 0.62, true);
  addWenchangFloor(group, 0.78, 0.78, 0.5, false);
  addWenchangRoof(group, 1.0, 0.42, 1.28, true);
  addWenchangFloor(group, 0.58, 1.42, 0.4, false);
  addWenchangRoof(group, 0.82, 0.5, 1.82, false);
  addWenchangFinial(group);

  compactSandUnder(x, z, 1.46, 0.12);
  return group;
}

function addWenchangBase(group) {
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.46, 1.58, 0.34, 8), materials.cityStoneDark);
  skirt.rotation.y = Math.PI / 8;
  skirt.position.y = -0.34;
  skirt.castShadow = true;
  skirt.receiveShadow = true;
  group.add(skirt);

  const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.34, 1.42, 0.18, 8), materials.templeStone);
  platform.rotation.y = Math.PI / 8;
  platform.position.y = -0.12;
  platform.castShadow = true;
  platform.receiveShadow = true;
  group.add(platform);

  for (const z of [1.28, 1.42]) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.06, 0.22), materials.templeStone);
    step.position.set(0, -0.03 + (z - 1.28) * 0.32, z);
    step.castShadow = true;
    group.add(step);
  }

  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.055), materials.cityStone);
    stone.position.set(Math.cos(angle) * 1.44, -0.18, Math.sin(angle) * 1.44);
    stone.rotation.y = -angle;
    group.add(stone);
  }
}

function addWenchangFloor(group, radius, y, height, doorway) {
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.94, radius, height, 8), materials.pavilionWood);
  wall.rotation.y = Math.PI / 8;
  wall.position.y = y + height / 2;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  const bottomTrim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.02, radius * 1.04, 0.055, 8), materials.templeGold);
  bottomTrim.rotation.y = Math.PI / 8;
  bottomTrim.position.y = y + 0.04;
  bottomTrim.castShadow = true;
  group.add(bottomTrim);

  const topTrim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.02, radius * 1.02, 0.055, 8), materials.roofRidgeWhite);
  topTrim.rotation.y = Math.PI / 8;
  topTrim.position.y = y + height + 0.04;
  topTrim.castShadow = true;
  group.add(topTrim);

  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.032, height + 0.08, 6), materials.darkWood);
    column.position.set(Math.cos(angle) * radius * 0.94, y + height / 2, Math.sin(angle) * radius * 0.94);
    column.castShadow = true;
    group.add(column);
  }

  for (let i = 0; i < 8; i += 1) {
    if (doorway && i === 0) continue;
    const angle = (i / 8) * Math.PI * 2;
    const window = createRoundWindow(radius * 0.22);
    const local = new THREE.Vector3(0, y + height * 0.55, radius + 0.008);
    local.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    window.position.copy(local);
    window.rotation.y = angle;
    group.add(window);
  }

  if (doorway) {
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.46), materials.darkWood);
    door.position.set(0, y + 0.26, radius + 0.01);
    group.add(door);
    for (const x of [-0.13, 0.13]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.018), materials.pavilionWood);
      panel.position.set(x, y + 0.25, radius + 0.02);
      group.add(panel);
    }
  }
}

function createRoundWindow(radius) {
  const frame = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.012, 6, 18), materials.darkWood);
  frame.add(ring);
  const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.014, radius * 1.54, 0.012), materials.darkWood);
  frame.add(vertical);
  const horizontal = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.54, 0.014, 0.012), materials.darkWood);
  frame.add(horizontal);
  return frame;
}

function addWenchangRoof(group, radius, height, y, withPlaque) {
  const roof = new THREE.Group();
  roof.position.y = y;
  roof.rotation.y = Math.PI / 8;

  const eave = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.12, radius * 1.24, 0.1, 8), materials.pavilionRoof);
  eave.position.y = -0.06;
  eave.castShadow = true;
  roof.add(eave);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(radius * 1.06, height, 8), materials.pavilionRoof);
  cap.position.y = height * 0.36;
  cap.scale.y = 0.86;
  cap.castShadow = true;
  roof.add(cap);

  const whiteRing = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.16, radius * 1.2, 0.045, 8), materials.roofRidgeWhite);
  whiteRing.position.y = -0.12;
  whiteRing.castShadow = true;
  roof.add(whiteRing);

  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, radius * 1.05, 6), materials.roofRidgeWhite);
    ridge.position.set(Math.cos(angle) * radius * 0.38, height * 0.2, Math.sin(angle) * radius * 0.38);
    ridge.rotation.z = Math.PI / 2;
    ridge.rotation.y = -angle;
    ridge.castShadow = true;
    roof.add(ridge);

    const corner = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 4), materials.roofRidgeWhite);
    corner.position.set(Math.cos(angle) * radius * 1.2, 0.01, Math.sin(angle) * radius * 1.2);
    corner.rotation.set(Math.PI / 2, -angle, 0.7);
    corner.castShadow = true;
    roof.add(corner);

    const beast = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 5), materials.roofRidgeWhite);
    beast.position.set(Math.cos(angle) * radius * 1.06, 0.08, Math.sin(angle) * radius * 1.06);
    beast.scale.set(1.2, 0.75, 0.8);
    beast.castShadow = true;
    roof.add(beast);
  }

  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2;
    const tile = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, radius * 0.82, 5), materials.templeBlueTrim);
    tile.position.set(Math.cos(angle) * radius * 0.38, height * 0.08, Math.sin(angle) * radius * 0.38);
    tile.rotation.z = Math.PI / 2;
    tile.rotation.y = -angle;
    roof.add(tile);
  }

  if (withPlaque) {
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(radius * 0.56, 0.2), createPlaqueMaterial("文昌阁"));
    plaque.position.set(0, 0.1, radius * 0.86);
    roof.add(plaque);
  }

  group.add(roof);
}

function createPlaqueMaterial(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 72;
  const context = canvas.getContext("2d");
  context.fillStyle = "#2a2118";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#d9a23a";
  context.lineWidth = 5;
  context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  context.fillStyle = "#e4b85b";
  context.font = "bold 34px serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture, transparent: false });
}

function addWenchangFinial(group) {
  const base = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 8), materials.roofRidgeWhite);
  base.position.y = 2.46;
  base.scale.y = 0.88;
  base.castShadow = true;
  group.add(base);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.05, 0.34, 12), materials.roofRidgeWhite);
  stem.position.y = 2.66;
  stem.castShadow = true;
  group.add(stem);
}

function createPavilion(x, z, rotation) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.46, z);
  group.rotation.y = rotation;
  group.userData.baseRadius = 1.42;
  group.userData.mass = 1.8;
  group.userData.snapPoints = radialSnapPoints(x, z, 1.48, 8);
  group.userData.erosion = { shape: "wall", width: 2.8, depth: 2.8, localY: -0.44 };

  addPavilionBase(group);
  addPavilionFloor(group, 1.2, 0.2, 0.62, true);
  addPavilionRoof(group, 1.42, 1.02, 0.98);
  addPavilionFloor(group, 0.92, 1.04, 0.5, false);
  addPavilionRoof(group, 1.12, 0.72, 1.62);
  addPavilionFloor(group, 0.66, 1.56, 0.42, false);
  addPavilionRoof(group, 0.82, 0.52, 2.06);
  addPavilionFinial(group);
  addPavilionLanterns(group);

  compactSandUnder(x, z, 1.42, 0.1);
  return group;
}

function addPavilionBase(group) {
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.78, 0.34, 2.78), materials.templeStone);
  base.position.y = -0.3;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  for (let layer = 0; layer < 3; layer += 1) {
    const edge = 1.42 - layer * 0.1;
    const height = -0.1 + layer * 0.08;
    const railFront = new THREE.Mesh(new THREE.BoxGeometry(edge * 2, 0.05, 0.06), materials.templeStone);
    railFront.position.set(0, height, edge);
    const railBack = railFront.clone();
    railBack.position.z = -edge;
    const railLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, edge * 2), materials.templeStone);
    railLeft.position.set(-edge, height, 0);
    const railRight = railLeft.clone();
    railRight.position.x = edge;
    for (const rail of [railFront, railBack, railLeft, railRight]) {
      rail.castShadow = true;
      group.add(rail);
    }
  }

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.32, 0.07), materials.templeStone);
      post.position.set(sx * 1.28, 0.02, sz * 1.28);
      post.castShadow = true;
      group.add(post);
    }
  }
}

function addPavilionFloor(group, size, y, height, doorway) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(size, height, size), materials.pavilionWood);
  wall.position.y = y + height / 2;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  const trimTop = new THREE.Mesh(new THREE.BoxGeometry(size * 1.06, 0.06, size * 1.06), materials.templeGold);
  trimTop.position.y = y + height + 0.03;
  trimTop.castShadow = true;
  group.add(trimTop);

  const trimBottom = new THREE.Mesh(new THREE.BoxGeometry(size * 1.04, 0.045, size * 1.04), materials.templeGold);
  trimBottom.position.y = y + 0.04;
  trimBottom.castShadow = true;
  group.add(trimBottom);

  for (const side of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    for (const offset of [-0.25, 0.25]) {
      const window = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.24), materials.castleShadow);
      const local = new THREE.Vector3(offset, y + height * 0.58, size / 2 + 0.006);
      local.applyAxisAngle(new THREE.Vector3(0, 1, 0), side);
      window.position.copy(local);
      window.rotation.y = side;
      group.add(window);
    }
  }

  if (doorway) {
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.42), materials.castleShadow);
    door.position.set(0, y + 0.28, size / 2 + 0.008);
    group.add(door);
  }
}

function addPavilionRoof(group, radius, height, y) {
  const roof = new THREE.Group();
  roof.position.y = y;

  const eave = new THREE.Mesh(new THREE.BoxGeometry(radius * 2.08, 0.08, radius * 2.08), materials.pavilionRoof);
  eave.position.y = -0.04;
  eave.castShadow = true;
  roof.add(eave);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 4), materials.pavilionRoof);
  cap.rotation.y = Math.PI / 4;
  cap.position.y = height * 0.42;
  cap.scale.y = 0.82;
  cap.castShadow = true;
  roof.add(cap);

  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, height * 1.5, 8), materials.templeGold);
  ridge.position.y = height * 0.5;
  ridge.rotation.z = Math.PI / 2;
  ridge.castShadow = true;
  roof.add(ridge);
  const crossRidge = ridge.clone();
  crossRidge.rotation.set(Math.PI / 2, 0, 0);
  roof.add(crossRidge);

  for (let i = -5; i <= 5; i += 1) {
    const tileA = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, radius * 1.45), materials.templeBlueTrim);
    tileA.position.set((i / 5) * radius * 0.62, 0.02, 0);
    tileA.castShadow = true;
    roof.add(tileA);
    const tileB = tileA.clone();
    tileB.rotation.y = Math.PI / 2;
    roof.add(tileB);
  }

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const corner = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.32, 4), materials.templeGold);
      corner.position.set(sx * radius * 1.05, 0.02, sz * radius * 1.05);
      corner.rotation.set(Math.PI / 2, Math.atan2(sz, sx), sx * -0.9);
      corner.castShadow = true;
      roof.add(corner);
    }
  }

  group.add(roof);
}

function addPavilionFinial(group) {
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.42, 12), materials.templeGold);
  stem.position.y = 2.55;
  stem.castShadow = true;
  group.add(stem);
  for (let i = 0; i < 3; i += 1) {
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.09 - i * 0.018, 14, 8), materials.templeGold);
    bead.position.y = 2.36 + i * 0.16;
    bead.castShadow = true;
    group.add(bead);
  }
}

function addPavilionLanterns(group) {
  const points = [
    [-1.18, 0.72, 1.18],
    [1.18, 0.72, 1.18],
    [-1.18, 0.72, -1.18],
    [1.18, 0.72, -1.18],
    [-0.84, 1.32, 0.84],
    [0.84, 1.32, 0.84],
  ];
  for (const [x, y, z] of points) {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.18, 5), materials.castleShadow);
    cord.position.set(x, y + 0.1, z);
    cord.castShadow = true;
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), materials.lantern);
    lantern.position.set(x, y, z);
    lantern.scale.y = 1.12;
    lantern.castShadow = true;
    group.add(cord, lantern);
  }
}

function createCityGate(x, z, rotation) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.48, z);
  group.rotation.y = rotation;
  group.userData.baseRadius = 1.75;
  group.userData.mass = 2;
  group.userData.snapPoints = wallEndpointSnapPoints(x, z, rotation, 3.1);
  group.userData.erosion = { shape: "wall", width: 3.7, depth: 1.85, localY: -0.48 };

  addCityGateFoundation(group);
  addCityGateWall(group);
  addCityGatePavilion(group);
  addCityGateFlags(group);
  addCityGateShrubs(group);
  compactSandUnder(x, z, 1.7, 0.13);
  return group;
}

function addCityGateFoundation(group) {
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(3.75, 0.34, 1.92), materials.cityStoneDark);
  skirt.position.y = -0.37;
  skirt.castShadow = true;
  skirt.receiveShadow = true;
  group.add(skirt);

  const base = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.22, 1.72), materials.cityStone);
  base.position.y = -0.17;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  for (let i = 0; i < 4; i += 1) {
    const stair = new THREE.Mesh(new THREE.BoxGeometry(0.8 + i * 0.18, 0.035, 0.18), materials.cityStone);
    stair.position.set(-1.24, -0.03 + i * 0.04, 1.02 + i * 0.11);
    stair.castShadow = true;
    group.add(stair);
  }
}

function addCityGateWall(group) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(3.28, 0.92, 1.02), materials.cityStone);
  wall.position.y = 0.36;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  const frontArch = createArchShadow(0.52, 0.76);
  frontArch.position.set(0, 0.22, 0.515);
  group.add(frontArch);
  const backArch = createArchShadow(0.52, 0.76);
  backArch.position.set(0, 0.22, -0.515);
  backArch.rotation.y = Math.PI;
  group.add(backArch);

  const towerLeft = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.08, 1.14), materials.cityStoneDark);
  towerLeft.position.set(-1.22, 0.45, 0);
  towerLeft.castShadow = true;
  towerLeft.receiveShadow = true;
  group.add(towerLeft);
  const towerRight = towerLeft.clone();
  towerRight.position.x = 1.22;
  group.add(towerRight);

  for (let x = -1.58; x <= 1.58; x += 0.32) {
    const crenel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), materials.cityStoneDark);
    crenel.position.set(x, 0.94, 0.46);
    crenel.castShadow = true;
    group.add(crenel);
    const back = crenel.clone();
    back.position.z = -0.46;
    group.add(back);
  }

  for (let row = 0; row < 5; row += 1) {
    const y = -0.02 + row * 0.17;
    for (let col = -5; col <= 5; col += 1) {
      const brick = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.018, 0.012), materials.cityStoneDark);
      brick.position.set(col * 0.28 + (row % 2) * 0.14, y, 0.526);
      group.add(brick);
      const backBrick = brick.clone();
      backBrick.position.z = -0.526;
      group.add(backBrick);
    }
  }
}

function createArchShadow(width, height) {
  const shape = new THREE.Shape();
  const half = width / 2;
  shape.moveTo(-half, -height / 2);
  shape.lineTo(-half, height * 0.08);
  shape.quadraticCurveTo(-half, height * 0.48, 0, height * 0.48);
  shape.quadraticCurveTo(half, height * 0.48, half, height * 0.08);
  shape.lineTo(half, -height / 2);
  shape.lineTo(-half, -height / 2);
  return new THREE.Mesh(new THREE.ShapeGeometry(shape), materials.castleShadow);
}

function addCityGatePavilion(group) {
  const floor = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.14, 1.08), materials.templeGold);
  floor.position.y = 1.02;
  floor.castShadow = true;
  group.add(floor);

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.48, 0.82), materials.templeWall);
  body.position.y = 1.32;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.62, 8), materials.templeWall);
      post.position.set(sx * 0.68, 1.24, sz * 0.46);
      post.castShadow = true;
      group.add(post);
    }
  }

  const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.035), materials.templeGold);
  plaque.position.set(0, 1.42, 0.432);
  plaque.castShadow = true;
  group.add(plaque);

  addCityGateRoof(group, 1.02, 0.76, 1.66);
  addCityGateRoof(group, 0.74, 0.54, 2.08);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), materials.templeGold);
  finial.position.y = 2.44;
  finial.castShadow = true;
  group.add(finial);

  for (const x of [-0.48, 0, 0.48]) {
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), materials.lantern);
    lantern.position.set(x, 1.08, 0.5);
    lantern.scale.y = 1.12;
    lantern.castShadow = true;
    group.add(lantern);
  }
}

function addCityGateRoof(group, width, depth, y) {
  const roof = new THREE.Group();
  roof.position.y = y;
  const left = new THREE.Mesh(new THREE.BoxGeometry(width * 1.58, 0.07, depth), materials.darkTile);
  left.position.z = -depth * 0.18;
  left.rotation.x = -0.34;
  left.castShadow = true;
  roof.add(left);
  const right = left.clone();
  right.position.z = depth * 0.18;
  right.rotation.x = 0.34;
  roof.add(right);

  const ridge = new THREE.Mesh(new THREE.BoxGeometry(width * 1.24, 0.06, 0.08), materials.templeGold);
  ridge.position.y = 0.22;
  ridge.castShadow = true;
  roof.add(ridge);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const corner = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.3, 4), materials.darkTile);
      corner.position.set(sx * width * 0.88, -0.03, sz * depth * 0.58);
      corner.rotation.set(Math.PI / 2, Math.atan2(sz, sx), sx * -1.02);
      corner.castShadow = true;
      roof.add(corner);
    }
  }

  for (let i = -4; i <= 4; i += 1) {
    const tile = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.02, depth * 0.95), materials.cityStoneDark);
    tile.position.x = (i / 4) * width * 0.62;
    roof.add(tile);
  }
  group.add(roof);
}

function addCityGateFlags(group) {
  for (const x of [-1.6, -1.15, 1.15, 1.6]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.68, 6), materials.wood);
    pole.position.set(x, 1.2, -0.54);
    pole.castShadow = true;
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.36, 1, 2), materials.flag);
    banner.position.set(x + 0.08, 1.36, -0.54);
    banner.rotation.y = -0.15;
    banner.castShadow = true;
    group.add(pole, banner);
  }
}

function addCityGateShrubs(group) {
  const shrubMaterial = new THREE.MeshStandardMaterial({ color: 0x74aa55, roughness: 0.82 });
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 5; i += 1) {
      const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.12 + Math.random() * 0.04, 8, 6), shrubMaterial);
      shrub.position.set(sx * (1.55 + Math.random() * 0.18), -0.05 + Math.random() * 0.06, -0.34 + i * 0.16);
      shrub.scale.set(1.2, 0.55, 0.9);
      shrub.castShadow = true;
      group.add(shrub);
    }
  }
}

function createPaintedGate(x, z, rotation) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.44, z);
  group.rotation.y = rotation;
  group.userData.baseRadius = 1.75;
  group.userData.mass = 1.7;
  group.userData.snapPoints = wallEndpointSnapPoints(x, z, rotation, 3.2);
  group.userData.erosion = { shape: "wall", width: 3.75, depth: 1.25, localY: -0.42 };

  addPaintedGateBase(group);
  addPaintedGatePillars(group);
  addPaintedGateBeams(group);
  addPaintedGateDoors(group);
  addPaintedGateRoofs(group);
  compactSandUnder(x, z, 1.72, 0.1);
  return group;
}

function addPaintedGateBase(group) {
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.28, 1.16), materials.cityStone);
  base.position.y = -0.34;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(3.45, 0.1, 0.98), materials.templeStone);
  slab.position.y = -0.15;
  slab.castShadow = true;
  group.add(slab);

  for (const x of [-1.48, -0.55, 0.55, 1.48]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.34), materials.cityStoneDark);
    foot.position.set(x, -0.02, 0);
    foot.castShadow = true;
    group.add(foot);
  }
}

function addPaintedGatePillars(group) {
  for (const x of [-1.48, -0.55, 0.55, 1.48]) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.26, 8), materials.blackPillar);
    pillar.position.set(x, 0.58, 0);
    pillar.castShadow = true;
    group.add(pillar);
    for (const y of [0.12, 0.52, 0.92]) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.035, 8), materials.templeGold);
      band.position.set(x, y, 0);
      band.rotation.x = Math.PI / 2;
      group.add(band);
    }
  }
}

function addPaintedGateBeams(group) {
  const beams = [
    [0, 1.02, 3.28, 0.16],
    [0, 0.72, 3.04, 0.14],
    [0, 1.32, 2.72, 0.16],
  ];
  for (const [x, y, width, height] of beams) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.22), materials.paintedBeam);
    beam.position.set(x, y, 0);
    beam.castShadow = true;
    group.add(beam);
  }

  const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.3, 0.035), materials.templeGold);
  plaque.position.set(0, 1.1, 0.13);
  plaque.castShadow = true;
  group.add(plaque);

  const patternColors = [materials.templeGold, materials.pavilionRoof, materials.lantern];
  for (let i = 0; i < 18; i += 1) {
    const x = -1.5 + i * 0.18;
    const ornament = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.025), patternColors[i % patternColors.length]);
    ornament.position.set(x, 0.82 + (i % 2) * 0.18, 0.14);
    ornament.rotation.z = Math.PI / 4;
    group.add(ornament);
  }
}

function addPaintedGateDoors(group) {
  const openings = [
    [-1.02, 0.44],
    [0, 0.64],
    [1.02, 0.44],
  ];
  for (const [x, width] of openings) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(width, 0.56, 0.06), materials.wood);
    door.position.set(x, 0.18, 0.08);
    door.castShadow = true;
    group.add(door);
    const split = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.5, 0.068), materials.templeGold);
    split.position.set(x, 0.18, 0.12);
    group.add(split);
    for (let row = 0; row < 4; row += 1) {
      for (let col = -2; col <= 2; col += 1) {
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), materials.templeGold);
        knob.position.set(x + col * width * 0.14, -0.02 + row * 0.12, 0.13);
        group.add(knob);
      }
    }
  }
}

function addPaintedGateRoofs(group) {
  addPaintedGateRoof(group, 0, 1.46, 1.55, 0.86);
  addPaintedGateRoof(group, -1.08, 1.2, 0.88, 0.68);
  addPaintedGateRoof(group, 1.08, 1.2, 0.88, 0.68);
  addPaintedGateRoof(group, -1.52, 0.96, 0.62, 0.52);
  addPaintedGateRoof(group, 1.52, 0.96, 0.62, 0.52);
}

function addPaintedGateRoof(group, x, y, width, depth) {
  const roof = new THREE.Group();
  roof.position.set(x, y, 0);

  const left = new THREE.Mesh(new THREE.BoxGeometry(width, 0.055, depth * 0.62), materials.paintedTile);
  left.position.z = -depth * 0.18;
  left.rotation.x = -0.36;
  left.castShadow = true;
  roof.add(left);
  const right = left.clone();
  right.position.z = depth * 0.18;
  right.rotation.x = 0.36;
  roof.add(right);

  const ridge = new THREE.Mesh(new THREE.BoxGeometry(width * 0.78, 0.055, 0.07), materials.templeGold);
  ridge.position.y = 0.2;
  roof.add(ridge);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const corner = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.24, 4), materials.paintedTile);
      corner.position.set(sx * width * 0.55, -0.03, sz * depth * 0.56);
      corner.rotation.set(Math.PI / 2, Math.atan2(sz, sx), sx * -1.04);
      corner.castShadow = true;
      roof.add(corner);
    }
    const beast = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 5), materials.templeGold);
    beast.position.set(sx * width * 0.36, 0.24, 0);
    beast.castShadow = true;
    roof.add(beast);
  }

  for (let i = -4; i <= 4; i += 1) {
    const tile = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.018, depth * 0.9), materials.castleShadow);
    tile.position.x = (i / 4) * width * 0.38;
    roof.add(tile);
  }

  const trim = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, 0.045, 0.09), materials.templeBlueTrim);
  trim.position.y = -0.13;
  roof.add(trim);
  group.add(roof);
}

function createKfcRestaurant(x, z, rotation) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.4, z);
  group.rotation.y = rotation;
  group.userData.baseRadius = 3;
  group.userData.mass = 3.2;
  group.userData.snapPoints = radialSnapPoints(x, z, 2.86, 12);
  group.userData.erosion = { shape: "wall", width: 5.4, depth: 4.4, localY: -0.42 };

  addKfcSite(group);
  addKfcBuilding(group);
  addKfcRoofEquipment(group);
  addKfcPatio(group);
  addKfcPylonSign(group);
  addKfcDriveThru(group);
  addKfcCar(group, 2.02, 0.68, -0.08);

  group.traverse((child) => {
    if (!child.isMesh) return;
    child.receiveShadow = true;
    child.castShadow = child.material !== materials.kfcGlass && child.material !== kfcSurfaceMaterials.window;
  });
  compactSandUnder(x, z, 2.62, 0.16);
  return group;
}

function addKfcSite(group) {
  addKfcBox(group, [5.4, 0.18, 4.4], [0, -0.38, 0], materials.kfcWhiteTrim);
  addKfcBox(group, [5.12, 0.06, 4.12], [0, -0.25, 0], materials.kfcAsphalt);
  addKfcBox(group, [3.5, 0.08, 1.04], [-0.1, -0.19, 1.48], materials.kfcPavement);
  addKfcBox(group, [3.52, 0.08, 2.62], [-0.12, -0.2, -0.18], materials.kfcPavement);

  for (let i = -7; i <= 7; i += 1) {
    addKfcBox(group, [0.014, 0.012, 1.02], [i * 0.23 - 0.1, -0.14, 1.48], materials.kfcWhiteTrim);
  }
  for (let i = 0; i < 5; i += 1) {
    addKfcBox(group, [3.46, 0.012, 0.014], [-0.1, -0.14, 1.03 + i * 0.23], materials.kfcWhiteTrim);
  }

  for (const z of [-1.42, -0.52, 0.38, 1.28]) {
    addKfcBox(group, [0.035, 0.018, 0.68], [2.12, -0.19, z], materials.kfcRoadLine);
  }
  addKfcBox(group, [0.055, 0.018, 0.38], [1.74, -0.19, -1.35], materials.kfcRoadLine);
  addKfcBox(group, [0.055, 0.018, 0.38], [1.74, -0.19, 1.35], materials.kfcRoadLine);

  addKfcBox(group, [0.08, 0.018, 0.42], [-2.12, -0.19, 0.82], materials.kfcRoadLine);
  addKfcBox(group, [0.08, 0.018, 0.25], [-2.2, -0.19, 0.56], materials.kfcRoadLine, [0, -0.68, 0]);
  addKfcBox(group, [0.08, 0.018, 0.25], [-2.04, -0.19, 0.56], materials.kfcRoadLine, [0, 0.68, 0]);
  for (let i = 0; i < 4; i += 1) {
    addKfcBox(group, [0.1, 0.018, 0.28], [-2.18, -0.19, -1.42 + i * 0.55], materials.templeGold);
  }
}

function addKfcBuilding(group) {
  addKfcBox(group, [3.15, 2.04, 2.2], [-0.15, 0.76, -0.34], materials.kfcWhite);
  addKfcBox(group, [3.28, 0.12, 2.32], [-0.15, 1.83, -0.34], materials.kfcWhiteTrim);
  addKfcBox(group, [0.76, 2.48, 0.78], [-1.38, 0.96, 0.38], materials.kfcRed);
  addKfcBox(group, [0.84, 0.1, 0.86], [-1.38, 2.24, 0.38], materials.kfcRedDark);

  addKfcBox(group, [2.22, 0.42, 0.1], [-0.15, 1.5, 0.79], materials.kfcRed);
  addKfcPlane(group, 1.12, 0.34, kfcSurfaceMaterials.wordmark, [-0.3, 1.52, 0.85]);
  addKfcPlane(group, 0.62, 0.62, kfcSurfaceMaterials.portrait, [-1.38, 1.57, 0.79]);

  addKfcFrontWindow(group, -0.08, 1.08, 0.8, 2.05, 0.54, 4, 1);
  addKfcFrontWindow(group, 0.4, 0.28, 0.805, 1.28, 0.72, 3, 1);
  addKfcDoor(group, -0.62, 0.18, 0.82);

  addKfcBox(group, [0.76, 0.09, 0.44], [-0.62, 0.71, 0.96], materials.kfcRed, [-0.28, 0, 0]);
  addKfcBox(group, [0.82, 0.035, 0.04], [-0.62, 0.65, 1.16], materials.kfcRedDark);

  addKfcBox(group, [0.3, 1.92, 0.24], [1.25, 0.72, 0.77], materials.kfcWhite);
  addKfcBox(group, [0.4, 0.94, 0.18], [1.04, 0.27, 0.81], materials.kfcWood);
  for (let i = -4; i <= 4; i += 1) {
    addKfcBox(group, [0.022, 0.9, 0.022], [1.04 + i * 0.042, 0.27, 0.915], materials.kfcRedDark);
  }

  addKfcSideWindow(group, 1.435, 1.06, -0.44, 1.54, 0.56, 3, 1);
  addKfcSideWindow(group, 1.44, 0.28, -0.4, 1.48, 0.7, 3, 1);
  addKfcBox(group, [0.46, 0.09, 1.48], [1.59, 0.7, -0.34], materials.kfcRed, [0, 0, 0.25]);
  addKfcBox(group, [0.04, 0.035, 1.54], [1.8, 0.64, -0.34], materials.kfcRedDark);
  addKfcPlane(group, 1.02, 0.36, kfcSurfaceMaterials.sideWordmark, [1.431, 1.55, -0.48], [0, Math.PI / 2, 0]);

  for (let row = 0; row < 4; row += 1) {
    addKfcBox(group, [0.018, 0.018, 2.08], [1.435, 0.14 + row * 0.46, -0.34], materials.kfcWhiteTrim);
  }
  for (let col = 0; col < 4; col += 1) {
    addKfcBox(group, [0.018, 1.86, 0.018], [1.435, 0.78, -1.22 + col * 0.58], materials.kfcWhiteTrim);
  }

  for (let i = 0; i < 3; i += 1) {
    addKfcPlane(group, 0.26, 0.16, kfcSurfaceMaterials.menu, [-0.1 + i * 0.3, 1.1, 0.84]);
  }
  for (let i = 0; i < 3; i += 1) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), materials.kfcWarm);
    lamp.position.set(-0.25 + i * 0.42, 1.24, 0.86);
    group.add(lamp);
  }

  addKfcBox(group, [0.34, 0.48, 0.05], [-1.37, 0.36, 0.8], materials.kfcWhite);
  addKfcPlane(group, 0.24, 0.34, kfcSurfaceMaterials.menu, [-1.37, 0.36, 0.835]);
}

function addKfcDoor(group, x, y, z) {
  addKfcBox(group, [0.64, 0.84, 0.055], [x, y, z], materials.kfcCharcoal);
  addKfcBox(group, [0.27, 0.74, 0.025], [x - 0.145, y, z + 0.035], materials.kfcGlass);
  addKfcBox(group, [0.27, 0.74, 0.025], [x + 0.145, y, z + 0.035], materials.kfcGlass);
  addKfcBox(group, [0.022, 0.72, 0.025], [x, y, z + 0.06], materials.kfcMetal);
  addKfcBox(group, [0.018, 0.28, 0.026], [x - 0.06, y, z + 0.075], materials.kfcMetal);
  addKfcBox(group, [0.018, 0.28, 0.026], [x + 0.06, y, z + 0.075], materials.kfcMetal);
  addKfcBox(group, [0.76, 0.06, 0.25], [x, -0.23, z + 0.07], materials.kfcPavement);
}

function addKfcFrontWindow(group, x, y, z, width, height, columns, rows) {
  addKfcPlane(group, width, height, kfcSurfaceMaterials.window, [x, y, z]);
  addKfcBox(group, [width + 0.06, 0.045, 0.035], [x, y - height / 2, z + 0.018], materials.kfcCharcoal);
  addKfcBox(group, [width + 0.06, 0.045, 0.035], [x, y + height / 2, z + 0.018], materials.kfcCharcoal);
  addKfcBox(group, [0.045, height + 0.04, 0.035], [x - width / 2, y, z + 0.018], materials.kfcCharcoal);
  addKfcBox(group, [0.045, height + 0.04, 0.035], [x + width / 2, y, z + 0.018], materials.kfcCharcoal);
  for (let i = 1; i < columns; i += 1) {
    addKfcBox(group, [0.028, height, 0.035], [x - width / 2 + (width * i) / columns, y, z + 0.024], materials.kfcCharcoal);
  }
  for (let i = 1; i < rows; i += 1) {
    addKfcBox(group, [width, 0.028, 0.035], [x, y - height / 2 + (height * i) / rows, z + 0.024], materials.kfcCharcoal);
  }
}

function addKfcSideWindow(group, x, y, z, width, height, columns, rows) {
  addKfcPlane(group, width, height, kfcSurfaceMaterials.window, [x, y, z], [0, Math.PI / 2, 0]);
  addKfcBox(group, [0.035, 0.045, width + 0.06], [x + 0.018, y - height / 2, z], materials.kfcCharcoal);
  addKfcBox(group, [0.035, 0.045, width + 0.06], [x + 0.018, y + height / 2, z], materials.kfcCharcoal);
  addKfcBox(group, [0.035, height + 0.04, 0.045], [x + 0.018, y, z - width / 2], materials.kfcCharcoal);
  addKfcBox(group, [0.035, height + 0.04, 0.045], [x + 0.018, y, z + width / 2], materials.kfcCharcoal);
  for (let i = 1; i < columns; i += 1) {
    addKfcBox(group, [0.035, height, 0.028], [x + 0.024, y, z - width / 2 + (width * i) / columns], materials.kfcCharcoal);
  }
  for (let i = 1; i < rows; i += 1) {
    addKfcBox(group, [0.035, 0.028, width], [x + 0.024, y - height / 2 + (height * i) / rows, z], materials.kfcCharcoal);
  }
}

function addKfcRoofEquipment(group) {
  addKfcBox(group, [3.02, 0.05, 2.05], [-0.15, 1.91, -0.34], materials.kfcMetal);
  addKfcBox(group, [3.28, 0.22, 0.1], [-0.15, 1.98, -1.47], materials.kfcWhiteTrim);
  addKfcBox(group, [3.28, 0.22, 0.1], [-0.15, 1.98, 0.79], materials.kfcWhiteTrim);
  addKfcBox(group, [0.1, 0.22, 2.18], [-1.74, 1.98, -0.34], materials.kfcWhiteTrim);
  addKfcBox(group, [0.1, 0.22, 2.18], [1.44, 1.98, -0.34], materials.kfcWhiteTrim);

  addKfcAcUnit(group, -0.85, 2.11, -0.7, 0.94);
  addKfcAcUnit(group, -0.2, 2.1, -0.82, 0.72);
  addKfcAcUnit(group, 0.52, 2.11, -0.56, 0.9);
  addKfcAcUnit(group, 0.35, 2.09, 0.12, 0.68);
  addKfcBox(group, [0.62, 0.12, 0.18], [-0.48, 2.04, 0.25], materials.kfcWhiteTrim);
}

function addKfcAcUnit(group, x, y, z, scale) {
  addKfcBox(group, [0.56 * scale, 0.28 * scale, 0.46 * scale], [x, y, z], materials.kfcWhiteTrim);
  addKfcBox(group, [0.58 * scale, 0.04, 0.48 * scale], [x, y + 0.16 * scale, z], materials.kfcMetal);
  const fan = new THREE.Mesh(new THREE.TorusGeometry(0.13 * scale, 0.018, 8, 24), materials.kfcCharcoal);
  fan.position.set(x, y + 0.19 * scale, z);
  fan.rotation.x = Math.PI / 2;
  group.add(fan);
  for (let i = -2; i <= 2; i += 1) {
    addKfcBox(group, [0.4 * scale, 0.012, 0.012], [x, y - 0.08 * scale + i * 0.04 * scale, z + 0.24 * scale], materials.kfcMetal);
  }
}

function addKfcPatio(group) {
  addKfcPatioSet(group, -0.12, 1.48, 0.92);
  addKfcPatioSet(group, 0.72, 1.55, 0.82);

  for (const [x, z, scale] of [
    [-1.18, 1.43, 0.82],
    [1.28, 1.48, 0.9],
    [1.72, -0.25, 0.8],
    [1.72, -1.1, 0.72],
  ]) {
    addKfcShrub(group, x, z, scale);
  }
  addKfcTree(group, -2.08, 1.32, 0.9);
}

function addKfcPatioSet(group, x, z, scale) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.032, 0.9 * scale, 10), materials.kfcMetal);
  pole.position.set(x, 0.22, z);
  group.add(pole);
  const umbrella = new THREE.Mesh(new THREE.ConeGeometry(0.43 * scale, 0.18, 8), materials.kfcRed);
  umbrella.position.set(x, 0.68 * scale, z);
  umbrella.rotation.y = Math.PI / 8;
  group.add(umbrella);
  for (let i = 0; i < 4; i += 1) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.016, 0.4 * scale), materials.kfcWhite);
    rib.position.set(x, 0.63 * scale, z);
    rib.rotation.y = (i / 4) * Math.PI;
    group.add(rib);
  }
  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.27 * scale, 0.27 * scale, 0.045, 16), materials.kfcWood);
  tableTop.position.set(x, 0.04, z);
  group.add(tableTop);
  const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.36, 10), materials.kfcCharcoal);
  tableLeg.position.set(x, -0.12, z);
  group.add(tableLeg);

  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2;
    const chair = new THREE.Group();
    chair.position.set(x + Math.cos(angle) * 0.4 * scale, -0.07, z + Math.sin(angle) * 0.4 * scale);
    chair.rotation.y = -angle;
    addKfcBox(chair, [0.18, 0.035, 0.18], [0, 0.02, 0], materials.kfcRedDark);
    addKfcBox(chair, [0.18, 0.26, 0.035], [0, 0.15, -0.08], materials.kfcRed);
    group.add(chair);
  }
}

function addKfcShrub(group, x, z, scale) {
  addKfcBox(group, [0.46 * scale, 0.18, 0.26 * scale], [x, -0.1, z], materials.kfcWhiteTrim);
  for (let i = 0; i < 3; i += 1) {
    const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.16 * scale, 12, 8), materials.kfcGreen);
    shrub.position.set(x + (i - 1) * 0.13 * scale, 0.02 + (i % 2) * 0.04, z);
    shrub.scale.y = 0.82;
    group.add(shrub);
  }
}

function addKfcTree(group, x, z, scale) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * scale, 0.11 * scale, 1.15 * scale, 10), materials.kfcWood);
  trunk.position.set(x, 0.32 * scale, z);
  group.add(trunk);
  for (const [dx, dy, dz, size] of [
    [0, 0, 0, 0.38],
    [-0.2, -0.06, 0.04, 0.28],
    [0.18, -0.02, -0.03, 0.3],
    [0.02, 0.2, 0.02, 0.3],
  ]) {
    const crown = new THREE.Mesh(new THREE.SphereGeometry(size * scale, 14, 9), materials.kfcGreen);
    crown.position.set(x + dx * scale, 1.02 * scale + dy * scale, z + dz * scale);
    crown.scale.y = 0.92;
    group.add(crown);
  }
}

function addKfcPylonSign(group) {
  const x = 2.08;
  const z = -1.18;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.16, 18), materials.kfcWhiteTrim);
  base.position.set(x, -0.12, z);
  group.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 1.72, 12), materials.kfcCharcoal);
  pole.position.set(x, 0.68, z);
  group.add(pole);
  addKfcBox(group, [0.78, 0.96, 0.16], [x, 1.5, z], materials.kfcCharcoal);
  addKfcPlane(group, 0.7, 0.7, kfcSurfaceMaterials.pylon, [x, 1.6, z + 0.085]);
  addKfcBox(group, [0.72, 0.34, 0.14], [x, 0.94, z], materials.kfcCharcoal);
  addKfcPlane(group, 0.65, 0.27, kfcSurfaceMaterials.pylonLower, [x, 0.94, z + 0.075]);
}

function addKfcDriveThru(group) {
  const z = -1.42;
  addKfcBox(group, [0.1, 1.1, 0.1], [-2.42, 0.3, z], materials.kfcCharcoal);
  addKfcBox(group, [0.1, 1.1, 0.1], [-1.72, 0.3, z], materials.kfcCharcoal);
  addKfcBox(group, [0.82, 0.14, 0.12], [-2.07, 0.83, z], materials.kfcRed);
  addKfcPlane(group, 0.7, 0.1, kfcSurfaceMaterials.driveThru, [-2.07, 0.83, z + 0.065]);

  addKfcBox(group, [0.12, 0.78, 0.12], [-2.28, 0.14, 0.08], materials.kfcCharcoal);
  addKfcBox(group, [0.5, 0.7, 0.12], [-2.28, 0.42, 0.08], materials.kfcCharcoal);
  addKfcPlane(group, 0.42, 0.6, kfcSurfaceMaterials.menu, [-2.28, 0.42, 0.145]);
}

function addKfcCar(group, x, z, rotation) {
  const car = new THREE.Group();
  car.position.set(x, -0.06, z);
  car.rotation.y = rotation;
  addKfcBox(car, [0.48, 0.18, 0.82], [0, 0.03, 0], materials.kfcWhite);
  addKfcBox(car, [0.4, 0.18, 0.42], [0, 0.18, -0.03], materials.kfcGlass);
  addKfcBox(car, [0.41, 0.035, 0.3], [0, 0.28, -0.04], materials.kfcWhiteTrim);
  addKfcBox(car, [0.34, 0.08, 0.03], [0, 0.15, 0.405], materials.kfcRedDark);
  addKfcBox(car, [0.36, 0.06, 0.03], [0, 0.08, -0.415], materials.kfcCharcoal);
  for (const wheelX of [-0.25, 0.25]) {
    for (const wheelZ of [-0.25, 0.25]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.05, 14), materials.kfcCharcoal);
      wheel.position.set(wheelX, -0.04, wheelZ);
      wheel.rotation.z = Math.PI / 2;
      car.add(wheel);
    }
  }
  group.add(car);
}

function addKfcBox(parent, size, position, material, rotation = null) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.position.set(position[0], position[1], position[2]);
  if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  parent.add(mesh);
  return mesh;
}

function addKfcPlane(parent, width, height, material, position, rotation = null) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(position[0], position[1], position[2]);
  if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  parent.add(mesh);
  return mesh;
}

function createKfcCanvasMaterial(kind) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = kind === "pylon-lower" || kind === "drive-thru" ? 192 : 256;
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  if (kind === "wordmark") {
    context.fillStyle = "#e4002b";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#ffffff";
    context.font = "900 164px Georgia, serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = "rgba(80, 0, 10, 0.38)";
    context.shadowBlur = 8;
    context.fillText("KFC", width / 2, height / 2 + 10);
  } else if (kind === "side-wordmark") {
    context.clearRect(0, 0, width, height);
    context.strokeStyle = "rgba(255,255,255,0.72)";
    context.lineWidth = 12;
    context.fillStyle = "#d8082f";
    context.font = "900 154px Georgia, serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.strokeText("KFC", width / 2, height / 2 + 8);
    context.fillText("KFC", width / 2, height / 2 + 8);
  } else if (kind === "pylon-lower") {
    context.fillStyle = "#d8082f";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#ffffff";
    context.font = "700 78px system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("肯德基", width / 2, height / 2 + 4);
  } else if (kind === "drive-thru") {
    context.fillStyle = "#24282a";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#ffffff";
    context.font = "700 64px system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("DRIVE THRU  →", width / 2, height / 2 + 2);
  } else if (kind === "menu") {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#16191a");
    gradient.addColorStop(1, "#3d2620");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    for (let i = 0; i < 4; i += 1) {
      const left = 22 + i * 122;
      context.fillStyle = i % 2 ? "#f2c27c" : "#f4e6cf";
      context.fillRect(left, 24, 98, 92);
      context.fillStyle = "#d8082f";
      context.beginPath();
      context.arc(left + 49, 70, 25, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "rgba(255,255,255,0.8)";
      for (let line = 0; line < 4; line += 1) {
        context.fillRect(left, 142 + line * 18, 92 - line * 8, 5);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: kind === "side-wordmark",
    side: THREE.DoubleSide,
  });
}

function createKfcWindowMaterial() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#26393d");
  gradient.addColorStop(0.42, "#33494b");
  gradient.addColorStop(1, "#1b2526");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 256);

  context.fillStyle = "rgba(255, 179, 86, 0.78)";
  for (let i = 0; i < 5; i += 1) {
    context.beginPath();
    context.arc(58 + i * 102, 42, 10, 0, Math.PI * 2);
    context.fill();
    context.fillRect(56 + i * 102, 0, 4, 34);
  }
  context.fillStyle = "#9a5b35";
  for (let i = 0; i < 4; i += 1) {
    const x = 48 + i * 122;
    context.fillRect(x, 150, 80, 14);
    context.fillRect(x + 36, 164, 8, 54);
    context.fillStyle = "#d8082f";
    context.fillRect(x - 12, 176, 24, 42);
    context.fillRect(x + 68, 176, 24, 42);
    context.fillStyle = "#9a5b35";
  }
  context.fillStyle = "rgba(232, 69, 54, 0.46)";
  context.fillRect(0, 224, 512, 32);
  context.strokeStyle = "rgba(190, 241, 245, 0.28)";
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(30, 240);
  context.lineTo(178, 0);
  context.moveTo(244, 256);
  context.lineTo(394, 0);
  context.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return new THREE.MeshStandardMaterial({
    map: texture,
    emissiveMap: texture,
    emissive: 0x4d1d0d,
    emissiveIntensity: 0.34,
    roughness: 0.2,
    metalness: 0.04,
  });
}

function createSquidwardHouse(x, z, rotation) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.42, z);
  group.rotation.y = rotation;
  group.userData.baseRadius = 1.18;
  group.userData.mass = 1.95;
  group.userData.snapPoints = radialSnapPoints(x, z, 1.18, 8);
  group.userData.erosion = { shape: "wall", width: 2.18, depth: 1.78, localY: -0.38 };

  const stoneMaterial = new THREE.MeshStandardMaterial({ map: createSquidStoneTexture(), roughness: 0.95 });
  addSquidwardBody(group, stoneMaterial);
  addSquidwardFace(group, stoneMaterial);
  addSquidwardDoor(group);
  compactSandUnder(x, z, 1.08, 0.12);
  return group;
}

function addSquidwardBody(group, stoneMaterial) {
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.98, 0.14, 28), materials.templeStone);
  pad.position.y = -0.32;
  pad.scale.set(1.1, 1, 0.72);
  pad.castShadow = true;
  pad.receiveShadow = true;
  group.add(pad);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.82, 2.18, 40), stoneMaterial);
  body.position.y = 0.76;
  body.scale.set(0.98, 1, 0.68);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.54, 0.1, 40), stoneMaterial);
  top.position.y = 1.88;
  top.scale.z = 0.68;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const topRim = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.026, 8, 40), materials.squidStoneLight);
  topRim.position.y = 1.93;
  topRim.scale.z = 0.68;
  topRim.rotation.x = Math.PI / 2;
  group.add(topRim);

  const chinShadow = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.84, 0.045, 36), materials.squidStoneDark);
  chinShadow.position.y = -0.29;
  chinShadow.scale.set(0.98, 1, 0.68);
  group.add(chinShadow);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.74, 0.34), stoneMaterial);
    ear.position.set(side * 0.68, 0.82, 0.01);
    ear.rotation.z = side * 0.02;
    ear.castShadow = true;
    ear.receiveShadow = true;
    group.add(ear);

    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.68, 0.3), materials.squidStoneDark);
    edge.position.set(side * 0.82, 0.82, 0.03);
    group.add(edge);
  }

  const leftHighlight = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.86, 0.016), materials.squidStoneLight);
  leftHighlight.position.set(-0.24, 0.86, 0.49);
  leftHighlight.rotation.z = -0.06;
  leftHighlight.scale.y = 0.92;
  group.add(leftHighlight);
}

function addSquidwardFace(group, stoneMaterial) {
  const brow = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.16, 0.2), stoneMaterial);
  brow.position.set(0, 1.28, 0.52);
  brow.rotation.x = -0.03;
  brow.castShadow = true;
  brow.receiveShadow = true;
  group.add(brow);

  const browShadow = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.045, 0.028), materials.squidStoneDark);
  browShadow.position.set(0, 1.17, 0.63);
  group.add(browShadow);

  addSquidwardWindow(group, -0.29, 1.08, 0.61, 0.16);
  addSquidwardWindow(group, 0.29, 1.08, 0.61, 0.16);

  const noseShadow = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.9, 0.045), materials.squidStoneDark);
  noseShadow.position.set(0.04, 0.75, 0.58);
  noseShadow.rotation.z = -0.015;
  group.add(noseShadow);

  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 0.92, 4), stoneMaterial);
  nose.position.set(0, 0.82, 0.66);
  nose.rotation.y = Math.PI / 4;
  nose.scale.set(0.78, 1, 0.54);
  nose.castShadow = true;
  nose.receiveShadow = true;
  group.add(nose);

  const noseRidge = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.72, 0.016), materials.squidStoneLight);
  noseRidge.position.set(-0.035, 0.88, 0.82);
  noseRidge.rotation.z = -0.08;
  group.add(noseRidge);
}

function addSquidwardWindow(group, x, y, z, radius) {
  const frame = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.045, 12, 36), materials.squidWindowFrame);
  frame.position.set(x, y, z);
  frame.castShadow = true;
  group.add(frame);

  const glass = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.72, 28), materials.squidGlass);
  glass.position.set(x, y, z + 0.025);
  group.add(glass);

  const shine = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.22, radius * 1.18, 0.012), materials.roofRidgeWhite);
  shine.position.set(x - radius * 0.08, y, z + 0.045);
  shine.rotation.z = -0.48;
  group.add(shine);

  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 5), materials.squidStoneDark);
    rivet.position.set(
      x + Math.cos(angle) * radius * 1.02,
      y + Math.sin(angle) * radius * 1.02,
      z + 0.045,
    );
    group.add(rivet);
  }
}

function addSquidwardDoor(group) {
  const frame = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.42, 6, 18), materials.squidStoneDark);
  frame.position.set(0, -0.06, 0.58);
  frame.scale.set(0.96, 1.12, 0.1);
  frame.castShadow = true;
  group.add(frame);

  const door = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.42, 6, 16), materials.squidDoor);
  door.position.set(0, -0.06, 0.635);
  door.scale.set(0.94, 1.08, 0.075);
  door.castShadow = true;
  group.add(door);

  for (let i = -2; i <= 2; i += 1) {
    const plankLine = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.72, 0.01), materials.squidDoorDark);
    plankLine.position.set(i * 0.064, -0.02, 0.685);
    group.add(plankLine);
  }

  for (let i = 0; i < 4; i += 1) {
    const grain = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.2, 0.01), materials.templeGold);
    grain.position.set(-0.11 + i * 0.073, -0.02 + (i % 2) * 0.1, 0.695);
    grain.rotation.z = 0.1 - i * 0.05;
    group.add(grain);
  }

  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), materials.templeGold);
  knob.position.set(0.13, -0.02, 0.71);
  knob.castShadow = true;
  group.add(knob);

  const step = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.2), materials.cityStone);
  step.position.set(0, -0.36, 0.74);
  step.castShadow = true;
  group.add(step);
}

function createPineappleHouse(x, z, rotation) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.4, z);
  group.rotation.y = rotation;
  group.userData.baseRadius = 1.32;
  group.userData.mass = 1.7;
  group.userData.snapPoints = radialSnapPoints(x, z, 1.34, 8);
  group.userData.erosion = { shape: "wall", width: 2.65, depth: 2.45, localY: -0.38 };

  addPineappleBase(group);
  addPineappleBody(group);
  addPineapplePattern(group);
  addPineappleDoorAndWindows(group);
  addPineappleLeaves(group);
  addPineapplePipe(group);
  compactSandUnder(x, z, 1.26, 0.12);
  return group;
}

function addPineappleBase(group) {
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 1.16, 0.18, 28), materials.templeStone);
  pad.position.y = -0.2;
  pad.scale.set(1.22, 1, 0.86);
  pad.castShadow = true;
  pad.receiveShadow = true;
  group.add(pad);

  for (let i = 0; i < 6; i += 1) {
    const stone = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.16), materials.cityStoneDark);
    stone.position.set(-0.06 + i * 0.11, -0.08 + i * 0.014, 0.98 + i * 0.15);
    stone.rotation.y = (i % 2 ? 0.08 : -0.08);
    stone.castShadow = true;
    group.add(stone);
  }
}

function addPineappleBody(group) {
  const bodyMaterial = new THREE.MeshStandardMaterial({ map: createPineappleTexture(), roughness: 0.76 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.9, 40, 24), bodyMaterial);
  body.position.y = 0.78;
  body.scale.set(0.95, 1.35, 0.88);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 12), materials.pineappleGlow);
  glow.position.set(-0.2, 0.96, 0.66);
  glow.scale.set(0.5, 0.82, 0.08);
  glow.castShadow = true;
  group.add(glow);

  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.1, 28), materials.pineappleShell);
  foot.position.y = -0.05;
  foot.scale.set(1.04, 1, 0.84);
  foot.castShadow = true;
  group.add(foot);
}

function addPineapplePattern(group) {
  for (let row = 0; row < 8; row += 1) {
    const y = 0.1 + row * 0.22;
    for (let col = -3; col <= 3; col += 1) {
      const x = col * 0.24 + (row % 2) * 0.12;
      const position = pineappleSurfacePoint(x, y, 0.018);
      if (!position) continue;
      const pore = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.012, 10), materials.pineapplePore);
      pore.position.copy(position);
      pore.rotation.x = Math.PI / 2;
      pore.castShadow = true;
      group.add(pore);
    }
  }
}

function addPineappleDoorAndWindows(group) {
  const doorFrame = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.34, 6, 16), materials.pineappleMetal);
  doorFrame.position.set(0, 0.28, 0.82);
  doorFrame.scale.set(1.1, 1.12, 0.12);
  doorFrame.castShadow = true;
  group.add(doorFrame);

  const door = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.3, 6, 14), materials.pineappleDoor);
  door.position.set(0, 0.27, 0.88);
  door.scale.set(1, 1.02, 0.08);
  door.castShadow = true;
  group.add(door);

  addDoorRivets(group);

  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 8, 24), materials.pineappleMetalDark);
  wheel.position.set(0, 0.29, 0.94);
  group.add(wheel);
  for (let i = 0; i < 4; i += 1) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.13, 0.012), materials.pineappleMetalDark);
    spoke.position.copy(wheel.position);
    spoke.rotation.z = (i / 4) * Math.PI;
    group.add(spoke);
  }
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 8), materials.pineappleMetalDark);
  knob.position.set(0, 0.29, 0.965);
  group.add(knob);

  addPineapplePorthole(group, -0.48, 0.72, 0.17);
  addPineapplePorthole(group, 0.48, 0.5, 0.145);
}

function addPineappleLeaves(group) {
  const rings = [
    { count: 10, radius: 0.28, y: 1.72, length: 0.66, spread: 0.78, lift: 0.5, material: materials.pineappleLeafDark },
    { count: 8, radius: 0.18, y: 1.86, length: 0.62, spread: 0.48, lift: 0.74, material: materials.pineappleLeaf },
    { count: 6, radius: 0.08, y: 2.02, length: 0.52, spread: 0.22, lift: 0.96, material: materials.pineappleLeafLight },
  ];

  for (const ring of rings) {
    for (let i = 0; i < ring.count; i += 1) {
      const angle = (i / ring.count) * Math.PI * 2 + (ring.count % 2 ? 0.16 : 0);
      const leaf = createPineappleLeaf(ring.length + (i % 2) * 0.035, ring.material);
      leaf.position.set(Math.cos(angle) * ring.radius, ring.y, Math.sin(angle) * ring.radius);
      const direction = new THREE.Vector3(
        Math.cos(angle) * ring.spread,
        ring.lift,
        Math.sin(angle) * ring.spread,
      ).normalize();
      leaf.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      leaf.castShadow = true;
      group.add(leaf);
    }
  }

  const crown = createPineappleLeaf(0.64, materials.pineappleLeafLight);
  crown.position.set(0, 2.08, 0);
  crown.scale.set(1.18, 1.12, 0.9);
  crown.castShadow = true;
  group.add(crown);

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 10), materials.pineappleLeaf);
  core.position.set(0, 1.84, 0);
  core.scale.set(1, 0.72, 1);
  core.castShadow = true;
  group.add(core);
}

function addPineapplePipe(group) {
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.46, 14), materials.pineappleMetal);
  stem.position.set(0.82, 1.12, 0.24);
  stem.rotation.z = Math.PI / 2;
  stem.castShadow = true;
  group.add(stem);

  const bend = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.06, 10, 24, Math.PI * 0.75), materials.pineappleMetal);
  bend.position.set(1.02, 1.24, 0.24);
  bend.rotation.set(Math.PI / 2, 0, -0.08);
  bend.castShadow = true;
  group.add(bend);

  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.32, 14), materials.pineappleMetal);
  top.position.set(1.17, 1.41, 0.24);
  top.castShadow = true;
  group.add(top);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 8, 18), materials.pineappleMetalDark);
  rim.position.set(1.17, 1.58, 0.24);
  rim.rotation.x = Math.PI / 2;
  group.add(rim);
}

function pineappleSurfacePoint(x, y, offset = 0) {
  const centerY = 0.78;
  const rx = 0.83;
  const ry = 1.12;
  const rz = 0.77;
  const normalized = 1 - (x * x) / (rx * rx) - ((y - centerY) * (y - centerY)) / (ry * ry);
  if (normalized <= 0) return null;
  return new THREE.Vector3(x, y, Math.sqrt(normalized) * rz + offset);
}

function pineappleSurfaceNormal(x, y) {
  const centerY = 0.78;
  const rx = 0.83;
  const ry = 1.12;
  const rz = 0.77;
  const z = pineappleSurfacePoint(x, y)?.z || rz;
  return new THREE.Vector3(x / (rx * rx), (y - centerY) / (ry * ry), z / (rz * rz)).normalize();
}

function addDoorRivets(group) {
  const rivets = [];
  for (let i = 0; i < 6; i += 1) {
    rivets.push([-0.22, 0.03 + i * 0.105]);
    rivets.push([0.22, 0.03 + i * 0.105]);
  }
  for (let i = 0; i <= 6; i += 1) {
    const angle = Math.PI - (i / 6) * Math.PI;
    rivets.push([Math.cos(angle) * 0.2, 0.62 + Math.sin(angle) * 0.14]);
  }
  for (const [x, y] of rivets) {
    const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 5), materials.pineappleMetalDark);
    rivet.position.set(x, y, 0.95);
    group.add(rivet);
  }
}

function addPineapplePorthole(group, x, y, radius) {
  const position = pineappleSurfacePoint(x, y, 0.045) || new THREE.Vector3(x, y, 0.76);
  const normal = pineappleSurfaceNormal(x, y);
  const porthole = new THREE.Group();
  porthole.position.copy(position);
  porthole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  group.add(porthole);

  const frame = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.038, 12, 34), materials.pineappleMetal);
  frame.castShadow = true;
  porthole.add(frame);

  const glass = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.72, 28), materials.pineappleGlass);
  glass.position.z = 0.018;
  porthole.add(glass);

  const shine = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.18, radius * 1.16, 0.01), materials.roofRidgeWhite);
  shine.position.set(-radius * 0.12, 0, 0.035);
  shine.rotation.z = -0.55;
  porthole.add(shine);

  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.019, 8, 5), materials.pineappleMetalDark);
    rivet.position.set(
      Math.cos(angle) * radius * 1.02,
      Math.sin(angle) * radius * 1.02,
      0.045,
    );
    porthole.add(rivet);
  }
}

function createPineappleLeaf(length, material) {
  const leaf = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, length, 6, 14), material);
  blade.scale.set(1, 1, 0.2);
  blade.position.y = length * 0.48;
  leaf.add(blade);

  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 8), material);
  tip.scale.set(1, 0.66, 0.2);
  tip.position.y = length * 0.98;
  leaf.add(tip);
  return leaf;
}

function createShell(x, z) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.08, z);
  group.rotation.y = Math.random() * Math.PI * 2;
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 10, 0, Math.PI), materials.shell);
  shell.scale.set(1.25, 0.35, 0.8);
  shell.castShadow = true;
  group.add(shell);
  for (let i = -2; i <= 2; i += 1) {
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.05, 0.42), materials.shell);
    ridge.position.x = i * 0.055;
    ridge.position.y = 0.05;
    ridge.rotation.z = i * 0.08;
    group.add(ridge);
  }
  return group;
}

function createPebble(x, z) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.09, z);
  const pebble = new THREE.Mesh(new THREE.SphereGeometry(0.16 + Math.random() * 0.1, 12, 8), materials.pebble);
  pebble.scale.set(1.15, 0.42, 0.86);
  pebble.castShadow = true;
  group.add(pebble);
  return group;
}

function createDriftwood(x, z, rotation) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.14, z);
  group.rotation.y = rotation + (Math.random() - 0.5) * 0.36;
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.32, 10), materials.wood);
  log.rotation.z = Math.PI / 2;
  log.castShadow = true;
  group.add(log);
  for (let i = 0; i < 2; i += 1) {
    const twig = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.04, 0.52, 7), materials.wood);
    twig.position.x = (i ? 0.2 : -0.28);
    twig.position.y = 0.12;
    twig.rotation.set(0.3, 0.1 + i, 0.75);
    group.add(twig);
  }
  return group;
}

function createSeaweed(x, z) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.03, z);
  const blades = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < blades; i += 1) {
    const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.55 + Math.random() * 0.35, 1, 4), materials.seaweed);
    blade.position.set((Math.random() - 0.5) * 0.2, 0.25, (Math.random() - 0.5) * 0.2);
    blade.rotation.set(0.2 + Math.random() * 0.35, Math.random() * Math.PI, (Math.random() - 0.5) * 0.2);
    blade.userData.sway = Math.random() * Math.PI * 2;
    group.add(blade);
  }
  return group;
}

function createPalmTree(x, z, rotation) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y, z);
  group.rotation.y = rotation + (Math.random() - 0.5) * 0.35;
  const lean = 0.18 + Math.random() * 0.12;

  for (let i = 0; i < 5; i += 1) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.13, 0.44, 8), materials.wood);
    trunk.position.set(i * lean * 0.16, 0.28 + i * 0.48, 0);
    trunk.rotation.z = -lean;
    trunk.castShadow = true;
    group.add(trunk);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.085 + i * 0.003, 0.01, 5, 12),
      new THREE.MeshStandardMaterial({ color: 0x6f4a26, roughness: 0.86 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(trunk.position);
    ring.position.y += 0.1;
    ring.rotation.z = -lean;
    group.add(ring);
  }

  const crown = new THREE.Group();
  crown.position.set(lean * 0.78, 2.24, 0);
  const leafColors = [0x168a45, 0x0d7038, 0x239b56];
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.12;
    const leaf = createPalmFrond(0.9 + Math.random() * 0.28, 0.18 + Math.random() * 0.05, leafColors[i % leafColors.length]);
    leaf.position.set(Math.cos(angle) * 0.18, -0.02, Math.sin(angle) * 0.18);
    leaf.rotation.set(0.52 + Math.random() * 0.18, angle, 0.32 * Math.sin(angle));
    leaf.castShadow = true;
    leaf.userData.sway = Math.random() * Math.PI * 2;
    crown.add(leaf);
  }

  const coconutMaterial = new THREE.MeshStandardMaterial({ color: 0x80623d, roughness: 0.85 });
  for (let i = 0; i < 3; i += 1) {
    const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), coconutMaterial);
    coconut.position.set((Math.random() - 0.5) * 0.25, -0.12, (Math.random() - 0.5) * 0.25);
    coconut.castShadow = true;
    crown.add(coconut);
  }

  group.add(crown);
  compactSandUnder(x, z, 0.55, 0.025);
  return group;
}

function createPalmFrond(length, width, color) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.08);
  shape.quadraticCurveTo(width, -length * 0.24, 0.04, -length);
  shape.quadraticCurveTo(-width, -length * 0.24, 0, 0.08);
  const leaf = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshStandardMaterial({ color, roughness: 0.78, side: THREE.DoubleSide })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.z = -0.08;
  leaf.add(mesh);

  const vein = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, length * 0.86, 0.012),
    new THREE.MeshBasicMaterial({ color: 0x7ccf70, transparent: true, opacity: 0.42 })
  );
  vein.rotation.x = -Math.PI / 2;
  vein.position.set(0, 0.008, -length * 0.5);
  leaf.add(vein);
  return leaf;
}

function createTropicalFlowers(x, z) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.04, z);
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x4f8f55, roughness: 0.86 });
  const flowerColors = [0xe26f7b, 0xf0b35b, 0xd98cd4, 0xf7d36b];

  for (let i = 0; i < 9; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.45;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12 + Math.random() * 0.07, 10, 8), leafMaterial);
    leaf.position.set(Math.cos(angle) * radius, 0.08 + Math.random() * 0.08, Math.sin(angle) * radius);
    leaf.scale.set(1.2, 0.55, 0.9);
    leaf.castShadow = true;
    group.add(leaf);
  }

  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.3;
    const radius = 0.1 + Math.random() * 0.38;
    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.045 + Math.random() * 0.025, 8, 6),
      new THREE.MeshStandardMaterial({ color: flowerColors[i % flowerColors.length], roughness: 0.68 })
    );
    flower.position.set(Math.cos(angle) * radius, 0.22 + Math.random() * 0.12, Math.sin(angle) * radius);
    flower.castShadow = true;
    group.add(flower);
  }

  return group;
}

function createPerson(x, z) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.02, z);
  group.rotation.y = Math.random() * Math.PI * 2;

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.22, 18),
    new THREE.MeshBasicMaterial({ color: 0x5b5a47, transparent: true, opacity: 0.18, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  const legs = [];
  for (let i = -1; i <= 1; i += 2) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.28, 8), materials.personShorts);
    leg.position.set(i * 0.055, 0.18, 0);
    leg.castShadow = true;
    leg.userData.legSide = i;
    legs.push(leg);
    group.add(leg);

    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.035, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xffd9a9, roughness: 0.74 })
    );
    foot.position.set(i * 0.055, 0.035, 0.035);
    foot.castShadow = true;
    leg.add(foot);
  }

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.34, 10), materials.personCloth);
  body.position.y = 0.48;
  body.castShadow = true;
  group.add(body);

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.105, 0.01, 6, 18),
    new THREE.MeshStandardMaterial({ color: 0xffe5b8, roughness: 0.78 })
  );
  collar.position.y = 0.66;
  collar.rotation.x = Math.PI / 2;
  group.add(collar);

  const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.145, 0.1, 10), materials.personShorts);
  shorts.position.y = 0.31;
  shorts.castShadow = true;
  group.add(shorts);

  const arms = [];
  for (let i = -1; i <= 1; i += 2) {
    const armPivot = new THREE.Group();
    armPivot.position.set(i * 0.15, 0.6, 0);
    armPivot.rotation.z = i * 0.34;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.028, 0.26, 8), materials.personSkin);
    arm.position.y = -0.13;
    arm.castShadow = true;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), materials.personSkin);
    hand.position.y = -0.27;
    hand.castShadow = true;
    armPivot.add(arm, hand);
    armPivot.userData.armSide = i;
    arms.push(armPivot);
    group.add(armPivot);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), materials.personSkin);
  head.position.y = 0.74;
  head.castShadow = true;
  group.add(head);

  const faceMaterial = new THREE.MeshBasicMaterial({ color: 0x47322b });
  for (let i = -1; i <= 1; i += 2) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), faceMaterial);
    eye.position.set(i * 0.04, 0.77, 0.105);
    group.add(eye);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), materials.personSkin);
  nose.position.set(0, 0.735, 0.118);
  nose.scale.set(0.8, 0.7, 1.2);
  group.add(nose);

  const hat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.12, 0.05, 16),
    new THREE.MeshStandardMaterial({ color: 0xf2d184, roughness: 0.75 })
  );
  hat.position.y = 0.86;
  hat.castShadow = true;
  group.add(hat);

  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.2, 0.025, 18),
    new THREE.MeshStandardMaterial({ color: 0xf5d988, roughness: 0.78 })
  );
  brim.position.y = 0.835;
  brim.castShadow = true;
  group.add(brim);

  group.userData.legs = legs;
  group.userData.arms = arms;
  return group;
}

function createFlag(x, z) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y + 0.18, z);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.92, 8), materials.wood);
  pole.position.y = 0.42;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.24, 4, 2), materials.flag);
  flag.position.set(0.22, 0.75, 0);
  flag.userData.flag = true;
  group.add(pole, flag);
  return group;
}

function carveMoat(x, z) {
  const position = terrain.mesh.geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const px = position.getX(i);
    const pz = position.getZ(i);
    const distance = Math.hypot(px - x, pz - z);
    const trench = smoothstep(1.45, 0.7, distance) - smoothstep(0.68, 0.26, distance);
    const lip = smoothstep(1.78, 1.36, distance) * smoothstep(0.88, 1.16, distance);
    if (trench > 0) terrain.heights[i] -= trench * 0.38;
    if (lip > 0) terrain.heights[i] += lip * 0.1;
    position.setY(i, terrain.heights[i]);
  }
  terrain.mesh.geometry.computeVertexNormals();
  position.needsUpdate = true;

  const water = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 1.45, 80),
    new THREE.MeshBasicMaterial({ color: 0x2daebd, transparent: true, opacity: 0.42, side: THREE.DoubleSide })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(x, Math.max(sampleHeight(x, z) + 0.04, ocean.water.position.y + 0.03), z);
  roots.decorations.add(water);
}

function carveMoatStroke(from, to) {
  const distance = from.distanceTo(to);
  const steps = Math.max(1, Math.ceil(distance / 0.24));
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const x = THREE.MathUtils.lerp(from.x, to.x, t);
    const z = THREE.MathUtils.lerp(from.z, to.z, t);
    const addWater = moatDrag.waterDistance <= 0;
    carveMoatBrush(x, z, 0.72, addWater);
    if (addWater) moatDrag.waterDistance = 0.68;
    moatDrag.waterDistance -= distance / steps;
  }
  spawnSandPuff(to.x, sampleHeight(to.x, to.z), to.z, 4);
}

function carveMoatBrush(x, z, strength = 1, addWater = false) {
  const position = terrain.mesh.geometry.attributes.position;
  const trenchRadius = 0.46;
  const lipRadius = 0.72;
  for (let i = 0; i < position.count; i += 1) {
    const px = position.getX(i);
    const pz = position.getZ(i);
    const distance = Math.hypot(px - x, pz - z);
    const trench = smoothstep(trenchRadius, 0, distance);
    const lip = smoothstep(lipRadius, trenchRadius * 0.82, distance) * smoothstep(trenchRadius * 0.35, trenchRadius * 0.72, distance);
    if (trench > 0) {
      terrain.heights[i] -= trench * 0.044 * strength;
      terrain.heights[i] = Math.max(terrain.heights[i], terrain.baseHeights[i] - 0.38);
    }
    if (lip > 0) {
      terrain.heights[i] += lip * 0.012 * strength;
    }
    if (trench > 0 || lip > 0) position.setY(i, terrain.heights[i]);
  }
  terrain.mesh.geometry.computeVertexNormals();
  position.needsUpdate = true;

  if (addWater) {
    addMoatWaterPatch(x, z);
  }
}

function addMoatWaterPatch(x, z) {
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(0.31, 18),
    new THREE.MeshBasicMaterial({ color: 0x35aeb9, transparent: true, opacity: 0.34, side: THREE.DoubleSide })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(x, Math.max(sampleHeight(x, z) + 0.025, ocean.water.position.y + 0.02), z);
  water.scale.set(1.35, 0.85, 1);
  roots.decorations.add(water);
}

function compactSandUnder(x, z, radius, amount) {
  const position = terrain.mesh.geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const px = position.getX(i);
    const pz = position.getZ(i);
    const distance = Math.hypot(px - x, pz - z);
    const falloff = smoothstep(radius, 0, distance);
    if (falloff <= 0) continue;
    terrain.heights[i] += amount * falloff;
    position.setY(i, terrain.heights[i]);
  }
  terrain.mesh.geometry.computeVertexNormals();
  position.needsUpdate = true;
}

function buildPresetCastle() {
  pushUndoSnapshot("自动建城");
  clearBuilds(false);
  const previousRotation = state.rotation;
  const towers = [
    [-4, -3.2],
    [4, -3.2],
    [-4, 3.2],
    [4, 3.2],
  ];
  for (const [x, z] of towers) addBuild(createTower(x, z));
  const walls = [
    [0, -3.2, 0],
    [0, 3.2, 0],
    [-4, 0, Math.PI / 2],
    [4, 0, Math.PI / 2],
  ];
  for (const [x, z, rotation] of walls) addBuild(createWall(x, z, rotation));
  state.rotation = 0;
  addBuild(createGate(0, -3.2, 0));
  carveMoat(0, 0);
  for (let i = 0; i < 18; i += 1) {
    const angle = (i / 18) * Math.PI * 2;
    addDecoration(createShell(Math.cos(angle) * 5.9, Math.sin(angle) * 4.8));
  }
  state.rotation = previousRotation;
  state.buildCount += 12;
  showToast("已经围好一座安静的大沙堡，可以继续加装饰。");
}

function clearBuilds(show = true, recordHistory = false) {
  if (recordHistory && hasSceneChanges()) pushUndoSnapshot("清空沙面");
  for (const root of [roots.builds, roots.decorations, roots.particles]) {
    while (root.children.length) root.remove(root.children[0]);
  }
  buildObjects.length = 0;
  dynamicDecorations.length = 0;
  sandPuffs.length = 0;
  resetTerrain();
  state.globalStability = 1;
  state.buildCount = 0;
  updateUndoButton();
  if (show) showToast("沙面恢复平整，重新开始。");
}

function resetTerrain() {
  const position = terrain.mesh.geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    terrain.heights[i] = terrain.baseHeights[i];
    position.setY(i, terrain.heights[i]);
  }
  terrain.mesh.geometry.computeVertexNormals();
  position.needsUpdate = true;
}

function spawnSandPuff(x, y, z, count) {
  const material = new THREE.MeshBasicMaterial({ color: 0xf3d69e, transparent: true, opacity: 0.82 });
  for (let i = 0; i < count; i += 1) {
    const particle = new THREE.Mesh(new THREE.SphereGeometry(0.035 + Math.random() * 0.025, 6, 4), material.clone());
    particle.position.set(x + (Math.random() - 0.5) * 0.38, y + 0.15, z + (Math.random() - 0.5) * 0.38);
    particle.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.035, 0.035 + Math.random() * 0.045, (Math.random() - 0.5) * 0.035);
    particle.userData.life = 0.8 + Math.random() * 0.45;
    roots.particles.add(particle);
    sandPuffs.push(particle);
  }
}

function spawnWetSandDrop(x, y, z) {
  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(0.045 + Math.random() * 0.025, 6, 4),
    new THREE.MeshBasicMaterial({ color: 0x9d7d52, transparent: true, opacity: 0.72 })
  );
  particle.position.set(x + (Math.random() - 0.5) * 0.18, y, z + (Math.random() - 0.5) * 0.18);
  particle.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.012, 0.012 + Math.random() * 0.012, (Math.random() - 0.5) * 0.012);
  particle.userData.life = 0.7 + Math.random() * 0.35;
  particle.userData.heavy = true;
  roots.particles.add(particle);
  sandPuffs.push(particle);
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.04);
  const elapsed = clock.elapsedTime;

  updateWeatherCycle(dt, elapsed);
  state.tideRise = THREE.MathUtils.clamp(state.tideRise + state.tideSpeed * dt, 0, 1);
  const wavePulse = Math.sin(elapsed * 0.72) * 0.07 + Math.sin(elapsed * 1.7) * 0.025;
  const waterLevel = -0.38 + state.tideRise * 0.95 + wavePulse;
  ocean.water.position.y = waterLevel;
  animateWater(elapsed, waterLevel);
  updateMarineLife(dt, elapsed, waterLevel);
  updateBuildPhysics(dt, elapsed, waterLevel);
  updateDecorations(dt, elapsed, waterLevel);
  updateSandPuffs(dt);
  updateTerrainWetness(elapsed, waterLevel);
  updatePreviewPulse(elapsed);
  updateUi();

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function animateWater(elapsed, waterLevel) {
  const pos = ocean.water.geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getY(i);
    const y = Math.sin(x * 0.34 + elapsed * 1.2) * 0.045 + Math.cos(z * 0.28 + elapsed * 1.6) * 0.035;
    pos.setZ(i, y);
  }
  pos.needsUpdate = true;
  ocean.water.geometry.computeVertexNormals();
  ocean.water.material.color.lerp(new THREE.Color(state.weather === "rainy" ? 0x4b9fab : 0x73d1d6), 0.025);
  ocean.water.material.emissive = ocean.water.material.emissive ?? new THREE.Color(0x000000);
  ocean.water.material.emissive.lerp(new THREE.Color(0x103d58), 0.018);
  ocean.water.material.emissiveIntensity = 0.08 + state.tideRise * 0.06;
  ocean.water.material.roughness = THREE.MathUtils.lerp(ocean.water.material.roughness, state.weather === "rainy" ? 0.38 : 0.2, 0.025);
  ocean.water.position.x = camera.position.x;
  ocean.water.position.z = camera.position.z;

  const foamPositions = ocean.foamFlecks.geometry.attributes.position;
  const foamBase = ocean.foamFlecks.userData.basePositions;
  for (let i = 0; i < foamPositions.count; i += 1) {
    const phase = elapsed * 0.72 + i * 0.37;
    foamPositions.setX(i, foamBase[i * 3] + Math.sin(phase) * 0.04);
    foamPositions.setZ(i, foamBase[i * 3 + 2] + Math.cos(phase * 0.8) * 0.04);
  }
  foamPositions.needsUpdate = true;
  ocean.foamFlecks.position.y = waterLevel + 0.026;
  ocean.foamFlecks.material.opacity = 0.14 + state.tideRise * 0.16 + Math.sin(elapsed * 1.2) * 0.025;
}

function updateWeatherCycle(dt, elapsed) {
  if (!state.timePaused) {
    state.dayTime = (state.dayTime + dt * 0.0055) % 1;
    state.weatherTimer -= dt;
    if (state.weatherTimer <= 0) {
      state.weather = pickWeather();
      state.weatherTimer = 36 + Math.random() * 42;
      showToast(`天气变化：${weatherLabel(state.weather)}。`);
    }
  }

  const daylight = smoothstep(0.2, 0.34, state.dayTime) * (1 - smoothstep(0.72, 0.86, state.dayTime));
  const sunrise = Math.max(0, 1 - Math.abs(state.dayTime - 0.28) / 0.1);
  const sunset = Math.max(0, 1 - Math.abs(state.dayTime - 0.75) / 0.12);
  const night = 1 - daylight;
  const weatherDim = state.weather === "rainy" ? 0.55 : state.weather === "cloudy" ? 0.72 : 1;

  const sunAngle = state.dayTime * Math.PI * 2 - Math.PI / 2;
  sun.position.set(Math.cos(sunAngle) * 26, Math.max(-5, Math.sin(sunAngle) * 30), 12);
  sun.intensity = (0.25 + daylight * 3.3) * weatherDim;
  sun.color.copy(new THREE.Color(0xffe0aa).lerp(new THREE.Color(0xff8e65), Math.max(sunrise, sunset) * 0.65));
  moonLight.intensity = night * (state.weather === "rainy" ? 0.28 : 0.62);

  hemiLight.intensity = (0.42 + daylight * 1.45) * (state.weather === "rainy" ? 0.68 : 1);
  hemiLight.color.copy(new THREE.Color(0xcff3f4).lerp(new THREE.Color(0x36416f), night * 0.8));
  hemiLight.groundColor.copy(new THREE.Color(0xf0cf91).lerp(new THREE.Color(0x8d83a2), night * 0.55));

  const sky = new THREE.Color(0xa6d9d2)
    .lerp(new THREE.Color(0xffa9c8), Math.max(sunrise, sunset) * 0.46)
    .lerp(new THREE.Color(0x17224a), night * 0.78)
    .lerp(new THREE.Color(0x7f9da5), state.weather === "rainy" ? 0.36 : state.weather === "cloudy" ? 0.18 : 0);
  scene.fog.color.copy(sky);
  scene.fog.near = 30 - night * 6 + (state.weather === "rainy" ? -6 : 0);
  scene.fog.far = 94 - night * 18 - (state.weather === "rainy" ? 18 : state.weather === "cloudy" ? 10 : 0);

  updateWeatherVisuals(dt, elapsed, daylight, night, sunrise, sunset);
}

function updateWeatherVisuals(dt, elapsed, daylight, night, sunrise, sunset) {
  const horizonGlow = Math.max(sunrise, sunset);
  const rainy = state.weather === "rainy";
  const skyTop = new THREE.Color(0x89dcf0)
    .lerp(new THREE.Color(0xb699ff), horizonGlow * 0.34)
    .lerp(new THREE.Color(0x1b2456), night * 0.82)
    .lerp(new THREE.Color(0x7d99a7), rainy ? 0.32 : state.weather === "cloudy" ? 0.14 : 0);
  const skyHorizon = new THREE.Color(0xffd5a7)
    .lerp(new THREE.Color(0xff9bd7), horizonGlow * 0.58)
    .lerp(new THREE.Color(0x3a467d), night * 0.72)
    .lerp(new THREE.Color(0x8195a2), rainy ? 0.28 : 0);
  updateSkyGradient(skyTop, skyHorizon);

  const cloudiness = state.weather === "sunny" ? 0.28 : state.weather === "cloudy" ? 1 : 0.86;
  const cloudTint = new THREE.Color(state.weather === "rainy" ? 0xc7d2dc : horizonGlow > 0.2 ? 0xffd3ef : 0xf5ecff);
  weatherVisuals.clouds.children.forEach((cloud, index) => {
    cloud.position.x += cloud.userData.speed * dt * (state.weather === "rainy" ? 1.25 : 1);
    if (cloud.position.x > 44) cloud.position.x = -44;
    cloud.position.y += Math.sin(elapsed * 0.25 + cloud.userData.float) * 0.0024;
    const showExtraCloud = cloud.userData.cloudyOnly ? cloudiness : 1;
    const targetOpacity = cloud.userData.baseOpacity * showExtraCloud * (0.62 + daylight * 0.38);
    cloud.children.forEach((puff) => {
      const twinkle = 0.86 + Math.sin(elapsed * 0.42 + index * 0.7 + puff.position.x) * 0.08;
      puff.material.opacity = THREE.MathUtils.lerp(puff.material.opacity, targetOpacity * twinkle, dt * 1.8);
      const baseTint = puff.userData.tint ?? new THREE.Color(0xffffff);
      puff.material.color.copy(baseTint).lerp(cloudTint, state.weather === "sunny" ? 0.12 : 0.34);
    });
  });

  const rainPositions = weatherVisuals.rain.geometry.attributes.position;
  const raining = rainy;
  weatherVisuals.rain.material.opacity = THREE.MathUtils.lerp(weatherVisuals.rain.material.opacity, raining ? 0.58 : 0, dt * 3);
  if (raining) {
    for (let i = 0; i < rainPositions.count; i += 1) {
      const y = rainPositions.getY(i) - dt * 16;
      rainPositions.setY(i, y < 0.6 ? 18 + Math.random() * 10 : y);
      rainPositions.setX(i, rainPositions.getX(i) + dt * 1.1);
      if (rainPositions.getX(i) > 26) rainPositions.setX(i, -26);
    }
    rainPositions.needsUpdate = true;
  }

  weatherVisuals.stars.material.opacity = THREE.MathUtils.clamp(night * 0.76 - (rainy ? 0.32 : 0), 0, 0.78);
  weatherVisuals.stars.material.size = 0.075 + Math.sin(elapsed * 1.4) * 0.012;

  const moonOpacity = THREE.MathUtils.clamp(night * 0.9 - (rainy ? 0.22 : 0), 0, 0.86);
  weatherVisuals.moonCore.material.opacity = THREE.MathUtils.lerp(weatherVisuals.moonCore.material.opacity, moonOpacity, dt * 2.6);
  weatherVisuals.moonHalo.material.opacity = THREE.MathUtils.lerp(weatherVisuals.moonHalo.material.opacity, moonOpacity * 0.48, dt * 2.2);
  const moonPulse = 1 + Math.sin(elapsed * 0.8) * 0.035;
  weatherVisuals.moon.scale.set(moonPulse, moonPulse, moonPulse);

  const sparklePositions = weatherVisuals.sparkles.geometry.attributes.position;
  const sparkleBase = weatherVisuals.sparkles.userData.basePositions;
  for (let i = 0; i < sparklePositions.count; i += 1) {
    const phase = elapsed * 0.72 + i * 1.37;
    sparklePositions.setX(i, sparkleBase[i * 3] + Math.sin(phase * 0.7) * 0.08);
    sparklePositions.setY(i, sparkleBase[i * 3 + 1] + Math.sin(phase) * 0.18);
    sparklePositions.setZ(i, sparkleBase[i * 3 + 2] + Math.cos(phase * 0.63) * 0.08);
  }
  sparklePositions.needsUpdate = true;
  const sparkleOpacity = 0.14 + night * 0.38 + horizonGlow * 0.2 - (rainy ? 0.12 : 0);
  weatherVisuals.sparkles.material.opacity = THREE.MathUtils.clamp(sparkleOpacity, 0.08, 0.56);
}

function pickWeather() {
  const roll = Math.random();
  if (roll < 0.45) return "sunny";
  if (roll < 0.78) return "cloudy";
  return "rainy";
}

function weatherLabel(weather) {
  if (weather === "sunny") return "晴天";
  if (weather === "cloudy") return "多云";
  return "下雨";
}

function dayPhaseLabel() {
  if (state.dayTime < 0.22 || state.dayTime >= 0.86) return "夜晚";
  if (state.dayTime < 0.38) return "早晨";
  if (state.dayTime < 0.68) return "中午";
  return "黄昏";
}

function updateMarineLife(dt, elapsed, waterLevel) {
  for (const item of marineLife) {
    const oldX = item.group.position.x;
    const oldZ = item.group.position.z;
    item.phase += dt * item.speed * (state.weather === "rainy" ? 1.12 : 1);

    const wander = Math.sin(item.phase * 1.7 + item.seed) * 0.28;
    const x = item.center.x + Math.cos(item.phase) * item.radiusX + wander;
    const z = item.center.y + Math.sin(item.phase * 1.16 + item.seed) * item.radiusZ;
    const terrainY = sampleHeight(x, z);
    const submerged = waterLevel > terrainY + 0.03;

    if (item.kind === "crab") {
      item.group.visible = waterLevel > terrainY - 0.08;
      item.group.position.set(x, terrainY + 0.055, z);
    } else {
      item.group.visible = submerged;
      const swimY = Math.max(terrainY + 0.16, waterLevel - item.depth + Math.sin(elapsed * 1.4 + item.seed) * 0.035);
      item.group.position.set(x, swimY, z);
    }

    const dx = x - oldX;
    const dz = z - oldZ;
    if (Math.hypot(dx, dz) > 0.0001) {
      item.group.rotation.y = THREE.MathUtils.lerp(item.group.rotation.y, -Math.atan2(dz, dx), dt * 5);
    }

    const wiggle = Math.sin(elapsed * (item.kind === "crab" ? 8 : 7.4) + item.seed);
    item.group.traverse((child) => {
      if (child.userData.tail) child.rotation.y = wiggle * 0.42;
      if (child.userData.shrimpSegment) child.rotation.z = Math.sin(elapsed * 5 + child.position.x * 8 + item.seed) * 0.08;
      if (child.userData.feeler) child.rotation.y = wiggle * 0.16;
      if (child.userData.claw) child.rotation.y = child.userData.claw * (0.25 + wiggle * 0.18);
      if (child.userData.leg) child.rotation.y = Math.sin(elapsed * 9 + child.userData.leg) * 0.2;
    });
  }
}

function updateBuildPhysics(dt, elapsed, waterLevel) {
  let totalStability = buildObjects.length ? 0 : 1;
  for (const item of buildObjects) {
    const group = item.group;
    const baseWater = waterLevel - (item.baseY - 0.1);
    const nearWater = smoothstep(-0.35, 0.8, baseWater);
    item.wetness = THREE.MathUtils.lerp(item.wetness, nearWater, dt * 1.2);

    const wetBenefit = item.wetness < 0.45 ? item.wetness * 0.08 : 0;
    const erosion = Math.max(0, item.wetness - 0.58) * (0.16 + state.tideRise * 0.15) * dt;
    item.stability = THREE.MathUtils.clamp(item.stability + wetBenefit * dt - erosion, 0.12, 1);
    item.collapse = THREE.MathUtils.lerp(item.collapse, 1 - item.stability, dt * 0.8);

    const wobble = Math.sin(elapsed * 1.7 + item.seed) * item.collapse * 0.06;
    const waterLean = Math.max(0, item.wetness - 0.5) * 0.06;
    group.rotation.x = wobble + Math.sin(item.seed) * waterLean;
    group.rotation.z = -wobble * 0.7 + Math.cos(item.seed) * waterLean;
    group.position.y = item.baseY - item.collapse * 0.24 - Math.max(0, item.wetness - 0.62) * 0.08;
    group.scale.y = 1 - item.collapse * 0.12 - Math.max(0, item.wetness - 0.72) * 0.04;
    group.traverse((child) => {
      if (child.isMesh && child.userData.castlePart) {
        child.material = item.wetness > 0.55 ? materials.castleWet : materials.castle;
      }
    });
    updateErosionVisual(item, elapsed);
    maybeShedWetSand(item, dt);
    totalStability += item.stability;
  }
  state.globalStability = buildObjects.length ? totalStability / buildObjects.length : 1;
  state.mood = THREE.MathUtils.clamp(0.78 + state.globalStability * 0.14 - state.tideRise * 0.07, 0.35, 1);
}

function updateErosionVisual(item, elapsed) {
  if (!item.erosionVisual) return;
  const wet = THREE.MathUtils.clamp(item.wetness, 0, 1);
  const pulse = 0.04 * Math.sin(elapsed * 2.8 + item.seed);
  item.erosionVisual.stain.material.opacity = THREE.MathUtils.clamp(wet * 0.42 + pulse, 0, 0.48);
  item.erosionVisual.silt.material.opacity = THREE.MathUtils.clamp(Math.max(0, wet - 0.35) * 0.32, 0, 0.28);
  const spread = 1 + Math.max(0, wet - 0.55) * 0.14;
  item.erosionVisual.stain.scale.set(spread, spread, 1);
  item.erosionVisual.silt.scale.set(spread * 1.04, spread * 1.04, 1);
}

function maybeShedWetSand(item, dt) {
  if (item.wetness < 0.68) return;
  item.dripCooldown -= dt;
  if (item.dripCooldown > 0) return;
  item.dripCooldown = 0.45 + Math.random() * 0.9;
  const angle = Math.random() * Math.PI * 2;
  const radius = item.group.userData.baseRadius ?? 0.8;
  const x = item.group.position.x + Math.cos(angle) * radius * 0.65;
  const z = item.group.position.z + Math.sin(angle) * radius * 0.65;
  spawnWetSandDrop(x, sampleHeight(x, z) + 0.18, z);
}

function updateDecorations(dt, elapsed, waterLevel) {
  for (const item of dynamicDecorations) {
    if (item.kind === "person") {
      updatePerson(item, dt, elapsed, waterLevel);
      continue;
    }
    const group = item.group;
    const terrainY = sampleHeight(group.position.x, group.position.z);
    const submerged = waterLevel > terrainY + 0.04;
    if (submerged && group.children.some((child) => child.material === materials.wood)) {
      group.position.x += item.velocity.x;
      group.position.z += item.velocity.z;
      group.position.y = THREE.MathUtils.lerp(group.position.y, waterLevel + 0.035, dt * 2);
      group.rotation.z = Math.sin(elapsed + item.bob) * 0.08;
    } else {
      group.position.y = THREE.MathUtils.lerp(group.position.y, terrainY + 0.08, dt * 5);
    }
    group.traverse((child) => {
      if (child.userData.sway) child.rotation.z = Math.sin(elapsed * 1.6 + child.userData.sway) * 0.18;
      if (child.userData.flag) child.rotation.y = Math.sin(elapsed * 3.4) * 0.22;
    });
  }
}

function updatePerson(item, dt, elapsed, waterLevel) {
  const group = item.group;
  const terrainY = sampleHeight(group.position.x, group.position.z);
  const waterThreat = waterLevel - terrainY;
  item.panic = THREE.MathUtils.lerp(item.panic, waterThreat > -0.05 ? 1 : 0, dt * 3);

  if (item.panic > 0.25) {
    item.target.copy(findSaferPersonTarget(group.position));
  } else {
    item.retargetAt -= dt;
    if (item.retargetAt <= 0 || horizontalDistance(group.position, item.target) < 0.35) {
      item.target.copy(pickPersonTarget(group.position));
      item.retargetAt = 2.2 + Math.random() * 3.4;
    }
  }

  const desired = new THREE.Vector3(item.target.x - group.position.x, 0, item.target.z - group.position.z);
  const distance = desired.length();
  if (distance > 0.02) desired.normalize();
  const speed = item.panic > 0.25 ? 2.5 : 0.58;
  item.velocity.lerp(desired.multiplyScalar(speed), dt * (item.panic > 0.25 ? 5 : 1.5));

  const nextX = group.position.x + item.velocity.x * dt;
  const nextZ = group.position.z + item.velocity.z * dt;
  if (isPersonWalkable(nextX, nextZ, waterLevel)) {
    group.position.x = nextX;
    group.position.z = nextZ;
  } else {
    item.target.copy(findSaferPersonTarget(group.position));
    item.velocity.multiplyScalar(0.25);
  }

  group.position.y = THREE.MathUtils.lerp(group.position.y, sampleHeight(group.position.x, group.position.z) + 0.02, dt * 8);
  if (item.velocity.lengthSq() > 0.002) {
    group.rotation.y = Math.atan2(item.velocity.x, item.velocity.z);
  }

  const step = Math.sin(elapsed * (item.panic > 0.25 ? 12 : 6) + item.bob);
  group.position.y += Math.abs(step) * (item.panic > 0.25 ? 0.035 : 0.018);
  for (const leg of group.userData.legs ?? []) {
    leg.rotation.x = step * 0.55 * leg.userData.legSide;
  }
  for (const arm of group.userData.arms ?? []) {
    arm.rotation.x = -step * 0.48 * arm.userData.armSide;
    arm.rotation.z = arm.userData.armSide * (0.34 + item.panic * 0.12);
  }
}

function pickPersonTarget(origin) {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 1.3 + Math.random() * 3.4;
    const x = origin.x + Math.cos(angle) * distance;
    const z = origin.z + Math.sin(angle) * distance;
    if (isPersonWalkable(x, z, ocean.water.position.y)) return new THREE.Vector3(x, sampleHeight(x, z), z);
  }
  return findSaferPersonTarget(origin);
}

function findSaferPersonTarget(origin) {
  const inward = new THREE.Vector3(-origin.x, 0, -origin.z);
  if (inward.lengthSq() < 0.1) inward.set(Math.random() - 0.5, 0, Math.random() - 0.5);
  inward.normalize();
  let best = new THREE.Vector3(origin.x, sampleHeight(origin.x, origin.z), origin.z);
  let bestScore = -Infinity;
  for (let i = 0; i < 8; i += 1) {
    const side = (i - 3.5) * 0.18;
    const direction = inward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), side);
    const distance = 1.8 + i * 0.2;
    const x = origin.x + direction.x * distance;
    const z = origin.z + direction.z * distance;
    const h = sampleHeight(x, z);
    const radial = Math.sqrt((x / 19) ** 2 + (z / 14.5) ** 2);
    const score = h - radial * 0.15;
    if (radial < 1.02 && score > bestScore) {
      bestScore = score;
      best.set(x, h, z);
    }
  }
  return best;
}

function isPersonWalkable(x, z, waterLevel) {
  const radial = Math.sqrt((x / 19) ** 2 + (z / 14.5) ** 2);
  return radial < 1.08 && sampleHeight(x, z) > waterLevel - 0.05;
}

function updateSandPuffs(dt) {
  for (let i = sandPuffs.length - 1; i >= 0; i -= 1) {
    const particle = sandPuffs[i];
    particle.userData.life -= dt;
    particle.userData.velocity.y -= dt * (particle.userData.heavy ? 0.24 : 0.12);
    particle.position.addScaledVector(particle.userData.velocity, 1);
    particle.material.opacity = Math.max(0, particle.userData.life);
    if (particle.userData.life <= 0) {
      roots.particles.remove(particle);
      sandPuffs.splice(i, 1);
    }
  }
}

function updateTerrainWetness(elapsed, waterLevel) {
  const wet = smoothstep(-0.2, 0.74, waterLevel);
  const color = new THREE.Color().lerpColors(new THREE.Color(0xe8c78e), new THREE.Color(0xc7ad78), wet * 0.62);
  terrain.mesh.material.color.lerp(color, 0.04);
  terrain.mesh.material.roughness = 0.92 - wet * 0.18;

  if (Math.floor(elapsed * 6) % 18 === 0 && state.tideRise > 0.34) {
    erodeShore(waterLevel);
  }
}

function updatePreviewPulse(elapsed) {
  if (!snapMarker.visible) return;
  const scale = 1 + Math.sin(elapsed * 5) * 0.12;
  snapMarker.scale.set(scale, scale, scale);
}

function erodeShore(waterLevel) {
  const position = terrain.mesh.geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const y = terrain.heights[i];
    if (Math.abs(y - waterLevel) > 0.08) continue;
    const x = position.getX(i);
    const z = position.getZ(i);
    const radial = Math.sqrt((x / 18) ** 2 + (z / 13.5) ** 2);
    if (radial < 0.55 || radial > 1.22) continue;
    terrain.heights[i] = THREE.MathUtils.lerp(terrain.heights[i], terrain.baseHeights[i] - 0.05, 0.004);
    position.setY(i, terrain.heights[i]);
  }
  position.needsUpdate = true;
  terrain.mesh.geometry.computeVertexNormals();
}

function updateUi() {
  setMeter("tide", state.tideRise);
  setMeter("stability", state.globalStability);
  setMeter("mood", state.mood);
  const phaseWeather = `${dayPhaseLabel()} · ${weatherLabel(state.weather)}`;
  ui.skyStatus.textContent = phaseWeather;
  ui.gameTime.textContent = formatGameTime();
  ui.timePhase.textContent = phaseWeather;
  updateTideButtons();
  updateTimeButton();
}

function formatGameTime() {
  const totalMinutes = Math.floor(state.dayTime * 24 * 60);
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function setMeter(id, value) {
  const percent = Math.round(THREE.MathUtils.clamp(value, 0, 1) * 100);
  ui.meters[id].style.width = `${percent}%`;
  ui.hud.querySelector(`[data-meter="${id}-value"]`).textContent = `${percent}%`;
}

function setTideSpeed(speed, message) {
  state.tideSpeed = speed;
  if (speed !== 0) state.lastTideSpeed = speed;
  updateTideButtons();
  showToast(message);
}

function updateTideButtons() {
  ui.pauseTideButton.textContent = state.tideSpeed === 0 ? "继续潮汐" : "暂停潮汐";
  ui.floodTideButton.classList.toggle("active", state.tideSpeed > 0);
  ui.ebbTideButton.classList.toggle("active", state.tideSpeed < 0);
}

function updateTimeButton() {
  ui.pauseTimeButton.textContent = state.timePaused ? "继续时间" : "暂停时间";
  ui.pauseTimeButton.classList.toggle("active", state.timePaused);
}

function snapToGrid(point) {
  const cell = 0.55;
  return new THREE.Vector3(Math.round(point.x / cell) * cell, point.y, Math.round(point.z / cell) * cell);
}

function sampleHeight(x, z) {
  const halfW = terrain.width / 2;
  const halfD = terrain.depth / 2;
  const u = THREE.MathUtils.clamp((x + halfW) / terrain.width, 0, 1);
  const v = THREE.MathUtils.clamp((z + halfD) / terrain.depth, 0, 1);
  const ix = Math.round(u * terrain.segmentsX);
  const iz = Math.round(v * terrain.segmentsZ);
  const index = iz * (terrain.segmentsX + 1) + ix;
  return terrain.heights[index] ?? 0;
}

function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => ui.toast.classList.remove("show"), 1900);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
