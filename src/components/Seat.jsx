import React from "react";
import { useDroppable } from "@dnd-kit/core";
import DraggableStudent from "./DraggableStudent";

function Seat({ id, occupant, tags, studentNotes, onAddTag, style }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const borderColor = isOver ? "border-green-500" : "border-gray-300";

  return (
    <div
      ref={setNodeRef}
      className={`relative z-10 w-12 h-12 border-2 rounded flex items-center justify-center ${borderColor}`}
      style={style}
    >
      {occupant ? (
        <DraggableStudent
          id={occupant}
          tags={tags}
          note={studentNotes[occupant] || ""}
          onAddTag={onAddTag}
          compact
        />
      ) : (
        "Seat"
      )}
    </div>
  );
}

export default Seat; 