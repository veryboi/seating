import React from "react";
import { useDroppable } from "@dnd-kit/core";
import DraggableStudent from "./DraggableStudent";

function StudentPool({ students, studentTags, studentNotes, onAddTag }) {
  const { setNodeRef, isOver } = useDroppable({ id: "pool" });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-24 w-full p-2 border-2 rounded bg-gray-50 flex flex-wrap gap-2 ${
        isOver ? "border-green-500" : "border-gray-300"
      }`}
    >
      {students.length === 0 && (
        <span className="text-gray-400">Drag students here to unseat</span>
      )}
      {students.map((s) => (
        <DraggableStudent
          key={s}
          id={s}
          tags={studentTags[s] || []}
          note={studentNotes[s] || ""}
          onAddTag={onAddTag}
        />
      ))}
    </div>
  );
}

export default StudentPool; 