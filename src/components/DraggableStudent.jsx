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
    zIndex: isDragging ? 1000 : 50,
  };

  const [showTip, setShowTip] = React.useState(false);
  const [tipPos, setTipPos] = React.useState({ left: 0, top: 0 });
  const cardRef = React.useRef(null);

  const openTip = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setTipPos({ left: rect.right + 6, top: rect.top });
      setShowTip(true);
    }
  };
  const closeTip = () => setShowTip(false);

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
      className={`relative ${small ? "w-12 h-12 text-xs" : "w-20 h-20"} bg-blue-500 text-white flex flex-col items-center justify-center rounded shadow select-none p-1`}
      style={style}
    >
      <div>{id}</div>
      
      {showTip && !isDragging &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "fixed",
              left: tipPos.left,
              top: tipPos.top,
              maxWidth: 220,
            }}
            className="bg-white text-black text-xs border rounded shadow z-[10000] p-2"
            onMouseEnter={openTip}
            onMouseLeave={closeTip}
          >
            <div className="font-bold">{id}</div>
            {tags.length > 0 && <div className="mt-1">Tags: {tags.join(", ")}</div>}
            {note && <div className="mt-1 italic break-words">{note}</div>}
          </div>,
          document.body
        )}
    </div>
  );
}

export default DraggableStudent; 