import React, { useState, useRef, useEffect } from "react";
import { DndContext, pointerWithin } from "@dnd-kit/core";
import DraggableDesk from "./DraggableDesk";

function LayoutEditor({ classroom, setClassroom }) {
  const [desks, setDesks] = useState(() => {
    const initialDesks = JSON.parse(JSON.stringify(classroom.desks));
    // Ensure each desk has an ID
    return initialDesks.map((desk, index) => ({
      ...desk,
      id: desk.id || `desk-${index}`,
    }));
  });
  const [selectedDesk, setSelectedDesk] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setClassroom((prev) => ({ ...prev, desks }));
  }, [desks, setClassroom]);

  const handleSeatSelect = (deskIdx, seatIdx) => {
    setSelectedDesk(deskIdx);
    setSelectedSeat(seatIdx);
  };

  const handleDeskPositionChange = (dIdx, newPos) =>
    setDesks((prev) => {
      const next = [...prev];
      next[dIdx] = { ...next[dIdx], position: newPos };
      return next;
    });

  const handleSeatPositionChange = (dIdx, seatIdx, newPos) =>
    setDesks((prev) => {
      const next = [...prev];
      const seats = [...next[dIdx].seats];
      seats[seatIdx] = newPos;
      next[dIdx] = { ...next[dIdx], seats };
      return next;
    });

  const addRectangleDesk = () => {
    setDesks((prev) => {
      const newIndex = prev.length;
      return [
        ...prev,
        {
          id: `desk-${newIndex}`,
          position: [250, 250],
          seats: [
            [-30, -20],
            [30, -20],
            [-30, 20],
            [30, 20],
          ],
          shape: { type: "rectangle", width: 120, height: 70 },
        },
      ];
    });
  };

  const addCircleDesk = () => {
    setDesks((prev) => {
      const newIndex = prev.length;
      return [
        ...prev,
        {
          id: `desk-${newIndex}`,
          position: [250, 250],
          seats: [],
          shape: { type: "circle", radius: 70 },
        },
      ];
    });
  };

  const addPolygonDesk = () => {
    setDesks((prev) => {
      const newIndex = prev.length;
      return [
        ...prev,
        {
          id: `desk-${newIndex}`,
          position: [250, 250],
          seats: [],
          shape: {
            type: "polygon",
            points: [
              [0, -50],
              [45, 35],
              [-45, 35],
            ],
          },
        },
      ];
    });
  };

  const addSeatToSelectedDesk = () => {
    if (selectedDesk == null) return;
    setDesks((prev) => {
      const next = [...prev];
      const seats = [...next[selectedDesk].seats, [0, 0]];
      next[selectedDesk] = { ...next[selectedDesk], seats };
      return next;
    });
  };

  const updateShape = (field, value) => {
    if (selectedDesk == null) return;
    setDesks((prev) => {
      const next = [...prev];
      next[selectedDesk] = {
        ...next[selectedDesk],
        shape: { ...next[selectedDesk].shape, [field]: value },
      };
      return next;
    });
  };

  const downloadJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify({ desks }, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = "chart1.json";
    a.click();
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (Array.isArray(data.desks)) {
          // Ensure each desk has an ID
          const desksWithIds = data.desks.map((desk, index) => ({
            ...desk,
            id: desk.id || `desk-${index}`,
          }));
          setDesks(desksWithIds);
          setSelectedDesk(null);
        } else {
          alert("JSON must contain a 'desks' array");
        }
      } catch {
        alert("Could not parse JSON. Make sure the file is valid.");
      }
    };
    reader.readAsText(file);
  };

  const selectedShape =
    Number.isInteger(selectedDesk) && desks[selectedDesk]
      ? desks[selectedDesk].shape
      : null;

  return (
    <div className="flex-1 h-full bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="h-full p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
          {/* HEADER */}
          <div className="px-6 py-5 border-b border-slate-200">
            <div className="flex items-center justify-between">
              {/* <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">✏️</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Layout Editor</h2>
                  <p className="text-sm text-slate-600 mt-1">Design and customize your classroom layout</p>
                </div>
              </div> */}
              
              {/* Import/Export Actions */}
              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/JSON"
                  className="hidden"
                  onChange={handleImportJson}
                />
                <button
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                  </svg>
                  Import Layout
                </button>
                <button 
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 border border-emerald-300 rounded-lg hover:bg-emerald-200 hover:border-emerald-400 transition-colors"
                  onClick={downloadJson}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  Export Layout
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-700">Add Desk:</span>
                <button 
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  onClick={addRectangleDesk}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  </svg>
                  Rectangle
                </button>
                <button 
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  onClick={addCircleDesk}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  Circle
                </button>
                {/* <button 
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  onClick={addPolygonDesk}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polygon points="12,2 22,20 2,20"/>
                  </svg>
                  Triangle
                </button> */}
              </div>
              
              <div className="border-l border-slate-300 pl-3 flex items-center space-x-2">
                <button
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedDesk == null 
                      ? "text-slate-400 bg-slate-50 border border-slate-200 cursor-not-allowed" 
                      : "text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100"
                  }`}
                  disabled={selectedDesk == null}
                  onClick={addSeatToSelectedDesk}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                  Add Seat
                </button>
                
                <button
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedSeat == null 
                      ? "text-slate-400 bg-slate-50 border border-slate-200 cursor-not-allowed" 
                      : "text-red-700 bg-red-50 border border-red-200 hover:bg-red-100"
                  }`}
                  disabled={selectedSeat == null}
                  onClick={() => {
                    if (selectedDesk == null || selectedSeat == null) return;
                    setDesks((prev) => {
                      const next = [...prev];
                      const seats = [...next[selectedDesk].seats];
                      seats.splice(selectedSeat, 1);
                      next[selectedDesk] = { ...next[selectedDesk], seats };
                      return next;
                    });
                    setSelectedSeat(null);
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  Delete Seat
                </button>

                <button
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedDesk == null 
                      ? "text-slate-400 bg-slate-50 border border-slate-200 cursor-not-allowed" 
                      : "text-red-700 bg-red-50 border border-red-200 hover:bg-red-100"
                  }`}
                  disabled={selectedDesk == null}
                  onClick={() => {
                    setDesks((prev) => prev.filter((_, i) => i !== selectedDesk));
                    setSelectedDesk(null);
                    setSelectedSeat(null);
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  Delete Desk
                </button>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="flex-1 flex overflow-hidden">
            {/* Canvas */}
            <div className="flex-1 p-6">
              <DndContext
                collisionDetection={pointerWithin}
                onDragStart={({ active }) => {
                  const m = /^desk-(\d+)$/.exec(active?.id ?? "");
                  if (m) setSelectedDesk(Number(m[1]));
                }}
                onDragEnd={({ active }) => {
                  const m = /^desk-(\d+)$/.exec(active?.id ?? "");
                  if (m) setSelectedDesk(Number(m[1]));
                }}
              >
                <div
                  className="relative w-full h-full border-2 border-dashed border-slate-300 rounded-xl bg-gradient-to-br from-slate-50 to-white overflow-auto"
                  style={{ minHeight: 600 }}
                  onClick={() => setSelectedDesk(null)}
                >
                  {/* Orientation Labels */}
                  <span className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                    Front of Classroom
                  </span>
                  <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                    Back of Classroom
                  </span>
                  <span className="absolute top-1/2 -translate-y-1/2 left-4 -rotate-90 origin-left text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                    Left Wall
                  </span>
                  <span className="absolute top-1/2 -translate-y-1/2 right-4 rotate-90 origin-right text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                    Right Wall
                  </span>

                  {desks.map((desk, i) => (
                    <DraggableDesk
                      key={i}
                      desk={desk}
                      index={i}
                      isSelected={selectedDesk === i}
                      selectedSeat={selectedSeat}
                      onSelect={(idx) => {
                        setSelectedDesk(idx);
                        setSelectedSeat(null);
                      }}
                      onPositionChange={handleDeskPositionChange}
                      onSeatPositionChange={handleSeatPositionChange}
                      onSeatSelect={handleSeatSelect}
                    />
                  ))}
                </div>
              </DndContext>
            </div>

            {/* Properties Panel */}
            <div className="w-80 border-l border-slate-200 bg-slate-50/50">
              <div className="p-6">
                {selectedDesk == null ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Desk Selected</h3>
                    <p className="text-sm text-slate-500">Click on a desk to edit its properties</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Desk {selectedDesk + 1} Properties
                      </h3>
                      <p className="text-sm text-slate-600">
                        {desks[selectedDesk].seats.length} seat{desks[selectedDesk].seats.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {selectedShape.type === "rectangle" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Width</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            value={selectedShape.width}
                            onChange={(e) => updateShape("width", Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Height</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            value={selectedShape.height}
                            onChange={(e) => updateShape("height", Number(e.target.value))}
                          />
                        </div>
                      </div>
                    )}

                    {selectedShape.type === "circle" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Radius</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                          value={selectedShape.radius}
                          onChange={(e) => updateShape("radius", Number(e.target.value))}
                        />
                      </div>
                    )}

                    {selectedShape.type === "polygon" && (
                      <div className="space-y-4">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-800">
                            Polygon shapes are advanced. Edit the points array directly in code for precise control.
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Scale Factor</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            step={0.1}
                            defaultValue={1}
                            onChange={(e) => {
                              const scale = parseFloat(e.target.value);
                              setDesks((prev) => {
                                const next = [...prev];
                                const pts = prev[selectedDesk].shape.points.map(([x, y]) => [x * scale, y * scale]);
                                next[selectedDesk] = {
                                  ...prev[selectedDesk],
                                  shape: { ...prev[selectedDesk].shape, points: pts },
                                };
                                return next;
                              });
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LayoutEditor; 