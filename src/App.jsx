import { useState } from 'react'
import './App.css'
import './index.css';
// App.jsx
import React from 'react';
import {
  DndContext,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";


function DraggableStudent({ id }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="w-24 h-24 bg-blue-500 text-white flex items-center justify-center rounded shadow"
      style={style}
    >
      {id}
    </div>
  );
}

function DropZone({ id }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`w-24 h-24 border-2 ${
        isOver ? "border-green-500" : "border-gray-300"
      } rounded flex items-center justify-center`}
    >
      Seat
    </div>
  );
}






export default function App() {


  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over) {
      console.log(`Moved ${active.id} to ${over.id}`);
      // update state here
    }
  };


  return (
    <div className="flex h-screen p-4 space-x-4 bg-gray-100">
      
      {/* Left Panel */}
      <div className="w-1/3 bg-white p-4 rounded shadow space-y-4">
        <div className="flex justify-between items-center">
          <label className="font-bold">Upload CSV</label>
          <span className="text-gray-400 cursor-pointer">?</span>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <select className="w-full border p-2 rounded">
                <option>First Name Last Name</option>
              </select>
              <input type="text" className="w-full border p-2 rounded" placeholder="Student Name" />
              <span className="text-green-500">✓</span>
            </div>
          ))}
        </div>
        <button className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Generate Seating Chart
        </button>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Top controls */}
        <div className="flex items-center justify-center">
          <label className="font-bold">Group Size</label>
          <input
            type="number"
            className="border p-2 rounded w-20"
            defaultValue={4}
          />
        </div>

        {/* Seating grid */}
        {/* <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-2 grid-rows-2 gap-1 border p-4 rounded h-56 w-56 bg-white shadow">
              <div className="border p-1 text-center text-xs">Seat</div>
              <div className="border p-1 text-center text-xs">Seat</div>
              <div className="border p-1 text-center text-xs">Seat</div>
              <div className="border p-1 text-center text-xs">Seat</div>
              
            </div>
          ))}
        </div> */}
        <DndContext onDragEnd={handleDragEnd}>
      <div className="p-8 grid grid-cols-4 gap-4">
        <DraggableStudent id="Alice" />
        <DropZone id="seat-1" />
        <DropZone id="seat-2" />
        <DropZone id="seat-3" />
      </div>
    </DndContext>

        {/* Footer inputs */}
        <div className="border-t pt-4 mt-auto space-y-2">
          <label className="">Type your concerns</label>
          <div className="flex space-x-2">
            {/* <select className="border p-2 rounded">
              <option>Split: boys, girls</option>
            </select> */}
            <input
              type="text"
              placeholder="Other preferences..."
              className="flex-1 border p-2 rounded"
            />
            <button className="bg-gray-300 px-4 rounded">→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
