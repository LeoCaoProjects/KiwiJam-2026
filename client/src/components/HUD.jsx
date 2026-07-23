import React from "react";

export default function HUD({ playerCount }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        color: "white",
        fontFamily: "sans-serif",
        background: "rgba(0,0,0,0.4)",
        padding: "8px 12px",
        borderRadius: "6px",
        zIndex: 5,
      }}
    >
      Players online: {playerCount}
    </div>
  );
}
