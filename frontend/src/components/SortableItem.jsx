// src/components/SortableItem.jsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative">
      <div
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 cursor-grab p-2 hover:bg-gray-100 rounded"
      >
        ⠿
      </div>
      {children}
    </div>
  );
}