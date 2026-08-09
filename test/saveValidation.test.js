import assert from "node:assert/strict";
import test from "node:test";

import { validateSaveData } from "../src/saveValidation.js";

const validSave = () => ({
  format: "dream-sandbar",
  version: 1,
  builds: [{ type: "tower", x: 1, z: -2, rotation: 0 }],
  decorations: [{ type: "shell", x: 2, y: 0.2, z: 3, rotation: 0 }],
  terrainHeights: [0, 0.25, -0.4],
  world: { tideRise: 0.5, weather: "sunny", timePaused: false },
  camera: { position: [16, 18, 22], target: [0, 0.7, 0] },
});

test("accepts a valid save", () => {
  assert.equal(validateSaveData(validSave()), true);
});

test("rejects unknown object types and non-finite coordinates", () => {
  const unknownType = validSave();
  unknownType.builds[0].type = "script";
  assert.equal(validateSaveData(unknownType), false);

  const invalidCoordinate = validSave();
  invalidCoordinate.decorations[0].x = Number.POSITIVE_INFINITY;
  assert.equal(validateSaveData(invalidCoordinate), false);
});

test("rejects oversized collections and remote thumbnails", () => {
  const tooManyBuilds = validSave();
  tooManyBuilds.builds = Array.from({ length: 1001 }, () => ({ type: "tower", x: 0, z: 0 }));
  assert.equal(validateSaveData(tooManyBuilds), false);

  const remoteThumbnail = validSave();
  remoteThumbnail.thumbnail = "https://example.com/tracker.png";
  assert.equal(validateSaveData(remoteThumbnail), false);
});
