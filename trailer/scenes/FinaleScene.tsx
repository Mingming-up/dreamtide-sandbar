import React from "react";
import { AbsoluteFill, CanvasImage, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CinematicBars, Grain } from "../components";

export const FinaleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#041d24", overflow: "hidden" }}>
      <CanvasImage
        name="Dreamtide world"
        src={staticFile("video/trailer-assets/cinematic-sunrise.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          scale: interpolate(frame, [0, durationInFrames - 1], [1.2, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }),
          translate: interpolate(frame, [0, durationInFrames - 1], ["-42px 0px", "-8px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          filter: "brightness(.47) contrast(1.15) saturate(.88)",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 47%, rgba(10,96,100,.15), rgba(1,12,17,.7) 66%), linear-gradient(180deg, rgba(1,11,16,.15), rgba(1,11,16,.74))" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          color: "#fff4d1",
          textAlign: "center",
          filter: "drop-shadow(0 12px 34px rgba(0,7,10,.82))",
        }}
      >
        <div
          style={{
            fontFamily: '"Dreamtide Brush", "Songti SC", serif',
            fontSize: 110,
            lineHeight: 1,
            letterSpacing: "0.08em",
            opacity: interpolate(frame, [0, 20, durationInFrames - 18, durationInFrames - 1], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            scale: interpolate(frame, [0, 24], [0.62, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({ damping: 140 }), output: "perceptual-scale" }),
            translate: interpolate(frame, [0, 24], ["0px 28px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }),
          }}
        >
          梦幻沙洲
        </div>
        <div
          style={{
            width: interpolate(frame, [16, 34], [0, 420], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }),
            height: 1,
            margin: "22px 0 18px",
            background: "linear-gradient(90deg, transparent, #f6d99e, transparent)",
            boxShadow: "0 0 18px rgba(246,217,158,.55)",
          }}
        />
        <div
          style={{
            color: "#9cebdc",
            fontFamily: "Arial, sans-serif",
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: "0.34em",
            opacity: interpolate(frame, [20, 38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            translate: interpolate(frame, [20, 38], ["0px 14px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }),
          }}
        >
          DREAMTIDE SANDBAR
        </div>
        <div
          style={{
            marginTop: 30,
            padding: "12px 24px",
            border: "1px solid rgba(255,240,197,.58)",
            borderRadius: 999,
            color: "rgba(255,247,224,.9)",
            fontFamily: "Arial, sans-serif",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.16em",
            backgroundColor: "rgba(2,25,31,.46)",
            boxShadow: "inset 0 1px rgba(255,255,255,.12), 0 14px 34px rgba(0,13,17,.28)",
            opacity: interpolate(frame, [34, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            translate: interpolate(frame, [34, 52], ["0px 18px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }),
          }}
        >
          现在，建造你的海岸
        </div>
      </div>
      <Grain warm />
      <CinematicBars />
    </AbsoluteFill>
  );
};
