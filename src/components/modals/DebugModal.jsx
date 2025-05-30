import React from "react";

function DebugModal({ debug, onClose }) {
  if (!debug) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000]">
      <div className="bg-white rounded shadow-lg max-w-lg w-[90%] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">Generation Debug Info</h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-1">Prompt sent to LLM</h3>
              <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-2 rounded">
                {debug.prompt}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-1">CDL returned</h3>
              <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-2 rounded">
                {JSON.stringify(debug.cdl, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-4 border-t bg-white sticky bottom-0">
          <button
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default DebugModal; 