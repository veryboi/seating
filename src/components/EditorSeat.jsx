import React from "react";
import { useDraggable } from "@dnd-kit/core";

function EditorSeat({
  deskIndex,
  seatIndex,
  pos,
  onPositionChange,
  isSelected,
  onSeatSelect,
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    isDragging,
  } = useDraggable({ id: `desk-${deskIndex}/seat-${seatIndex}` });

  const style = {
    position: "absolute",
    left: pos[0] + (transform ? transform.x : 0),
    top: pos[1] + (transform ? transform.y : 0),
    transform: "translate(-50%, -50%)",
    zIndex: isDragging ? 1000 : 20,
    width: 24,
    height: 24,
    borderRadius: 4,
    background: "#f97316",
    border: `2px solid ${isSelected ? "#ef4444" : "#4b5563"}`,
    cursor: "move",
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    onSeatSelect();
    if (listeners.onPointerDown) {
      listeners.onPointerDown(e);
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
      style={style}
      onPointerUp={() => {
        if (transform) {
          onPositionChange(seatIndex, [
            pos[0] + transform.x,
            pos[1] + transform.y,
          ]);
        }
      }}
      title={`Seat ${seatIndex + 1}`}
    />
  );
}

export default EditorSeat; 