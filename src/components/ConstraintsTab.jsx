import React, { useState } from 'react';
import BlockEditor from './block-editor/BlockEditor';
import { parseCDL } from '../lib/cdl.validate';

function ConstraintsTab({
  cdlDraft,
  setCdlDraft,
  studentList,
  studentTags,
  desks
}) {
  const [activeTab, setActiveTab] = useState('blocks');
  const [rawValue, setRawValue] = useState(cdlDraft);
  const [blockEditorKey, setBlockEditorKey] = useState(0);

  // Keep raw value in sync with cdlDraft
  React.useEffect(() => {
    setRawValue(cdlDraft);
  }, [cdlDraft]);

  const handleRawSave = () => {
    try {
      // First try to parse as JSON
      const obj = JSON.parse(rawValue);
      
      // Then validate against CDL schema
      const validCdl = parseCDL(obj);
      
      // Only save if validation passes
      setCdlDraft(JSON.stringify(validCdl, null, 2));
    } catch (err) {
      console.error('Save failed:', err.message);
      alert(err.message || "Invalid CDL format");
    }
  };

  const exportCdl = () => {
    if (!cdlDraft || cdlDraft.trim() === '') {
      alert("No CDL to export. Please create some constraints first.");
      return;
    }

    try {
      // Validate and pretty-format the CDL
      const cdlObj = JSON.parse(cdlDraft);
      const formattedCdl = JSON.stringify(cdlObj, null, 2);
      
      const blob = new Blob([formattedCdl], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'constraints.cdl';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Could not export CDL. Make sure it's valid JSON.");
      console.error(err);
    }
  };

  return (
    <div className="flex-1 p-4">
      <input
        id="importCdlInput"
        type="file"
        accept=".cdl,text/plain"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            const reader = new FileReader();
            reader.onload = (evt) => {
              try {
                const cdlText = evt.target.result;
                // Validate that it's valid JSON
                const cdlObj = JSON.parse(cdlText);
                // Validate against CDL schema
                const validCdl = parseCDL(cdlObj);
                const formattedCdl = JSON.stringify(validCdl, null, 2);
                setCdlDraft(formattedCdl);
                setRawValue(formattedCdl);
                // Force BlockEditor to remount with new data
                setBlockEditorKey(prev => prev + 1);
              } catch (err) {
                alert("Could not parse CDL file. Make sure it contains valid CDL JSON.");
                console.error(err);
              }
            };
            reader.readAsText(f);
          }
          e.target.value = "";
        }}
      />

      <div className="bg-white rounded-lg shadow p-4">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold">Seating Constraints</h2>
              <p className="text-sm text-gray-600">
                Define and edit constraints for student seating arrangements. Changes are automatically saved.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <button
                  className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                  onClick={() => document.getElementById("importCdlInput").click()}
                >
                  Import CDL
                </button>
                <button
                  className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                  onClick={exportCdl}
                >
                  Export CDL
                </button>
              </div>
              <div className="border-l h-6 mx-2"></div>
              <div className="flex gap-4">
                <button
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeTab === 'blocks' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('blocks')}
                >
                  Block Editor
                </button>
                <button
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeTab === 'raw' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('raw')}
                >
                  Raw JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'blocks' ? (
          <BlockEditor
            key={blockEditorKey}
            value={cdlDraft}
            onChange={setCdlDraft}
            students={studentList}
            studentTags={studentTags}
            desks={desks}
          />
        ) : (
          <div className="space-y-4">
            <textarea
              className="w-full h-[600px] p-4 font-mono text-sm border rounded bg-gray-50 resize-none"
              value={rawValue}
              onChange={(e) => setRawValue(e.target.value)}
              placeholder="Enter CDL JSON here..."
              style={{ fontFamily: 'Menlo, Monaco, monospace' }}
            />
            <div className="flex justify-end">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleRawSave}
              >
                Validate & Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConstraintsTab; 