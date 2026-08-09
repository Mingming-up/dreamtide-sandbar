import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const Grain: React.FC<{ warm?: boolean }> = ({ warm = false }) => {
  return (
    <AbsoluteFill
      style={{
        opacity: 0.07,
        backgroundImage: `radial-gradient(circle at 18% 22%, rgba(255,255,255,.26) 0 1px, transparent 1.6px), radial-gradient(circle at 76% 68%, ${warm ? "rgba(255,218,148,.24)" : "rgba(111,218,229,.18)"} 0 1px, transparent 1.8px)`,
        backgroundSize: "137px 131px, 191px 179px",
        mixBlendMode: "screen",
      }}
    />
  );
};

export const CinematicBars: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", inset: "0 0 auto", height: 22, backgroundColor: "#02080b" }} />
    <div style={{ position: "absolute", inset: "auto 0 0", height: 22, backgroundColor: "#02080b" }} />
  </AbsoluteFill>
);

export const KineticLabel: React.FC<{ kicker: string; title: string; align?: "left" | "center" }> = ({ kicker, title, align = "left" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        left: align === "center" ? 90 : 82,
        right: align === "center" ? 90 : "auto",
        bottom: 82,
        color: "#fff7df",
        textAlign: align,
        filter: "drop-shadow(0 8px 24px rgba(0,13,19,.72))",
      }}
    >
      <div
        style={{
          color: "#8be9dc",
          fontFamily: "Arial, sans-serif",
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: "0.28em",
          opacity: interpolate(frame, [0, 0.45 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          translate: interpolate(frame, [0, 0.45 * fps], ["0px 18px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }),
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          marginTop: 12,
          fontFamily: '"Dreamtide Brush", "Songti SC", serif',
          fontSize: 76,
          lineHeight: 0.98,
          letterSpacing: "0.04em",
          opacity: interpolate(frame, [0.12 * fps, 0.72 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          scale: interpolate(frame, [0.12 * fps, 0.72 * fps], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({ damping: 180 }), output: "perceptual-scale" }),
          translate: interpolate(frame, [0.12 * fps, 0.72 * fps], ["0px 30px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }),
        }}
      >
        {title}
      </div>
      <div
        style={{
          width: align === "center" ? "100%" : 168,
          height: 2,
          marginTop: 16,
          background: "linear-gradient(90deg, #f6d99e, rgba(246,217,158,0))",
          opacity: interpolate(frame, [0.45 * fps, 0.9 * fps], [0, 0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          scale: interpolate(frame, [0.45 * fps, 0.9 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }),
          transformOrigin: align === "center" ? "center" : "left",
        }}
      />
    </div>
  );
};
