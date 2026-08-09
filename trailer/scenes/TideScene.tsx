import React from "react";
import { AbsoluteFill, CanvasImage, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CinematicBars, Grain, KineticLabel } from "../components";

export const TideScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#04222b", overflow: "hidden" }}>
      <CanvasImage
        name="Sunrise wave"
        src={staticFile("video/trailer-assets/cinematic-sunrise.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          scale: interpolate(frame, [0, durationInFrames - 1], [1.09, 1.015], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.22, 1, 0.36, 1) }),
          translate: interpolate(frame, [0, durationInFrames - 1], ["-24px 8px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          filter: "contrast(1.08) saturate(1.08)",
        }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(0,15,22,.82) 0%, rgba(0,15,22,.32) 44%, transparent 72%), linear-gradient(0deg, rgba(0,9,14,.62), transparent 48%)" }} />
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 76% 26%, rgba(255,215,137,.36), transparent 32%)",
          opacity: interpolate(frame, [0, 26, 58, 95], [0.2, 0.72, 0.34, 0.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
      <KineticLabel kicker="THE TIDE IS CALLING" title="当潮汐，扑面而来" />
      <Grain warm />
      <CinematicBars />
    </AbsoluteFill>
  );
};
