import React from "react";
import DeskShape from "./DeskShape";
import Seat from "./Seat";

function ViewerDesk({ desk, deskIndex, seatMap, studentTags, studentNotes, onAddTag }) {
  return (
    <div
      className="absolute"
      style={{ left: desk.position[0], top: desk.position[1] }}
    >
      <DeskShape shape={desk.shape} />
      {desk.seats.map((seatPos, sIdx) => {
        const seatId = `desk-${deskIndex}/seat-${sIdx}`;
        const occupant = seatMap[seatId];
        return (
          <Seat
            key={seatId}
            id={seatId}
            occupant={occupant}
            tags={occupant ? studentTags[occupant] || [] : []}
            studentNotes={studentNotes}
            onAddTag={onAddTag}
            style={{
              position: "absolute",
              left: seatPos[0],
              top: seatPos[1],
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </div>
  );
}

export default ViewerDesk; 