import React from "react";
import ReactDOM from "react-dom";
import { useDraggable } from "@dnd-kit/core";

function DraggableStudent({ id, tags = [], note = "", onAddTag, compact = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id });

  const small = compact || isDragging;

  const style = {
    ...(transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : {}),
    zIndex: isDragging ? 99999 : 50,
    position: isDragging ? 'fixed' : 'relative',
    pointerEvents: isDragging ? 'none' : 'auto',
  };

  const [showTip, setShowTip] = React.useState(false);
  const [tipPos, setTipPos] = React.useState({ left: 0, top: 0 });
  const cardRef = React.useRef(null);

  const openTip = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setTipPos({ left: rect.right + 8, top: rect.top });
      setShowTip(true);
    }
  };
  const closeTip = () => setShowTip(false);

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        cardRef.current = el;
      }}
      {...listeners}
      {...attributes}
      onMouseEnter={openTip}
      onMouseLeave={closeTip}
      className={`relative ${
        small ? "w-16 h-16 text-xs" : "w-24 h-24 text-sm"
      } bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg cursor-grab active:cursor-grabbing select-none flex flex-col items-center justify-center border border-blue-400/20 ${
        isDragging ? "rotate-3 scale-105" : ""
      }`}
      style={style}
    >
      <div className={`font-semibold ${small ? "text-xs" : "text-xs"} leading-tight text-center px-1`}>
        {small ? (
          // For compact mode (seated), show full name but with smaller text and line breaks for long names
          id.length > 8 ? (
            <div>
              <div>{id.split(' ')[0]}</div>
              <div>{id.split(' ').slice(1).join(' ')}</div>
            </div>
          ) : id
        ) : (
          // For normal mode (in pool), break long names into multiple lines for better readability
          id.length > 12 ? (
            <div>
              <div>{id.split(' ')[0]}</div>
              <div>{id.split(' ').slice(1).join(' ')}</div>
            </div>
          ) : id
        )}
      </div>
      
      {!small && tags.length > 0 && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
      )}

      {showTip && !isDragging &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "fixed",
              left: tipPos.left,
              top: tipPos.top,
              maxWidth: 280,
            }}
            className="bg-white text-slate-900 text-sm border border-slate-200 rounded-xl shadow-xl z-[10000] p-4 backdrop-blur-sm"
            onMouseEnter={openTip}
            onMouseLeave={closeTip}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                {getInitials(id)}
              </div>
              <div>
                <div className="font-semibold text-slate-900">{id}</div>
                {tags.length > 0 && (
                  <div className="text-xs text-slate-500">
                    {tags.length} tag{tags.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
            
            {tags.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-slate-700 mb-2">Tags:</div>
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {note && (
              <div>
                <div className="text-xs font-medium text-slate-700 mb-2">Notes:</div>
                <div className="text-xs text-slate-600 break-words bg-slate-50 rounded-lg p-2 border border-slate-200">
                  {note}
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

export default DraggableStudent; 