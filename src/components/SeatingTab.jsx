import React, { useState, useRef } from "react";
import { DndContext, rectIntersection } from "@dnd-kit/core";
import StudentPool from "./StudentPool";
import ViewerDesk from "./ViewerDesk";
import StudentEditor from "./StudentEditor";

function SeatingTab({
  studentList,
  setStudentList,
  studentTags,
  setStudentTags,
  studentNotes,
  setStudentNotes,
  customTags,
  setCustomTags,
  presetTags,
  classroom,
  seatMap,
  setSeatMap,
  unseated,
  setUnseated,
  noteForChart,
  setNoteForChart,
  manualCdl,
  cdlDraft,
  setCdlDraft,
  setShowCdlEditor,
  setDebug,
  compileNotesToCDL,
  buildUserPrompt,
  runOptimizer,
  importStudents,
  exportStudents
}) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentInput, setStudentInput] = useState("");
  const fileInputRef = useRef(null);

  const handleAddTag = (studentId, tag) => {
    setStudentTags((prev) => {
      if (prev[studentId]?.includes(tag)) return prev;
      const nextTags = prev[studentId] ? [...prev[studentId], tag] : [tag];
      return { ...prev, [studentId]: nextTags };
    });
    if (!presetTags.includes(tag) && !customTags.includes(tag)) {
      setCustomTags((p) => [...p, tag]);
    }
  };

  const handleRemoveTag = (studentId, tagIdx) =>
    setStudentTags((prev) => ({
      ...prev,
      [studentId]: prev[studentId].filter((_, i) => i !== tagIdx),
    }));

  const handleUpdateNote = (studentId, text) =>
    setStudentNotes((prev) => ({ ...prev, [studentId]: text }));

  const handleDragEnd = ({ active, over }) => {
    if (!over) return;

    const studentA = active.id;
    const targetId = over.id;

    const recalcUnseated = (nextSeatMap) => {
      const seated = new Set(Object.values(nextSeatMap).filter(Boolean));
      return studentList.filter((s) => !seated.has(s));
    };

    if (targetId === "pool") {
      const oldSeat = Object.entries(seatMap).find(([_, student]) => student === studentA)?.[0];
      if (!oldSeat) return;

      const next = { ...seatMap, [oldSeat]: null };
      setSeatMap(next);
      setUnseated(recalcUnseated(next));
      return;
    }

    if (studentList.includes(targetId)) {
      const studentB = targetId;
      if (studentA === studentB) return;

      const seatA = Object.entries(seatMap).find(([_, student]) => student === studentA)?.[0];
      const seatB = Object.entries(seatMap).find(([_, student]) => student === studentB)?.[0];
      if (!seatB) return;

      const next = { ...seatMap };
      if (seatA) next[seatA] = studentB;
      else next[seatB] = null;
      next[seatB] = studentA;

      setSeatMap(next);
      setUnseated(recalcUnseated(next));
      return;
    }

    if (!seatMap.hasOwnProperty(targetId)) return;

    const occupant = seatMap[targetId];

    if (!occupant) {
      const oldSeat = Object.entries(seatMap).find(([_, student]) => student === studentA)?.[0];
      const next = { ...seatMap };
      if (oldSeat) next[oldSeat] = null;
      next[targetId] = studentA;

      setSeatMap(next);
      setUnseated(recalcUnseated(next));
      return;
    }

    const studentB = occupant;
    const seatA = Object.entries(seatMap).find(([_, student]) => student === studentA)?.[0];
    const next = { ...seatMap };
    next[targetId] = studentA;
    if (seatA) next[seatA] = studentB;

    setSeatMap(next);
    setUnseated(recalcUnseated(next));
  };

  return (
    <div className="flex flex-1 p-4 space-x-4 overflow-hidden">
      <div className="w-1/3 h-full bg-white p-4 rounded shadow flex flex-col relative">
        <input
          id="importStudentsInput"
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              const reader = new FileReader();
              reader.onload = (evt) => {
                try {
                  const data = JSON.parse(evt.target.result);
                  if (Array.isArray(data.students)) {
                    const imported = importStudents(data);
                    setStudentList(imported.studentList);
                    setStudentTags(imported.studentTags);
                    setStudentNotes(imported.studentNotes);
                    setCustomTags(imported.customTags);
                    setSelectedStudent(null);
                  } else {
                    alert("JSON must contain a 'students' array");
                  }
                } catch (err) {
                  alert("Could not parse JSON. Make sure the file is valid.");
                  console.error(err);
                }
              };
              reader.readAsText(f);
            }
            e.target.value = "";
          }}
        />

        <div className="flex-1 overflow-y-auto my-4 space-y-2">
          {studentList.map((s) =>
            selectedStudent === s ? (
              <StudentEditor
                key={s}
                student={s}
                tags={studentTags[s] || []}
                note={studentNotes[s] || ""}
                allTags={[...presetTags, ...customTags]}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                onUpdateNote={handleUpdateNote}
                onDelete={(name) => {
                  setStudentList((p) => p.filter((x) => x !== name));
                  setStudentTags((p) => {
                    const n = { ...p };
                    delete n[name];
                    return n;
                  });
                  setStudentNotes((p) => {
                    const n = { ...p };
                    delete n[name];
                    return n;
                  });
                  setSelectedStudent(null);
                }}
                onCollapse={() => setSelectedStudent(null)}
              />
            ) : (
              <button
                key={s}
                className="w-full text-left border rounded p-2 hover:bg-blue-100 transition bg-gray-100"
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
            )
          )}
        </div>

        <div className="sticky bottom-0 bg-white z-10 pt-4 space-y-4 border-t">
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

          <div className="flex gap-2">
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded"
              onClick={async () => {
                try {
                  const promptText = buildUserPrompt(
                    noteForChart,
                    studentNotes,
                    studentTags,
                    [...presetTags, ...customTags]
                  );

                  console.log('Generating CDL with:', {
                    noteForChart,
                    studentNotes,
                    studentTags,
                    desks: classroom.desks,
                    tags: [...presetTags, ...customTags]
                  });

                  const cdl = await compileNotesToCDL(
                    noteForChart,
                    studentNotes,
                    studentTags,
                    classroom.desks,
                    [...presetTags, ...customTags]
                  );
                  
                  console.log('Generated CDL:', cdl);
                  const cdlString = JSON.stringify(cdl, null, 2);
                  console.log('Stringified CDL:', cdlString);
                  
                  setCdlDraft(cdlString);
                  setDebug({ prompt: promptText, cdl });
                  alert("CDL generated successfully. You can now generate the chart or edit the CDL.");
                } catch (err) {
                  console.error("Could not generate CDL:", err);
                  alert("Could not generate CDL:\n" + (err?.message || String(err)));
                }
              }}
            >
              Generate CDL
            </button>
            <button
              className="bg-emerald-600 text-white px-3 py-1 rounded"
              onClick={() => {
                try {
                  const cdl = JSON.parse(cdlDraft);
                  const seatMapNew = runOptimizer(
                    studentList.map((id) => ({
                      id,
                      firstName: id.split(" ")[0],
                      lastName: id.split(" ").slice(1).join(" ") || id,
                      tags: studentTags[id] || [],
                    })),
                    classroom.desks,
                    cdl
                  );

                  setSeatMap(seatMapNew);
                  const seated = new Set(Object.values(seatMapNew).filter(Boolean));
                  setUnseated(studentList.filter((s) => !seated.has(s)));
                } catch (err) {
                  console.log("Could not generate chart:\n" + (err?.message || String(err)));
                  alert("Could not generate chart:\n" + (err?.message || String(err)));
                }
              }}
            >
              Generate Chart
            </button>
            <button
              className="bg-gray-700 text-white px-3 py-1 rounded"
              onClick={() => setShowCdlEditor(true)}
            >
              Edit CDL
            </button>
            <div className="border-l mx-2" />
            <button
              className="bg-emerald-500 text-white px-3 rounded"
              onClick={() => document.getElementById("importStudentsInput").click()}
            >
              Import
            </button>
            <button
              className="bg-emerald-600 text-white px-3 rounded"
              onClick={() => exportStudents(studentList, studentTags, studentNotes, customTags)}
            >
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white p-4 rounded shadow flex flex-col overflow-y-auto">
        <h2 className="font-bold text-lg text-center mb-2">Seating Sandbox</h2>

        <DndContext collisionDetection={rectIntersection} onDragEnd={handleDragEnd}>
          <StudentPool students={unseated} studentTags={studentTags} studentNotes={studentNotes} onAddTag={handleAddTag} />

          <div
            className="relative mt-4 w-full h-[500px] border border-gray-300 rounded bg-slate-50 overflow-scroll"
            style={{ scrollbarGutter: "stable" }}
          >
            <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-semibold pointer-events-none">
              Front
            </span>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-semibold pointer-events-none">
              Back
            </span>
            <span className="absolute top-1/2 -translate-y-1/2 left-2 -rotate-90 origin-left text-xs font-semibold pointer-events-none">
              Left
            </span>
            <span className="absolute top-1/2 -translate-y-1/2 right-2 rotate-90 origin-right text-xs font-semibold pointer-events-none">
              Right
            </span>

            <div className="relative w-[4000px] h-[4000px]">
              {classroom.desks.map((desk, i) => (
                <ViewerDesk
                  key={i}
                  desk={desk}
                  deskIndex={i}
                  seatMap={seatMap}
                  studentTags={studentTags}
                  studentNotes={studentNotes}
                  onAddTag={handleAddTag}
                />
              ))}
            </div>
          </div>
        </DndContext>
      </div>
    </div>
  );
}

export default SeatingTab; 