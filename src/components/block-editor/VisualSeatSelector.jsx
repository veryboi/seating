import React from 'react';
import DeskShape from '../DeskShape';

const VisualSeatSelector = ({ desks = [], value = { deskIds: [], seatIds: [] }, onChange }) => {
  const { deskIds = [], seatIds = [] } = value;

  // Debug logging
  console.log('VisualSeatSelector received:', {
    desks,
    desksLength: desks?.length,
    desksType: typeof desks,
    value,
    deskIds,
    seatIds
  });

  // Validate desk data structure and ensure IDs
  const validDesks = desks.map((desk, index) => {
    // Ensure each desk has an ID
    if (!desk.id) {
      desk = { ...desk, id: `desk-${index}` };
    }
    return desk;
  }).filter(desk => {
    const isValid = desk && desk.id && typeof desk.id === 'string';
    if (!isValid) {
      console.log('Invalid desk found:', desk);
    }
    return isValid;
  });

  console.log('Valid desks:', validDesks);

  const toggleDesk = (deskId) => {
    if (!deskId) return;
    
    const newDeskIds = deskIds.includes(deskId)
      ? deskIds.filter(id => id !== deskId)
      : [...deskIds, deskId];
    
    // Remove any seat selections for this desk if deselecting the desk
    const newSeatIds = deskIds.includes(deskId)
      ? seatIds.filter(id => !id.startsWith(deskId))
      : seatIds;

    onChange({ deskIds: newDeskIds, seatIds: newSeatIds });
  };

  const toggleSeat = (deskId, seatNumber) => {
    if (!deskId || seatNumber === undefined) return;
    
    console.log('toggleSeat called with:', { deskId, seatNumber });
    
    const seatId = `${deskId}/seat-${seatNumber}`;
    const newSeatIds = seatIds.includes(seatId)
      ? seatIds.filter(id => id !== seatId)
      : [...seatIds, seatId];
    
    console.log('toggleSeat result:', { seatId, newSeatIds });
    
    onChange({ deskIds, seatIds: newSeatIds });
  };

  // If no desks, show empty state
  if (!validDesks.length) {
    return (
      <div className="border rounded p-4 bg-gray-50 text-center text-gray-500">
        No desks available
      </div>
    );
  }

  // Calculate bounds for scaling
  const bounds = validDesks.reduce((acc, desk) => {
    const [x, y] = desk.position;
    const shape = desk.shape;
    
    // Estimate desk bounds based on shape
    let width = 100, height = 100;
    if (shape.type === 'rectangle') {
      width = shape.width || 100;
      height = shape.height || 100;
    } else if (shape.type === 'circle') {
      width = height = (shape.radius || 50) * 2;
    }
    
    const minX = x - width / 2;
    const maxX = x + width / 2;
    const minY = y - height / 2;
    const maxY = y + height / 2;
    
    return {
      minX: Math.min(acc.minX, minX),
      maxX: Math.max(acc.maxX, maxX),
      minY: Math.min(acc.minY, minY),
      maxY: Math.max(acc.maxY, maxY)
    };
  }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

  const layoutWidth = bounds.maxX - bounds.minX;
  const layoutHeight = bounds.maxY - bounds.minY;
  
  // Scale to fit in a reasonable container size
  const containerWidth = 400;
  const containerHeight = 300;
  const scale = Math.min(containerWidth / layoutWidth, containerHeight / layoutHeight, 1);

  return (
    <div className="border rounded p-4 bg-gray-50">
      <div 
        className="relative bg-slate-100 mx-auto border rounded"
        style={{ 
          width: Math.max(containerWidth, layoutWidth * scale + 40),
          height: Math.max(containerHeight, layoutHeight * scale + 40),
          minHeight: 200
        }}
      >
        {/* Teacher area indicator */}
        <div 
          className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-gray-300 rounded flex items-center justify-center text-xs"
        >
          Teacher
        </div>

        {/* Render desks */}
        {validDesks.map((desk) => {
          if (!desk || !desk.id) return null;
          
          const isDeskSelected = deskIds.includes(desk.id);
          const [x, y] = desk.position;
          
          // Scale and offset position
          const scaledX = (x - bounds.minX) * scale + 20;
          const scaledY = (y - bounds.minY) * scale + 40; // Extra offset for teacher area
          
          return (
            <div 
              key={desk.id}
              className="absolute"
              style={{
                left: scaledX,
                top: scaledY,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Desk shape with selection styling */}
              <div 
                className={`cursor-pointer transition-all relative ${
                  isDeskSelected 
                    ? 'ring-4 ring-blue-500 ring-opacity-75' 
                    : 'hover:ring-2 hover:ring-blue-300 hover:ring-opacity-50'
                }`}
                onClick={() => toggleDesk(desk.id)}
                style={{ transform: `scale(${scale})` }}
              >
                {/* Selection overlay - positioned behind desk shape */}
                {isDeskSelected && (() => {
                  const shape = desk.shape;
                  let overlayStyle = {};
                  
                  if (shape.type === 'circle') {
                    const radius = shape.radius || 50;
                    overlayStyle = {
                      width: radius * 2,
                      height: radius * 2,
                      borderRadius: '50%',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)'
                    };
                  } else if (shape.type === 'rectangle') {
                    const width = shape.width || 100;
                    const height = shape.height || 100;
                    overlayStyle = {
                      width: width,
                      height: height,
                      borderRadius: '4px',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)'
                    };
                  } else if (shape.type === 'polygon') {
                    // For polygon, create a bounding box
                    const points = shape.points || [];
                    const minX = Math.min(...points.map(p => p[0]));
                    const maxX = Math.max(...points.map(p => p[0]));
                    const minY = Math.min(...points.map(p => p[1]));
                    const maxY = Math.max(...points.map(p => p[1]));
                    overlayStyle = {
                      width: maxX - minX,
                      height: maxY - minY,
                      borderRadius: '4px',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)'
                    };
                  }
                  
                  return (
                    <div 
                      className="absolute bg-blue-500 bg-opacity-30 pointer-events-none z-0"
                      style={overlayStyle}
                    />
                  );
                })()}
                
                <DeskShape shape={desk.shape} />
                
                {/* Desk label */}
                <div className={`absolute inset-0 flex items-center justify-center text-xs font-medium pointer-events-none z-10 ${
                  isDeskSelected ? 'text-blue-800' : 'text-gray-600'
                }`}>
                  {desk.id.split('-')[1]}
                </div>
              </div>

              {/* Seats */}
              {(desk.seats || []).map((seatPos, seatIndex) => {
                if (!seatPos) return null;
                
                const seatNumber = seatIndex;
                const seatId = `${desk.id}/seat-${seatNumber}`;
                const isSeatSelected = seatIds.includes(seatId);
                
                const [seatX, seatY] = Array.isArray(seatPos) ? seatPos : [seatPos.x || 0, seatPos.y || 0];
                
                return (
                  <button
                    key={seatIndex}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSeat(desk.id, seatNumber);
                    }}
                    className={`
                      absolute rounded-full border-2 transition-all pointer-events-auto
                      ${isSeatSelected 
                        ? 'bg-green-500 border-green-600 ring-2 ring-green-300 ring-opacity-75 scale-125' 
                        : 'bg-white border-gray-400 hover:border-green-400 hover:bg-green-50 hover:scale-110'
                      }
                    `}
                    style={{
                      left: seatX * scale,
                      top: seatY * scale,
                      width: Math.max(8 * scale, 8),
                      height: Math.max(8 * scale, 8),
                      transform: 'translate(-50%, -50%)',
                      minWidth: 8,
                      minHeight: 8
                    }}
                    title={`Seat ${seatIndex + 1}${isSeatSelected ? ' (Selected)' : ''}`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-2 text-xs text-gray-500 flex gap-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded"></div>
          <span>Selected Desk</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Selected Seat</span>
        </div>
      </div>
    </div>
  );
};

export default VisualSeatSelector; 