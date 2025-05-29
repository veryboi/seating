import React from "react";
import { useDraggable } from "@dnd-kit/core";
import DeskShape from "./DeskShape";
import EditorSeat from "./EditorSeat";

function DraggableDesk({
  desk,
  index,
  isSelected,
  selectedSeat,
  onSelect,
  onPositionChange,
  onSeatPositionChange,
  onSeatSelect,
}) {
  const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({ id: `desk-${index}` });

  const style = {
    transform: transform
      ? `translate(${desk.position[0] + transform.x}px, ${desk.position[1] + transform.y}px)`
      : `translate(${desk.position[0]}px, ${desk.position[1]}px)`,
  };

  const borderStyle = isSelected ? "ring-2 ring-blue-500" : "";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`absolute cursor-move ${borderStyle}`}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(index);
      }}
      onPointerUp={() => {
        if (transform) {
          onPositionChange(index, [
            desk.position[0] + transform.x,
            desk.position[1] + transform.y,
          ]);
        }
      }}
    >
      <DeskShape shape={desk.shape} />

      {desk.seats.map((seatPos, sIdx) => (
        <EditorSeat
          key={sIdx}
          deskIndex={index}
          seatIndex={sIdx}
          pos={seatPos}
          isSelected={isSelected && selectedSeat === sIdx}
          onPositionChange={(seatIdx, newPos) =>
            onSeatPositionChange(index, seatIdx, newPos)
          }
          onSeatSelect={() => onSeatSelect(index, sIdx)}
        />
      ))}
    </div>
  );
}

export default DraggableDesk; 