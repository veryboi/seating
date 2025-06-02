import React, { useState, useEffect } from "react";
import BlockEditor from "../block-editor/BlockEditor";
import { parseCDL } from "../../lib/cdl.validate";

function CDLEditorModal({ isOpen, cdlDraft, onClose, onSave, students = [], studentTags = {}, desks = [] }) {
  const [cdlTab, setCdlTab] = useState("blocks");
  const [draftValue, setDraftValue] = useState(cdlDraft);

  // Debug logging
  console.log('CDLEditorModal received:', {
    cdlDraft,
    draftValue,
    students,
    studentTags,
    desks,
  });

  // Format student data
  const formattedStudents = Array.isArray(students) ? students : 
    typeof students === 'object' && students !== null ? 
      Array.isArray(students.students) ? students.students :  // Handle {students: [...]} format
      Object.keys(students) : 
    [];

  // Format student tags
  const formattedTags = typeof studentTags === 'object' && studentTags !== null ? 
    studentTags.tags || studentTags : // Handle {tags: {...}} format
    {};

  // Format desks
  const formattedDesks = Array.isArray(desks) ? desks :
    typeof desks === 'object' && desks !== null && Array.isArray(desks.desks) ? 
      desks.desks : // Handle {desks: [...]} format
      [];

  // Debug logging
  console.log('Formatted data:', {
    formattedStudents,
    formattedTags,
    formattedDesks,
  });

  // Update draft value when cdlDraft prop changes (from LLM or elsewhere)
  useEffect(() => {
    console.log('cdlDraft changed:', cdlDraft);
    setDraftValue(cdlDraft);
  }, [cdlDraft]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[800px] max-h-[90vh] rounded shadow flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center">
          <div className="flex gap-4 text-sm">
            <button
              className={cdlTab === "blocks" ? "font-semibold underline" : ""}
              onClick={() => setCdlTab("blocks")}
            >
              Blocks
            </button>
            <button
              className={cdlTab === "raw" ? "font-semibold underline" : ""}
              onClick={() => setCdlTab("raw")}
            >
              Raw JSON
            </button>
          </div>
        </div>

        {/* Editor area */}
        {cdlTab === "raw" ? (
          <textarea
            className="flex-1 p-6 font-mono text-sm outline-none resize-none bg-gray-50 font-[Menlo,Monaco,monospace]"
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            placeholder="Enter CDL JSON here..."
            style={{ minHeight: "500px", lineHeight: "1.5" }}
          />
        ) : (
          <div className="flex-1 overflow-auto p-4">
            <BlockEditor
              value={draftValue}
              onChange={setDraftValue}
              students={formattedStudents}
              studentTags={formattedTags}
              desks={formattedDesks}
            />
          </div>
        )}

        {/* Footer with actions */}
        <div className="p-3 border-t flex gap-2 justify-end">
          <button
            className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
            onClick={() => {
              try {
                // First try to parse as JSON
                const obj = JSON.parse(draftValue);
                
                // Then validate against CDL schema
                const validCdl = parseCDL(obj);
                
                // Only save if validation passes
                onSave(validCdl);
                onClose();
              } catch (err) {
                console.error('Save failed:', err.message);
                alert(err.message || "Invalid CDL format");
              }
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default CDLEditorModal; 