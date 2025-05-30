import React, { useState, useRef } from "react";
import ReactDOM from "react-dom";

function StudentEditor({
  student,
  tags,
  note,
  allTags,
  onAddTag,
  onRemoveTag,
  onUpdateNote,
  onDelete,
  onCollapse
}) {
  if (!student) {
    return (
      <div className="border rounded p-3 text-sm text-gray-500">
        Select a student to edit
      </div>
    );
  }

  const [tagInput, setTagInput] = useState("");
  const [localNote, setLocalNote] = useState(note || "");
  const [openTags, setOpenTags] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ left: 0, top: 0, width: 0 });
  const toggleRef = useRef(null);

  return (
    <div className="border rounded p-3 space-y-3 bg-gray-50">
      <div
        className="flex justify-between items-start cursor-pointer select-none"
        onClick={onCollapse}
      >
        <h3 className="font-bold text-lg">{student}</h3>
        <button
          className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(student);
          }}
        >
          Delete
        </button>
      </div>

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

      <div className="relative">
        <button
          ref={toggleRef}
          type="button"
          className="w-full text-sm border rounded px-2 py-1 text-gray-600 bg-white hover:bg-gray-100"
          onClick={() => {
            if (!openTags && toggleRef.current) {
              const r = toggleRef.current.getBoundingClientRect();
              setDropdownPos({ left: r.left, top: r.bottom, width: r.width });
            }
            setOpenTags(!openTags);
          }}
        >
          + Tag
        </button>
      </div>

      {openTags &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "fixed",
              left: dropdownPos.left,
              top: dropdownPos.top,
              width: dropdownPos.width,
              maxHeight: "160px",
            }}
            className="overflow-y-auto bg-white border rounded shadow z-[1000]"
            onMouseLeave={() => setOpenTags(false)}
            onWheel={(e) => e.stopPropagation()}
          >
            {allTags.map((t) => (
              <button
                key={t}
                className={`block w-full text-left px-2 py-1 text-xs ${
                  tags.includes(t)
                    ? "text-gray-400 cursor-not-allowed"
                    : "hover:bg-gray-200"
                }`}
                disabled={tags.includes(t)}
                onClick={() => {
                  onAddTag(student, t);
                  setOpenTags(false);
                }}
              >
                {t}
              </button>
            ))}

            <form
              className="flex gap-1 p-2 border-t"
              onSubmit={(e) => {
                e.preventDefault();
                const clean = tagInput.trim();
                if (!clean) return;
                onAddTag(student, clean);
                setTagInput("");
                setOpenTags(false);
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
          </div>,
          document.body
        )}

      <div className="space-y-1">
        <label className="text-xs font-medium">Note</label>
        <textarea
          className="w-full border rounded p-1 text-xs"
          rows={2}
          placeholder="Notes about this student"
          value={localNote}
          onChange={(e) => setLocalNote(e.target.value)}
          onBlur={() => onUpdateNote(student, localNote)}
        />
      </div>
    </div>
  );
}

export default StudentEditor; 