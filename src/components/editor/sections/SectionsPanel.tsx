import { useState } from "react";
import { GripVertical, Eye, EyeOff, Copy, Trash2, Plus, Layers } from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";
import { getBlock } from "@/components/storefront/blocks/registry";
import { BlockLibrary } from "../BlockLibrary";

export function SectionsPanel() {
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold">
            {activeTemplate.charAt(0).toUpperCase() + activeTemplate.slice(1)} Sections
          </h3>
          <span className="text-xs text-muted-foreground">
            {sections.length} section{sections.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setLibraryOpen(true)}
          className="w-full mt-2 inline-flex items-center justify-center gap-1.5 h-9 text-xs font-medium rounded-md border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Section
        </button>
      </div>

      {/* Section list */}
      <div className="flex-1 overflow-y-auto p-2">
        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="h-10 w-10 mb-3 text-muted-foreground/40" strokeWidth={1} />
            <p className="text-xs text-muted-foreground">
              No sections yet. Click "Add Section" to start building your page.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {sections.map((section, index) => {
              const def = getBlock(section.blockKey);
              const isSelected = selectedId === section.id;
              return (
                <div
                  key={section.id}
                  onClick={() => selectSection(section.id)}
                  className={`flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors group ${
                    isSelected
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-accent border border-transparent"
                  }`}
                >
                  {/* Drag handle */}
                  <div className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground">
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
                        toggleSectionVisibility(section.id);
                      }}
                      className="p-1 rounded hover:bg-accent text-muted-foreground"
                      title="Toggle visibility"
                    >
                      {section.styleOverrides?.fullWidth ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateSection(section.id);
                      }}
                      className="p-1 rounded hover:bg-accent text-muted-foreground"
                      title="Duplicate"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSection(section.id);
                      }}
                      className="p-1 rounded hover:bg-destructive/10 text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Block library modal */}
      {libraryOpen && <BlockLibrary onClose={() => setLibraryOpen(false)} />}
    </div>
  );
}
