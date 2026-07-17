import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
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
  { id: "su7", label: "汽车", icon: "🚗", hint: "放置一辆青蓝色现代轿车，带全景玻璃、精致内饰、运动轮毂和完整灯组。" },
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
app.append(ui.shell, ui.bubbleMenu, ui.bubbleItems, ui.hud, ui.tools, ui.saves, ui.soundButton, ui.tideAlert, ui.toast);

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

const carModelLoader = new GLTFLoader();
const pendingCarGroups = new Set();
let carModelTemplate = null;
loadHighFidelityCarModel();

const materials = {
  sand: new THREE.MeshStandardMaterial({ color: 0xe8c78e, roughness: 0.92, metalness: 0.02 }),
  wetSand: new THREE.MeshStandardMaterial({ color: 0xb89967, roughness: 0.88 }),
  castle: new THREE.MeshStandardMaterial({ color: 0xe9c88f, roughness: 0.96 }),
  castleWet: new THREE.MeshStandardMaterial({ color: 0xbd9e70, roughness: 0.98 }),
  castleTrim: new THREE.MeshStandardMaterial({ color: 0xf5dda4, roughness: 0.94 }),
  castleShadow: new THREE.MeshBasicMaterial({ color: 0x947448, transparent: true, opacity: 0.36 }),
  templeWall: new THREE.MeshStandardMaterial({ color: 0xa94a2b, roughness: 0.74 }),
  templeRoof: new THREE.MeshStandardMaterial({ color: 0x123f68, roughness: 0.64, metalness: 0.02 }),
  templeBlueTrim: new THREE.MeshStandardMaterial({ color: 0x26798e, roughness: 0.66 }),
  templeGold: new THREE.MeshStandardMaterial({ color: 0xd9a23a, roughness: 0.48, metalness: 0.08 }),
  templeStone: new THREE.MeshStandardMaterial({ color: 0xdedbd0, roughness: 0.86 }),
  pavilionWood: new THREE.MeshStandardMaterial({ color: 0x8f542e, roughness: 0.74 }),
  pavilionRoof: new THREE.MeshStandardMaterial({ color: 0x2f8067, roughness: 0.58 }),
  pavilionRoofDark: new THREE.MeshStandardMaterial({ color: 0x195446, roughness: 0.66 }),
  roofRidgeWhite: new THREE.MeshStandardMaterial({ color: 0xe8ece6, roughness: 0.52 }),
  darkWood: new THREE.MeshStandardMaterial({ color: 0x3a2118, roughness: 0.72 }),
  lantern: new THREE.MeshStandardMaterial({ color: 0xd94832, emissive: 0x7d180b, emissiveIntensity: 0, roughness: 0.56, metalness: 0.02 }),
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
  squidStone: new THREE.MeshStandardMaterial({ color: 0x416c7d, roughness: 0.98 }),
  squidStoneDark: new THREE.MeshStandardMaterial({ color: 0x284c5d, roughness: 0.98 }),
  squidStoneLight: new THREE.MeshStandardMaterial({ color: 0x7193a0, roughness: 0.94 }),
  squidWindowFrame: new THREE.MeshStandardMaterial({ color: 0x5264a8, roughness: 0.62, metalness: 0.12 }),
  squidGlass: new THREE.MeshStandardMaterial({ color: 0x9ac6cb, roughness: 0.3, metalness: 0.04, transparent: true, opacity: 0.82 }),
  squidDoor: new THREE.MeshStandardMaterial({ color: 0x9b5a27, roughness: 0.86 }),
  squidDoorDark: new THREE.MeshStandardMaterial({ color: 0x4b2a18, roughness: 0.92 }),
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
  nightGlowWarm: createGlowSpriteMaterial("rgba(255, 190, 92, 1)"),
  nightGlowCool: createGlowSpriteMaterial("rgba(186, 238, 255, 1)"),
};

const frameColors = {
  waterSunny: new THREE.Color(0x73d1d6),
  waterRainy: new THREE.Color(0x4b9fab),
  waterEmissive: new THREE.Color(0x103d58),
  sunDay: new THREE.Color(0xffe0aa),
  sunWarm: new THREE.Color(0xff8e65),
  hemiDay: new THREE.Color(0xcff3f4),
  hemiNight: new THREE.Color(0x36416f),
  groundDay: new THREE.Color(0xf0cf91),
  groundNight: new THREE.Color(0x8d83a2),
  skyDay: new THREE.Color(0xa6d9d2),
  skySunset: new THREE.Color(0xffa9c8),
  skyNight: new THREE.Color(0x17224a),
  skyRain: new THREE.Color(0x7f9da5),
  skyTopDay: new THREE.Color(0x89dcf0),
  skyTopSunset: new THREE.Color(0xb699ff),
  skyTopNight: new THREE.Color(0x1b2456),
  skyTopRain: new THREE.Color(0x7d99a7),
  horizonDay: new THREE.Color(0xffd5a7),
  horizonSunset: new THREE.Color(0xff9bd7),
  horizonNight: new THREE.Color(0x3a467d),
  horizonRain: new THREE.Color(0x8195a2),
  cloudSunny: new THREE.Color(0xf5ecff),
  cloudSunset: new THREE.Color(0xffd3ef),
  cloudRainy: new THREE.Color(0xc7d2dc),
  drySand: new THREE.Color(0xe8c78e),
  dampSand: new THREE.Color(0xc7ad78),
  sky: new THREE.Color(),
  skyTop: new THREE.Color(),
  skyHorizon: new THREE.Color(),
  skyMid: new THREE.Color(),
  cloudTint: new THREE.Color(),
  terrain: new THREE.Color(),
};

const particleGeometry = new THREE.SphereGeometry(1, 6, 4);
const particlePool = [];

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
const editOutline = new THREE.Box3Helper(new THREE.Box3(), 0xffd98a);
editOutline.visible = false;
editOutline.material.depthTest = false;
editOutline.material.transparent = true;
editOutline.material.opacity = 0.95;
editOutline.renderOrder = 1000;
const alignmentGuides = createAlignmentGuides();
scene.add(wallPreview, snapMarker, editOutline, alignmentGuides);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const mouse = new THREE.Vector2();
let hoveredPoint = new THREE.Vector3();
let hasHover = false;
let pendingPointerMove = null;
let pointerMoveFrame = 0;
let toastTimer = 0;
const buildObjects = [];
const dynamicDecorations = [];
const sandPuffs = [];
const undoStack = [];
const redoStack = [];
const maxUndoSteps = 12;
const editState = {
  selected: null,
  dragging: false,
  pointerId: null,
  moved: false,
  valid: true,
  historySnapshot: null,
  groundOffset: 0,
  startBaseY: 0,
  startPosition: new THREE.Vector3(),
  dragOffset: new THREE.Vector3(),
  originalSnapPoints: [],
};
const SAVE_VERSION = 1;
const SAVE_KEY_PREFIX = "dream-sandbar-save-v1-slot-";
const SAVE_ACTIVE_SLOT_KEY = "dream-sandbar-active-save-slot";
const saveSystem = {
  activeSlot: 1,
  autosaveTimer: 0,
  dirty: false,
  restoring: false,
  restoredOnStart: false,
};
const AUDIO_MUTED_KEY = "dream-sandbar-audio-muted";
const audioSystem = createAudioSystem();
const clock = new THREE.Clock();
let uiUpdateElapsed = 0;
let erosionUpdateElapsed = 0;
let floodProtectionElapsed = 1;
let nextSkyTextureUpdate = 0;
let waterUpdateElapsed = 1 / 30;
let waterNormalElapsed = 1 / 15;
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
const tideGameplay = {
  warningLevel: 0,
  criticalBuilds: 0,
};

initializeSaveSystem();
if (!saveSystem.restoredOnStart) showToast("浏览沙洲，选择模具后再点击沙滩建造。");

window.addEventListener("pointerdown", unlockAudio, { once: true, capture: true });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    Object.values(audioSystem.tracks).forEach((track) => track.pause());
  } else if (audioSystem.unlocked && !audioSystem.muted) {
    startAmbientTracks();
  }
});

window.addEventListener("resize", onResize);
renderer.domElement.addEventListener("pointermove", onPointerMove);
renderer.domElement.addEventListener("pointerdown", onPointerDown, { capture: true });
renderer.domElement.addEventListener("pointerup", onPointerUp);
renderer.domElement.addEventListener("pointercancel", onPointerUp);
renderer.domElement.addEventListener("pointerleave", onPointerUp);
window.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) redoLastAction();
    else undoLastAction();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
    event.preventDefault();
    redoLastAction();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
    event.preventDefault();
    duplicateSelectedBuild();
    return;
  }
  if (event.key.toLowerCase() === "r") rotateMold();
  if (event.key === "Delete" || event.key === "Backspace") {
    if (editState.selected) event.preventDefault();
    deleteSelectedBuild();
  }
  if (event.key === "Escape") {
    if (state.selected) clearSelection(false);
    clearEditableSelection(false);
  }
  if (event.key === "1") selectMold("tower");
  if (event.key === "2") selectMold("wall");
  if (event.key === "3") selectMold("moat");
});

ui.undoButton.addEventListener("click", undoLastAction);
ui.redoButton.addEventListener("click", redoLastAction);
ui.rotateButton.addEventListener("click", rotateMold);
ui.copyButton.addEventListener("click", duplicateSelectedBuild);
ui.repairButton.addEventListener("click", repairSelectedBuild);
ui.reinforceButton.addEventListener("click", reinforceSelectedBuild);
ui.deleteButton.addEventListener("click", deleteSelectedBuild);
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
  scheduleAutoSave();
});
ui.pauseTimeButton.addEventListener("click", () => {
  state.timePaused = !state.timePaused;
  updateTimeButton();
  showToast(state.timePaused ? "时间已暂停，昼夜暂时停住。" : "时间继续流动。");
  scheduleAutoSave();
});
ui.soundButton.addEventListener("click", toggleAudio);
ui.saveSlotLoadButtons.forEach((button) => {
  button.addEventListener("click", () => loadSaveSlot(Number(button.dataset.loadSlot)));
});
ui.saveSlotWriteButtons.forEach((button) => {
  button.addEventListener("click", () => saveToSlot(Number(button.dataset.writeSlot), true));
});
ui.exportSaveButton.addEventListener("click", exportActiveSave);
ui.importSaveButton.addEventListener("click", () => ui.saveFileInput.click());
ui.saveFileInput.addEventListener("change", importSaveFile);
ui.clearSaveButton.addEventListener("click", () => {
  clearBuilds(true, true);
  scheduleAutoSave(0);
});
window.addEventListener("beforeunload", () => saveToSlot(saveSystem.activeSlot, false));
window.setInterval(() => saveToSlot(saveSystem.activeSlot, false), 15000);

updateUi();
animate();

function createUi() {
  const shell = document.createElement("div");
  shell.className = "game-shell";

  const bubbleMenu = document.createElement("nav");
  bubbleMenu.className = "bubble-menu";
  bubbleMenu.setAttribute("aria-label", "游戏界面菜单");
  bubbleMenu.innerHTML = `
    <button class="bubble toggle-bubble menu-btn" type="button" aria-label="展开界面菜单" aria-pressed="false">
      <span class="menu-line"></span>
      <span class="menu-line short"></span>
    </button>
  `;

  const bubbleItems = document.createElement("div");
  bubbleItems.className = "bubble-menu-items";
  bubbleItems.setAttribute("aria-hidden", "true");
  bubbleItems.innerHTML = `
    <ul class="glass-icon-grid" role="menu" aria-label="界面面板">
      <li role="none">
        <button class="glass-icon-btn" type="button" role="menuitem" data-panel-target="title" aria-label="标题" style="--item-index: 0; --glass-gradient: linear-gradient(160deg, #22b8b3, #167e91);">
          <span class="glass-icon-back"></span><span class="glass-icon-front"><span class="glass-icon-glyph" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4"/></svg></span></span><span class="glass-icon-label">标题</span>
        </button>
      </li>
      <li role="none">
        <button class="glass-icon-btn" type="button" role="menuitem" data-panel-target="status" aria-label="状态" style="--item-index: 1; --glass-gradient: linear-gradient(160deg, #5b8ff9, #315dd8);">
          <span class="glass-icon-back"></span><span class="glass-icon-front"><span class="glass-icon-glyph" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 16l4-5 4 3 7-8M16 6h3v3"/></svg></span></span><span class="glass-icon-label">状态</span>
        </button>
      </li>
      <li role="none">
        <button class="glass-icon-btn" type="button" role="menuitem" data-panel-target="tools" aria-label="工具" style="--item-index: 2; --glass-gradient: linear-gradient(160deg, #f4a15d, #df624b);">
          <span class="glass-icon-back"></span><span class="glass-icon-front"><span class="glass-icon-glyph" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14 5l5 5-3 3-5-5zM4 20l7.5-7.5M5 16l3 3-4 1z"/></svg></span></span><span class="glass-icon-label">工具</span>
        </button>
      </li>
      <li role="none">
        <button class="glass-icon-btn" type="button" role="menuitem" data-panel-target="saves" aria-label="存档" style="--item-index: 3; --glass-gradient: linear-gradient(160deg, #9b78ee, #6849c8);">
          <span class="glass-icon-back"></span><span class="glass-icon-front"><span class="glass-icon-glyph" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 4h12l2 2v14H5zM8 4v6h8V4M8 17h8M9 7h5"/></svg></span></span><span class="glass-icon-label">存档</span>
        </button>
      </li>
    </ul>
  `;

  const hud = document.createElement("div");
  hud.className = "hud";
  hud.innerHTML = `
    <section class="title-panel ui-card" data-spotlight-card>
      <button class="panel-collapse" type="button" data-collapse="title" aria-label="收纳标题">−</button>
      <div class="title-heading">
        <div class="brand-orbit" aria-hidden="true"><span></span></div>
        <div>
          <p class="eyebrow">Tropical Coast Sandbox</p>
          <h1>梦幻沙洲</h1>
        </div>
      </div>
      <p class="subtitle">在潮汐与星光之间塑造海岸，用模具搭起属于你的沙洲地标。</p>
      <div class="title-meta">
        <div class="sky-status" data-sky-status>早晨 · 晴天</div>
        <div class="world-mode"><span></span>自由建造</div>
      </div>
    </section>
    <section class="status-panel ui-card" data-spotlight-card>
      <button class="panel-collapse" type="button" data-collapse="status" aria-label="收纳状态">−</button>
      <div class="status-heading">
        <div>
          <p class="eyebrow">Island telemetry</p>
          <div class="time-phase" data-time-phase>早晨 · 晴天</div>
        </div>
        <div class="time-meter">
          <span>LOCAL TIME</span>
          <strong data-game-time>06:43</strong>
        </div>
      </div>
      <div class="status-metrics">
        ${meter("tide", "潮位", "≋")}
        ${meter("stability", "稳定度", "◇")}
        ${meter("mood", "平静感", "◌")}
      </div>
    </section>
  `;

  const tools = document.createElement("section");
  tools.className = "tool-panel ui-card";
  tools.dataset.spotlightCard = "";
  tools.innerHTML = `
    <button class="panel-collapse" type="button" data-collapse="tools" aria-label="收纳工具栏">−</button>
    <div class="toolbar-header">
      <div class="tool-context">
        <span class="tool-context-icon" aria-hidden="true">✦</span>
        <div>
          <div class="eyebrow">Build deck</div>
          <div class="selected-name">当前：浏览视角</div>
          <div class="selected-build-status" data-selected-build-status>选择建筑可查看抗潮状态</div>
        </div>
      </div>
      <div class="action-picker">
        <div class="action-scroll">
          <div class="small-actions">
            <button class="action-button" data-action="preset">自动建城</button>
            <button class="action-button" data-action="undo" disabled>撤销</button>
            <button class="action-button" data-action="redo" disabled>重做</button>
            <button class="action-button" data-action="rotate">旋转 R</button>
            <button class="action-button" data-action="copy" disabled>复制 ⌘D</button>
            <button class="action-button" data-action="repair" disabled>修复建筑</button>
            <button class="action-button" data-action="reinforce" disabled>加固抗潮</button>
            <button class="action-button danger-action" data-action="delete" disabled>删除</button>
            <button class="action-button" data-action="flood">涨潮</button>
            <button class="action-button" data-action="ebb">退潮</button>
            <button class="action-button" data-action="tide">暂停潮汐</button>
            <button class="action-button" data-action="time">暂停时间</button>
            <button class="action-button" data-action="clear">清空</button>
          </div>
        </div>
      </div>
    </div>
    <div class="mold-picker">
      <div class="mold-scroll">
        <div class="mold-grid"></div>
      </div>
    </div>
  `;
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
  const saves = document.createElement("aside");
  saves.className = "hint-panel save-panel ui-card";
  saves.dataset.spotlightCard = "";
  saves.innerHTML = `
    <button class="panel-collapse" type="button" aria-label="返回界面菜单">−</button>
    <div class="hint-heading save-heading">
      <span class="hint-symbol save-symbol" aria-hidden="true">◈</span>
      <div><p class="eyebrow">Island archive</p><strong>沙洲存档</strong></div>
      <span class="autosave-state" data-autosave-state>自动保存已开启</span>
    </div>
    <div class="save-slot-list">
      ${[1, 2, 3].map((slot) => `
        <article class="save-slot" data-save-slot="${slot}">
          <button class="save-slot-load" type="button" data-load-slot="${slot}">
            <span class="save-slot-number">0${slot}</span>
            <span class="save-slot-copy"><strong>存档 ${slot}</strong><small data-slot-meta="${slot}">空存档位</small></span>
          </button>
          <button class="save-slot-write" type="button" data-write-slot="${slot}">保存</button>
        </article>
      `).join("")}
    </div>
    <div class="save-file-actions">
      <button type="button" data-save-action="export">导出存档</button>
      <button type="button" data-save-action="import">导入存档</button>
      <button type="button" class="save-danger" data-save-action="clear">清空当前沙洲</button>
    </div>
    <input class="save-file-input" type="file" accept="application/json,.json" data-save-file hidden>
    <p class="hint-note save-note">编辑后会自动写入当前存档位，导出文件可用于备份或迁移。</p>
  `;

  const titlePanel = hud.querySelector(".title-panel");
  const statusPanel = hud.querySelector(".status-panel");
  [titlePanel, statusPanel, tools, saves].forEach(enhanceSpotlightCard);
  const panels = { title: titlePanel, status: statusPanel, tools, saves };
  Object.values(panels).forEach((panel) => panel.classList.add("collapsed"));

  const menuButton = bubbleMenu.querySelector(".menu-btn");
  const setMenuOpen = (isOpen) => {
    bubbleMenu.classList.toggle("is-open", isOpen);
    bubbleItems.classList.toggle("is-open", isOpen);
    bubbleItems.setAttribute("aria-hidden", String(!isOpen));
    menuButton.classList.toggle("open", isOpen);
    menuButton.setAttribute("aria-pressed", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "收起界面菜单" : "展开界面菜单");
  };
  const closePanels = () => Object.values(panels).forEach((panel) => panel.classList.add("collapsed"));
  const returnToMenu = () => {
    closePanels();
    setMenuOpen(true);
  };
  const openPanel = (panelName) => {
    closePanels();
    const panel = panels[panelName];
    if (!panel) return;
    panel.classList.remove("collapsed");
    setMenuOpen(false);
  };

  menuButton.addEventListener("click", () => {
    const willOpen = !bubbleItems.classList.contains("is-open");
    if (willOpen) closePanels();
    setMenuOpen(willOpen);
  });
  bubbleItems.querySelectorAll("[data-panel-target]").forEach((button) => {
    button.addEventListener("click", () => openPanel(button.dataset.panelTarget));
  });
  hud.querySelectorAll(".panel-collapse").forEach((button) => button.addEventListener("click", returnToMenu));
  tools.querySelector(".panel-collapse").addEventListener("click", returnToMenu);
  saves.querySelector(".panel-collapse").addEventListener("click", returnToMenu);
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    setMenuOpen(false);
    closePanels();
  });

  const toast = document.createElement("div");
  toast.className = "toast";

  const soundButton = document.createElement("button");
  soundButton.className = "sound-toggle";
  soundButton.type = "button";
  soundButton.setAttribute("aria-label", "切换环境声音");
  soundButton.innerHTML = `<span aria-hidden="true">♪</span>`;

  const tideAlert = document.createElement("div");
  tideAlert.className = "tide-alert";
  tideAlert.setAttribute("role", "status");
  tideAlert.setAttribute("aria-live", "polite");
  tideAlert.innerHTML = `<span class="tide-alert-icon" aria-hidden="true">≋</span><span data-tide-alert-text></span>`;

  return {
    shell,
    bubbleMenu,
    bubbleItems,
    hud,
    tools,
    saves,
    soundButton,
    tideAlert,
    toast,
    selectedName: tools.querySelector(".selected-name"),
    selectedBuildStatus: tools.querySelector("[data-selected-build-status]"),
    skyStatus: hud.querySelector("[data-sky-status]"),
    gameTime: hud.querySelector("[data-game-time]"),
    timePhase: hud.querySelector("[data-time-phase]"),
    undoButton: tools.querySelector('[data-action="undo"]'),
    redoButton: tools.querySelector('[data-action="redo"]'),
    rotateButton: tools.querySelector('[data-action="rotate"]'),
    copyButton: tools.querySelector('[data-action="copy"]'),
    repairButton: tools.querySelector('[data-action="repair"]'),
    reinforceButton: tools.querySelector('[data-action="reinforce"]'),
    deleteButton: tools.querySelector('[data-action="delete"]'),
    clearButton: tools.querySelector('[data-action="clear"]'),
    presetButton: tools.querySelector('[data-action="preset"]'),
    floodTideButton: tools.querySelector('[data-action="flood"]'),
    ebbTideButton: tools.querySelector('[data-action="ebb"]'),
    pauseTideButton: tools.querySelector('[data-action="tide"]'),
    pauseTimeButton: tools.querySelector('[data-action="time"]'),
    saveSlotCards: [...saves.querySelectorAll("[data-save-slot]")],
    saveSlotLoadButtons: [...saves.querySelectorAll("[data-load-slot]")],
    saveSlotWriteButtons: [...saves.querySelectorAll("[data-write-slot]")],
    saveSlotMeta: [...saves.querySelectorAll("[data-slot-meta]")],
    autosaveState: saves.querySelector("[data-autosave-state]"),
    exportSaveButton: saves.querySelector('[data-save-action="export"]'),
    importSaveButton: saves.querySelector('[data-save-action="import"]'),
    clearSaveButton: saves.querySelector('[data-save-action="clear"]'),
    saveFileInput: saves.querySelector("[data-save-file]"),
    tideAlertText: tideAlert.querySelector("[data-tide-alert-text]"),
    meters: {
      tide: hud.querySelector('[data-meter="tide"]'),
      stability: hud.querySelector('[data-meter="stability"]'),
      mood: hud.querySelector('[data-meter="mood"]'),
    },
    meterValues: {
      tide: hud.querySelector('[data-meter="tide-value"]'),
      stability: hud.querySelector('[data-meter="stability-value"]'),
      mood: hud.querySelector('[data-meter="mood-value"]'),
    },
    lastMeterValues: {},
    lastPhaseWeather: "",
    lastGameTime: "",
    lastTideState: "",
    lastTimePaused: null,
  };
}

function meter(id, label, icon) {
  return `
    <div class="meter">
      <div class="meter-label">
        <span class="meter-icon" aria-hidden="true">${icon}</span>
        <span>${label}</span>
        <strong data-meter="${id}-value">0%</strong>
      </div>
      <div class="meter-track"><div class="meter-fill ${id}" data-meter="${id}"></div></div>
    </div>
  `;
}

function enhanceSpotlightCard(panel) {
  panel.addEventListener("pointermove", (event) => {
    const rect = panel.getBoundingClientRect();
    panel.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    panel.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  });
  panel.addEventListener("pointerleave", () => {
    panel.style.removeProperty("--spot-x");
    panel.style.removeProperty("--spot-y");
  });
}

function pushUndoSnapshot(label) {
  undoStack.push(captureSceneSnapshot(label));
  trimHistoryStack(undoStack);
  redoStack.length = 0;
  updateUndoButton();
}

function captureSceneSnapshot(label) {
  return {
    label,
    buildChildren: [...roots.builds.children],
    decorationChildren: [...roots.decorations.children],
    buildObjects: [...buildObjects],
    dynamicDecorations: [...dynamicDecorations],
    buildTransforms: roots.builds.children.map(captureObjectTransform),
    decorationTransforms: roots.decorations.children.map(captureObjectTransform),
    buildStates: buildObjects.map((item) => ({
      item,
      baseY: item.baseY,
      stability: item.stability,
      wetness: item.wetness,
      collapse: item.collapse,
      reinforcement: item.reinforcement,
    })),
    terrainHeights: [...terrain.heights],
    state: {
      buildCount: state.buildCount,
      globalStability: state.globalStability,
      mood: state.mood,
    },
  };
}

function captureObjectTransform(object) {
  return {
    object,
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
    snapPoints: (object.userData.snapPoints ?? []).map((point) => point.clone()),
  };
}

function trimHistoryStack(stack) {
  if (stack.length > maxUndoSteps) stack.shift();
}

function commitHistorySnapshot(snapshot) {
  if (!snapshot) return;
  undoStack.push(snapshot);
  trimHistoryStack(undoStack);
  redoStack.length = 0;
  updateUndoButton();
}

function undoLastAction() {
  if (moatDrag.active || wallDrag.active || editState.dragging) {
    showToast("松开鼠标后再撤销。");
    return;
  }
  const snapshot = undoStack.pop();
  if (!snapshot) {
    showToast("还没有可以撤销的建造动作。");
    return;
  }

  redoStack.push(captureSceneSnapshot(snapshot.label));
  trimHistoryStack(redoStack);
  restoreSceneSnapshot(snapshot);
  showToast(`已撤销：${snapshot.label}。`);
}

function redoLastAction() {
  if (moatDrag.active || wallDrag.active || editState.dragging) {
    showToast("松开鼠标后再重做。");
    return;
  }
  const snapshot = redoStack.pop();
  if (!snapshot) {
    showToast("还没有可以重做的动作。");
    return;
  }

  undoStack.push(captureSceneSnapshot(snapshot.label));
  trimHistoryStack(undoStack);
  restoreSceneSnapshot(snapshot);
  showToast(`已重做：${snapshot.label}。`);
}

function restoreSceneSnapshot(snapshot) {
  clearEditableSelection(false);
  restoreRootChildren(roots.builds, snapshot.buildChildren);
  restoreRootChildren(roots.decorations, snapshot.decorationChildren);
  clearActiveParticles();
  restoreArray(buildObjects, snapshot.buildObjects);
  restoreArray(dynamicDecorations, snapshot.dynamicDecorations);
  restoreObjectTransforms(snapshot.buildTransforms);
  restoreObjectTransforms(snapshot.decorationTransforms);
  for (const saved of snapshot.buildStates) {
    saved.item.baseY = saved.baseY;
    saved.item.stability = saved.stability;
    saved.item.wetness = saved.wetness;
    saved.item.collapse = saved.collapse;
    saved.item.reinforcement = saved.reinforcement;
  }
  restoreTerrainHeights(snapshot.terrainHeights);

  state.buildCount = snapshot.state.buildCount;
  state.globalStability = snapshot.state.globalStability;
  state.mood = snapshot.state.mood;
  wallPreview.visible = false;
  snapMarker.visible = false;
  updateUndoButton();
  updateUi();
  scheduleAutoSave();
}

function restoreObjectTransforms(transforms) {
  for (const saved of transforms) {
    saved.object.position.copy(saved.position);
    saved.object.quaternion.copy(saved.quaternion);
    saved.object.scale.copy(saved.scale);
    saved.object.userData.snapPoints = saved.snapPoints.map((point) => point.clone());
  }
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
  requestTerrainGeometryUpdate();
}

let terrainUpdateDepth = 0;
let terrainNeedsNormalUpdate = false;

function deferTerrainUpdates(callback) {
  terrainUpdateDepth += 1;
  try {
    return callback();
  } finally {
    terrainUpdateDepth -= 1;
    if (terrainUpdateDepth === 0) flushTerrainGeometryUpdate();
  }
}

function requestTerrainGeometryUpdate() {
  terrainNeedsNormalUpdate = true;
  terrain.mesh.geometry.attributes.position.needsUpdate = true;
  if (terrainUpdateDepth === 0) flushTerrainGeometryUpdate();
}

function flushTerrainGeometryUpdate() {
  if (!terrainNeedsNormalUpdate) return;
  terrain.mesh.geometry.computeVertexNormals();
  terrainNeedsNormalUpdate = false;
}

function hasSceneChanges() {
  if (roots.builds.children.length || roots.decorations.children.length || roots.particles.children.length) return true;
  return terrain.heights.some((height, index) => Math.abs(height - terrain.baseHeights[index]) > 0.0001);
}

function updateUndoButton() {
  ui.undoButton.disabled = undoStack.length === 0;
  ui.redoButton.disabled = redoStack.length === 0;
}

function initializeSaveSystem() {
  const storedSlot = Number(readStorageValue(SAVE_ACTIVE_SLOT_KEY));
  saveSystem.activeSlot = Number.isInteger(storedSlot) && storedSlot >= 1 && storedSlot <= 3 ? storedSlot : 1;
  refreshSavePanel();
  const save = readSaveSlot(saveSystem.activeSlot);
  if (!save) return;
  if (restoreIslandFromSave(save)) {
    saveSystem.restoredOnStart = true;
    showToast(`已恢复存档 ${saveSystem.activeSlot}。`);
  }
}

function readStorageValue(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn("无法读取本地存档：", error);
    return null;
  }
}

function readSaveSlot(slot) {
  const raw = readStorageValue(`${SAVE_KEY_PREFIX}${slot}`);
  if (!raw) return null;
  try {
    const save = JSON.parse(raw);
    return save?.format === "dream-sandbar" && save.version === SAVE_VERSION ? save : null;
  } catch (error) {
    console.warn(`存档 ${slot} 解析失败：`, error);
    return null;
  }
}

function serializeCurrentIsland() {
  return {
    format: "dream-sandbar",
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    builds: buildObjects
      .filter((item) => item.group.userData.moldType)
      .map((item) => ({
        type: item.group.userData.moldType,
        x: roundSaveNumber(item.group.position.x),
        z: roundSaveNumber(item.group.position.z),
        rotation: roundSaveNumber(item.group.rotation.y),
        baseY: roundSaveNumber(item.baseY),
        stability: roundSaveNumber(item.stability),
        wetness: roundSaveNumber(item.wetness),
        collapse: roundSaveNumber(item.collapse),
        reinforcement: roundSaveNumber(item.reinforcement),
      })),
    decorations: roots.decorations.children
      .filter((group) => group.userData.moldType)
      .map((group) => ({
        type: group.userData.moldType,
        x: roundSaveNumber(group.position.x),
        y: roundSaveNumber(group.position.y),
        z: roundSaveNumber(group.position.z),
        rotation: roundSaveNumber(group.rotation.y),
      })),
    terrainHeights: Array.from(terrain.heights, roundSaveNumber),
    world: {
      tideRise: roundSaveNumber(state.tideRise),
      tideSpeed: roundSaveNumber(state.tideSpeed),
      lastTideSpeed: roundSaveNumber(state.lastTideSpeed),
      dayTime: roundSaveNumber(state.dayTime),
      timePaused: state.timePaused,
      weather: state.weather,
      weatherTimer: roundSaveNumber(state.weatherTimer),
      buildCount: state.buildCount,
      globalStability: roundSaveNumber(state.globalStability),
      mood: roundSaveNumber(state.mood),
    },
    camera: {
      position: camera.position.toArray().map(roundSaveNumber),
      target: controls.target.toArray().map(roundSaveNumber),
    },
  };
}

function roundSaveNumber(value) {
  return Math.round((Number(value) || 0) * 10000) / 10000;
}

function saveToSlot(slot, showMessage = false) {
  if (saveSystem.restoring || slot < 1 || slot > 3) return false;
  const save = serializeCurrentIsland();
  try {
    window.localStorage.setItem(`${SAVE_KEY_PREFIX}${slot}`, JSON.stringify(save));
    window.localStorage.setItem(SAVE_ACTIVE_SLOT_KEY, String(slot));
  } catch (error) {
    console.error("存档写入失败：", error);
    ui.autosaveState.textContent = "保存失败";
    showToast("浏览器存储空间不足，请先导出存档备份。");
    return false;
  }
  saveSystem.activeSlot = slot;
  saveSystem.dirty = false;
  clearTimeout(saveSystem.autosaveTimer);
  ui.autosaveState.textContent = `已保存 · 存档 ${slot}`;
  refreshSavePanel();
  if (showMessage) showToast(`已保存到存档 ${slot}。`);
  return true;
}

function scheduleAutoSave(delay = 900) {
  if (saveSystem.restoring) return;
  saveSystem.dirty = true;
  ui.autosaveState.textContent = "等待自动保存…";
  clearTimeout(saveSystem.autosaveTimer);
  if (delay <= 0) {
    saveToSlot(saveSystem.activeSlot, false);
    return;
  }
  saveSystem.autosaveTimer = window.setTimeout(() => {
    saveToSlot(saveSystem.activeSlot, false);
  }, delay);
}

function loadSaveSlot(slot) {
  if (slot < 1 || slot > 3) return;
  if (slot !== saveSystem.activeSlot) saveToSlot(saveSystem.activeSlot, false);
  saveSystem.activeSlot = slot;
  try {
    window.localStorage.setItem(SAVE_ACTIVE_SLOT_KEY, String(slot));
  } catch (error) {
    console.warn("无法记录当前存档位：", error);
  }

  const save = readSaveSlot(slot);
  if (save) {
    restoreIslandFromSave(save);
    showToast(`已载入存档 ${slot}。`);
  } else {
    saveSystem.restoring = true;
    clearBuilds(false, false);
    resetWorldForBlankSave();
    saveSystem.restoring = false;
    saveToSlot(slot, false);
    showToast(`已切换到空存档 ${slot}。`);
  }
  refreshSavePanel();
}

function restoreIslandFromSave(save) {
  if (!save || save.format !== "dream-sandbar" || save.version !== SAVE_VERSION) return false;
  saveSystem.restoring = true;
  clearSelection(false);
  clearEditableSelection(false);

  try {
    deferTerrainUpdates(() => {
      clearBuilds(false, false);
      for (const record of save.builds ?? []) restoreSavedBuild(record);
      for (const record of save.decorations ?? []) restoreSavedDecoration(record);
      if (Array.isArray(save.terrainHeights) && save.terrainHeights.length === terrain.heights.length) {
        restoreTerrainHeights(save.terrainHeights);
      }
    });

    const world = save.world ?? {};
    state.tideRise = THREE.MathUtils.clamp(Number(world.tideRise) || 0, 0, 1);
    state.tideSpeed = Number.isFinite(world.tideSpeed) ? world.tideSpeed : 0.016;
    state.lastTideSpeed = Number.isFinite(world.lastTideSpeed) ? world.lastTideSpeed : 0.016;
    state.dayTime = THREE.MathUtils.euclideanModulo(Number(world.dayTime) || 0.28, 1);
    state.timePaused = Boolean(world.timePaused);
    state.weather = ["sunny", "cloudy", "rainy"].includes(world.weather) ? world.weather : "sunny";
    state.weatherTimer = Number(world.weatherTimer) || 28;
    state.buildCount = Number.isFinite(world.buildCount) ? world.buildCount : buildObjects.length + roots.decorations.children.length;
    state.globalStability = THREE.MathUtils.clamp(Number(world.globalStability) || 1, 0, 1);
    state.mood = THREE.MathUtils.clamp(Number(world.mood) || 0.86, 0, 1);

    if (Array.isArray(save.camera?.position) && save.camera.position.length === 3) {
      camera.position.fromArray(save.camera.position);
    }
    if (Array.isArray(save.camera?.target) && save.camera.target.length === 3) {
      controls.target.fromArray(save.camera.target);
    }
    controls.update();
    undoStack.length = 0;
    redoStack.length = 0;
    saveSystem.dirty = false;
    updateUndoButton();
    updateUi();
    refreshSavePanel();
    return true;
  } catch (error) {
    console.error("存档恢复失败：", error);
    showToast("存档内容损坏，无法恢复。");
    return false;
  } finally {
    saveSystem.restoring = false;
  }
}

function restoreSavedBuild(record) {
  const group = createBuildGroupForSave(record.type, Number(record.x) || 0, Number(record.z) || 0, Number(record.rotation) || 0);
  if (!group) return;
  addBuild(group, record.type);
  const item = buildObjects[buildObjects.length - 1];
  item.baseY = Number.isFinite(record.baseY) ? record.baseY : group.position.y;
  item.stability = THREE.MathUtils.clamp(Number(record.stability) || 1, 0.08, 1);
  item.wetness = THREE.MathUtils.clamp(Number(record.wetness) || 0, 0, 1);
  item.collapse = THREE.MathUtils.clamp(Number(record.collapse) || 0, 0, 1);
  item.reinforcement = THREE.MathUtils.clamp(Number(record.reinforcement) || 0, 0, 1);
  group.position.set(Number(record.x) || 0, item.baseY, Number(record.z) || 0);
  group.rotation.y = Number(record.rotation) || 0;
}

function createBuildGroupForSave(type, x, z, rotation) {
  if (type === "tower") return createTower(x, z);
  if (type === "wall") return createWall(x, z, rotation);
  if (type === "gate") return createGate(x, z, rotation);
  if (type === "temple") return createTemple(x, z, rotation);
  if (type === "paifang") return createPaifang(x, z, rotation);
  if (type === "pavilion") return createPavilion(x, z, rotation);
  if (type === "wenchang") return createWenchangPavilion(x, z, rotation);
  if (type === "citygate") return createCityGate(x, z, rotation);
  if (type === "paintedgate") return createPaintedGate(x, z, rotation);
  if (type === "pineapple") return createPineappleHouse(x, z, rotation);
  if (type === "squidward") return createSquidwardHouse(x, z, rotation);
  if (type === "su7") return createCar(x, z, rotation);
  if (type === "kfc") return createKfcRestaurant(x, z, rotation);
  return null;
}

function restoreSavedDecoration(record) {
  const x = Number(record.x) || 0;
  const z = Number(record.z) || 0;
  const rotation = Number(record.rotation) || 0;
  let group = null;
  if (record.type === "shell") group = createShell(x, z);
  if (record.type === "pebble") group = createPebble(x, z);
  if (record.type === "driftwood") group = createDriftwood(x, z, rotation);
  if (record.type === "seaweed") group = createSeaweed(x, z);
  if (record.type === "palm") group = createPalmTree(x, z, rotation);
  if (record.type === "flowers") group = createTropicalFlowers(x, z);
  if (record.type === "person") group = createPerson(x, z);
  if (record.type === "flag") group = createFlag(x, z);
  if (record.type === "moat-water") group = addMoatWaterPatch(x, z);
  if (record.type === "moat-ring") group = addMoatRingWater(x, z);
  if (!group) return;

  if (record.type === "moat-water" || record.type === "moat-ring") {
    group.position.set(x, Number.isFinite(record.y) ? record.y : group.position.y, z);
    group.rotation.y = rotation;
    return;
  }

  if (record.type === "palm" || record.type === "flowers") addStaticDecoration(group, record.type);
  else if (record.type === "person") addPerson(group, record.type);
  else addDecoration(group, record.type);
  group.position.set(x, Number.isFinite(record.y) ? record.y : group.position.y, z);
  group.rotation.y = rotation;
}

function resetWorldForBlankSave() {
  state.tideRise = 0;
  state.tideSpeed = 0.016;
  state.lastTideSpeed = 0.016;
  state.dayTime = 0.28;
  state.timePaused = false;
  state.weather = "sunny";
  state.weatherTimer = 28;
  state.globalStability = 1;
  state.mood = 0.86;
  state.buildCount = 0;
  camera.position.set(16, 18, 22);
  controls.target.set(0, 0.7, 0);
  controls.update();
  undoStack.length = 0;
  redoStack.length = 0;
  updateUndoButton();
  updateUi();
}

function refreshSavePanel() {
  for (let slot = 1; slot <= 3; slot += 1) {
    const save = readSaveSlot(slot);
    const card = ui.saveSlotCards.find((item) => Number(item.dataset.saveSlot) === slot);
    const meta = ui.saveSlotMeta.find((item) => Number(item.dataset.slotMeta) === slot);
    card?.classList.toggle("is-active", slot === saveSystem.activeSlot);
    card?.classList.toggle("has-save", Boolean(save));
    if (!meta) continue;
    if (!save) {
      meta.textContent = "空存档位";
      continue;
    }
    const count = (save.builds?.length ?? 0) + (save.decorations?.length ?? 0);
    meta.textContent = `${formatSaveTime(save.savedAt)} · ${count} 个物体`;
  }
}

function formatSaveTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "已保存";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function exportActiveSave() {
  const save = serializeCurrentIsland();
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `梦幻沙洲-存档${saveSystem.activeSlot}-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  showToast("存档文件已导出。");
}

async function importSaveFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const save = JSON.parse(await file.text());
    if (save?.format !== "dream-sandbar" || save.version !== SAVE_VERSION) throw new Error("存档格式不匹配");
    if (!restoreIslandFromSave(save)) throw new Error("存档恢复失败");
    saveToSlot(saveSystem.activeSlot, false);
    showToast(`已导入到存档 ${saveSystem.activeSlot}。`);
  } catch (error) {
    console.error("存档导入失败：", error);
    showToast("无法导入该文件，请选择有效的梦幻沙洲存档。");
  } finally {
    event.target.value = "";
  }
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
  const midColor = frameColors.skyMid.copy(topColor).lerp(horizonColor, 0.36);
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
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(1.25, 1);
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
  const gradient = context.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#f8c94f");
  gradient.addColorStop(0.56, "#efa934");
  gradient.addColorStop(1, "#dc8423");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(143, 78, 24, 0.82)";
  context.lineWidth = 2;
  context.lineCap = "round";
  const cell = 32;
  for (let i = -256; i <= 512; i += cell) {
    context.beginPath();
    context.moveTo(i, 0);
    context.lineTo(i + 256, 256);
    context.stroke();
    context.beginPath();
    context.moveTo(i + 256, 0);
    context.lineTo(i, 256);
    context.stroke();
  }

  context.fillStyle = "rgba(158, 80, 21, 0.68)";
  for (let y = 16; y < 256; y += cell) {
    for (let x = 16; x < 256; x += cell) {
      context.beginPath();
      context.ellipse(x + ((y / cell) % 2 ? cell / 2 : 0), y, 2.5, 1.8, 0.15, 0, Math.PI * 2);
      context.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createSquidStoneTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  context.fillStyle = "#808080";
  context.fillRect(0, 0, canvas.width, canvas.height);

  let seed = 6389;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 2200; i += 1) {
    const shade = 92 + random() * 72;
    const alpha = 0.12 + random() * 0.18;
    context.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
    context.beginPath();
    context.ellipse(random() * 256, random() * 256, 0.25 + random() * 0.9, 0.2 + random() * 0.7, random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.2, 2.2);
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
  const coralGeometry = new THREE.ConeGeometry(1, 1, 5);
  const coralMatrices = new Map(coralColors.map((color) => [color, []]));
  const transform = new THREE.Object3D();
  for (let i = 0; i < 180; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 14 + Math.random() * 18;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius * 0.82;
    const h = sampleHeight(x, z) - 0.03;
    const color = coralColors[Math.floor(Math.random() * coralColors.length)];
    const pieces = 2 + Math.floor(Math.random() * 4);
    for (let p = 0; p < pieces; p += 1) {
      const pieceRadius = 0.05 + Math.random() * 0.08;
      const pieceHeight = 0.3 + Math.random() * 0.34;
      transform.position.set(x + (Math.random() - 0.5) * 0.4, h + 0.1, z + (Math.random() - 0.5) * 0.4);
      transform.rotation.set(Math.random() * 0.3, Math.random() * 6, Math.random() * 0.25);
      transform.scale.set(pieceRadius, pieceHeight, pieceRadius);
      transform.updateMatrix();
      coralMatrices.get(color).push(transform.matrix.clone());
    }
  }
  for (const [color, matrices] of coralMatrices) {
    const coral = new THREE.InstancedMesh(
      coralGeometry,
      new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
      matrices.length,
    );
    matrices.forEach((matrix, index) => coral.setMatrixAt(index, matrix));
    coral.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    roots.scenery.add(coral);
  }

  const pebbleGeometry = new THREE.SphereGeometry(1, 6, 4);
  const pebbleMatrices = [];
  for (let i = 0; i < 320; i += 1) {
    const x = (Math.random() - 0.5) * 38;
    const z = (Math.random() - 0.5) * 30;
    if (Math.sqrt((x / 18) ** 2 + (z / 13.5) ** 2) > 1.08) continue;
    const size = 0.025 + Math.random() * 0.04;
    transform.position.set(x, sampleHeight(x, z) + 0.025, z);
    transform.rotation.set(0, 0, 0);
    transform.scale.set(size, size * 0.38, size);
    transform.updateMatrix();
    pebbleMatrices.push(transform.matrix.clone());
  }
  const pebbles = new THREE.InstancedMesh(
    pebbleGeometry,
    new THREE.MeshStandardMaterial({ color: 0x8f815f, roughness: 0.9 }),
    pebbleMatrices.length,
  );
  pebbleMatrices.forEach((matrix, index) => pebbles.setMatrixAt(index, matrix));
  pebbles.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  roots.scenery.add(pebbles);

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

function createAlignmentGuides() {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0xffd98a,
    transparent: true,
    opacity: 0.82,
    depthTest: false,
  });
  const xGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-4.5, 0, 0),
    new THREE.Vector3(4.5, 0, 0),
  ]);
  const zGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, -4.5),
    new THREE.Vector3(0, 0, 4.5),
  ]);
  const xLine = new THREE.Line(xGeometry, material);
  const zLine = new THREE.Line(zGeometry, material.clone());
  xLine.renderOrder = 999;
  zLine.renderOrder = 999;
  group.add(xLine, zLine);
  group.userData.xLine = xLine;
  group.userData.zLine = zLine;
  group.visible = false;
  return group;
}

function findEditableBuildFromObject(object) {
  let group = object;
  while (group && group.parent !== roots.builds) group = group.parent;
  if (!group) return null;
  return buildObjects.find((item) => item.group === group) ?? null;
}

function pickEditableBuild() {
  const hits = raycaster.intersectObjects(roots.builds.children, true);
  for (const hit of hits) {
    const item = findEditableBuildFromObject(hit.object);
    if (item) return item;
  }
  return null;
}

function getEditableBuildLabel(item = editState.selected) {
  if (!item) return "建筑";
  const mold = molds.find((candidate) => candidate.id === item.group.userData.moldType);
  return mold?.label ?? "建筑";
}

function selectEditableBuild(item, showMessage = true) {
  if (!item) return;
  clearSelection(false);
  editState.selected = item;
  editState.valid = true;
  ui.selectedName.textContent = `已选中：${getEditableBuildLabel(item)}`;
  editOutline.visible = true;
  editOutline.material.color.setHex(0xffd98a);
  updateEditableOutline();
  updateEditActionButtons();
  updateSelectedBuildStatus();
  if (showMessage) showToast("已选中，可移动、修复、加固或调整建筑。");
}

function clearEditableSelection(showMessage = false) {
  if (!editState.selected && !editState.dragging) return;
  editState.selected = null;
  editState.dragging = false;
  editState.pointerId = null;
  editState.historySnapshot = null;
  editOutline.visible = false;
  alignmentGuides.visible = false;
  if (!state.selected) ui.selectedName.textContent = "当前：浏览视角";
  ui.selectedBuildStatus.textContent = "选择建筑可查看抗潮状态";
  updateEditActionButtons();
  if (showMessage) showToast("已取消选中。");
}

function updateEditActionButtons() {
  const item = editState.selected;
  const disabled = !item;
  ui.copyButton.disabled = disabled;
  ui.deleteButton.disabled = disabled;
  ui.repairButton.disabled = disabled || (item.stability >= 0.995 && item.wetness <= 0.08);
  ui.reinforceButton.disabled = disabled || item.reinforcement >= 0.99;
  ui.rotateButton.textContent = disabled ? "旋转 R" : "旋转已选 R";
}

function updateSelectedBuildStatus() {
  const item = editState.selected;
  if (!item) return;
  const stability = Math.round(item.stability * 100);
  const wetness = Math.round(item.wetness * 100);
  const resistance = Math.round(getEffectiveFloodResistance(item) * 100);
  const protection = item.moatProtection > 0.08 && item.wallProtection > 0.08
    ? "城墙＋护城河防护"
    : item.moatProtection > 0.08
      ? "护城河防护"
      : item.wallProtection > 0.08
        ? "城墙防护"
        : "无外围防护";
  ui.selectedBuildStatus.textContent = `稳定 ${stability}% · 受潮 ${wetness}% · 抗潮 ${resistance}% · ${protection}`;
  updateEditActionButtons();
}

function updateEditableOutline() {
  const item = editState.selected;
  if (!item || !item.group.parent) {
    editOutline.visible = false;
    return;
  }
  editOutline.box.setFromObject(item.group);
  editOutline.material.color.setHex(editState.valid ? 0xffd98a : 0xff4f43);
  editOutline.visible = true;
}

function startEditableDrag(event, item, terrainHit) {
  selectEditableBuild(item, false);
  editState.dragging = true;
  editState.pointerId = event.pointerId;
  editState.moved = false;
  editState.valid = true;
  editState.historySnapshot = captureSceneSnapshot(`移动${getEditableBuildLabel(item)}`);
  editState.startPosition.copy(item.group.position);
  editState.startBaseY = item.baseY;
  editState.groundOffset = item.baseY - sampleHeight(item.group.position.x, item.group.position.z);
  editState.dragOffset.set(
    item.group.position.x - terrainHit.point.x,
    0,
    item.group.position.z - terrainHit.point.z,
  );
  editState.originalSnapPoints = (item.group.userData.snapPoints ?? []).map((point) => point.clone());
  controls.enabled = false;
  renderer.domElement.setPointerCapture(event.pointerId);
  event.preventDefault();
  event.stopImmediatePropagation();
}

function updateEditableDrag(terrainHit) {
  const item = editState.selected;
  if (!editState.dragging || !item) return;

  const rawPoint = terrainHit.point.clone().add(editState.dragOffset);
  const snapped = snapToGrid(rawPoint);
  const alignment = alignEditablePosition(snapped, item);
  const target = alignment.point;
  const group = item.group;
  const dx = target.x - editState.startPosition.x;
  const dz = target.z - editState.startPosition.z;

  group.position.x = target.x;
  group.position.z = target.z;
  item.baseY = sampleHeight(target.x, target.z) + editState.groundOffset;
  group.position.y = item.baseY;
  group.userData.snapPoints = editState.originalSnapPoints.map((point) => new THREE.Vector3(
    point.x + dx,
    point.y + item.baseY - editState.startBaseY,
    point.z + dz,
  ));

  editState.moved = editState.moved || Math.hypot(dx, dz) > 0.05;
  editState.valid = isBuildableSand(target, ["seaweed", "driftwood", "pebble"])
    && !hasBuildCollision(item);
  updateAlignmentGuides(target, alignment.snapX, alignment.snapZ);
  snapMarker.visible = alignment.snapX || alignment.snapZ;
  if (snapMarker.visible) {
    snapMarker.position.set(target.x, sampleHeight(target.x, target.z) + 0.07, target.z);
  }
  updateEditableOutline();
}

function finishEditableDrag() {
  const item = editState.selected;
  if (!editState.dragging || !item) return;
  if (renderer.domElement.hasPointerCapture(editState.pointerId)) {
    renderer.domElement.releasePointerCapture(editState.pointerId);
  }

  if (editState.moved && editState.valid) {
    commitHistorySnapshot(editState.historySnapshot);
    spawnSandPuff(item.group.position.x, sampleHeight(item.group.position.x, item.group.position.z), item.group.position.z, 12);
    showToast(`${getEditableBuildLabel(item)}已移动。`);
    playInteractionSound("place");
    triggerBuildFeedback();
    scheduleAutoSave();
  } else if (editState.moved) {
    item.group.position.copy(editState.startPosition);
    item.baseY = editState.startBaseY;
    item.group.userData.snapPoints = editState.originalSnapPoints.map((point) => point.clone());
    editState.valid = true;
    showToast("红框位置与其他建筑碰撞，已恢复原位。");
  }

  editState.dragging = false;
  editState.pointerId = null;
  editState.historySnapshot = null;
  controls.enabled = true;
  snapMarker.visible = false;
  alignmentGuides.visible = false;
  updateEditableOutline();
}

function alignEditablePosition(point, selectedItem) {
  const aligned = point.clone();
  let snapX = false;
  let snapZ = false;
  let bestX = 0.34;
  let bestZ = 0.34;
  const selectedRadius = selectedItem.group.userData.baseRadius ?? 0.8;

  for (const other of buildObjects) {
    if (other === selectedItem) continue;
    const otherPosition = other.group.position;
    const otherRadius = other.group.userData.baseRadius ?? 0.8;

    const centerXDistance = Math.abs(point.x - otherPosition.x);
    if (centerXDistance < bestX) {
      aligned.x = otherPosition.x;
      bestX = centerXDistance;
      snapX = true;
    }
    const centerZDistance = Math.abs(point.z - otherPosition.z);
    if (centerZDistance < bestZ) {
      aligned.z = otherPosition.z;
      bestZ = centerZDistance;
      snapZ = true;
    }

    const spacing = (selectedRadius + otherRadius) * 0.62 + 0.16;
    for (const direction of [-1, 1]) {
      const targetX = otherPosition.x + direction * spacing;
      const xDistance = Math.abs(point.x - targetX);
      if (Math.abs(point.z - otherPosition.z) < 0.72 && xDistance < bestX) {
        aligned.x = targetX;
        bestX = xDistance;
        snapX = true;
      }
      const targetZ = otherPosition.z + direction * spacing;
      const zDistance = Math.abs(point.z - targetZ);
      if (Math.abs(point.x - otherPosition.x) < 0.72 && zDistance < bestZ) {
        aligned.z = targetZ;
        bestZ = zDistance;
        snapZ = true;
      }
    }
  }
  return { point: aligned, snapX, snapZ };
}

function updateAlignmentGuides(point, snapX, snapZ) {
  alignmentGuides.visible = snapX || snapZ;
  alignmentGuides.position.set(point.x, sampleHeight(point.x, point.z) + 0.09, point.z);
  alignmentGuides.userData.xLine.visible = snapZ;
  alignmentGuides.userData.zLine.visible = snapX;
}

function hasBuildCollision(selectedItem) {
  const selectedPosition = selectedItem.group.position;
  const selectedRadius = selectedItem.group.userData.baseRadius ?? 0.8;
  return buildObjects.some((other) => {
    if (other === selectedItem) return false;
    const otherRadius = other.group.userData.baseRadius ?? 0.8;
    const minimumDistance = Math.max(0.48, (selectedRadius + otherRadius) * 0.52);
    return horizontalDistance(selectedPosition, other.group.position) < minimumDistance;
  });
}

function rotateSelectedBuild() {
  const item = editState.selected;
  if (!item) return;
  const label = getEditableBuildLabel(item);
  pushUndoSnapshot(`旋转${label}`);
  const angle = Math.PI / 2;
  item.group.rotation.y = (item.group.rotation.y + angle) % (Math.PI * 2);
  const center = item.group.position;
  item.group.userData.snapPoints = (item.group.userData.snapPoints ?? []).map((point) => {
    const dx = point.x - center.x;
    const dz = point.z - center.z;
    return new THREE.Vector3(center.x - dz, point.y, center.z + dx);
  });
  updateEditableOutline();
  showToast(`${label}已旋转 90 度。`);
  playInteractionSound("rotate");
  scheduleAutoSave();
}

function repairSelectedBuild() {
  const item = editState.selected;
  if (!item) {
    showToast("请先点击选中需要修复的建筑。");
    return;
  }
  if (item.stability >= 0.995 && item.wetness <= 0.08) {
    showToast("这座建筑状态很好，暂时不需要修复。");
    return;
  }
  const label = getEditableBuildLabel(item);
  pushUndoSnapshot(`修复${label}`);
  item.stability = Math.min(1, item.stability + 0.42);
  item.wetness = Math.max(0, item.wetness - 0.3);
  item.collapse = Math.max(0, 1 - item.stability);
  item.warningLevel = 0;
  spawnSandPuff(item.group.position.x, sampleHeight(item.group.position.x, item.group.position.z), item.group.position.z, 20);
  updateEditableOutline();
  updateSelectedBuildStatus();
  showToast(`${label}已修复，稳定度恢复。`);
  playInteractionSound("repair");
  triggerBuildFeedback();
  scheduleAutoSave();
}

function reinforceSelectedBuild() {
  const item = editState.selected;
  if (!item) {
    showToast("请先点击选中需要加固的建筑。");
    return;
  }
  if (item.reinforcement >= 0.99) {
    showToast("这座建筑已经完成最高级加固。");
    return;
  }
  const label = getEditableBuildLabel(item);
  pushUndoSnapshot(`加固${label}`);
  item.reinforcement = Math.min(1, item.reinforcement + 0.34);
  item.stability = Math.min(1, item.stability + 0.12);
  spawnSandPuff(item.group.position.x, sampleHeight(item.group.position.x, item.group.position.z), item.group.position.z, 24);
  updateSelectedBuildStatus();
  showToast(`${label}已加固，抗潮能力提升。`);
  playInteractionSound("repair");
  triggerBuildFeedback();
  scheduleAutoSave();
}

function duplicateSelectedBuild() {
  const sourceItem = editState.selected;
  if (!sourceItem) {
    showToast("请先点击选中一个建筑。");
    return;
  }
  const source = sourceItem.group;
  const label = getEditableBuildLabel(sourceItem);
  const target = findDuplicatePosition(sourceItem);
  if (!target) {
    showToast("附近空间不足，先移开周围建筑再复制。");
    return;
  }

  pushUndoSnapshot(`复制${label}`);
  const clone = source.clone(true);
  const erosionParts = [];
  clone.traverse((child) => {
    if (child.userData.isErosionVisual) erosionParts.push(child);
  });
  erosionParts.forEach((child) => child.parent?.remove(child));
  const dx = target.x - source.position.x;
  const dz = target.z - source.position.z;
  clone.position.set(target.x, sampleHeight(target.x, target.z) + (sourceItem.baseY - sampleHeight(source.position.x, source.position.z)), target.z);
  clone.rotation.x = 0;
  clone.rotation.z = 0;
  clone.scale.y = 1;
  clone.userData.snapPoints = (source.userData.snapPoints ?? []).map((point) => new THREE.Vector3(point.x + dx, point.y, point.z + dz));
  addBuild(clone, source.userData.moldType);
  state.buildCount += 1;
  const newItem = buildObjects[buildObjects.length - 1];
  newItem.reinforcement = sourceItem.reinforcement;
  selectEditableBuild(newItem, false);
  spawnSandPuff(target.x, sampleHeight(target.x, target.z), target.z, 16);
  showToast(`${label}已复制。`);
  playInteractionSound("confirm");
  triggerBuildFeedback();
  scheduleAutoSave();
}

function findDuplicatePosition(sourceItem) {
  const source = sourceItem.group;
  const radius = source.userData.baseRadius ?? 0.8;
  const step = Math.max(1.1, radius * 1.45);
  for (let ring = 1; ring <= 3; ring += 1) {
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2;
      const candidate = snapToGrid(new THREE.Vector3(
        source.position.x + Math.cos(angle) * step * ring,
        0,
        source.position.z + Math.sin(angle) * step * ring,
      ));
      if (!isBuildableSand(candidate, ["seaweed", "driftwood", "pebble"])) continue;
      const collides = buildObjects.some((other) => {
        const otherRadius = other.group.userData.baseRadius ?? 0.8;
        return horizontalDistance(candidate, other.group.position) < Math.max(0.48, (radius + otherRadius) * 0.54);
      });
      if (!collides) return candidate;
    }
  }
  return null;
}

function deleteSelectedBuild() {
  const item = editState.selected;
  if (!item) return;
  const label = getEditableBuildLabel(item);
  pushUndoSnapshot(`删除${label}`);
  roots.builds.remove(item.group);
  const index = buildObjects.indexOf(item);
  if (index >= 0) buildObjects.splice(index, 1);
  state.buildCount = Math.max(0, state.buildCount - 1);
  clearEditableSelection(false);
  updateUi();
  showToast(`${label}已删除，可使用撤销恢复。`);
  playInteractionSound("delete");
  scheduleAutoSave();
}

function selectMold(id) {
  if (state.selected === id) {
    clearSelection();
    return;
  }
  clearEditableSelection(false);
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
  if (editState.selected) {
    rotateSelectedBuild();
    return;
  }
  state.rotation = (state.rotation + Math.PI / 2) % (Math.PI * 2);
  ghost.rotation.y = state.rotation;
  showToast("模具已旋转 90 度。");
  playInteractionSound("rotate");
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
  } else if (id === "su7") {
    const body = new THREE.Mesh(new RoundedBoxGeometry(3.84, 0.5, 1.44, 6, 0.16), materials.ghost);
    body.position.y = 0.43;
    const cabin = new THREE.Mesh(new RoundedBoxGeometry(1.88, 0.43, 1, 6, 0.15), materials.ghost);
    cabin.position.set(-0.08, 0.83, 0);
    ghost.add(body, cabin);
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
  pendingPointerMove = { clientX: event.clientX, clientY: event.clientY };
  if (pointerMoveFrame) return;
  pointerMoveFrame = requestAnimationFrame(() => {
    pointerMoveFrame = 0;
    const pointerEvent = pendingPointerMove;
    pendingPointerMove = null;
    if (pointerEvent) processPointerMove(pointerEvent);
  });
}

function flushPointerMove() {
  if (!pendingPointerMove) return;
  if (pointerMoveFrame) cancelAnimationFrame(pointerMoveFrame);
  pointerMoveFrame = 0;
  const pointerEvent = pendingPointerMove;
  pendingPointerMove = null;
  processPointerMove(pointerEvent);
}

function processPointerMove(event) {
  setPointerRayFromClient(event);
  const hit = raycaster.intersectObject(terrain.mesh, false)[0];
  hasHover = Boolean(hit);
  ghost.visible = hasHover && Boolean(state.selected);
  wallPreview.visible = false;
  snapMarker.visible = false;
  if (!hit) return;
  hoveredPoint.copy(hit.point);
  if (editState.dragging) {
    ghost.visible = false;
    updateEditableDrag(hit);
    return;
  }
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

function setPointerRayFromClient(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
}

function onPointerDown(event) {
  flushPointerMove();
  setPointerRayFromClient(event);
  if (event.button !== 0) return;

  if (!state.selected) {
    const terrainHit = raycaster.intersectObject(terrain.mesh, false)[0];
    const editableItem = pickEditableBuild();
    if (editableItem && terrainHit) {
      startEditableDrag(event, editableItem, terrainHit);
    } else if (editState.selected) {
      clearEditableSelection(false);
    }
    return;
  }

  if (!hasHover) return;
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
  if (event.type === "pointerleave") {
    if (pointerMoveFrame) cancelAnimationFrame(pointerMoveFrame);
    pointerMoveFrame = 0;
    pendingPointerMove = null;
    hasHover = false;
    ghost.visible = false;
    wallPreview.visible = false;
    snapMarker.visible = false;
  }
  if (moatDrag.active && event.pointerId === moatDrag.pointerId) {
    finishMoatDrag();
  }
  if (wallDrag.active && event.pointerId === wallDrag.pointerId) {
    finishWallDrag();
  }
  if (editState.dragging && event.pointerId === editState.pointerId) {
    finishEditableDrag();
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
  playInteractionSound("dig");
  triggerBuildFeedback();
  clearSelection(false);
  scheduleAutoSave();
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
    playInteractionSound("confirm");
    triggerBuildFeedback();
  } else if (wallDrag.moved) {
    state.mood = Math.min(1, state.mood + 0.01);
    showToast("连续城墙已经接好，靠近端点的地方会自动吸附。");
    playInteractionSound("place");
    triggerBuildFeedback();
  } else {
    placeMold("wall", wallDrag.lastPoint);
  }
  clearSelection(false);
  scheduleAutoSave();
}

function placeMold(type, point, quiet = false) {
  if (type === "tower") addBuild(createTower(point.x, point.z), type);
  if (type === "wall") addBuild(createWall(point.x, point.z, state.rotation), type);
  if (type === "gate") addBuild(createGate(point.x, point.z, state.rotation), type);
  if (type === "temple") addBuild(createTemple(point.x, point.z, state.rotation), type);
  if (type === "paifang") addBuild(createPaifang(point.x, point.z, state.rotation), type);
  if (type === "pavilion") addBuild(createPavilion(point.x, point.z, state.rotation), type);
  if (type === "wenchang") addBuild(createWenchangPavilion(point.x, point.z, state.rotation), type);
  if (type === "citygate") addBuild(createCityGate(point.x, point.z, state.rotation), type);
  if (type === "paintedgate") addBuild(createPaintedGate(point.x, point.z, state.rotation), type);
  if (type === "pineapple") addBuild(createPineappleHouse(point.x, point.z, state.rotation), type);
  if (type === "squidward") addBuild(createSquidwardHouse(point.x, point.z, state.rotation), type);
  if (type === "su7") addBuild(createCar(point.x, point.z, state.rotation), type);
  if (type === "kfc") addBuild(createKfcRestaurant(point.x, point.z, state.rotation), type);
  if (type === "moat") carveMoat(point.x, point.z);
  if (type === "shell") addDecoration(createShell(point.x, point.z), type);
  if (type === "pebble") addDecoration(createPebble(point.x, point.z), type);
  if (type === "driftwood") addDecoration(createDriftwood(point.x, point.z, state.rotation), type);
  if (type === "seaweed") addDecoration(createSeaweed(point.x, point.z), type);
  if (type === "palm") addStaticDecoration(createPalmTree(point.x, point.z, state.rotation), type);
  if (type === "flowers") addStaticDecoration(createTropicalFlowers(point.x, point.z), type);
  if (type === "person") addPerson(createPerson(point.x, point.z), type);
  if (type === "flag") addDecoration(createFlag(point.x, point.z), type);
  spawnSandPuff(point.x, sampleHeight(point.x, point.z), point.z, type === "moat" ? 45 : type === "palm" ? 26 : type === "person" ? 10 : 18);
  state.buildCount += 1;
  state.mood = Math.min(1, state.mood + 0.006);
  if (!quiet) showToast(`${molds.find((mold) => mold.id === type).label} 已放置。`);
  playInteractionSound(type === "moat" ? "dig" : "place");
  triggerBuildFeedback();
  scheduleAutoSave();
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
      addBuild(createWallBetween(cursor, end), "wall");
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
  addBuild(createWallBetween(wallDrag.lastPoint, wallDrag.startPoint), "wall");
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
    mesh.userData.isErosionVisual = true;
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

function getBuildFloodResistance(moldType) {
  const resistanceByType = {
    wall: 0.78,
    gate: 0.64,
    tower: 0.48,
    temple: 0.7,
    paifang: 0.6,
    pavilion: 0.62,
    wenchang: 0.66,
    citygate: 0.84,
    paintedgate: 0.62,
    pineapple: 0.54,
    squidward: 0.74,
    su7: 0.88,
    kfc: 0.86,
  };
  return resistanceByType[moldType] ?? 0.5;
}

function getEffectiveFloodResistance(item) {
  return THREE.MathUtils.clamp(item.resistance + item.reinforcement * 0.34, 0, 0.96);
}

function createGlowSpriteMaterial(color) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(32, 32, 1, 32, 32, 31);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.22, color.replace(", 1)", ", 0.72)"));
  gradient.addColorStop(1, color.replace(", 1)", ", 0)"));
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.SpriteMaterial({
    map: texture,
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function attachNightGlow(group, moldType) {
  if (!moldType || group.userData.hasNightGlow) return;
  const glowsByType = {
    gate: [[0, 0.72, 0.52, "warm", 0.55]],
    temple: [[0, 1.75, 0.65, "warm", 0.72]],
    paifang: [[-0.75, 1.35, 0.42, "warm", 0.5], [0.75, 1.35, 0.42, "warm", 0.5]],
    pavilion: [[0, 1.72, 0.5, "warm", 0.68]],
    wenchang: [[0, 1.65, 0.58, "warm", 0.68]],
    citygate: [[-0.72, 1.32, 0.62, "warm", 0.52], [0.72, 1.32, 0.62, "warm", 0.52]],
    paintedgate: [[-0.76, 1.18, 0.5, "warm", 0.48], [0.76, 1.18, 0.5, "warm", 0.48]],
    pineapple: [[0, 0.72, 1.12, "warm", 0.7]],
    squidward: [[0, 0.56, 0.82, "warm", 0.56]],
    kfc: [[-0.62, 1.2, 1.1, "warm", 0.68], [0.62, 1.2, 1.1, "warm", 0.68]],
    su7: [[1.9, 0.42, -0.5, "cool", 0.44], [1.9, 0.42, 0.5, "cool", 0.44]],
  };
  const glows = glowsByType[moldType];
  if (!glows) return;
  for (const [x, y, z, tone, size] of glows) {
    const glow = new THREE.Sprite(tone === "cool" ? materials.nightGlowCool : materials.nightGlowWarm);
    glow.position.set(x, y, z);
    glow.scale.set(size, size, 1);
    glow.userData.nightGlow = true;
    group.add(glow);
  }
  group.userData.hasNightGlow = true;
}

function addBuild(group, moldType = null) {
  if (moldType) group.userData.moldType = moldType;
  attachNightGlow(group, moldType);
  roots.builds.add(group);
  const erosionVisual = createErosionVisual(group);
  buildObjects.push({
    group,
    baseY: group.position.y,
    erosionVisual,
    stability: 1,
    wetness: 0,
    collapse: 0,
    resistance: getBuildFloodResistance(moldType),
    reinforcement: 0,
    floodProtection: 0,
    wallProtection: 0,
    moatProtection: 0,
    warningLevel: 0,
    dripCooldown: 0.4 + Math.random() * 0.8,
    seed: Math.random() * 100,
  });
}

function addDecoration(group, moldType = null) {
  if (moldType) group.userData.moldType = moldType;
  roots.decorations.add(group);
  dynamicDecorations.push({
    group,
    velocity: new THREE.Vector3((Math.random() - 0.5) * 0.015, 0, (Math.random() - 0.5) * 0.015),
    bob: Math.random() * Math.PI * 2,
  });
}

function addStaticDecoration(group, moldType = null) {
  if (moldType) group.userData.moldType = moldType;
  roots.decorations.add(group);
}

function addPerson(group, moldType = null) {
  if (moldType) group.userData.moldType = moldType;
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
  addTempleRoof(group, 1.12, 0.48, 0.86);
  addTempleUpperHall(group, 0.62, 1.21);
  addTempleRoof(group, 0.84, 0.4, 1.38);
  addTempleUpperHall(group, 0.43, 1.61);
  addTempleRoof(group, 0.6, 0.43, 1.78);
  addTempleFinial(group);

  compactSandUnder(x, z, 1.55, 0.11);
  return group;
}

function addTempleBase(group) {
  const levels = [
    [1.56, 1.72, -0.3],
    [1.36, 1.48, -0.16],
    [1.16, 1.27, -0.02],
  ];
  for (const [topRadius, bottomRadius, y] of levels) {
    const level = new THREE.Mesh(new THREE.CylinderGeometry(topRadius, bottomRadius, 0.12, 64), materials.templeStone);
    level.position.y = y;
    level.castShadow = true;
    level.receiveShadow = true;
    group.add(level);
  }

  const railCount = 32;
  for (let i = 0; i < railCount; i += 1) {
    const angle = (i / railCount) * Math.PI * 2;
    if (Math.abs(Math.atan2(Math.cos(angle), Math.sin(angle))) < 0.22) continue;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.032, 0.28, 8), materials.templeStone);
    post.position.set(Math.cos(angle) * 1.45, 0.13, Math.sin(angle) * 1.45);
    post.castShadow = true;
    group.add(post);
    const middle = angle + Math.PI / railCount;
    const rail = new THREE.Mesh(new RoundedBoxGeometry(0.27, 0.045, 0.045, 2, 0.01), materials.templeStone);
    rail.position.set(Math.cos(middle) * 1.45, 0.19, Math.sin(middle) * 1.45);
    rail.rotation.y = middle - Math.PI / 2;
    rail.castShadow = true;
    group.add(rail);
  }

  for (let i = 0; i < 6; i += 1) {
    const stair = new THREE.Mesh(new THREE.BoxGeometry(0.74 + i * 0.12, 0.055, 0.18), materials.templeStone);
    stair.position.set(0, -0.22 + i * 0.055, 1.68 - i * 0.14);
    stair.castShadow = true;
    stair.receiveShadow = true;
    group.add(stair);
  }
}

function addTempleHall(group) {
  const hall = new THREE.Mesh(new THREE.CylinderGeometry(0.79, 0.86, 0.62, 64), materials.templeWall);
  hall.position.y = 0.43;
  hall.castShadow = true;
  hall.receiveShadow = true;
  group.add(hall);

  const trimTop = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.86, 0.13, 64), materials.templeBlueTrim);
  trimTop.position.y = 0.78;
  trimTop.castShadow = true;
  group.add(trimTop);

  const trimBottom = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.022, 8, 64), materials.templeGold);
  trimBottom.rotation.x = Math.PI / 2;
  trimBottom.position.y = 0.08;
  group.add(trimBottom);

  const columnCount = 20;
  for (let i = 0; i < columnCount; i += 1) {
    const angle = (i / columnCount) * Math.PI * 2;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.57, 10), materials.templeGold);
    pillar.position.set(Math.cos(angle) * 0.855, 0.42, Math.sin(angle) * 0.855);
    pillar.castShadow = true;
    group.add(pillar);

    const panel = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.28, 0.025, 2, 0.012), i % 2 ? materials.templeWall : materials.paintedBeam);
    const middle = angle + Math.PI / columnCount;
    panel.position.set(Math.cos(middle) * 0.862, 0.42, Math.sin(middle) * 0.862);
    panel.rotation.y = -middle;
    group.add(panel);
  }
}

function addTempleUpperHall(group, radius, y) {
  const height = radius > 0.5 ? 0.34 : 0.3;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.04, height, 64), materials.templeBlueTrim);
  wall.position.y = y;
  wall.castShadow = true;
  group.add(wall);
  const count = radius > 0.5 ? 16 : 12;
  const panelMaterials = [materials.templeGold, materials.paintedBeam, materials.pavilionRoof, materials.templeWall];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const panel = new THREE.Mesh(new RoundedBoxGeometry(0.09, height * 0.62, 0.025, 2, 0.01), panelMaterials[i % panelMaterials.length]);
    panel.position.set(Math.cos(angle) * (radius + 0.025), y, Math.sin(angle) * (radius + 0.025));
    panel.rotation.y = -angle;
    group.add(panel);
  }

  const topBand = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.02, 0.018, 8, 64), materials.templeGold);
  topBand.rotation.x = Math.PI / 2;
  topBand.position.y = y + height / 2;
  group.add(topBand);

  const footBand = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.07, radius * 1.1, 0.055, 64), materials.templeRoof);
  footBand.position.y = y - height / 2 + 0.005;
  footBand.castShadow = true;
  group.add(footBand);
}

function addTempleRoof(group, radius, height, y) {
  const profile = [
    new THREE.Vector2(0, height),
    new THREE.Vector2(radius * 0.18, height * 0.94),
    new THREE.Vector2(radius * 0.43, height * 0.75),
    new THREE.Vector2(radius * 0.7, height * 0.42),
    new THREE.Vector2(radius * 0.88, height * 0.18),
    new THREE.Vector2(radius, height * 0.07),
    new THREE.Vector2(radius * 1.07, 0),
  ];
  const roof = new THREE.Mesh(new THREE.LatheGeometry(profile, 64), materials.templeRoof);
  roof.position.y = y;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  const ceiling = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.96, radius * 1.04, 0.065, 64), materials.templeRoof);
  ceiling.position.y = y + 0.005;
  ceiling.castShadow = true;
  ceiling.receiveShadow = true;
  group.add(ceiling);

  const eave = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.07, radius * 1.1, 0.055, 64), materials.templeRoof);
  eave.position.y = y - 0.018;
  eave.castShadow = true;
  group.add(eave);

  const goldRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.98, 0.017, 8, 64), materials.templeGold);
  goldRing.rotation.x = Math.PI / 2;
  goldRing.position.y = y + 0.035;
  group.add(goldRing);

  for (const ring of [0.38, 0.64, 0.86]) {
    const ringY = y + height * (1 - ring) * 0.82;
    const tileBand = new THREE.Mesh(new THREE.TorusGeometry(radius * ring, 0.009, 6, 64), materials.templeBlueTrim);
    tileBand.rotation.x = Math.PI / 2;
    tileBand.position.y = ringY;
    group.add(tileBand);
  }

  const ribCount = radius > 1 ? 24 : radius > 0.7 ? 20 : 16;
  for (let i = 0; i < ribCount; i += 1) {
    const angle = (i / ribCount) * Math.PI * 2;
    const innerRadius = radius * 0.22;
    const outerRadius = radius * 0.92;
    const innerY = y + height * 0.87;
    const outerY = y + height * 0.11;
    const start = new THREE.Vector3(Math.cos(angle) * innerRadius, innerY, Math.sin(angle) * innerRadius);
    const end = new THREE.Vector3(Math.cos(angle) * outerRadius, outerY, Math.sin(angle) * outerRadius);
    const direction = end.clone().sub(start);
    const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, direction.length(), 6), materials.templeBlueTrim);
    rib.position.copy(start).add(end).multiplyScalar(0.5);
    rib.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    group.add(rib);
  }

  const bracketCount = radius > 1 ? 20 : radius > 0.7 ? 16 : 12;
  for (let i = 0; i < bracketCount; i += 1) {
    const angle = (i / bracketCount) * Math.PI * 2;
    const bracket = new THREE.Mesh(
      new RoundedBoxGeometry(radius * 0.12, 0.055, 0.07, 2, 0.012),
      i % 2 ? materials.templeGold : materials.templeBlueTrim,
    );
    bracket.position.set(Math.cos(angle) * radius * 0.88, y - 0.055, Math.sin(angle) * radius * 0.88);
    bracket.rotation.y = -angle;
    bracket.castShadow = true;
    group.add(bracket);
  }
}

function addTempleFinial(group) {
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.08, 20), materials.templeGold);
  base.position.y = 2.24;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.16, 16), materials.templeGold);
  stem.position.y = 2.34;
  stem.castShadow = true;
  const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), materials.templeGold);
  pearl.position.y = 2.47;
  pearl.castShadow = true;
  group.add(base, stem, pearl);
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
  addPaifangUpperStorey(group);
  addPaifangRoof(group, -0.98, 1.1, 1.28, 0.9, 0.3);
  addPaifangRoof(group, 0.98, 1.1, 1.28, 0.9, 0.3);
  addPaifangRoof(group, 0, 1.52, 2.28, 1.12, 0.42);
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
    [0, 0.91, -0.34, 2.75],
    [0, 0.91, 0.34, 2.75],
    [0, 0.62, -0.34, 2.48],
    [0, 0.62, 0.34, 2.48],
  ];
  for (const [x, y, z, width] of beams) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, 0.1), materials.templeWall);
    beam.position.set(x, y, z);
    beam.castShadow = true;
    group.add(beam);
  }

  for (const x of postPositions) {
    for (const y of [0.58, 0.9]) {
      const sideBeam = new THREE.Mesh(new RoundedBoxGeometry(0.11, 0.11, 0.82, 3, 0.018), materials.templeWall);
      sideBeam.position.set(x, y, 0);
      sideBeam.castShadow = true;
      group.add(sideBeam);
    }
  }

  for (const z of [-0.34, 0.34]) {
    for (let i = 0; i < 7; i += 1) {
      const x = -1.08 + i * 0.36;
      const bracket = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.07, 0.16, 2, 0.015), i % 2 ? materials.templeWall : materials.templeBlueTrim);
      bracket.position.set(x, 1.01, z);
      bracket.castShadow = true;
      group.add(bracket);
    }
  }

  const plaqueFrame = new THREE.Mesh(new RoundedBoxGeometry(0.86, 0.3, 0.045, 3, 0.025), materials.templeGold);
  plaqueFrame.position.set(0, 0.76, 0.405);
  plaqueFrame.castShadow = true;
  group.add(plaqueFrame);
  const plaque = new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.2, 0.035, 3, 0.018), materials.templeBlueTrim);
  plaque.position.set(0, 0.76, 0.435);
  plaque.castShadow = true;
  group.add(plaque);
  const plaqueText = new THREE.Mesh(new THREE.PlaneGeometry(0.69, 0.17), createPaifangPlaqueMaterial());
  plaqueText.position.set(0, 0.76, 0.458);
  group.add(plaqueText);
  for (let i = -1; i <= 1; i += 2) {
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.74, 6), materials.templeWall);
    brace.position.set(i * 1.16, 0.42, 0.42);
    brace.rotation.z = i * 0.26;
    brace.castShadow = true;
    group.add(brace);
    const rearBrace = brace.clone();
    rearBrace.position.z = -0.42;
    rearBrace.rotation.z *= -1;
    group.add(rearBrace);
  }

  for (const x of [-1.2, 1.2]) {
    addPaifangBrace(group, new THREE.Vector3(x, -0.12, -0.38), new THREE.Vector3(x, 0.82, 0.38), 0.045);
    addPaifangBrace(group, new THREE.Vector3(x, -0.12, 0.38), new THREE.Vector3(x, 0.82, -0.38), 0.045);
  }
}

function addPaifangUpperStorey(group) {
  for (const x of [-0.62, 0.62]) {
    for (const z of [-0.28, 0.28]) {
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.052, 0.44, 12), materials.templeWall);
      column.position.set(x, 1.25, z);
      column.castShadow = true;
      group.add(column);
    }
  }

  for (const z of [-0.3, 0.3]) {
    const beam = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.12, 0.12, 3, 0.02), materials.templeWall);
    beam.position.set(0, 1.43, z);
    beam.castShadow = true;
    group.add(beam);
  }
  for (const x of [-0.64, 0.64]) {
    const beam = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.12, 0.72, 3, 0.02), materials.templeWall);
    beam.position.set(x, 1.43, 0);
    beam.castShadow = true;
    group.add(beam);
  }

  for (const z of [-0.3, 0.3]) {
    for (let i = 0; i < 5; i += 1) {
      const bracket = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.065, 0.15, 2, 0.014), i % 2 ? materials.templeBlueTrim : materials.templeGold);
      bracket.position.set(-0.48 + i * 0.24, 1.49, z);
      bracket.castShadow = true;
      group.add(bracket);
    }
  }
}

function createPaifangPlaqueMaterial() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = '700 104px "Ma Shan Zheng", "STKaiti", "KaiTi", serif';
  context.lineJoin = "round";
  context.lineWidth = 8;
  context.strokeStyle = "rgba(92, 43, 12, 0.72)";
  context.strokeText("飞檐门楼", 256, 83);
  context.fillStyle = "#f2c24e";
  context.shadowColor = "rgba(30, 18, 8, 0.42)";
  context.shadowBlur = 4;
  context.shadowOffsetY = 3;
  context.fillText("飞檐门楼", 256, 83);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
}

function addPaifangBrace(group, start, end, thickness) {
  const direction = end.clone().sub(start);
  const brace = new THREE.Mesh(new RoundedBoxGeometry(thickness, direction.length(), thickness, 2, thickness * 0.3), materials.templeWall);
  brace.position.copy(start).add(end).multiplyScalar(0.5);
  brace.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  brace.castShadow = true;
  group.add(brace);
}

function addPaifangRoof(group, x, y, width, depth, height) {
  const roof = new THREE.Group();
  roof.position.set(x, y, 0);

  const ceiling = new THREE.Mesh(new RoundedBoxGeometry(width * 0.94, 0.1, depth * 0.88, 3, 0.025), materials.darkTile);
  ceiling.position.y = -0.09;
  ceiling.castShadow = true;
  ceiling.receiveShadow = true;
  roof.add(ceiling);

  const left = new THREE.Mesh(new THREE.BoxGeometry(width, 0.075, depth * 0.62), materials.darkTile);
  left.position.set(0, 0.045, -depth * 0.19);
  left.rotation.x = -0.38;
  left.castShadow = true;
  roof.add(left);
  const right = left.clone();
  right.position.z = depth * 0.18;
  right.rotation.x = 0.38;
  roof.add(right);

  const ridge = new THREE.Mesh(new RoundedBoxGeometry(width * 0.9, 0.075, 0.09, 3, 0.018), materials.templeRoof);
  ridge.position.y = height * 0.38;
  ridge.castShadow = true;
  roof.add(ridge);

  const eaveFront = new THREE.Mesh(new RoundedBoxGeometry(width * 1.08, 0.085, 0.09, 3, 0.018), materials.darkTile);
  eaveFront.position.set(0, -0.06, depth * 0.52);
  eaveFront.castShadow = true;
  roof.add(eaveFront);
  const eaveBack = eaveFront.clone();
  eaveBack.position.z = -depth * 0.52;
  roof.add(eaveBack);

  for (const side of [-1, 1]) {
    const sideEave = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.085, depth * 1.02, 3, 0.018), materials.darkTile);
    sideEave.position.set(side * width * 0.52, -0.055, 0);
    sideEave.castShadow = true;
    roof.add(sideEave);
  }

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

  for (let i = -6; i <= 6; i += 1) {
    for (const side of [-1, 1]) {
      const tile = new THREE.Mesh(new RoundedBoxGeometry(0.016, 0.022, depth * 0.58, 2, 0.005), materials.templeRoof);
      tile.position.set((i / 6) * width * 0.42, 0.075, side * depth * 0.19);
      tile.rotation.x = side * 0.38;
      tile.castShadow = true;
      roof.add(tile);
    }
  }

  for (const z of [-depth * 0.34, depth * 0.34]) {
    const bracketCount = Math.max(3, Math.round(width / 0.28));
    for (let i = 0; i < bracketCount; i += 1) {
      const t = bracketCount === 1 ? 0 : i / (bracketCount - 1);
      const bracket = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.065, 0.14, 2, 0.014), i % 2 ? materials.templeWall : materials.templeBlueTrim);
      bracket.position.set(-width * 0.38 + t * width * 0.76, -0.16, z);
      bracket.castShadow = true;
      roof.add(bracket);
    }
  }

  const trim = new THREE.Mesh(new RoundedBoxGeometry(width * 0.88, 0.055, 0.12, 3, 0.015), materials.templeGold);
  trim.position.set(0, -0.135, depth * 0.4);
  trim.castShadow = true;
  roof.add(trim);
  const rearTrim = trim.clone();
  rearTrim.position.z = -depth * 0.4;
  roof.add(rearTrim);
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
  const floorSlab = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.08, radius * 1.12, 0.08, 8), materials.darkWood);
  floorSlab.rotation.y = Math.PI / 8;
  floorSlab.position.y = y - 0.015;
  floorSlab.castShadow = true;
  floorSlab.receiveShadow = true;
  group.add(floorSlab);

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

  const topTrim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.02, radius * 1.04, 0.055, 8), materials.pavilionRoofDark);
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

  const ceiling = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.08, radius * 1.13, 0.09, 8), materials.pavilionRoofDark);
  ceiling.position.y = -0.105;
  ceiling.castShadow = true;
  ceiling.receiveShadow = true;
  roof.add(ceiling);

  const eave = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.12, radius * 1.24, 0.1, 8), materials.pavilionRoof);
  eave.position.y = -0.06;
  eave.castShadow = true;
  roof.add(eave);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(radius * 1.06, height, 8), materials.pavilionRoof);
  cap.position.y = height * 0.36;
  cap.scale.y = 0.86;
  cap.castShadow = true;
  roof.add(cap);

  const eaveTrim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.16, radius * 1.2, 0.04, 8), materials.templeGold);
  eaveTrim.position.y = -0.125;
  eaveTrim.castShadow = true;
  roof.add(eaveTrim);

  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2;
    const bracket = new THREE.Mesh(new RoundedBoxGeometry(radius * 0.14, 0.055, 0.1, 2, 0.012), i % 2 ? materials.templeGold : materials.darkWood);
    bracket.position.set(Math.cos(angle) * radius * 0.95, -0.18, Math.sin(angle) * radius * 0.95);
    bracket.rotation.y = -angle;
    bracket.castShadow = true;
    roof.add(bracket);
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
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.08, 12), materials.templeGold);
  seat.position.y = 2.22;
  seat.castShadow = true;
  group.add(seat);

  const base = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 10), materials.templeGold);
  base.position.y = 2.29;
  base.scale.y = 0.82;
  base.castShadow = true;
  group.add(base);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.045, 0.22, 12), materials.templeGold);
  stem.position.y = 2.42;
  stem.castShadow = true;
  group.add(stem);

  const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 9), materials.templeGold);
  pearl.position.y = 2.55;
  pearl.castShadow = true;
  group.add(pearl);
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
  addPavilionFloor(group, 1.32, -0.08, 0.66, true);
  addPavilionRoof(group, 1.4, 0.62, 0.62);
  addPavilionFloor(group, 0.96, 0.78, 0.44, false);
  addPavilionRoof(group, 1.12, 0.52, 1.24);
  addPavilionFloor(group, 0.7, 1.38, 0.36, false);
  addPavilionRoof(group, 0.84, 0.48, 1.76);
  addPavilionFinial(group);
  addPavilionLanterns(group);

  compactSandUnder(x, z, 1.42, 0.1);
  return group;
}

function addPavilionBase(group) {
  const base = new THREE.Mesh(new RoundedBoxGeometry(2.78, 0.18, 2.78, 4, 0.05), materials.templeStone);
  base.position.y = -0.34;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const upperBase = new THREE.Mesh(new RoundedBoxGeometry(2.5, 0.16, 2.5, 4, 0.04), materials.roofRidgeWhite);
  upperBase.position.y = -0.17;
  upperBase.castShadow = true;
  upperBase.receiveShadow = true;
  group.add(upperBase);

  const railEdge = 1.2;
  for (let i = -4; i <= 4; i += 1) {
    for (const side of [-1, 1]) {
      const x = i * 0.27;
      if (!(side === 1 && Math.abs(x) < 0.42)) {
        const post = new THREE.Mesh(new RoundedBoxGeometry(0.055, 0.28, 0.055, 2, 0.012), materials.templeStone);
        post.position.set(x, 0.02, side * railEdge);
        post.castShadow = true;
        group.add(post);
      }
      const sidePost = new THREE.Mesh(new RoundedBoxGeometry(0.055, 0.28, 0.055, 2, 0.012), materials.templeStone);
      sidePost.position.set(side * railEdge, 0.02, x);
      sidePost.castShadow = true;
      group.add(sidePost);
    }
  }

  for (const z of [-railEdge, railEdge]) {
    for (const y of [-0.01, 0.09]) {
      const leftRail = new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.045, 0.05, 2, 0.01), materials.templeStone);
      leftRail.position.set(-0.8, y, z);
      const rightRail = leftRail.clone();
      rightRail.position.x = 0.8;
      group.add(leftRail, rightRail);
    }
  }
  for (const x of [-railEdge, railEdge]) {
    for (const y of [-0.01, 0.09]) {
      const rail = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.045, 2.18, 2, 0.01), materials.templeStone);
      rail.position.set(x, y, 0);
      group.add(rail);
    }
  }

  for (let i = 0; i < 4; i += 1) {
    const step = new THREE.Mesh(new RoundedBoxGeometry(0.78 + i * 0.12, 0.055, 0.18, 2, 0.018), materials.templeStone);
    step.position.set(0, -0.26 + i * 0.055, 1.5 - i * 0.14);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);
  }
}

function addPavilionWindow(group, size, y, height, side, offset) {
  const panelWidth = Math.max(0.12, size * 0.18);
  const panelHeight = height * 0.42;
  const panel = new THREE.Mesh(new RoundedBoxGeometry(panelWidth, panelHeight, 0.025, 2, 0.01), materials.castleShadow);
  const local = new THREE.Vector3(offset, y + height * 0.57, size / 2 + 0.014);
  local.applyAxisAngle(new THREE.Vector3(0, 1, 0), side);
  panel.position.copy(local);
  panel.rotation.y = side;
  group.add(panel);

  const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.012, panelHeight * 0.88, 0.012), materials.templeGold);
  vertical.position.copy(local);
  vertical.position.add(new THREE.Vector3(0, 0, 0.018).applyAxisAngle(new THREE.Vector3(0, 1, 0), side));
  vertical.rotation.y = side;
  group.add(vertical);
  const horizontal = new THREE.Mesh(new THREE.BoxGeometry(panelWidth * 0.88, 0.012, 0.012), materials.templeGold);
  horizontal.position.copy(vertical.position);
  horizontal.rotation.y = side;
  group.add(horizontal);
}

function addPavilionBalconyRail(group, size, y) {
  const edge = size * 0.66;
  for (const side of [-1, 1]) {
    const front = new THREE.Mesh(new RoundedBoxGeometry(size * 1.3, 0.04, 0.04, 2, 0.01), materials.templeGold);
    front.position.set(0, y, side * edge);
    const lateral = new THREE.Mesh(new RoundedBoxGeometry(0.04, 0.04, size * 1.3, 2, 0.01), materials.templeGold);
    lateral.position.set(side * edge, y, 0);
    group.add(front, lateral);
    for (let i = -2; i <= 2; i += 1) {
      const post = new THREE.Mesh(new RoundedBoxGeometry(0.025, 0.18, 0.025, 2, 0.006), materials.templeGold);
      post.position.set(i * size * 0.26, y - 0.07, side * edge);
      post.castShadow = true;
      group.add(post);
    }
  }
}

function addPavilionFloor(group, size, y, height, doorway) {
  const floorSlab = new THREE.Mesh(new RoundedBoxGeometry(size * 1.18, 0.08, size * 1.18, 3, 0.02), materials.templeGold);
  floorSlab.position.y = y - 0.02;
  floorSlab.castShadow = true;
  group.add(floorSlab);

  const wall = new THREE.Mesh(new RoundedBoxGeometry(size, height, size, 3, 0.025), materials.pavilionWood);
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

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const column = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.035, size * 0.045, height * 1.08, 12), materials.templeWall);
      column.position.set(sx * size * 0.48, y + height * 0.5, sz * size * 0.48);
      column.castShadow = true;
      group.add(column);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.055, size * 0.06, 0.04, 12), materials.templeGold);
      base.position.set(sx * size * 0.48, y + 0.02, sz * size * 0.48);
      group.add(base);
    }
  }

  for (const side of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    for (const offset of [-size * 0.22, size * 0.22]) addPavilionWindow(group, size, y, height, side, offset);
  }

  if (doorway) {
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.42), materials.castleShadow);
    door.position.set(0, y + 0.28, size / 2 + 0.008);
    group.add(door);
  }

  if (!doorway) addPavilionBalconyRail(group, size, y + 0.15);
}

function addPavilionRoof(group, radius, height, y) {
  const roof = new THREE.Group();
  roof.position.y = y;

  const ceiling = new THREE.Mesh(new RoundedBoxGeometry(radius * 1.82, 0.1, radius * 1.82, 3, 0.025), materials.darkWood);
  ceiling.position.y = -0.09;
  ceiling.castShadow = true;
  ceiling.receiveShadow = true;
  roof.add(ceiling);

  const eave = new THREE.Mesh(new RoundedBoxGeometry(radius * 2.08, 0.08, radius * 2.08, 3, 0.025), materials.pavilionRoof);
  eave.position.y = -0.04;
  eave.castShadow = true;
  roof.add(eave);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 4), materials.pavilionRoof);
  cap.rotation.y = Math.PI / 4;
  cap.position.y = height * 0.42;
  cap.scale.y = 0.82;
  cap.castShadow = true;
  roof.add(cap);

  for (const side of [-1, 1]) {
    for (let i = -3; i <= 3; i += 1) {
      const bracketFront = new THREE.Mesh(new RoundedBoxGeometry(radius * 0.22, 0.06, 0.12, 2, 0.014), i % 2 ? materials.templeGold : materials.templeBlueTrim);
      bracketFront.position.set(i * radius * 0.25, -0.16, side * radius * 0.76);
      bracketFront.castShadow = true;
      roof.add(bracketFront);
      const bracketSide = bracketFront.clone();
      bracketSide.position.set(side * radius * 0.76, -0.16, i * radius * 0.25);
      bracketSide.rotation.y = Math.PI / 2;
      roof.add(bracketSide);
    }
  }

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
      const start = new THREE.Vector3(sx * radius * 0.78, 0.02, sz * radius * 0.78);
      const middle = new THREE.Vector3(sx * radius * 0.98, 0.075, sz * radius * 0.98);
      const end = new THREE.Vector3(sx * radius * 1.13, 0.18, sz * radius * 1.13);
      addPavilionEaveSegment(roof, start, middle, 0.025, 0.035, materials.pavilionRoof);
      addPavilionEaveSegment(roof, middle, end, 0.014, 0.027, materials.pavilionRoof);

      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 8), materials.templeGold);
      tip.position.copy(end);
      tip.scale.set(1, 0.78, 1);
      tip.castShadow = true;
      roof.add(tip);
    }
  }

  group.add(roof);
}

function addPavilionEaveSegment(roof, start, end, topRadius, bottomRadius, material) {
  const direction = end.clone().sub(start);
  const segment = new THREE.Mesh(
    new THREE.CylinderGeometry(topRadius, bottomRadius, direction.length(), 10),
    material,
  );
  segment.position.copy(start).add(end).multiplyScalar(0.5);
  segment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  segment.castShadow = true;
  roof.add(segment);
}

function addPavilionFinial(group) {
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.42, 12), materials.templeGold);
  stem.position.y = 2.28;
  stem.castShadow = true;
  group.add(stem);
  for (let i = 0; i < 3; i += 1) {
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.09 - i * 0.018, 14, 8), materials.templeGold);
    bead.position.y = 2.1 + i * 0.14;
    bead.castShadow = true;
    group.add(bead);
  }
}

function addPavilionLanterns(group) {
  const points = [
    [-1.16, 0.4, 1.16],
    [1.16, 0.4, 1.16],
    [-1.16, 0.4, -1.16],
    [1.16, 0.4, -1.16],
    [-0.82, 1.04, 0.82],
    [0.82, 1.04, 0.82],
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

  const stoneTexture = createSquidStoneTexture();
  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x426d7d,
    bumpMap: stoneTexture,
    bumpScale: 0.018,
    roughness: 0.98,
  });
  addSquidwardBody(group, stoneMaterial);
  addSquidwardFace(group, stoneMaterial);
  addSquidwardDoor(group);
  compactSandUnder(x, z, 1.08, 0.12);
  return group;
}

function addSquidwardBody(group, stoneMaterial) {
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 1, 0.12, 64), materials.templeStone);
  pad.position.y = -0.34;
  pad.scale.set(1.12, 1, 0.75);
  pad.castShadow = true;
  pad.receiveShadow = true;
  group.add(pad);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.83, 2.28, 64), stoneMaterial);
  body.position.y = 0.79;
  body.scale.set(1, 1, 0.72);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.565, 0.59, 0.11, 64), stoneMaterial);
  top.position.y = 1.975;
  top.scale.z = 0.72;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.035, 64), stoneMaterial);
  topCap.position.y = 2.047;
  topCap.scale.z = 0.72;
  topCap.castShadow = true;
  topCap.receiveShadow = true;
  group.add(topCap);

  const chinShadow = new THREE.Mesh(new THREE.CylinderGeometry(0.73, 0.84, 0.045, 64), materials.squidStoneDark);
  chinShadow.position.y = -0.29;
  chinShadow.scale.set(0.98, 1, 0.68);
  group.add(chinShadow);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.84, 0.42, 4, 0.035), stoneMaterial);
    ear.position.set(side * 0.7, 0.88, 0.02);
    ear.rotation.z = side * -0.018;
    ear.castShadow = true;
    ear.receiveShadow = true;
    group.add(ear);

    const edge = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.76, 0.32, 3, 0.012), materials.squidStoneDark);
    edge.position.set(side * 0.845, 0.88, 0.03);
    group.add(edge);
  }
}

function addSquidwardFace(group, stoneMaterial) {
  const brow = new THREE.Mesh(new RoundedBoxGeometry(1.28, 0.17, 0.25, 4, 0.025), stoneMaterial);
  brow.position.set(0, 1.35, 0.53);
  brow.rotation.x = -0.03;
  brow.castShadow = true;
  brow.receiveShadow = true;
  group.add(brow);

  const browShadow = new THREE.Mesh(new RoundedBoxGeometry(1.08, 0.045, 0.028, 3, 0.01), materials.squidStoneDark);
  browShadow.position.set(0, 1.245, 0.665);
  group.add(browShadow);

  addSquidwardWindow(group, -0.3, 1.12, 0.655, 0.17);
  addSquidwardWindow(group, 0.3, 1.12, 0.655, 0.17);

  const noseShadow = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.86, 0.045), materials.squidStoneDark);
  noseShadow.position.set(0.035, 0.72, 0.62);
  noseShadow.rotation.z = -0.015;
  group.add(noseShadow);

  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.235, 0.9, 12), stoneMaterial);
  nose.position.set(0, 0.8, 0.72);
  nose.rotation.y = Math.PI / 4;
  nose.scale.set(0.82, 1, 0.62);
  nose.castShadow = true;
  nose.receiveShadow = true;
  group.add(nose);

  const noseRidge = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.72, 0.016), materials.squidStoneLight);
  noseRidge.position.set(-0.035, 0.86, 0.88);
  noseRidge.rotation.z = -0.08;
  group.add(noseRidge);
}

function addSquidwardWindow(group, x, y, z, radius) {
  const socket = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.2, radius * 1.2, 0.055, 32), materials.squidStoneDark);
  socket.position.set(x, y, z - 0.005);
  socket.rotation.x = Math.PI / 2;
  socket.castShadow = true;
  group.add(socket);

  const frame = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.05, 12, 48), materials.squidWindowFrame);
  frame.position.set(x, y, z);
  frame.castShadow = true;
  group.add(frame);

  const glass = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.71, 32), materials.squidGlass);
  glass.position.set(x, y, z + 0.025);
  group.add(glass);

  const shine = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.18, radius * 0.92, 0.012), materials.roofRidgeWhite);
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
  const frame = new THREE.Mesh(createSquidwardArchGeometry(0.5, 0.78, 0.08), materials.squidStoneDark);
  frame.position.set(0, -0.34, 0.59);
  frame.castShadow = true;
  group.add(frame);

  const door = new THREE.Mesh(createSquidwardArchGeometry(0.4, 0.7, 0.045), materials.squidDoor);
  door.position.set(0, -0.34, 0.675);
  door.castShadow = true;
  group.add(door);

  for (let i = -2; i <= 2; i += 1) {
    const plankLine = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.53, 0.012), materials.squidDoorDark);
    plankLine.position.set(i * 0.071, -0.065, 0.726);
    group.add(plankLine);
  }

  for (let i = 0; i < 4; i += 1) {
    const grain = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.2, 0.01), materials.templeGold);
    grain.position.set(-0.11 + i * 0.073, -0.08 + (i % 2) * 0.1, 0.738);
    grain.rotation.z = 0.1 - i * 0.05;
    group.add(grain);
  }

  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), materials.templeGold);
  knob.position.set(0.13, -0.05, 0.75);
  knob.castShadow = true;
  group.add(knob);

  const step = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.2), materials.cityStone);
  step.position.set(0, -0.36, 0.74);
  step.castShadow = true;
  group.add(step);
}

function createSquidwardArchGeometry(width, height, depth) {
  const radius = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-radius, 0);
  shape.lineTo(-radius, height - radius);
  shape.absarc(0, height - radius, radius, Math.PI, 0, true);
  shape.lineTo(radius, 0);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    curveSegments: 16,
  });
  geometry.center();
  geometry.translate(0, height / 2, -depth / 2);
  return geometry;
}

function loadHighFidelityCarModel() {
  carModelLoader.load(
    "/models/car-concept.glb",
    (gltf) => {
      carModelTemplate = prepareHighFidelityCarModel(gltf.scene);
      const waitingGroups = [...pendingCarGroups];
      pendingCarGroups.clear();
      waitingGroups.forEach(attachHighFidelityCarModel);
      if (waitingGroups.length) showToast("高精度汽车模型加载完成。");
    },
    undefined,
    (error) => {
      console.error("高精度汽车模型加载失败：", error);
      pendingCarGroups.clear();
      showToast("汽车模型加载失败，请刷新页面后重试。");
    },
  );
}

function prepareHighFidelityCarModel(source) {
  const customizedMaterials = new Set();
  const hiddenPartNames = new Set(["License Plate", "InteriorSteeringEmblem"]);

  source.traverse((object) => {
    if (hiddenPartNames.has(object.name)) object.visible = false;
    if (!object.isMesh) return;

    const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
    objectMaterials.forEach((material) => customizeHighFidelityCarMaterial(material, customizedMaterials));
    const isGlass = objectMaterials.some((material) => material?.name === "Glass");
    object.castShadow = !isGlass;
    object.receiveShadow = true;
  });

  const initialBounds = new THREE.Box3().setFromObject(source);
  const initialSize = initialBounds.getSize(new THREE.Vector3());
  source.scale.set(
    1.68 / initialSize.x,
    1.12 / initialSize.y,
    3.92 / initialSize.z,
  );
  source.updateMatrixWorld(true);

  const scaledBounds = new THREE.Box3().setFromObject(source);
  const scaledCenter = scaledBounds.getCenter(new THREE.Vector3());
  source.position.set(
    -scaledCenter.x,
    0.035 - scaledBounds.min.y,
    -scaledCenter.z,
  );

  const normalizedCar = new THREE.Group();
  normalizedCar.name = "HighFidelityCar";
  normalizedCar.add(source);
  normalizedCar.rotation.y = Math.PI / 2;
  return normalizedCar;
}

function customizeHighFidelityCarMaterial(material, customizedMaterials) {
  if (!material || customizedMaterials.has(material)) return;
  customizedMaterials.add(material);

  if (material.name === "Paint 1 Carmine") {
    material.color.set(0x00aabd);
    material.roughness = 0.24;
    material.metalness = 0.58;
  } else if (material.name === "Paint 2 Carmine") {
    material.color.set(0x075764);
    material.roughness = 0.28;
    material.metalness = 0.52;
  } else if (material.name === "Interior 3 Carmine") {
    material.color.set(0xbda88f);
    material.roughness = 0.68;
  } else if (material.name === "Glass") {
    material.color.set(0x88aeb9);
    material.opacity = 0.72;
    material.transmission = 0.28;
    material.roughness = 0.08;
    material.transparent = true;
    material.depthWrite = false;
  }

  material.needsUpdate = true;
}

function attachHighFidelityCarModel(group) {
  if (!carModelTemplate || group.getObjectByName("HighFidelityCar")) return;
  group.add(carModelTemplate.clone(true));
}

function createCar(x, z, rotation) {
  const group = new THREE.Group();
  const y = sampleHeight(x, z);
  group.position.set(x, y - 0.012, z);
  group.rotation.y = rotation;
  group.userData.baseRadius = 2.05;
  group.userData.mass = 1.35;
  group.userData.snapPoints = radialSnapPoints(x, z, 2.02, 8);
  group.userData.erosion = { shape: "wall", width: 4.02, depth: 1.72, localY: 0 };

  if (carModelTemplate) attachHighFidelityCarModel(group);
  else pendingCarGroups.add(group);

  compactSandUnder(x, z, 1.88, 0.045);
  return group;
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
  addPineappleDoorAndWindows(group);
  addPineappleLeaves(group);
  addPineapplePipe(group);
  compactSandUnder(x, z, 1.26, 0.12);
  return group;
}

function addPineappleBase(group) {
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1.05, 0.14, 40), materials.templeStone);
  pad.position.y = -0.2;
  pad.scale.set(1.16, 1, 0.84);
  pad.castShadow = true;
  pad.receiveShadow = true;
  group.add(pad);

  for (let i = 0; i < 4; i += 1) {
    const stone = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.035, 0.17), materials.cityStoneDark);
    stone.position.set(-0.04 + i * 0.105, -0.1 + i * 0.014, 0.84 + i * 0.14);
    stone.rotation.y = (i % 2 ? 0.08 : -0.08);
    stone.castShadow = true;
    group.add(stone);
  }
}

function addPineappleBody(group) {
  const bodyMaterial = new THREE.MeshStandardMaterial({ map: createPineappleTexture(), roughness: 0.76 });
  const profile = [
    new THREE.Vector2(0, -0.06),
    new THREE.Vector2(0.64, -0.06),
    new THREE.Vector2(0.76, 0.02),
    new THREE.Vector2(0.84, 0.25),
    new THREE.Vector2(0.88, 0.72),
    new THREE.Vector2(0.84, 1.14),
    new THREE.Vector2(0.72, 1.48),
    new THREE.Vector2(0.48, 1.68),
    new THREE.Vector2(0.18, 1.76),
    new THREE.Vector2(0, 1.77),
  ];
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 64), bodyMaterial);
  body.scale.z = 0.92;
  body.rotation.y = Math.PI;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
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
  const doorway = new THREE.Mesh(createSquidwardArchGeometry(0.54, 0.75, 0.2), materials.pineappleMetalDark);
  doorway.position.set(0, -0.14, 0.75);
  doorway.castShadow = true;
  group.add(doorway);

  const doorFrame = new THREE.Mesh(createSquidwardArchGeometry(0.48, 0.72, 0.07), materials.pineappleMetal);
  doorFrame.position.set(0, -0.13, 0.8);
  doorFrame.castShadow = true;
  group.add(doorFrame);

  const door = new THREE.Mesh(createSquidwardArchGeometry(0.37, 0.61, 0.045), materials.pineappleDoor);
  door.position.set(0, -0.125, 0.845);
  door.castShadow = true;
  group.add(door);

  addDoorRivets(group, -0.07, 0.875);

  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 8, 24), materials.pineappleMetalDark);
  wheel.position.set(0, 0.18, 0.895);
  group.add(wheel);
  for (let i = 0; i < 4; i += 1) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.13, 0.012), materials.pineappleMetalDark);
    spoke.position.copy(wheel.position);
    spoke.rotation.z = (i / 4) * Math.PI;
    group.add(spoke);
  }
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 8), materials.pineappleMetalDark);
  knob.position.set(0, 0.18, 0.92);
  group.add(knob);

  const threshold = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.055, 0.18, 3, 0.012), materials.cityStone);
  threshold.position.set(0, -0.165, 0.78);
  threshold.castShadow = true;
  group.add(threshold);

  addPineapplePorthole(group, -0.48, 0.72, 0.17);
  addPineapplePorthole(group, 0.48, 0.5, 0.145);
}

function addPineappleLeaves(group) {
  const rings = [
    { count: 8, radius: 0.23, y: 1.6, length: 0.55, width: 0.105, spread: 0.72, lift: 0.58, material: materials.pineappleLeafDark },
    { count: 6, radius: 0.14, y: 1.7, length: 0.6, width: 0.145, spread: 0.42, lift: 0.82, material: materials.pineappleLeaf },
    { count: 4, radius: 0.055, y: 1.78, length: 0.58, width: 0.16, spread: 0.16, lift: 0.98, material: materials.pineappleLeafLight },
  ];

  for (const ring of rings) {
    for (let i = 0; i < ring.count; i += 1) {
      const angle = (i / ring.count) * Math.PI * 2 + (ring.count % 2 ? 0.16 : 0);
      const leaf = createPineappleLeaf(ring.length + (i % 2) * 0.03, ring.material, ring.width);
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

  const crown = createPineappleLeaf(0.64, materials.pineappleLeafLight, 0.17);
  crown.position.set(0, 1.82, 0);
  crown.scale.set(1.06, 1.05, 0.9);
  crown.castShadow = true;
  group.add(crown);

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 12), materials.pineappleLeaf);
  core.position.set(0, 1.7, 0);
  core.scale.set(1, 0.62, 1);
  core.castShadow = true;
  group.add(core);
}

function addPineapplePipe(group) {
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.32, 18), materials.pineappleMetal);
  stem.position.set(0.77, 1.18, 0.18);
  stem.rotation.z = Math.PI / 2;
  stem.castShadow = true;
  group.add(stem);

  const bend = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.055, 12, 28, Math.PI * 0.75), materials.pineappleMetal);
  bend.position.set(0.91, 1.28, 0.18);
  bend.rotation.set(Math.PI / 2, 0, -0.08);
  bend.castShadow = true;
  group.add(bend);

  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.25, 18), materials.pineappleMetal);
  top.position.set(1.025, 1.42, 0.18);
  top.castShadow = true;
  group.add(top);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 8, 20), materials.pineappleMetalDark);
  rim.position.set(1.025, 1.55, 0.18);
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

function addDoorRivets(group, yOffset = 0, z = 0.95) {
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
    rivet.position.set(x, y + yOffset, z);
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

function createPineappleLeaf(length, material, halfWidth = 0.14) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(-halfWidth * 1.05, length * 0.12, -halfWidth, length * 0.62, 0, length);
  shape.bezierCurveTo(halfWidth, length * 0.62, halfWidth * 1.05, length * 0.12, 0, 0);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    curveSegments: 18,
  });
  geometry.translate(0, 0, -0.0275);
  const leaf = new THREE.Mesh(geometry, material);
  leaf.castShadow = true;
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
  forEachTerrainVertexNear(x, z, 1.78, (i, distance) => {
    const trench = smoothstep(1.45, 0.7, distance) - smoothstep(0.68, 0.26, distance);
    const lip = smoothstep(1.78, 1.36, distance) * smoothstep(0.88, 1.16, distance);
    if (trench > 0) terrain.heights[i] -= trench * 0.38;
    if (lip > 0) terrain.heights[i] += lip * 0.1;
    position.setY(i, terrain.heights[i]);
  });
  requestTerrainGeometryUpdate();

  addMoatRingWater(x, z);
}

function addMoatRingWater(x, z) {
  const water = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 1.45, 80),
    new THREE.MeshBasicMaterial({ color: 0x2daebd, transparent: true, opacity: 0.42, side: THREE.DoubleSide })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(x, Math.max(sampleHeight(x, z) + 0.04, ocean.water.position.y + 0.03), z);
  water.userData.moldType = "moat-ring";
  roots.decorations.add(water);
  return water;
}

function carveMoatStroke(from, to) {
  const distance = from.distanceTo(to);
  const steps = Math.max(1, Math.ceil(distance / 0.24));
  deferTerrainUpdates(() => {
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      const x = THREE.MathUtils.lerp(from.x, to.x, t);
      const z = THREE.MathUtils.lerp(from.z, to.z, t);
      const addWater = moatDrag.waterDistance <= 0;
      carveMoatBrush(x, z, 0.72, addWater);
      if (addWater) moatDrag.waterDistance = 0.68;
      moatDrag.waterDistance -= distance / steps;
    }
  });
  playInteractionSound("dig");
  spawnSandPuff(to.x, sampleHeight(to.x, to.z), to.z, 4);
}

function carveMoatBrush(x, z, strength = 1, addWater = false) {
  const position = terrain.mesh.geometry.attributes.position;
  const trenchRadius = 0.46;
  const lipRadius = 0.72;
  forEachTerrainVertexNear(x, z, lipRadius, (i, distance) => {
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
  });
  requestTerrainGeometryUpdate();

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
  water.userData.moldType = "moat-water";
  roots.decorations.add(water);
  return water;
}

function compactSandUnder(x, z, radius, amount) {
  const position = terrain.mesh.geometry.attributes.position;
  forEachTerrainVertexNear(x, z, radius, (i, distance) => {
    const falloff = smoothstep(radius, 0, distance);
    if (falloff <= 0) return;
    terrain.heights[i] += amount * falloff;
    position.setY(i, terrain.heights[i]);
  });
  requestTerrainGeometryUpdate();
}

function buildPresetCastle() {
  pushUndoSnapshot("自动建城");
  const previousRotation = state.rotation;
  deferTerrainUpdates(() => {
    clearBuilds(false);
    const towers = [
      [-4, -3.2],
      [4, -3.2],
      [-4, 3.2],
      [4, 3.2],
    ];
    for (const [x, z] of towers) addBuild(createTower(x, z), "tower");
    const walls = [
      [0, -3.2, 0],
      [0, 3.2, 0],
      [-4, 0, Math.PI / 2],
      [4, 0, Math.PI / 2],
    ];
    for (const [x, z, rotation] of walls) addBuild(createWall(x, z, rotation), "wall");
    state.rotation = 0;
    addBuild(createGate(0, -3.2, 0), "gate");
    carveMoat(0, 0);
    for (let i = 0; i < 18; i += 1) {
      const angle = (i / 18) * Math.PI * 2;
      addDecoration(createShell(Math.cos(angle) * 5.9, Math.sin(angle) * 4.8), "shell");
    }
  });
  state.rotation = previousRotation;
  state.buildCount += 12;
  showToast("已经围好一座安静的大沙堡，可以继续加装饰。");
  playInteractionSound("confirm");
  triggerBuildFeedback();
  scheduleAutoSave();
}

function clearBuilds(show = true, recordHistory = false) {
  if (recordHistory && hasSceneChanges()) pushUndoSnapshot("清空沙面");
  clearEditableSelection(false);
  for (const root of [roots.builds, roots.decorations]) {
    while (root.children.length) {
      pendingCarGroups.delete(root.children[0]);
      root.remove(root.children[0]);
    }
  }
  clearActiveParticles();
  buildObjects.length = 0;
  dynamicDecorations.length = 0;
  sandPuffs.length = 0;
  resetTerrain();
  state.globalStability = 1;
  state.buildCount = 0;
  updateUndoButton();
  if (show) showToast("沙面恢复平整，重新开始。");
  if (!saveSystem.restoring) scheduleAutoSave();
}

function resetTerrain() {
  const position = terrain.mesh.geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    terrain.heights[i] = terrain.baseHeights[i];
    position.setY(i, terrain.heights[i]);
  }
  requestTerrainGeometryUpdate();
}

function spawnSandPuff(x, y, z, count) {
  for (let i = 0; i < count; i += 1) {
    const particle = acquireParticle(0xf3d69e, 0.82);
    const size = 0.035 + Math.random() * 0.025;
    particle.scale.setScalar(size);
    particle.position.set(x + (Math.random() - 0.5) * 0.38, y + 0.15, z + (Math.random() - 0.5) * 0.38);
    particle.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.035, 0.035 + Math.random() * 0.045, (Math.random() - 0.5) * 0.035);
    particle.userData.life = 0.8 + Math.random() * 0.45;
    roots.particles.add(particle);
    sandPuffs.push(particle);
  }
}

function spawnWetSandDrop(x, y, z) {
  const particle = acquireParticle(0x9d7d52, 0.72);
  const size = 0.045 + Math.random() * 0.025;
  particle.scale.setScalar(size);
  particle.position.set(x + (Math.random() - 0.5) * 0.18, y, z + (Math.random() - 0.5) * 0.18);
  particle.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.012, 0.012 + Math.random() * 0.012, (Math.random() - 0.5) * 0.012);
  particle.userData.life = 0.7 + Math.random() * 0.35;
  particle.userData.heavy = true;
  roots.particles.add(particle);
  sandPuffs.push(particle);
}

function acquireParticle(color, opacity) {
  const particle = particlePool.pop() ?? new THREE.Mesh(
    particleGeometry,
    new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }),
  );
  particle.material.color.setHex(color);
  particle.material.opacity = opacity;
  particle.visible = true;
  particle.userData.heavy = false;
  return particle;
}

function releaseParticle(particle) {
  roots.particles.remove(particle);
  particle.visible = false;
  particle.userData.velocity = null;
  if (particlePool.length < 320) particlePool.push(particle);
  else particle.material.dispose();
}

function clearActiveParticles() {
  for (const particle of sandPuffs) releaseParticle(particle);
  sandPuffs.length = 0;
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.04);
  const elapsed = clock.elapsedTime;

  updateWeatherCycle(dt, elapsed);
  state.tideRise = THREE.MathUtils.clamp(state.tideRise + state.tideSpeed * dt, 0, 1);
  const wavePulse = Math.sin(elapsed * 0.72) * 0.07 + Math.sin(elapsed * 1.7) * 0.025;
  const waterLevel = -0.38 + state.tideRise * 0.95 + wavePulse;
  ocean.water.position.y = waterLevel;
  animateWater(dt, elapsed, waterLevel);
  updateMarineLife(dt, elapsed, waterLevel);
  updateFloodProtection(dt);
  updateBuildPhysics(dt, elapsed, waterLevel);
  updateDecorations(dt, elapsed, waterLevel);
  updateSandPuffs(dt);
  updateTerrainWetness(dt, waterLevel);
  updatePreviewPulse(elapsed);
  updateEditableOutline();
  uiUpdateElapsed += dt;
  if (uiUpdateElapsed >= 0.1) {
    uiUpdateElapsed %= 0.1;
    updateUi();
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function animateWater(dt, elapsed, waterLevel) {
  waterUpdateElapsed += dt;
  if (waterUpdateElapsed < 1 / 30) return;
  const updateDt = waterUpdateElapsed;
  waterUpdateElapsed %= 1 / 30;

  const pos = ocean.water.geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getY(i);
    const y = Math.sin(x * 0.34 + elapsed * 1.2) * 0.045 + Math.cos(z * 0.28 + elapsed * 1.6) * 0.035;
    pos.setZ(i, y);
  }
  pos.needsUpdate = true;
  waterNormalElapsed += updateDt;
  if (waterNormalElapsed >= 1 / 15) {
    waterNormalElapsed %= 1 / 15;
    ocean.water.geometry.computeVertexNormals();
  }
  const materialSmoothing = 1 - 0.975 ** (updateDt * 60);
  ocean.water.material.color.lerp(state.weather === "rainy" ? frameColors.waterRainy : frameColors.waterSunny, materialSmoothing);
  ocean.water.material.emissive.lerp(frameColors.waterEmissive, 1 - 0.982 ** (updateDt * 60));
  ocean.water.material.emissiveIntensity = 0.08 + state.tideRise * 0.06;
  ocean.water.material.roughness = THREE.MathUtils.lerp(
    ocean.water.material.roughness,
    state.weather === "rainy" ? 0.38 : 0.2,
    materialSmoothing,
  );
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
  sun.color.copy(frameColors.sunDay).lerp(frameColors.sunWarm, Math.max(sunrise, sunset) * 0.65);
  moonLight.intensity = night * (state.weather === "rainy" ? 0.28 : 0.62);

  hemiLight.intensity = (0.42 + daylight * 1.45) * (state.weather === "rainy" ? 0.68 : 1);
  hemiLight.color.copy(frameColors.hemiDay).lerp(frameColors.hemiNight, night * 0.8);
  hemiLight.groundColor.copy(frameColors.groundDay).lerp(frameColors.groundNight, night * 0.55);

  const sky = frameColors.sky
    .copy(frameColors.skyDay)
    .lerp(frameColors.skySunset, Math.max(sunrise, sunset) * 0.46)
    .lerp(frameColors.skyNight, night * 0.78)
    .lerp(frameColors.skyRain, state.weather === "rainy" ? 0.36 : state.weather === "cloudy" ? 0.18 : 0);
  scene.fog.color.copy(sky);
  scene.fog.near = 30 - night * 6 + (state.weather === "rainy" ? -6 : 0);
  scene.fog.far = 94 - night * 18 - (state.weather === "rainy" ? 18 : state.weather === "cloudy" ? 10 : 0);

  materials.lantern.emissiveIntensity = night * 1.35;
  materials.kfcWarm.emissiveIntensity = 0.16 + night * 0.92;
  materials.nightGlowWarm.opacity = night * (state.weather === "rainy" ? 0.92 : 0.76);
  materials.nightGlowCool.opacity = night * 0.9;
  updateAmbientAudio(dt, night);
  updateWeatherVisuals(dt, elapsed, daylight, night, sunrise, sunset);
}

function updateWeatherVisuals(dt, elapsed, daylight, night, sunrise, sunset) {
  const horizonGlow = Math.max(sunrise, sunset);
  const rainy = state.weather === "rainy";
  if (elapsed >= nextSkyTextureUpdate) {
    nextSkyTextureUpdate = elapsed + 1 / 15;
    const skyTop = frameColors.skyTop
      .copy(frameColors.skyTopDay)
      .lerp(frameColors.skyTopSunset, horizonGlow * 0.34)
      .lerp(frameColors.skyTopNight, night * 0.82)
      .lerp(frameColors.skyTopRain, rainy ? 0.32 : state.weather === "cloudy" ? 0.14 : 0);
    const skyHorizon = frameColors.skyHorizon
      .copy(frameColors.horizonDay)
      .lerp(frameColors.horizonSunset, horizonGlow * 0.58)
      .lerp(frameColors.horizonNight, night * 0.72)
      .lerp(frameColors.horizonRain, rainy ? 0.28 : 0);
    updateSkyGradient(skyTop, skyHorizon);
  }

  const cloudiness = state.weather === "sunny" ? 0.28 : state.weather === "cloudy" ? 1 : 0.86;
  const cloudTint = frameColors.cloudTint.copy(
    state.weather === "rainy" ? frameColors.cloudRainy : horizonGlow > 0.2 ? frameColors.cloudSunset : frameColors.cloudSunny,
  );
  weatherVisuals.clouds.children.forEach((cloud, index) => {
    cloud.position.x += cloud.userData.speed * dt * (state.weather === "rainy" ? 1.25 : 1);
    if (cloud.position.x > 44) cloud.position.x = -44;
    cloud.position.y += Math.sin(elapsed * 0.25 + cloud.userData.float) * 0.0024 * dt * 60;
    const showExtraCloud = cloud.userData.cloudyOnly ? cloudiness : 1;
    const targetOpacity = cloud.userData.baseOpacity * showExtraCloud * (0.62 + daylight * 0.38);
    cloud.children.forEach((puff) => {
      const twinkle = 0.86 + Math.sin(elapsed * 0.42 + index * 0.7 + puff.position.x) * 0.08;
      puff.material.opacity = THREE.MathUtils.lerp(puff.material.opacity, targetOpacity * twinkle, dt * 1.8);
      puff.material.color.copy(puff.userData.tint).lerp(cloudTint, state.weather === "sunny" ? 0.12 : 0.34);
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

function updateFloodProtection(dt) {
  floodProtectionElapsed += dt;
  if (floodProtectionElapsed < 0.45) return;
  floodProtectionElapsed %= 0.45;

  for (const item of buildObjects) {
    const center = item.group.position;
    let wallProtection = 0;
    for (const wall of buildObjects) {
      if (wall === item || !["wall", "citygate"].includes(wall.group.userData.moldType)) continue;
      const distance = horizontalDistance(center, wall.group.position);
      if (distance >= 5.2) continue;
      wallProtection += 0.16 + (1 - distance / 5.2) * 0.18;
    }

    const radius = THREE.MathUtils.clamp((item.group.userData.baseRadius ?? 0.8) + 0.9, 1.35, 3.1);
    let trenchSamples = 0;
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2;
      const sampleX = center.x + Math.cos(angle) * radius;
      const sampleZ = center.z + Math.sin(angle) * radius;
      const trenchDepth = sampleBaseHeight(sampleX, sampleZ) - sampleHeight(sampleX, sampleZ);
      if (trenchDepth > 0.11) trenchSamples += 1;
    }

    item.wallProtection = Math.min(0.52, wallProtection);
    item.moatProtection = trenchSamples >= 3 ? Math.min(0.56, (trenchSamples / 12) * 0.78) : 0;
    item.floodProtection = 1 - (1 - item.wallProtection) * (1 - item.moatProtection);
  }
}

function updateBuildPhysics(dt, elapsed, waterLevel) {
  let totalStability = buildObjects.length ? 0 : 1;
  for (const item of buildObjects) {
    const group = item.group;
    const baseWater = waterLevel - (item.baseY - 0.1);
    const rawWaterExposure = smoothstep(-0.35, 0.8, baseWater);
    const nearWater = rawWaterExposure * (1 - item.floodProtection * 0.76);
    item.wetness = THREE.MathUtils.lerp(item.wetness, nearWater, dt * 1.2);

    const resistance = getEffectiveFloodResistance(item);
    const wetBenefit = item.wetness > 0.08 && item.wetness < 0.38 ? item.wetness * 0.018 : 0;
    const erosion = Math.max(0, item.wetness - 0.52)
      * (0.055 + state.tideRise * 0.07)
      * (1 - resistance * 0.82)
      * (1 - item.floodProtection * 0.62)
      * dt;
    item.stability = THREE.MathUtils.clamp(item.stability + wetBenefit * dt - erosion, 0.08, 1);
    item.collapse = THREE.MathUtils.lerp(item.collapse, 1 - item.stability, dt * 0.8);

    const warningLevel = item.stability < 0.24 ? 2 : item.stability < 0.46 ? 1 : 0;
    if (warningLevel > item.warningLevel && group === editState.selected?.group) {
      showToast(warningLevel === 2 ? `${getEditableBuildLabel(item)}濒临坍塌，请立即修复。` : `${getEditableBuildLabel(item)}稳定度偏低，需要修复或加固。`);
    }
    item.warningLevel = warningLevel;

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
      group.position.x += item.velocity.x * dt * 60;
      group.position.z += item.velocity.z * dt * 60;
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
    particle.position.addScaledVector(particle.userData.velocity, dt * 60);
    particle.material.opacity = Math.max(0, particle.userData.life);
    if (particle.userData.life <= 0) {
      releaseParticle(particle);
      sandPuffs.splice(i, 1);
    }
  }
}

function updateTerrainWetness(dt, waterLevel) {
  const wet = smoothstep(-0.2, 0.74, waterLevel);
  const color = frameColors.terrain.lerpColors(frameColors.drySand, frameColors.dampSand, wet * 0.62);
  terrain.mesh.material.color.lerp(color, 1 - Math.exp(-2.45 * dt));
  terrain.mesh.material.roughness = 0.92 - wet * 0.18;

  if (state.tideRise <= 0.34) {
    erosionUpdateElapsed = 0;
    return;
  }
  erosionUpdateElapsed += dt;
  if (erosionUpdateElapsed < 3) return;
  erosionUpdateElapsed %= 3;
  erodeShore(waterLevel, 1 - 0.996 ** 10);
}

function updatePreviewPulse(elapsed) {
  if (!snapMarker.visible) return;
  const scale = 1 + Math.sin(elapsed * 5) * 0.12;
  snapMarker.scale.set(scale, scale, scale);
}

function erodeShore(waterLevel, erosionStrength) {
  const position = terrain.mesh.geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const y = terrain.heights[i];
    if (Math.abs(y - waterLevel) > 0.08) continue;
    const x = position.getX(i);
    const z = position.getZ(i);
    const radial = Math.sqrt((x / 18) ** 2 + (z / 13.5) ** 2);
    if (radial < 0.55 || radial > 1.22) continue;
    terrain.heights[i] = THREE.MathUtils.lerp(terrain.heights[i], terrain.baseHeights[i] - 0.05, erosionStrength);
    position.setY(i, terrain.heights[i]);
  }
  requestTerrainGeometryUpdate();
}

function updateUi() {
  setMeter("tide", state.tideRise);
  setMeter("stability", state.globalStability);
  setMeter("mood", state.mood);
  const phaseWeather = `${dayPhaseLabel()} · ${weatherLabel(state.weather)}`;
  if (ui.lastPhaseWeather !== phaseWeather) {
    ui.lastPhaseWeather = phaseWeather;
    ui.skyStatus.textContent = phaseWeather;
    ui.timePhase.textContent = phaseWeather;
  }
  const gameTime = formatGameTime();
  if (ui.lastGameTime !== gameTime) {
    ui.lastGameTime = gameTime;
    ui.gameTime.textContent = gameTime;
  }
  updateTideButtons();
  updateTimeButton();
  updateTideGameplayAlert();
  updateSelectedBuildStatus();
}

function updateTideGameplayAlert() {
  const risingWarning = state.tideSpeed > 0 && state.tideRise >= 0.5;
  const highTide = state.tideRise >= 0.76;
  const warningLevel = highTide ? 2 : risingWarning ? 1 : 0;
  const criticalBuilds = buildObjects.filter((item) => item.stability < 0.46).length;

  if (warningLevel !== tideGameplay.warningLevel) {
    tideGameplay.warningLevel = warningLevel;
  }
  tideGameplay.criticalBuilds = criticalBuilds;

  ui.tideAlert.classList.toggle("show", warningLevel > 0);
  ui.tideAlert.classList.toggle("critical", warningLevel === 2 || criticalBuilds > 0);
  if (warningLevel === 2) {
    ui.tideAlertText.textContent = "高潮危险";
  } else if (warningLevel === 1) {
    ui.tideAlertText.textContent = "涨潮预警";
  }
}

function formatGameTime() {
  const totalMinutes = Math.floor(state.dayTime * 24 * 60);
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function setMeter(id, value) {
  const percent = Math.round(THREE.MathUtils.clamp(value, 0, 1) * 100);
  if (ui.lastMeterValues[id] === percent) return;
  ui.lastMeterValues[id] = percent;
  ui.meters[id].style.width = `${percent}%`;
  ui.meterValues[id].textContent = `${percent}%`;
}

function setTideSpeed(speed, message) {
  state.tideSpeed = speed;
  if (speed !== 0) state.lastTideSpeed = speed;
  updateTideButtons();
  showToast(message);
  playInteractionSound("water");
  scheduleAutoSave();
}

function updateTideButtons() {
  const tideState = state.tideSpeed === 0 ? "paused" : state.tideSpeed > 0 ? "flood" : "ebb";
  if (ui.lastTideState === tideState) return;
  ui.lastTideState = tideState;
  ui.pauseTideButton.textContent = state.tideSpeed === 0 ? "继续潮汐" : "暂停潮汐";
  ui.floodTideButton.classList.toggle("active", state.tideSpeed > 0);
  ui.ebbTideButton.classList.toggle("active", state.tideSpeed < 0);
}

function updateTimeButton() {
  if (ui.lastTimePaused === state.timePaused) return;
  ui.lastTimePaused = state.timePaused;
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

function sampleBaseHeight(x, z) {
  const halfW = terrain.width / 2;
  const halfD = terrain.depth / 2;
  const u = THREE.MathUtils.clamp((x + halfW) / terrain.width, 0, 1);
  const v = THREE.MathUtils.clamp((z + halfD) / terrain.depth, 0, 1);
  const ix = Math.round(u * terrain.segmentsX);
  const iz = Math.round(v * terrain.segmentsZ);
  const index = iz * (terrain.segmentsX + 1) + ix;
  return terrain.baseHeights[index] ?? 0;
}

function forEachTerrainVertexNear(x, z, radius, callback) {
  const halfW = terrain.width / 2;
  const halfD = terrain.depth / 2;
  const minX = THREE.MathUtils.clamp(Math.floor(((x - radius + halfW) / terrain.width) * terrain.segmentsX), 0, terrain.segmentsX);
  const maxX = THREE.MathUtils.clamp(Math.ceil(((x + radius + halfW) / terrain.width) * terrain.segmentsX), 0, terrain.segmentsX);
  const minZ = THREE.MathUtils.clamp(Math.floor(((z - radius + halfD) / terrain.depth) * terrain.segmentsZ), 0, terrain.segmentsZ);
  const maxZ = THREE.MathUtils.clamp(Math.ceil(((z + radius + halfD) / terrain.depth) * terrain.segmentsZ), 0, terrain.segmentsZ);
  const position = terrain.mesh.geometry.attributes.position;
  const rowSize = terrain.segmentsX + 1;

  for (let iz = minZ; iz <= maxZ; iz += 1) {
    for (let ix = minX; ix <= maxX; ix += 1) {
      const index = iz * rowSize + ix;
      const distance = Math.hypot(position.getX(index) - x, position.getZ(index) - z);
      if (distance <= radius) callback(index, distance);
    }
  }
}

function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function createAudioSystem() {
  let muted = false;
  try {
    muted = window.localStorage.getItem(AUDIO_MUTED_KEY) === "true";
  } catch (error) {
    console.warn("无法读取声音设置：", error);
  }

  const tracks = {
    ocean: new Audio("/audio/seaside-waves-birds.mp3"),
    wind: new Audio("/audio/soft-wind.mp3"),
    rain: new Audio("/audio/rain-thunder-birds.mp3"),
    night: new Audio("/audio/night-cricket.mp3"),
  };
  Object.values(tracks).forEach((track) => {
    track.loop = true;
    track.preload = "auto";
    track.volume = 0;
  });

  ui.soundButton.classList.toggle("muted", muted);
  ui.soundButton.setAttribute("aria-pressed", String(!muted));

  return {
    muted,
    unlocked: false,
    context: null,
    masterGain: null,
    noiseBuffer: null,
    tracks,
    nextDigAt: 0,
  };
}

function unlockAudio() {
  if (!audioSystem.context) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioSystem.context = new AudioContext();
      audioSystem.masterGain = audioSystem.context.createGain();
      audioSystem.masterGain.gain.value = audioSystem.muted ? 0 : 0.22;
      audioSystem.masterGain.connect(audioSystem.context.destination);
      audioSystem.noiseBuffer = createNoiseBuffer(audioSystem.context);
    }
  }
  audioSystem.context?.resume();
  audioSystem.unlocked = true;
  if (!audioSystem.muted) startAmbientTracks();
}

function startAmbientTracks() {
  if (document.hidden) return;
  Object.values(audioSystem.tracks).forEach((track) => {
    const promise = track.play();
    if (promise) promise.catch(() => {});
  });
}

function toggleAudio() {
  audioSystem.muted = !audioSystem.muted;
  try {
    window.localStorage.setItem(AUDIO_MUTED_KEY, String(audioSystem.muted));
  } catch (error) {
    console.warn("无法保存声音设置：", error);
  }
  ui.soundButton.classList.toggle("muted", audioSystem.muted);
  ui.soundButton.setAttribute("aria-pressed", String(!audioSystem.muted));
  unlockAudio();
  if (audioSystem.masterGain) {
    audioSystem.masterGain.gain.setTargetAtTime(audioSystem.muted ? 0 : 0.22, audioSystem.context.currentTime, 0.04);
  }
  if (audioSystem.muted) {
    Object.values(audioSystem.tracks).forEach((track) => {
      track.volume = 0;
      track.pause();
    });
  } else {
    startAmbientTracks();
    playInteractionSound("confirm");
  }
  showToast(audioSystem.muted ? "环境声音已关闭。" : "环境声音已开启。互动画面会随天气和昼夜变化。"
  );
}

function updateAmbientAudio(dt, night) {
  const targets = {
    ocean: 0.15 + state.tideRise * 0.1,
    wind: state.weather === "rainy" ? 0.07 : state.weather === "cloudy" ? 0.055 : 0.032,
    rain: state.weather === "rainy" ? 0.26 : 0,
    night: night * (state.weather === "rainy" ? 0.035 : 0.1),
  };
  for (const [name, track] of Object.entries(audioSystem.tracks)) {
    const target = audioSystem.muted || document.hidden ? 0 : targets[name];
    track.volume = THREE.MathUtils.lerp(track.volume, target, 1 - Math.exp(-1.7 * dt));
  }
}

function createNoiseBuffer(context) {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.5), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  return buffer;
}

function playInteractionSound(kind) {
  const context = audioSystem.context;
  if (!context || audioSystem.muted || context.state !== "running") return;
  const now = context.currentTime;
  if (kind === "dig" && now < audioSystem.nextDigAt) return;
  if (kind === "dig") audioSystem.nextDigAt = now + 0.16;

  const tones = {
    rotate: [520, 740, 0.09, "sine", 0.08],
    place: [210, 128, 0.16, "triangle", 0.12],
    confirm: [620, 880, 0.16, "sine", 0.08],
    repair: [390, 760, 0.22, "sine", 0.1],
    delete: [190, 90, 0.18, "triangle", 0.09],
    water: [280, 190, 0.24, "sine", 0.06],
  };
  const tone = tones[kind];
  if (tone) playSynthTone(...tone);
  if (kind === "place" || kind === "dig" || kind === "water") {
    playNoiseBurst(kind === "dig" ? 0.13 : 0.09, kind === "water" ? 720 : 1250, kind === "dig" ? 0.09 : 0.055);
  }
}

function playSynthTone(startFrequency, endFrequency, duration, waveType, volume) {
  const context = audioSystem.context;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  oscillator.type = waveType;
  oscillator.frequency.setValueAtTime(startFrequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(audioSystem.masterGain);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function playNoiseBurst(duration, frequency, volume) {
  if (!audioSystem.noiseBuffer) return;
  const context = audioSystem.context;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const now = context.currentTime;
  source.buffer = audioSystem.noiseBuffer;
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = 0.72;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.connect(filter).connect(gain).connect(audioSystem.masterGain);
  source.start(now);
  source.stop(now + duration + 0.02);
}

function triggerBuildFeedback() {
  ui.shell.classList.remove("build-feedback");
  void ui.shell.offsetWidth;
  ui.shell.classList.add("build-feedback");
  window.setTimeout(() => ui.shell.classList.remove("build-feedback"), 380);
  navigator.vibrate?.(14);
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
