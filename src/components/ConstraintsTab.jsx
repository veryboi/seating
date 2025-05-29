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

  return (
    <div className="flex-1 p-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold">Seating Constraints</h2>
              <p className="text-sm text-gray-600">
                Define and edit constraints for student seating arrangements. Changes are automatically saved.
              </p>
            </div>
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

        {activeTab === 'blocks' ? (
          <BlockEditor
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