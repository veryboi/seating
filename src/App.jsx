// src/App.js – seating sandbox **plus** a visual "Layout Editor" tab (with JSON import)
// Drag-and-drop desks in the editor, select them reliably, and download / import layouts.
// ─────────────────────────────────────────────────────────────────────
import ReactDOM from "react-dom";
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
import {
    primeStudentCache,
    generateChart as runOptimizer,
  } from "./lib/seat-optimizer";
import {
    compileNotesToCDL,
    buildUserPrompt,          /* NEW – exported in step 4 */
  } from "./lib/llm.compiler";

// Import components
import DraggableStudent from "./components/DraggableStudent";
import Seat from "./components/Seat";
import StudentPool from "./components/StudentPool";
import DeskShape from "./components/DeskShape";
import ViewerDesk from "./components/ViewerDesk";
import StudentEditor from "./components/StudentEditor";
import LayoutEditor from "./components/LayoutEditor";
import DebugModal from "./components/modals/DebugModal";
import CDLEditorModal from "./components/modals/CDLEditorModal";
import SeatingTab from "./components/SeatingTab";

// Import utilities
import {
  shuffle,
  buildEmptySeatMap,
  findSeatOfStudent,
  generateSeatMapFromList,
} from "./utils/seatUtils";
import {
  exportStudents as exportStudentsUtil,
  importStudents as importStudentsUtil,
} from "./utils/studentUtils";

/**********************************************************************
 *  EDIT-MODE SEAT (draggable inside a desk)
 *********************************************************************/
function EditorSeat({
  deskIndex,
  seatIndex,
  pos,
  onPositionChange,
  isSelected,
  onSeatSelect,
}) {
  /* dnd-kit handle */
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    isDragging,
  } = useDraggable({ id: `desk-${deskIndex}/seat-${seatIndex}` });

  /* style */
  const style = {
    position: "absolute",
    left: pos[0] + (transform ? transform.x : 0),
    top: pos[1] + (transform ? transform.y : 0),
    transform: "translate(-50%, -50%)",
    zIndex: isDragging ? 1000 : 20,
    width: 20,
    height: 20,
    borderRadius: 4,
    background: "#f97316",
    border: `2px solid ${isSelected ? "#ef4444" : "#4b5563"}`,
    cursor: "move",
  };

  /* merge our own pointer-down with dnd-kit's */
  const handlePointerDown = (e) => {
    e.stopPropagation();          // don't let the desk grab focus
    onSeatSelect();               // persist selection
    if (listeners.onPointerDown) {
      listeners.onPointerDown(e);  // still start the drag
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}   // block desk click after drag
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

/**********************************************************************
 *  DRAGGABLE DESK (with selectable & resizable capabilities)
 *********************************************************************/
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
    /* click once to select; the click won't bubble up and clear selection */
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
const [studentList, setStudentList] = useState([]);
const [studentTags, setStudentTags] = useState({});
const [studentNotes, setStudentNotes] = useState({});
  const [customTags, setCustomTags] = useState([]);
const [noteForChart, setNoteForChart] = useState("");
  const [debug, setDebug] = useState(null);

  // UI
  const [tab, setTab] = useState("seating");

  /* ---- CDL editor ---- */
  const [cdlDraft, setCdlDraft] = useState("{}");
  const [manualCdl, setManualCdl] = useState(null);
const [showCdlEditor, setShowCdlEditor] = useState(false);

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

  /* keep optimiser's student cache in sync */
useEffect(() => {
  primeStudentCache(
    studentList.map((id) => ({
      id,
      firstName: id.split(" ")[0],
      lastName: id.split(" ").slice(1).join(" ") || id,
      tags: studentTags[id] || [],
    }))
  );
}, [studentList, studentTags]);

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
  
    const studentA = active.id;           // the one we dragged
    const targetId = over.id;             // seat-id, pool, or other student
  
    /** helper: recompute the pool from a seatMap */
    const recalcUnseated = (nextSeatMap) => {
      const seated = new Set(Object.values(nextSeatMap).filter(Boolean));
      return studentList.filter((s) => !seated.has(s));
    };
  
    /** -------- 1. Dropped in the pool → unseat -------- */
    if (targetId === "pool") {
      const oldSeat = findSeatOfStudent(seatMap, studentA);
      if (!oldSeat) return;               // already un-seated
  
      const next = { ...seatMap, [oldSeat]: null };
      setSeatMap(next);
      setUnseated(recalcUnseated(next));
      return;
    }
  
    /** -------- 2. Dropped on another student tile -------- */
    if (studentList.includes(targetId)) {
      const studentB = targetId;
      if (studentA === studentB) return;
  
      const seatA = findSeatOfStudent(seatMap, studentA);
      const seatB = findSeatOfStudent(seatMap, studentB);
      if (!seatB) return;                 // target student is in pool → ignore
  
      const next = { ...seatMap };
      if (seatA) next[seatA] = studentB;
      else next[seatB] = null;            // studentB will become un-seated
      next[seatB] = studentA;
  
      setSeatMap(next);
      setUnseated(recalcUnseated(next));
      return;
    }
  
    /** -------- 3. Dropped on a seat -------- */
    if (!seatMap.hasOwnProperty(targetId)) return;
  
    const occupant = seatMap[targetId];
  
    /* 3a: seat empty → simple move */
    if (!occupant) {
      const oldSeat = findSeatOfStudent(seatMap, studentA);
      const next = { ...seatMap };
      if (oldSeat) next[oldSeat] = null;
      next[targetId] = studentA;
  
      setSeatMap(next);
      setUnseated(recalcUnseated(next));
      return;
    }
  
    /* 3b: seat occupied → swap A & B */
    const studentB = occupant;
    const seatA = findSeatOfStudent(seatMap, studentA); // may be null
    const next = { ...seatMap };
    next[targetId] = studentA;
    if (seatA) next[seatA] = studentB;
    else {
      // studentA came from pool, so studentB now becomes un-seated
      next[targetId] = studentA;
      // leave seatA null (it doesn't exist), studentB ends up in pool
    }
  
    setSeatMap(next);
    setUnseated(recalcUnseated(next));
  };

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
        <SeatingTab
          studentList={studentList}
          setStudentList={setStudentList}
        studentTags={studentTags}
          setStudentTags={setStudentTags}
        studentNotes={studentNotes}
          setStudentNotes={setStudentNotes}
          customTags={customTags}
          setCustomTags={setCustomTags}
          presetTags={presetTags}
          classroom={classroom}
          seatMap={seatMap}
          setSeatMap={setSeatMap}
          unseated={unseated}
          setUnseated={setUnseated}
          noteForChart={noteForChart}
          setNoteForChart={setNoteForChart}
          manualCdl={manualCdl}
          cdlDraft={cdlDraft}
          setCdlDraft={setCdlDraft}
          setShowCdlEditor={setShowCdlEditor}
          setDebug={setDebug}
          compileNotesToCDL={compileNotesToCDL}
          buildUserPrompt={buildUserPrompt}
          runOptimizer={runOptimizer}
          importStudents={importStudentsUtil}
          exportStudents={exportStudentsUtil}
        />
      )}

      {/* --- EDITOR TAB -------------------------------------------------- */}
      {tab === "editor" && <LayoutEditor classroom={classroom} setClassroom={setClassroom} />}

      {/* DEBUG MODAL */}
{debug && (
        <DebugModal debug={debug} onClose={() => setDebug(null)} />
)}

      {/* CDL EDITOR MODAL */}
{showCdlEditor && (
        <CDLEditorModal
          isOpen={showCdlEditor}
          cdlDraft={cdlDraft}
          onClose={() => setShowCdlEditor(false)}
          onSave={(obj) => {
            setManualCdl(obj);
            setCdlDraft(JSON.stringify(obj, null, 2));  // Update cdlDraft with the new CDL
            setShowCdlEditor(false);
            alert("Manual CDL saved. Next Generate Chart will use it.");
          }}
          students={studentList}
          studentTags={studentTags}
          desks={classroom.desks}
        />
)}
    </div>
  );
}