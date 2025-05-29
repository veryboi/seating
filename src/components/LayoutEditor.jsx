import React, { useState, useRef, useEffect } from "react";
import { DndContext, pointerWithin } from "@dnd-kit/core";
import DraggableDesk from "./DraggableDesk";

function LayoutEditor({ classroom, setClassroom }) {
  const [desks, setDesks] = useState(() => JSON.parse(JSON.stringify(classroom.desks)));
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
    setDesks((prev) => [
      ...prev,
      {
        position: [250, 250],
        seats: [
          [-30, -20],
          [30, -20],
          [-30, 20],
          [30, 20],
        ],
        shape: { type: "rectangle", width: 120, height: 70 },
      },
    ]);
  };

  const addCircleDesk = () => {
    setDesks((prev) => [
      ...prev,
      {
        position: [250, 250],
        seats: [],
        shape: { type: "circle", radius: 70 },
      },
    ]);
  };

  const addPolygonDesk = () => {
    setDesks((prev) => [
      ...prev,
      {
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
    ]);
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
          setDesks(data.desks);
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
    <div className="flex-1 flex flex-col gap-4 overflow-hidden p-4 m-4 bg-white rounded-lg shadow">
      <div className="flex flex-wrap gap-2 items-center">
        <button className="bg-blue-500 text-white px-3 py-2 rounded" onClick={addRectangleDesk}>
          + Rectangle Desk
        </button>
        <button className="bg-blue-500 text-white px-3 py-2 rounded" onClick={addCircleDesk}>
          + Circle Desk
        </button>
        <button className="bg-blue-500 text-white px-3 py-2 rounded" onClick={addPolygonDesk}>
          + Polygon Desk
        </button>
        <button
          className={`bg-emerald-600 text-white px-3 py-2 rounded ${selectedDesk == null ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={selectedDesk == null}
          onClick={addSeatToSelectedDesk}
        >
          + Seat
        </button>

        <button
          className={`bg-red-500 text-white px-3 py-2 rounded ${
            selectedSeat == null ? "opacity-50 cursor-not-allowed" : ""
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
          Delete Seat
        </button>

        <button
          className={`bg-red-600 text-white px-3 py-2 rounded ${
            selectedDesk == null ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={selectedDesk == null}
          onClick={() => {
            setDesks((prev) => prev.filter((_, i) => i !== selectedDesk));
            setSelectedDesk(null);
            setSelectedSeat(null);
          }}
        >
          Delete Desk
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/JSON"
          className="hidden"
          onChange={handleImportJson}
        />
        <button
          className="bg-green-500 text-white px-3 py-2 rounded ml-auto"
          onClick={() => fileInputRef.current?.click()}
        >
          Import JSON
        </button>
        <button className="bg-green-600 text-white px-3 py-2 rounded" onClick={downloadJson}>
          Download JSON
        </button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
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
            className="relative flex-1 border rounded bg-slate-100 overflow-hidden"
            style={{ minHeight: 600 }}
            onClick={() => setSelectedDesk(null)}
          >
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

        <div className="w-64 bg-white border rounded p-4 overflow-y-auto">
          {selectedDesk == null ? (
            <p className="text-sm text-gray-500">Select a desk to edit its properties</p>
          ) : (
            <>
              <h2 className="font-bold mb-2 text-lg">Desk {selectedDesk + 1}</h2>
              {selectedShape.type === "rectangle" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Width</label>
                  <input
                    type="number"
                    className="w-full border p-1 rounded"
                    value={selectedShape.width}
                    onChange={(e) => updateShape("width", Number(e.target.value))}
                  />
                  <label className="block text-sm font-medium">Height</label>
                  <input
                    type="number"
                    className="w-full border p-1 rounded"
                    value={selectedShape.height}
                    onChange={(e) => updateShape("height", Number(e.target.value))}
                  />
                </div>
              )}

              {selectedShape.type === "circle" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Radius</label>
                  <input
                    type="number"
                    className="w-full border p-1 rounded"
                    value={selectedShape.radius}
                    onChange={(e) => updateShape("radius", Number(e.target.value))}
                  />
                </div>
              )}

              {selectedShape.type === "polygon" && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Edit the points array directly in code for advanced shapes.</p>
                  <label className="block text-sm font-medium">Scale</label>
                  <input
                    type="number"
                    className="w-full border p-1 rounded"
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LayoutEditor; 