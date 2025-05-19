import React, { useState } from "react";
import {
  DndContext,
  pointerWithin,
  closestCenter,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import "./App.css";
import "./index.css";

// /****************************
//  * DRAGGABLE STUDENT CARD
//  ***************************/
// function DraggableStudent({ id }) {
//   const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
//   const style = transform
//     ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
//     : undefined;

//   return (
//     <div
//       ref={setNodeRef}
//       {...listeners}
//       {...attributes}
//       className="w-20 h-20 bg-blue-500 text-white flex items-center justify-center rounded shadow select-none"
//       style={style}
//     >
//       {id}
//     </div>
//   );
// }

/****************************
 * DRAGGABLE STUDENT CARD (with tags)
 ***************************/
function DraggableStudent({ id, tags = [], onAddTag }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  // Local state for new tag input
  const [tagInput, setTagInput] = React.useState("");

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="w-20 h-20 bg-blue-500 text-white flex flex-col items-center justify-center rounded shadow select-none p-1"
      style={style}
    >
      <div>{id}</div>
      <div className="flex flex-wrap gap-1 mt-1">
        {tags.map((tag, i) => (
          <span key={i} className="bg-green-300 text-xs px-1 rounded">{tag}</span>
        ))}
      </div>
      {onAddTag && (
        <form
          onSubmit={e => {
            e.preventDefault();
            if (tagInput.trim()) {
              onAddTag(id, tagInput.trim());
              setTagInput("");
            }
          }}
          className="mt-1"
        >
          <input
            className="text-xs text-black rounded px-1 w-14"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            placeholder="+tag"
          />
        </form>
      )}
    </div>
  );
}

/****************************
 * DROPPABLE SEAT CELL
 ***************************/
function Seat({ id, occupant, tags, onAddTag }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const borderColor = isOver ? "border-green-500" : "border-gray-300";

  return (
    <div
      ref={setNodeRef}
      className={`w-24 h-24 border-2 rounded flex items-center justify-center ${borderColor}`}
    >
      {occupant ? (
        <DraggableStudent id={occupant} tags={tags} onAddTag={onAddTag} />
      ) : (
        "Seat"
      )}
    </div>
  );
}

/****************************
 * UNSEATED STUDENT POOL – NOW INSIDE MAIN GRID
 ***************************/
function StudentPool({ students, studentTags, onAddTag }) {
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
          onAddTag={onAddTag}
        />
      ))}
    </div>
  );
}

/****************************
 * MAIN APP COMPONENT
 ***************************/
export default function App() {
  /**
   * INITIAL DATA – start with everyone seated, so the pool shows the helper text.
   */
  const initialStudents = [
    "Alice",
    "Bob",
    "Charlie",
    "Dana",
    "Eli",
    "Fiona",
  ];

  // Build an object like { "table-0-seat-0": "Alice", ... } to seat everyone initially
  // const generateSeatMap = () => {
  //   const map = {};
  //   let idx = 0;
  //   for (let t = 0; t < 6; t++) {
  //     for (let s = 0; s < 4; s++) {
  //       const student = initialStudents[idx] ?? null;
  //       map[`table-${t}-seat-${s}`] = student;
  //       idx += 1;
  //     }
  //   }
  //   return map;
  // };

  // randomize the chart
  const generateSeatMap = () => {
  const shuffled = [...initialStudents].sort(() => Math.random() - 0.5); // random shuffle
  const map = {};
  let idx = 0;
  for (let t = 0; t < 6; t++) {
    for (let s = 0; s < 4; s++) {
      const student = shuffled[idx] ?? null; // fill with student or null if none left
      map[`table-${t}-seat-${s}`] = student;
      idx += 1;
    }
  }
  return map;
};


  const [seatMap, setSeatMap] = useState(generateSeatMap);
  const [unseated, setUnseated] = useState([]); // pool starts empty

// NEW: tags state for each student
  const [studentTags, setStudentTags] = useState({});

  // Handler to add a tag to a student
  const handleAddTag = (studentId, tag) => {
    setStudentTags(prev => ({
      ...prev,
      [studentId]: prev[studentId] ? [...prev[studentId], tag] : [tag],
    }));
  };

  /**
   * HELPERS
   */
  const findSeatOfStudent = (studentId) =>
    Object.keys(seatMap).find((k) => seatMap[k] === studentId);

  /**
   * DND HANDLER
   */
  const handleDragEnd = ({ active, over }) => {
    if (!over) return;
    const studentId = active.id;

    // Work out logical destination: "pool" or a seat id
    let destId = over.id;
    // If they dropped onto another student already in the pool, treat the destination as the pool itself
    if (unseated.includes(destId)) destId = "pool";

    // Dropped back in the pool ---------------------------------
    if (destId === "pool") {
      const oldSeat = findSeatOfStudent(studentId);
      if (oldSeat) setSeatMap((m) => ({ ...m, [oldSeat]: null }));
      setUnseated((prev) =>
        prev.includes(studentId) ? prev : [...prev, studentId]
      );
      return;
    }

    // Dropped on a seat ---------------------------------------
    if (!seatMap.hasOwnProperty(destId)) return; // Not a seat

    // Ignore if seat already has the same student
    if (seatMap[destId] === studentId) return;

    // Ignore if seat is taken (or implement swapping logic)
    if (seatMap[destId]) return;

    const oldSeat = findSeatOfStudent(studentId);

    setSeatMap((m) => {
      const newMap = { ...m };
      if (oldSeat) newMap[oldSeat] = null;
      newMap[destId] = studentId;
      return newMap;
    });
    setUnseated((prev) => prev.filter((s) => s !== studentId));
  };

  /**
   * RENDER HELPERS
   */
  const renderTable = (tableIdx) => (
    <div
      key={tableIdx}
      className="grid grid-cols-2 grid-rows-2 gap-1 border p-4 rounded h-56 w-56 bg-white shadow"
    >
      {Array.from({ length: 4 }).map((_, seatIdx) => {
        const seatId = `table-${tableIdx}-seat-${seatIdx}`;
        const occupant = seatMap[seatId];
        return (
          <Seat
            key={seatId}
            id={seatId}
            occupant={occupant}
            tags={occupant ? studentTags[occupant] || [] : []}
            onAddTag={handleAddTag}
          />
        );
      })}
    </div>
  );

  /**
   * UI
   */
  return (
    <div className="flex h-screen p-4 space-x-4 bg-gray-100 overflow-hidden">
      {/* LEFT PANEL – KEEP ORIGINAL FOR CSV & STUDENT INFO */}
      <div className="w-1/3 bg-white p-4 rounded shadow space-y-4 overflow-y-auto">
        <div className="flex justify-between items-center">
          <label className="font-bold">Upload CSV</label>
          <span className="text-gray-400 cursor-pointer">?</span>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <select className="w-full border p-2 rounded">
                <option>First Name Last Name</option>
              </select>
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Student Name"
              />
              <span className="text-green-500">✓</span>
            </div>
          ))}
        </div>
          <button
            onClick={() => {
              setSeatMap(generateSeatMap());
              setUnseated([]);
            }}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Generate Seating Chart
          </button>

      </div>

      {/* RIGHT PANEL – STUDENT POOL + INTERACTIVE SEATING */}
      <div className="flex-1 bg-white p-4 rounded shadow flex flex-col space-y-4 overflow-y-auto">
        <h2 className="font-bold text-lg text-center">Seating Sandbox</h2>

        {/* SINGLE DndContext WRAPS BOTH POOL & GRID */}
        <DndContext collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
          {/* Student Pool */}
          <StudentPool students={unseated} />

          {/* Seating Tables */}
          <div className="grid grid-cols-3 gap-4 justify-items-center mt-4">
            {Array.from({ length: 6 }).map((_, t) => renderTable(t))}
          </div>
        </DndContext>
      </div>
    </div>
  );
}
