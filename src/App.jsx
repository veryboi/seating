// src/App.js – seating sandbox **plus** a visual "Layout Editor" tab (with JSON import)
// Drag-and-drop desks in the editor, select them reliably, and download / import layouts.
// ─────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from "react";
import {
  DndContext,
  pointerWithin,
  rectIntersection, 
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

import chartData from "../chart_data/chart1.json"; // ◀ default layout (can be replaced via Import)
import "./App.css";
import "./index.css";

/**********************************************************************
 *  DRAGGABLE STUDENT CARD
 *********************************************************************/
function DraggableStudent({ id, tags = [], onAddTag, compact = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id });


  const small = compact || isDragging;

  const style = {
    ...(transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : {}),
    zIndex: isDragging ? 1000 : 50,
  };

  const [tagInput, setTagInput] = React.useState("");
  /* selected student + optional note */




  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`relative ${small ? "w-12 h-12 text-xs" : "w-20 h-20"} bg-blue-500 text-white flex flex-col items-center justify-center rounded shadow select-none p-1`}
      style={style}
    >
      <div>{id}</div>
      {!small && (<div className="flex flex-wrap gap-1 mt-1">
        {tags.map((tag, i) => (
          <span key={i} className="bg-green-300 text-xs px-1 rounded">
            {tag}
          </span>
        ))}
      </div>)}

      {onAddTag &&!small&& (
        <form
          onSubmit={(e) => {
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
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="+tag"
          />
        </form>
      )}
    </div>
  );
}

/**********************************************************************
 *  SEAT (droppable)
 *********************************************************************/
function Seat({ id, occupant, tags, onAddTag, style }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const borderColor = isOver ? "border-green-500" : "border-gray-300";

  return (
    <div
      ref={setNodeRef}
      className={`relative z-10 w-12 h-12 border-2 rounded flex items-center justify-center ${borderColor}`}
      style={style}
    >
      {occupant ? (
        <DraggableStudent id={occupant} tags={tags} onAddTag={onAddTag} compact />
      ) : (
        "Seat"
      )}
    </div>
  );
}

/**********************************************************************
 *  STUDENT POOL
 *********************************************************************/
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

/**********************************************************************
 *  DESK SHAPE (shared by viewer & editor)
 *********************************************************************/
function DeskShape({ shape }) {
  switch (shape.type) {
    case "circle":
      return (
        <div
          className="absolute z-0 rounded-full border border-gray-400 bg-white/60"
          style={{
            width: shape.radius * 2,
            height: shape.radius * 2,
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
            width: shape.width,
            height: shape.height,
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

/**********************************************************************
 *  DESK (viewer)
 *********************************************************************/
function ViewerDesk({ desk, deskIndex, seatMap, studentTags, onAddTag }) {
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
/**********************************************************************
 *  EDIT-MODE SEAT (draggable inside a desk)
 *********************************************************************/
function EditorSeat({ deskIndex, seatIndex, pos, onPositionChange }) {
  const { setNodeRef, listeners, attributes, transform, isDragging } =
    useDraggable({ id: `desk-${deskIndex}/seat-${seatIndex}` });

  const style = {
    position: "absolute",
    left: pos[0] + (transform ? transform.x : 0),
    top: pos[1] + (transform ? transform.y : 0),
    transform: "translate(-50%, -50%)",
    zIndex: isDragging ? 1000 : 20,
    width: 20,
    height: 20,
    borderRadius: 4,
    background: "#f97316", // orange-400
    border: "2px solid #4b5563", // gray-600
    cursor: "move",
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      onPointerUp={() => {
        if (transform) {
          onPositionChange(seatIndex, [pos[0] + transform.x, pos[1] + transform.y]);
        }
      }}
      title={`Seat ${seatIndex + 1}`}
    />
  );
}

/**********************************************************************
 *  DRAGGABLE DESK (with selectable & resizable capabilities)
 *********************************************************************/
function DraggableDesk({
  desk,
  index,
  isSelected,
  onSelect,
  onPositionChange,
  onSeatPositionChange,
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
    /* click once to select; the click won’t bubble up and clear selection */
    onClick={(e) => {
      e.stopPropagation();
      onSelect(index);
    }}
    onPointerUp={() => {
      /* commit the position after the drag finishes */
      if (transform) {
        onPositionChange(index, [
          desk.position[0] + transform.x,
          desk.position[1] + transform.y,
        ]);
      }
    }}
  >
      {/* Desk shape */}
      <DeskShape shape={desk.shape} />

      {/* Seats inside this desk */}
      {desk.seats.map((seatPos, sIdx) => (
        <EditorSeat
          key={sIdx}
          deskIndex={index}
          seatIndex={sIdx}
          pos={seatPos}
          onPositionChange={(seatIdx, newPos) => onSeatPositionChange(index, seatIdx, newPos)}
        />
      ))}
    </div>
  );
}

/**********************************************************************
 *  UTILITIES
 *********************************************************************/
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildEmptySeatMap(desks) {
  return Object.fromEntries(
    desks.flatMap((desk, d) => desk.seats.map((_, s) => [`desk-${d}/seat-${s}`, null]))
  );
}

function findSeatOfStudent(seatMap, studentId) {
  return Object.keys(seatMap).find((k) => seatMap[k] === studentId);
}

function generateSeatMapFromList(studentList, desks) {
  const shuffled = shuffle(studentList);
  const entries = [];
  let idx = 0;
  desks.forEach((desk, d) =>
    desk.seats.forEach((_, s) => {
      entries.push([`desk-${d}/seat-${s}`, shuffled[idx++] ?? null]);
    })
  );
  return Object.fromEntries(entries);
}

/**********************************************************************
 *  LAYOUT EDITOR TAB
 *********************************************************************/
function LayoutEditor({ classroom, setClassroom }) {
  /* Local copy of desks so we can stage edits */
  const [desks, setDesks] = useState(() => JSON.parse(JSON.stringify(classroom.desks)));
  const [selectedDesk, setSelectedDesk] = useState(null);
  const fileInputRef = useRef(null);

  /* Propagate changes to parent */
  useEffect(() => {
    setClassroom((prev) => ({ ...prev, desks }));
  }, [desks, setClassroom]);

  /******************************************************************
   *  DESK MANIPULATION HELPERS
   *****************************************************************/
  const handleDeskPositionChange = (dIdx, newPos) =>
    setDesks((prev) => {
      const next = [...prev];
      next[dIdx] = { ...next[dIdx], position: newPos };
      return next;
    });

  const handleSeatPositionChange = (dIdx, seatIdx, newPos) =>
    setDesks((prev) => {
      const next = [...prev];
      const seats = [...next[dIdx].seats];
      seats[seatIdx] = newPos;
      next[dIdx] = { ...next[dIdx], seats };
      return next;
    });

  const addRectangleDesk = () => {
    setDesks((prev) => [
      ...prev,
      {
        position: [250, 250],
        seats: [
          [-30, -20],
          [30, -20],
          [-30, 20],
          [30, 20],
        ],
        shape: { type: "rectangle", width: 120, height: 70 },
      },
    ]);
  };

  const addCircleDesk = () => {
    setDesks((prev) => [
      ...prev,
      {
        position: [250, 250],
        seats: [],
        shape: { type: "circle", radius: 70 },
      },
    ]);
  };

  const addPolygonDesk = () => {
    setDesks((prev) => [
      ...prev,
      {
        position: [250, 250],
        seats: [],
        shape: {
          type: "polygon",
          points: [
            [0, -50],
            [45, 35],
            [-45, 35],
          ], // simple triangle
        },
      },
    ]);
  };

  const addSeatToSelectedDesk = () => {
    if (selectedDesk == null) return;
    setDesks((prev) => {
      const next = [...prev];
      const seats = [...next[selectedDesk].seats, [0, 0]]; // new seat at centre
      next[selectedDesk] = { ...next[selectedDesk], seats };
      return next;
    });
  };

  /* Inspector – update dimensions */
  const updateShape = (field, value) => {
    if (selectedDesk == null) return;
    setDesks((prev) => {
      const next = [...prev];
      next[selectedDesk] = {
        ...next[selectedDesk],
        shape: { ...next[selectedDesk].shape, [field]: value },
      };
      return next;
    });
  };

  /* Download */
  const downloadJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify({ desks }, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = "chart1.json";
    a.click();
  };

  /* Import */
  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (Array.isArray(data.desks)) {
          setDesks(data.desks);
          setSelectedDesk(null);
        } else {
          alert("JSON must contain a 'desks' array");
        }
      } catch {
        alert("Could not parse JSON. Make sure the file is valid.");
      }
    };
    reader.readAsText(file);
  };

  const selectedShape =
  Number.isInteger(selectedDesk) && desks[selectedDesk]
    ? desks[selectedDesk].shape
    : null;

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <button className="bg-blue-500 text-white px-3 py-2 rounded" onClick={addRectangleDesk}>
          + Rectangle Desk
        </button>
        <button className="bg-blue-500 text-white px-3 py-2 rounded" onClick={addCircleDesk}>
          + Circle Desk
        </button>
        <button className="bg-blue-500 text-white px-3 py-2 rounded" onClick={addPolygonDesk}>
          + Polygon Desk
        </button>
        <button
          className={`bg-emerald-600 text-white px-3 py-2 rounded ${selectedDesk == null ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={selectedDesk == null}
          onClick={addSeatToSelectedDesk}
        >
          + Seat
        </button>

        {/* Import & Download */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/JSON"
          className="hidden"
          onChange={handleImportJson}
        />
        <button
          className="bg-green-500 text-white px-3 py-2 rounded ml-auto"
          onClick={() => fileInputRef.current?.click()}
        >
          Import JSON
        </button>
        <button className="bg-green-600 text-white px-3 py-2 rounded" onClick={downloadJson}>
          Download JSON
        </button>
      </div>

      {/* Main editor area */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Canvas */}
        {/* Canvas */}
<DndContext
  collisionDetection={pointerWithin}
  onDragStart={({ active }) => {
    /* accept IDs like "desk-3" only */
    const m = /^desk-(\d+)$/.exec(active?.id ?? "");
    if (m) setSelectedDesk(Number(m[1]));
  }}
  onDragEnd={({ active }) => {
    const m = /^desk-(\d+)$/.exec(active?.id ?? "");
    if (m) setSelectedDesk(Number(m[1]));
  }}
>
  <div
    className="relative flex-1 border rounded bg-slate-100 overflow-hidden"
    style={{ minHeight: 600 }}
    onClick={() => setSelectedDesk(null)}
  >
    {desks.map((desk, i) => (
      <DraggableDesk
        key={i}
        desk={desk}
        index={i}
        isSelected={selectedDesk === i}
        onSelect={setSelectedDesk}
        onPositionChange={handleDeskPositionChange}
        onSeatPositionChange={handleSeatPositionChange}
      />
    ))}
  </div>
</DndContext>

        {/* Inspector panel */}
        <div className="w-64 bg-white border rounded p-4 overflow-y-auto">
          {selectedDesk == null ? (
            <p className="text-sm text-gray-500">Select a desk to edit its properties</p>
          ) : (
            <>
              <h2 className="font-bold mb-2 text-lg">Desk {selectedDesk + 1}</h2>
              {selectedShape.type === "rectangle" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Width</label>
                  <input
                    type="number"
                    className="w-full border p-1 rounded"
                    value={selectedShape.width}
                    onChange={(e) => updateShape("width", Number(e.target.value))}
                  />
                  <label className="block text-sm font-medium">Height</label>
                  <input
                    type="number"
                    className="w-full border p-1 rounded"
                    value={selectedShape.height}
                    onChange={(e) => updateShape("height", Number(e.target.value))}
                  />
                </div>
              )}

              {selectedShape.type === "circle" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Radius</label>
                  <input
                    type="number"
                    className="w-full border p-1 rounded"
                    value={selectedShape.radius}
                    onChange={(e) => updateShape("radius", Number(e.target.value))}
                  />
                </div>
              )}

              {selectedShape.type === "polygon" && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Edit the points array directly in code for advanced shapes.</p>
                  <label className="block text-sm font-medium">Scale</label>
                  <input
                    type="number"
                    className="w-full border p-1 rounded"
                    step={0.1}
                    defaultValue={1}
                    onChange={(e) => {
                      /* simple uniform scale */
                      const scale = parseFloat(e.target.value);
                      setDesks((prev) => {
                        const next = [...prev];
                        const pts = prev[selectedDesk].shape.points.map(([x, y]) => [x * scale, y * scale]);
                        next[selectedDesk] = {
                          ...prev[selectedDesk],
                          shape: { ...prev[selectedDesk].shape, points: pts },
                        };
                        return next;
                      });
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   MAIN APP
--------------------------------------------------------------------------- */
export default function App() {
  /* --------------------------------------------------------------------- */
  /*  STATE                                                                */
  /* --------------------------------------------------------------------- */
  const [classroom, setClassroom] = useState(chartData);


  const [seatMap, setSeatMap] = useState(() => buildEmptySeatMap(classroom.desks));
  const [unseated, setUnseated] = useState([]);
  
  // seating state
  const [selectedStudent, setSelectedStudent] = useState(null);
const [studentInput, setStudentInput] = useState("");
const [studentList, setStudentList] = useState([]);
const [studentTags, setStudentTags] = useState({});
const [studentNotes, setStudentNotes] = useState({});
const [customTags, setCustomTags] = useState([]);     // new
const [noteForChart, setNoteForChart] = useState("");

  // UI
  const [tab, setTab] = useState("seating");
  /* common list of preset tags */
const presetTags = [
  "Talkative",
  "Quiet",
  "High Performer",
  "Needs Assistance",
  "Leader",
  "Collaborative",
];

  /* --------------------------------------------------------------------- */
  /*  EFFECTS                                                              */
  /* --------------------------------------------------------------------- */
  // when desk layout changes, keep seated students if their seat still exists
  useEffect(() => {
    setSeatMap((prev) => {
      const blank = buildEmptySeatMap(classroom.desks);
      Object.entries(prev).forEach(([seatId, occupant]) => {
        if (blank.hasOwnProperty(seatId)) blank[seatId] = occupant;
      });
      return blank;
    });
  }, [classroom.desks]);

  /* --------------------------------------------------------------------- */
  /*  TAG HELPERS                                                          */
  /* --------------------------------------------------------------------- */


  const handleAddTag = (studentId, tag) => {
    setStudentTags((prev) => {
      if (prev[studentId]?.includes(tag)) return prev;          // no dupes per student
      const nextTags = prev[studentId] ? [...prev[studentId], tag] : [tag];
      return { ...prev, [studentId]: nextTags };
    });
    if (
      !presetTags.includes(tag) &&
      !customTags.includes(tag)                                   // no dupes globally
    ) {
      setCustomTags((p) => [...p, tag]);
    }
  };
  
  const handleRemoveTag = (studentId, tagIdx) =>
    setStudentTags((prev) => ({
      ...prev,
      [studentId]: prev[studentId].filter((_, i) => i !== tagIdx),
    }));
  
  /* note helper */
  const handleUpdateNote = (studentId, text) =>
    setStudentNotes((prev) => ({ ...prev, [studentId]: text }));


    // studnet stuff
    /* export { students, tags, notes, customTags } to JSON */
function exportStudents() {
  const data = {
    students: studentList,
    tags: studentTags,
    notes: studentNotes,
    customTags,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "students.json";
  a.click();
  URL.revokeObjectURL(url);
}

/* import the same structure */
function importStudents(file) {
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const data = JSON.parse(evt.target.result);
      if (Array.isArray(data.students)) {
        setStudentList(data.students);
        setStudentTags(data.tags || {});
        setStudentNotes(data.notes || {});
        setCustomTags(data.customTags || []);
        setSelectedStudent(null);
      } else {
        alert("JSON must contain a 'students' array");
      }
    } catch {
      alert("Could not parse JSON");
    }
  };
  reader.readAsText(file);
}
  /* --------------------------------------------------------------------- */
  /*  DnD LOGIC                                                            */
  /* --------------------------------------------------------------------- */
  const handleDragEnd = ({ active, over }) => {
    if (!over) return;

    const studentId = active.id;
    let destId = over.id;

    // dropped into the pool – id("pool") handled by StudentPool
    if (destId === "pool") {
      const oldSeat = findSeatOfStudent(seatMap, studentId);
      if (oldSeat) setSeatMap((m) => ({ ...m, [oldSeat]: null }));
      setUnseated((prev) => (prev.includes(studentId) ? prev : [...prev, studentId]));
      return;
    }

    // dropped on a seat
    if (!seatMap.hasOwnProperty(destId)) return;
    if (seatMap[destId] === studentId) return;
    if (seatMap[destId]) return; // seat taken – no swap logic

    const oldSeat = findSeatOfStudent(seatMap, studentId);
    setSeatMap((m) => {
      const next = { ...m };
      if (oldSeat) next[oldSeat] = null;
      next[destId] = studentId;
      return next;
    });
    setUnseated((prev) => prev.filter((s) => s !== studentId));
  };

  /* --------------------------------------------------------------------- */
  /*  CHILD COMPONENTS                                                     */
  /* --------------------------------------------------------------------- */
  
  function StudentEditor({
    student,
    tags,
    note,
    allTags,
    onAddTag,
    onRemoveTag,
    onUpdateNote,
    onDelete,
  }) {
    if (!student) {
      return (
        <div className="border rounded p-3 text-sm text-gray-500">
          Select a student to edit
        </div>
      );
    }
  
    const [tagInput, setTagInput] = useState("");
  
    return (
      <div className="border rounded p-3 space-y-3 bg-gray-50">
        {/* header + delete */}
        <div className="flex justify-between items-center">
          <h3 className="font-bold">{student}</h3>
          <button
            className="text-red-600 text-sm"
            onClick={() => onDelete(student)}
            title="Remove student"
          >
            ✕
          </button>
        </div>
  
        {/* existing tags */}
        <div className="flex flex-wrap gap-1">
          {tags.map((t, i) => (
            <span
              key={i}
              className="bg-yellow-400/80 text-xs px-2 rounded flex items-center"
            >
              {t}
              <button
                className="ml-1 text-white"
                onClick={() => onRemoveTag(student, i)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
  
        {/* preset & custom tags */}
        <details className="w-full">
          <summary className="cursor-pointer text-sm border rounded px-2 py-1 text-gray-600">
            + Tag
          </summary>
          <div className="mt-2 space-y-1">
            {allTags.map((t) => (
              <button
                key={t}
                className="block w-full text-left px-2 py-1 hover:bg-gray-200 rounded disabled:text-gray-400"
                disabled={tags.includes(t)}
                onClick={() => onAddTag(student, t)}
              >
                {t}
              </button>
            ))}
  
            {/* custom tag entry */}
            <form
              className="flex gap-1 pt-2"
              onSubmit={(e) => {
                e.preventDefault();
                const clean = tagInput.trim();
                if (!clean) return;
                onAddTag(student, clean);
                setTagInput("");
              }}
            >
              <input
                className="flex-1 border px-1 text-xs rounded"
                placeholder="Custom tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
              <button className="text-xs bg-blue-500 text-white px-2 rounded">
                Add
              </button>
            </form>
          </div>
        </details>
  
        {/* individual note */}
        <div className="space-y-1">
          <label className="text-xs font-medium">Note</label>
          <textarea
            className="w-full border rounded p-1 text-xs"
            rows={2}
            placeholder="Notes about this student"
            value={note || ""}
            onChange={(e) => onUpdateNote(student, e.target.value)}
          />
        </div>
      </div>
    );
  }


  const StudentBox = ({ student }) => (
    <button
      className="w-full text-left bg-gray-100 border rounded p-2 mb-1 hover:bg-blue-100 transition flex flex-col"
      onClick={() => setSelectedStudent(student)}
    >
      <span className="font-semibold">{student}</span>
      <div className="flex flex-wrap gap-1 mt-1">
        {(studentTags[student] || []).map((tag, i) => (
          <span key={i} className="bg-green-300 text-xs px-1 rounded">
            {tag}
          </span>
        ))}
      </div>
    </button>
  );

  /* --------------------------------------------------------------------- */
  /*  RENDER                                                                */
  /* --------------------------------------------------------------------- */
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* TAB BAR */}
      <div className="flex">
        {[
          { key: "seating", label: "Seating Sandbox" },
          { key: "editor", label: "Layout Editor" },
        ].map((t) => (
          <button
            key={t.key}
            className={`px-4 py-2 border-b-2 ${tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent"}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* --- SEATING TAB ------------------------------------------------- */}
      {tab === "seating" && (
        <div className="flex flex-1 p-4 space-x-4 overflow-hidden">
          
{/* LEFT PANEL – students & controls */}
<div className="w-1/3 h-full bg-white p-4 rounded shadow flex flex-col relative">

  {/* hidden file input for Import */}
  <input
    id="importStudentsInput"
    type="file"
    accept=".json,application/json"
    className="hidden"
    onChange={(e) => {
      const f = e.target.files?.[0];
      if (f) importStudents(f);
      e.target.value = "";
    }}
  />

  {/* ───── sticky TOP: Student editor ───── */}
  {/* ───── sticky TOP: Student editor ───── */}
<div className="sticky top-0 bg-white z-10">
  {/* fixed height + internal scroll */}
  <div className="h-64 overflow-y-auto p-4">
    <StudentEditor
      student={selectedStudent}
      tags={selectedStudent ? studentTags[selectedStudent] || [] : []}
      note={selectedStudent ? studentNotes[selectedStudent] : ""}
      allTags={[...presetTags, ...customTags]}
      onAddTag={handleAddTag}
      onRemoveTag={handleRemoveTag}
      onUpdateNote={handleUpdateNote}
      onDelete={(name) => {
        setStudentList((p) => p.filter((s) => s !== name));
        setStudentTags((p) => { const n = {...p}; delete n[name]; return n; });
        setStudentNotes((p) => { const n = {...p}; delete n[name]; return n; });
        setSelectedStudent(null);
      }}
    />
  </div>
  {/* divider */}
  <div className="border-b" />
</div>


  {/* ───── scrollable MIDDLE: roster ───── */}
  <div className="flex-1 overflow-y-auto my-4">
    {studentList.map((s) => (
      <button
        key={s}
        className={`w-full text-left border rounded p-2 mb-1 hover:bg-blue-100 transition ${
          selectedStudent === s ? "bg-blue-50" : "bg-gray-100"
        }`}
        onClick={() => setSelectedStudent(s)}
      >
        <span className="font-semibold">{s}</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {(studentTags[s] || []).map((tag, i) => (
            <span key={i} className="bg-green-300 text-xs px-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      </button>
    ))}
  </div>

  {/* ───── sticky BOTTOM: add / note / actions ───── */}
  <div className="sticky bottom-0 bg-white z-10 pt-4 space-y-4 border-t">

    {/* add student */}
    <div className="flex items-center gap-2">
      <input
        type="text"
        className="flex-1 border p-2 rounded"
        placeholder="Enter student name"
        value={studentInput}
        onChange={(e) => setStudentInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const clean = studentInput.trim();
            if (clean && !studentList.includes(clean)) {
              setStudentList((p) => [...p, clean]);
              setStudentInput("");
            }
          }
        }}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={() => {
          const clean = studentInput.trim();
          if (clean && !studentList.includes(clean)) {
            setStudentList((p) => [...p, clean]);
            setStudentInput("");
          }
        }}
      >
        Add
      </button>
    </div>

    {/* chart-level note */}
    <div className="space-y-1">
      <label className="text-sm font-semibold">Chart note</label>
      <textarea
        className="w-full border rounded p-2 text-sm"
        rows={2}
        placeholder="e.g. Keep disruptive students apart"
        value={noteForChart}
        onChange={(e) => setNoteForChart(e.target.value)}
      />
    </div>

    {/* action buttons */}
    <div className="flex gap-2">
      <button
        className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        onClick={() => {
          console.log("Chart note:", noteForChart);
          setSeatMap(generateSeatMapFromList(studentList, classroom.desks));
          setUnseated([]);
        }}
      >
        Generate Chart
      </button>
      <button
        className="bg-emerald-500 text-white px-3 rounded"
        onClick={() => document.getElementById("importStudentsInput").click()}
      >
        Import
      </button>
      <button
        className="bg-emerald-600 text-white px-3 rounded"
        onClick={exportStudents}
      >
        Export
      </button>
    </div>
  </div>
</div>


          {/* RIGHT PANEL – pool + desks */}
          <div className="flex-1 bg-white p-4 rounded shadow flex flex-col overflow-y-auto">
            <h2 className="font-bold text-lg text-center mb-2">Seating Sandbox</h2>

            <DndContext collisionDetection={rectIntersection} onDragEnd={handleDragEnd}>
              {/* UN-SEATED BANK – always visible so you can drop here */}
              <StudentPool students={unseated} studentTags={studentTags} onAddTag={handleAddTag} />

              {/* DESK LAYOUT */}
              <div className="relative mt-4 w-full h-[500px] border border-gray-300 rounded bg-slate-50 overflow-hidden">
                {classroom.desks.map((desk, i) => (
                  <ViewerDesk
                    key={i}
                    desk={desk}
                    deskIndex={i}
                    seatMap={seatMap}
                    studentTags={studentTags}
                    onAddTag={handleAddTag}
                  />
                ))}
              </div>
            </DndContext>
          </div>
        </div>
      )}

      {/* --- EDITOR TAB -------------------------------------------------- */}
      {tab === "editor" && <LayoutEditor classroom={classroom} setClassroom={setClassroom} />}

      
    </div>
  );
}