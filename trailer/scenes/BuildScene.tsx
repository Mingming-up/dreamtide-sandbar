import React from "react";
import { AbsoluteFill, CanvasImage, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CinematicBars, Grain, KineticLabel } from "../components";

export const BuildScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#8dcfd2", overflow: "hidden" }}>
      <CanvasImage
        name="Build vision"
        src={staticFile("features/free-build.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          scale: interpolate(frame, [0, durationInFrames - 1], [1.04, 1.13], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.2, 0.7, 0.2, 1) }),
          translate: interpolate(frame, [0, durationInFrames - 1], ["0px 12px", "-24px -18px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          filter: "contrast(1.08) saturate(1.12) brightness(.88)",
        }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(2,30,39,.86) 0%, rgba(2,30,39,.36) 46%, transparent 76%), linear-gradient(0deg, rgba(2,21,28,.58), transparent 54%)" }} />
      <div
        style={{
          position: "absolute",
          top: 74,
          right: 72,
          width: 410,
          height: 231,
          overflow: "hidden",
          border: "2px solid rgba(255,239,196,.74)",
          borderRadius: 8,
          boxShadow: "0 24px 55px rgba(0,25,31,.48)",
          opacity: interpolate(frame, [16, 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          scale: interpolate(frame, [16, 32], [0.78, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({ damping: 160 }), output: "perceptual-scale" }),
          rotate: interpolate(frame, [16, durationInFrames - 1], ["2.5deg", "-1deg"], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <CanvasImage
          name="Real gameplay proof"
          src={staticFile("showcase/real-gameplay.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", scale: 1.08, filter: "contrast(1.35) saturate(1.3) brightness(.86)" }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 326,
          right: 72,
          color: "rgba(255,247,224,.8)",
          fontFamily: "Arial, sans-serif",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.18em",
          opacity: interpolate(frame, [28, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        REAL IN-GAME FOOTAGE · 实机画面
      </div>
      <KineticLabel kicker="SHAPE EVERY GRAIN" title="一粒沙，也能筑成世界" />
      <Grain warm />
      <CinematicBars />
    </AbsoluteFill>
  );
};
