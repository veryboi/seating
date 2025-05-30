import React from "react";
import { useDroppable } from "@dnd-kit/core";
import DraggableStudent from "./DraggableStudent";

function StudentPool({ students, studentTags, studentNotes, onAddTag }) {
  const { setNodeRef, isOver } = useDroppable({ id: "pool" });

  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center">
          <span className="text-slate-600 text-sm">👥</span>
        </div>
        <h3 className="text-sm font-medium text-slate-700">Unassigned Students</h3>
        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          {students.length}
        </span>
      </div>
      
      <div
        ref={setNodeRef}
        className={`min-h-24 max-h-32 w-full p-4 border-2 border-dashed rounded-xl transition-all duration-200 overflow-auto ${
          isOver 
            ? "border-emerald-400 bg-emerald-50/50" 
            : "border-slate-300 bg-slate-50/50 hover:border-slate-400"
        }`}
        style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 96px)',
          gap: '16px',
          justifyContent: 'start'
        }}
      >
        {students.length === 0 ? (
          <div className="col-span-full w-full flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <p className="text-slate-500 text-sm">All students are seated</p>
              <p className="text-slate-400 text-xs mt-1">Drag students here to unseat them</p>
            </div>
          </div>
        ) : (
          students.map((s) => (
            <div key={s} style={{ width: '96px', height: '96px' }}>
              <DraggableStudent
                id={s}
                tags={studentTags[s] || []}
                note={studentNotes[s] || ""}
                onAddTag={onAddTag}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default StudentPool; 