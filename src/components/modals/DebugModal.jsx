import React from "react";

function DebugModal({ debug, onClose }) {
  if (!debug) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000]">
      <div className="bg-white rounded shadow-lg max-w-lg w-[90%] max-h-[85vh] p-4 overflow-auto">
        <h2 className="font-bold text-lg mb-3">Generation Debug Info</h2>

        <h3 className="font-semibold text-sm mb-1">Prompt sent to LLM</h3>
        <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-2 rounded mb-4">
          {debug.prompt}
        </pre>

        <h3 className="font-semibold text-sm mb-1">CDL returned</h3>
        <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-2 rounded">
          {JSON.stringify(debug.cdl, null, 2)}
        </pre>

        <button
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default DebugModal; 