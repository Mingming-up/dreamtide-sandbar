export const MAX_SAVE_FILE_SIZE = 2 * 1024 * 1024;

const MAX_BUILDS = 1000;
const MAX_DECORATIONS = 2000;
const MAX_POSITION = 256;
const MAX_CAMERA_POSITION = 1000;
const MAX_THUMBNAIL_LENGTH = 256 * 1024;
const BUILD_TYPES = new Set([
  "tower", "wall", "gate", "temple", "paifang", "pavilion", "wenchang",
  "citygate", "paintedgate", "pineapple", "squidward", "su7", "kfc",
]);
const DECORATION_TYPES = new Set([
  "shell", "pebble", "driftwood", "seaweed", "palm", "flowers", "person",
  "flag", "moat-water", "moat-ring",
]);

function isFiniteNumber(value, limit = Number.MAX_VALUE) {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;
}

function hasValidOptionalNumbers(record, fields, limit) {
  return fields.every((field) => record[field] === undefined || isFiniteNumber(record[field], limit));
}

function isValidRecord(record, allowedTypes, optionalFields) {
  return record !== null
    && typeof record === "object"
    && allowedTypes.has(record.type)
    && isFiniteNumber(record.x, MAX_POSITION)
    && isFiniteNumber(record.z, MAX_POSITION)
    && hasValidOptionalNumbers(record, optionalFields, MAX_POSITION);
}

function isValidVector(value, limit) {
  return Array.isArray(value) && value.length === 3 && value.every((item) => isFiniteNumber(item, limit));
}

export function validateSaveData(save) {
  if (save === null || typeof save !== "object" || save.format !== "dream-sandbar" || save.version !== 1) return false;
  if (save.name !== undefined && (typeof save.name !== "string" || save.name.length > 100)) return false;
  if (save.thumbnail !== undefined && save.thumbnail !== null) {
    if (typeof save.thumbnail !== "string"
      || save.thumbnail.length > MAX_THUMBNAIL_LENGTH
      || !save.thumbnail.startsWith("data:image/jpeg;base64,")) return false;
  }

  const builds = save.builds ?? [];
  const decorations = save.decorations ?? [];
  if (!Array.isArray(builds) || builds.length > MAX_BUILDS) return false;
  if (!Array.isArray(decorations) || decorations.length > MAX_DECORATIONS) return false;
  if (!builds.every((record) => isValidRecord(
    record,
    BUILD_TYPES,
    ["rotation", "baseY", "stability", "wetness", "collapse", "reinforcement"],
  ))) return false;
  if (!decorations.every((record) => isValidRecord(record, DECORATION_TYPES, ["y", "rotation"]))) return false;

  if (save.terrainHeights !== undefined) {
    if (!Array.isArray(save.terrainHeights)
      || save.terrainHeights.length > 20000
      || !save.terrainHeights.every((height) => isFiniteNumber(height, 10))) return false;
  }
  if (save.camera !== undefined) {
    if (save.camera === null || typeof save.camera !== "object") return false;
    if (save.camera.position !== undefined && !isValidVector(save.camera.position, MAX_CAMERA_POSITION)) return false;
    if (save.camera.target !== undefined && !isValidVector(save.camera.target, MAX_CAMERA_POSITION)) return false;
  }

  const world = save.world;
  if (world !== undefined) {
    if (world === null || typeof world !== "object") return false;
    if (!hasValidOptionalNumbers(world, [
      "tideRise", "tideSpeed", "lastTideSpeed", "dayTime", "lunarPhase",
      "weatherTimer", "buildCount", "globalStability", "mood",
    ], 100000)) return false;
    if (world.weather !== undefined && !["sunny", "cloudy", "rainy"].includes(world.weather)) return false;
    if (world.timePaused !== undefined && typeof world.timePaused !== "boolean") return false;
  }
  return true;
}
