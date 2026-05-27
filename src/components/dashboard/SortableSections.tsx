import { useId } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Image, LayoutGrid, Sparkles, Mail } from "lucide-react";
import { ALL_SECTIONS, type SectionKey } from "@/lib/storeTheme";

const META: Record<
  SectionKey,
  { label: string; description: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  hero: { label: "Hero", description: "Top banner with heading & CTA", Icon: Image },
  categories: { label: "Categories", description: "Browse by category strip", Icon: LayoutGrid },
  featured: { label: "Featured products", description: "Hand-picked products", Icon: Sparkles },
  newsletter: { label: "Newsletter", description: "Email signup section", Icon: Mail },
};

interface Props {
  order: SectionKey[];
  onChange: (next: SectionKey[]) => void;
}

export function SortableSections({ order, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const dndId = useId();

  // Ensure we always render every section (in case DB is missing some)
  const safeOrder: SectionKey[] = [
    ...order,
    ...ALL_SECTIONS.filter((s) => !order.includes(s)),
  ];

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = safeOrder.indexOf(active.id as SectionKey);
    const newIndex = safeOrder.indexOf(over.id as SectionKey);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(safeOrder, oldIndex, newIndex));
  };

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={safeOrder} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {safeOrder.map((key, i) => (
            <SortableRow key={key} sectionKey={key} index={i} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ sectionKey, index }: { sectionKey: SectionKey; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: sectionKey });
  const meta = META[sectionKey];
  const Icon = meta.Icon;

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : "auto",
      }}
      className={`group flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-soft ${
        isDragging ? "opacity-90 ring-2 ring-primary" : ""
      }`}
    >
      <button
        type="button"
        className="touch-none cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={`Drag ${meta.label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="font-medium">{meta.label}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{meta.description}</p>
      </div>
    </li>
  );
}
