import React from "react";
import { AbsoluteFill, CanvasImage, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CinematicBars, Grain, KineticLabel } from "../components";

export const MoonScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#021426", overflow: "hidden" }}>
      <CanvasImage
        name="Moonlit tide"
        src={staticFile("video/trailer-assets/cinematic-moonrise.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          scale: interpolate(frame, [0, durationInFrames - 1], [1.02, 1.12], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }),
          translate: interpolate(frame, [0, durationInFrames - 1], ["0px 0px", "24px -10px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          filter: "contrast(1.1) saturate(1.06)",
        }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(1,12,29,.82) 0%, rgba(1,12,29,.28) 47%, transparent 72%), linear-gradient(0deg, rgba(1,8,22,.55), transparent 52%)" }} />
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 24% 18%, rgba(112,205,255,.34), transparent 23%), radial-gradient(circle at 72% 63%, rgba(255,170,72,.16), transparent 25%)",
          opacity: interpolate(frame, [0, 32, 70, 95], [0.12, 0.7, 0.46, 0.18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
      <KineticLabel kicker="TIDES · WEATHER · STARLIGHT" title="让世界，随星光改变" />
      <Grain />
      <CinematicBars />
    </AbsoluteFill>
  );
};
