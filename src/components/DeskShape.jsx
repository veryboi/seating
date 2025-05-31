import React from "react";

function DeskShape({ shape }) {
  switch (shape.type) {
    case "circle":
      return (
        <div
          className="absolute z-0 rounded-full border border-gray-400 bg-white/60"
          style={{
            width: shape.radius * 2.5,
            height: shape.radius * 2.5,
            transform: "translate(-50%, -50%)",
            left: 0,
            top: 0,
          }}
        />
      );
    case "rectangle":
      return (
        <div
          className="absolute z-0 border border-gray-400 bg-white/60"
          style={{
            width: shape.width*1.5,
            height: shape.height*1.5,
            transform: "translate(-50%, -50%)",
            left: 0,
            top: 0,
          }}
        />
      );
    case "polygon":
      return (
        <svg
          className="absolute z-0 overflow-visible"
          style={{ transform: "translate(-50%, -50%)", left: 0, top: 0 }}
        >
          <polygon
            points={shape.points.map((p) => p.join(",")).join(" ")}
            fill="rgba(255,255,255,0.6)"
            stroke="gray"
          />
        </svg>
      );
    default:
      return null;
  }
}

export default DeskShape; 