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
  const [isGeneratingCDL, setIsGeneratingCDL] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
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
    <div className="flex flex-1 h-full bg-gradient-to-br from-slate-50 to-slate-100">
      {/* LEFT PANEL - Student Management */}
      <div className="w-80 h-full bg-white border-r border-slate-200 shadow-sm flex flex-col">
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

        {/* Header */}
        

        {/* Student List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
                className="w-full text-left bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all duration-200 group"
                onClick={() => setSelectedStudent(s)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 group-hover:text-blue-600 text-sm">{s}</span>
                  <svg className="w-3 h-3 text-slate-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(studentTags[s] || []).map((tag, i) => (
                    <span key={i} className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            )
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          {/* Add Student */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700">Add New Student</label>
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
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
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 transition-colors font-medium"
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
          </div>

          {/* Chart Note */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">Chart Instructions</label>
            <textarea
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              rows={2}
              placeholder="e.g. Keep disruptive students apart..."
              value={noteForChart}
              onChange={(e) => setNoteForChart(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {/* Debug Mode */}
            <label className="flex items-center space-x-2 text-xs">
              <input
                type="checkbox"
                className="w-3 h-3 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500/20"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
              />
              <span className="text-slate-700">Debug Mode</span>
            </label>

            {/* AI Actions */}
            <div className="grid grid-cols-2 gap-1">
              <button
                className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  isGeneratingCDL 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
                onClick={async () => {
                  if (isGeneratingCDL) return;
                  setIsGeneratingCDL(true);
                  try {
                    const promptText = buildUserPrompt(
                      noteForChart,
                      studentNotes,
                      studentTags,
                      classroom.desks,
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
                    if (debugMode) {
                      setDebug({ prompt: promptText, cdl });
                    }
                    setShowSuccessModal(true);
                  } catch (err) {
                    console.error("Could not generate CDL:", err);
                    alert("Could not generate CDL:\n" + (err?.message || String(err)));
                  } finally {
                    setIsGeneratingCDL(false);
                  }
                }}
                disabled={isGeneratingCDL}
              >
                {isGeneratingCDL ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : (
                  'Generate CDL'
                )}
              </button>
              <button
                className="px-2 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
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
            </div>

            {/* Import/Export */}
            <div className="grid grid-cols-2 gap-1">
              <button
                className="px-2 py-1.5 text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={() => document.getElementById("importStudentsInput").click()}
              >
                Import Students
              </button>
              <button
                className="px-2 py-1.5 text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={() => exportStudents(studentList, studentTags, studentNotes, customTags)}
              >
                Export Students
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Seating Visualization */}
      <div className="flex-1 bg-white flex flex-col">
        

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden" style={{ position: 'relative', zIndex: 0 }}>
          <DndContext 
            collisionDetection={rectIntersection} 
            onDragEnd={handleDragEnd}
          >
            <StudentPool students={unseated} studentTags={studentTags} studentNotes={studentNotes} onAddTag={handleAddTag} />

            <div
              className="relative mt-3 w-full border-2 border-dashed border-slate-300 rounded-xl bg-gradient-to-br from-slate-50 to-white overflow-auto"
              style={{ 
                height: '680px',
                scrollbarGutter: "stable",
                zIndex: 1
              }}
            >
              {/* Orientation Labels */}
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-200" style={{ zIndex: 5 }}>
                Front of Classroom
              </span>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-200" style={{ zIndex: 5 }}>
                Back of Classroom
              </span>
              <span className="absolute top-1/2 -translate-y-1/2 left-2 -rotate-90 origin-left text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-200" style={{ zIndex: 5 }}>
                Left Wall
              </span>
              <span className="absolute top-1/2 -translate-y-1/2 right-2 rotate-90 origin-right text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-200" style={{ zIndex: 5 }}>
                Right Wall
              </span>

              <div className="relative" style={{ width: '1000px', height: '600px', zIndex: 2 }}>
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md mx-4 border border-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">CDL Generated Successfully!</h3>
              </div>
            </div>
            <p className="text-slate-600 mb-6">
              Your constraints have been generated. You can view and edit them in the Constraints tab.
            </p>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 transition-colors font-medium"
                onClick={() => setShowSuccessModal(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SeatingTab; 