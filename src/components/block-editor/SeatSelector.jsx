import React, { useState } from 'react';

const SeatSelector = ({ desks, value, onChange, mode = 'both' }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Debug logging
  console.log('SeatSelector props:', {
    desks,
    value,
    mode
  });

  // Format the selected items for display
  const formatSelection = () => {
    if (!value) return '';
    
    const { deskIds = [], seatIds = [] } = value;
    const parts = [];
    
    if (deskIds.length) {
      parts.push(`${deskIds.length} desk${deskIds.length !== 1 ? 's' : ''}`);
    }
    if (seatIds.length) {
      parts.push(`${seatIds.length} seat${seatIds.length !== 1 ? 's' : ''}`);
    }
    
    return parts.join(', ') || 'None selected';
  };

  const handleDeskToggle = (deskId) => {
    const newValue = { ...value };
    newValue.deskIds = newValue.deskIds || [];
    
    if (newValue.deskIds.includes(deskId)) {
      newValue.deskIds = newValue.deskIds.filter(id => id !== deskId);
      // Also remove all seats from this desk
      newValue.seatIds = (newValue.seatIds || []).filter(id => !id.startsWith(`${deskId}/`));
    } else {
      newValue.deskIds = [...newValue.deskIds, deskId];
    }
    
    onChange(newValue);
  };

  const handleSeatToggle = (seatId) => {
    const newValue = { ...value };
    newValue.seatIds = newValue.seatIds || [];
    
    if (newValue.seatIds.includes(seatId)) {
      newValue.seatIds = newValue.seatIds.filter(id => id !== seatId);
    } else {
      newValue.seatIds = [...newValue.seatIds, seatId];
    }
    
    onChange(newValue);
  };

  return (
    <div className="relative">
      <div 
        className="border rounded-lg p-2 cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {formatSelection()}
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-[400px] overflow-auto">
          <div className="p-2 space-y-3">
            {(desks || []).length > 0 ? (
              (desks || []).map((desk, index) => (
                <div key={`desk-${index}`} className="border rounded p-2">
                  {/* Desk header */}
                  {mode !== 'seats-only' && (
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={value?.deskIds?.includes(`desk-${index}`)}
                        onChange={() => handleDeskToggle(`desk-${index}`)}
                      />
                      <span className="font-medium">Desk {index + 1}</span>
                    </div>
                  )}

                  {/* Seats */}
                  {mode !== 'desks-only' && (
                    <div className="grid grid-cols-2 gap-2 ml-6">
                      {desk.seats.map((_, seatIndex) => (
                        <div key={`seat-${seatIndex}`} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={value?.seatIds?.includes(`desk-${index}/seat-${seatIndex}`)}
                            onChange={() => handleSeatToggle(`desk-${index}/seat-${seatIndex}`)}
                          />
                          <span className="text-sm">Seat {seatIndex + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">
                No desks available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSelector; 