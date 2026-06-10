import { useState } from "react";
import { GripVertical, Eye, EyeOff, Copy, Trash2, Plus, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEditorStore } from "@/stores/editor-store";
import { getBlock } from "@/components/storefront/blocks/registry";
import type { SectionInstance } from "@/components/storefront/blocks/types";
import { BlockLibrary } from "../BlockLibrary";

function SortableSection({
  section,
  isSelected,
  onSelect,
  onToggleVisibility,
  onDuplicate,
  onRemove,
}: {
  section: SectionInstance;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const { t: tr } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const def = getBlock(section.blockKey);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors group ${
        isSelected
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-accent border border-transparent"
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Section info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">
          {def?.label ?? section.blockKey}
        </div>
        <div className="text-[10px] text-muted-foreground truncate">
          {section.blockKey}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className="p-1 rounded hover:bg-accent text-muted-foreground"
          title={tr("editor.sections.toggleVisibility")}
        >
          {section.styleOverrides?.hidden ? (
            <EyeOff className="h-3 w-3" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 rounded hover:bg-accent text-muted-foreground"
          title={tr("editor.sections.duplicate")}
        >
          <Copy className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 rounded hover:bg-destructive/10 text-destructive"
          title={tr("editor.sections.delete")}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function SectionsPanel() {
  const { t: tr } = useTranslation();
  const {
    getSections,
    selectedId,
    selectSection,
    removeSection,
    duplicateSection,
    moveSection,
    toggleSectionVisibility,
    activeTemplate,
  } = useEditorStore();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const sections = getSections();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    moveSection(oldIndex, newIndex);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold">
            {tr(`editor.layout.${activeTemplate}`)} {tr("editor.sections.title")}
          </h3>
          <span className="text-xs text-muted-foreground">
            {tr("editor.sections.count", { count: sections.length })}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setLibraryOpen(true)}
          className="w-full mt-2 inline-flex items-center justify-center gap-1.5 h-9 text-xs font-medium rounded-md border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          {tr("editor.sections.add")}
        </button>
      </div>

      {/* Section list */}
      <div className="flex-1 overflow-y-auto p-2">
        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="h-10 w-10 mb-3 text-muted-foreground/40" strokeWidth={1} />
            <p className="text-xs text-muted-foreground">
              {tr("editor.sections.empty")}
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {sections.map((section) => (
                  <SortableSection
                    key={section.id}
                    section={section}
                    isSelected={selectedId === section.id}
                    onSelect={() => selectSection(section.id)}
                    onToggleVisibility={() => toggleSectionVisibility(section.id)}
                    onDuplicate={() => duplicateSection(section.id)}
                    onRemove={() => removeSection(section.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Block library modal */}
      {libraryOpen && <BlockLibrary onClose={() => setLibraryOpen(false)} />}
    </div>
  );
}
