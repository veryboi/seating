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
    <div className="flex-1 h-full bg-gradient-to-br from-slate-50 to-slate-100">
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

      <div className="h-full p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
          {/* HEADER */}
          <div className="px-6 py-5 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">⚙️</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Seating Constraints</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Define and edit constraints for student seating arrangements
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Import/Export Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-colors"
                    onClick={() => document.getElementById("importCdlInput").click()}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                    </svg>
                    Import
                  </button>
                  <button
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-700 bg-purple-100 border border-purple-300 rounded-lg hover:bg-purple-200 hover:border-purple-400 transition-colors"
                    onClick={exportCdl}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    Export
                  </button>
                </div>

                {/* View Toggle */}
                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                  <button
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                      activeTab === 'blocks' 
                        ? "bg-white text-slate-900 shadow-sm" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    onClick={() => setActiveTab('blocks')}
                  >
                    Block Editor
                  </button>
                  <button
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                      activeTab === 'raw' 
                        ? "bg-white text-slate-900 shadow-sm" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    onClick={() => setActiveTab('raw')}
                  >
                    Raw JSON
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'blocks' ? (
              <div className="h-full relative">
                {/* Scroll indicator */}
                <div className="absolute top-0 right-0 w-4 h-16 bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>
                <div className="absolute bottom-0 right-0 w-4 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
                
                <div 
                  className="h-full px-6 py-4 scrollbar-always-visible" 
                  style={{ 
                    overflowY: 'scroll',
                    scrollbarWidth: 'auto',
                    scrollbarGutter: 'stable'
                  }}
                >
                  <BlockEditor
                    key={blockEditorKey}
                    value={cdlDraft}
                    onChange={setCdlDraft}
                    students={studentList}
                    studentTags={studentTags}
                    desks={desks}
                  />
                  {/* Bottom padding to ensure last content is visible */}
                  <div className="h-8"></div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col p-6">
                <div className="flex-1 relative">
                  <textarea
                    className="w-full h-full p-4 font-mono text-sm border-2 border-slate-200 rounded-xl bg-slate-50/50 resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                    value={rawValue}
                    onChange={(e) => setRawValue(e.target.value)}
                    placeholder="Enter CDL JSON here..."
                    style={{ 
                      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                      scrollbarWidth: 'auto'
                    }}
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                    onClick={handleRawSave}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Validate & Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Custom scrollbar styles */}
          <style jsx>{`
            .scrollbar-always-visible::-webkit-scrollbar {
              width: 12px;
            }
            .scrollbar-always-visible::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 6px;
            }
            .scrollbar-always-visible::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 6px;
              border: 2px solid #f1f5f9;
            }
            .scrollbar-always-visible::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }
            .scrollbar-always-visible {
              scrollbar-width: thin;
              scrollbar-color: #cbd5e1 #f1f5f9;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}

export default ConstraintsTab; 