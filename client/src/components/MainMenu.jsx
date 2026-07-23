import React, { useState } from "react";

export default function MainMenu({ onJoin }) {
  const [name, setName] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onJoin(name.trim() || "Player");
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        color: "white",
        zIndex: 10,
      }}
    >
      <h1>Kiwijam Game</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: "8px", fontSize: "16px" }}
        />
        <button type="submit" style={{ padding: "8px 16px", fontSize: "16px" }}>
          Join Game
        </button>
      </form>
      <p style={{ marginTop: "16px", opacity: 0.7 }}>WASD or arrow keys to move</p>
    </div>
  );
}
