import React from "react";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { BuildScene } from "./scenes/BuildScene";
import { FinaleScene } from "./scenes/FinaleScene";
import { MoonScene } from "./scenes/MoonScene";
import { TideScene } from "./scenes/TideScene";

export const DreamtideTrailer: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#031b26" }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={96} name="The tide arrives">
        <TideScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence durationInFrames={96} name="Build freely">
        <BuildScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence durationInFrames={96} name="The world changes">
        <MoonScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence durationInFrames={108} name="Brand reveal">
        <FinaleScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    <Audio src={staticFile("video/trailer-assets/dreamtide-score.wav")} volume={0.92} />
    <Sequence from={0} durationInFrames={360} name="Ocean ambience">
      <Audio
        src={staticFile("audio/seaside-waves-birds.mp3")}
        loop
        volume={(frame) => Math.min(0.16, 0.04 + frame / 1800)}
      />
    </Sequence>
  </AbsoluteFill>
);
