import React, { useState } from "react";

export default function Chat({ room }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  React.useEffect(() => {
    if (!room) return;
    const handler = (message) => {
      setMessages((prev) => [...prev.slice(-19), message]);
    };
    room.onMessage("chat", handler);
    // colyseus.js doesn't provide an "off" for onMessage on older versions,
    // this listener is cleaned up automatically when the room disposes
  }, [room]);

  function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !room) return;
    room.send("chat", input.trim());
    setInput("");
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 12,
        left: 12,
        width: "280px",
        color: "white",
        fontFamily: "sans-serif",
        zIndex: 5,
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.4)",
          borderRadius: "6px",
          padding: "8px",
          maxHeight: "150px",
          overflowY: "auto",
          marginBottom: "6px",
          fontSize: "13px",
        }}
      >
        {messages.map((m, i) => (
          <div key={i}>{m}</div>
        ))}
      </div>
      <form onSubmit={sendMessage} style={{ display: "flex", gap: "4px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something..."
          style={{ flex: 1, padding: "6px" }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
