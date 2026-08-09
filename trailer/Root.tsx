import React from "react";
import { Composition, Folder } from "remotion";
import { DreamtideTrailer } from "./Trailer";
import { BuildScene } from "./scenes/BuildScene";
import { FinaleScene } from "./scenes/FinaleScene";
import { MoonScene } from "./scenes/MoonScene";
import { TideScene } from "./scenes/TideScene";
import "./fonts.css";

export const TrailerRoot: React.FC = () => (
  <>
    <Folder name="Dreamtide-Scenes">
      <Composition id="TideScene" component={TideScene} durationInFrames={96} fps={30} width={1280} height={720} />
      <Composition id="BuildScene" component={BuildScene} durationInFrames={96} fps={30} width={1280} height={720} />
      <Composition id="MoonScene" component={MoonScene} durationInFrames={96} fps={30} width={1280} height={720} />
      <Composition id="FinaleScene" component={FinaleScene} durationInFrames={108} fps={30} width={1280} height={720} />
    </Folder>
    <Composition id="DreamtideTrailer" component={DreamtideTrailer} durationInFrames={360} fps={30} width={1280} height={720} />
  </>
);
