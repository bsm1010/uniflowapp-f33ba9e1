import React, { Suspense, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useEditorStore } from "@/stores/editor-store";
import { BlockRenderer } from "@/components/storefront/blocks";
import { getStoreTokens } from "@/components/storefront/StorefrontShell";
import type { BlockContext } from "@/components/storefront/blocks/types";

export function EditorPreview() {
  const { settings, getSections, selectedId, selectSection, device } = useEditorStore();
  const { t: tr } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!settings) return null;

  const sections = getSections();
  const tokens = getStoreTokens(settings);

  const context: BlockContext = {
    storeSlug: settings.slug,
    currency: settings.currency || "DZD",
    brandName: settings.store_name || "Store",
    isPreview: true,
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-background border rounded-lg overflow-hidden shadow-lg"
      style={{
        fontFamily: tokens.fontFamily,
        backgroundColor: tokens.bg,
        color: tokens.fg,
        minHeight: 600,
      }}
      onMouseLeave={() => setHoveredId(null)}
    >
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: tokens.primary + "20" }}
          >
            <svg
              className="h-8 w-8"
              style={{ color: tokens.primary }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: tokens.fg }}>
            {tr("editor.preview.noSections")}
          </p>
          <p className="text-xs mt-1" style={{ color: tokens.muted }}>
            {tr("editor.preview.addSectionPrompt")}
          </p>
        </div>
      ) : (
        <div className="relative">
          {sections.map((section) => (
            <div
              key={section.id}
              className="relative group/section"
              onMouseEnter={() => setHoveredId(section.id)}
              onClick={(e) => {
                e.stopPropagation();
                selectSection(section.id);
              }}
            >
              {/* Hover/selection overlay */}
              <div
                className={`absolute inset-0 z-10 pointer-events-none transition-all ${
                  selectedId === section.id
                    ? "ring-2 ring-primary ring-inset"
                    : hoveredId === section.id
                      ? "ring-1 ring-primary/40 ring-inset"
                      : ""
                }`}
              />

              {/* Section label */}
              {(hoveredId === section.id || selectedId === section.id) && (
                <div
                  className={`absolute top-2 left-2 z-20 px-2 py-0.5 text-[10px] font-medium rounded pointer-events-none ${
                    selectedId === section.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-foreground/80 text-background"
                  }`}
                >
                  {section.blockKey}
                </div>
              )}

              {/* Section toolbar (only when selected) */}
              {selectedId === section.id && (
                <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const store = useEditorStore.getState();
                      const secs = store.getSections();
                      const idx = secs.findIndex((s) => s.id === section.id);
                      if (idx > 0) store.moveSection(idx, idx - 1);
                    }}
                    className="h-6 w-6 flex items-center justify-center rounded bg-foreground/80 text-background text-xs hover:bg-foreground transition-colors"
                    title={tr("editor.preview.moveUp")}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const store = useEditorStore.getState();
                      const secs = store.getSections();
                      const idx = secs.findIndex((s) => s.id === section.id);
                      if (idx < secs.length - 1) store.moveSection(idx, idx + 1);
                    }}
                    className="h-6 w-6 flex items-center justify-center rounded bg-foreground/80 text-background text-xs hover:bg-foreground transition-colors"
                    title={tr("editor.preview.moveDown")}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      useEditorStore.getState().duplicateSection(section.id);
                    }}
                    className="h-6 w-6 flex items-center justify-center rounded bg-foreground/80 text-background text-xs hover:bg-foreground transition-colors"
                    title={tr("editor.preview.duplicate")}
                  >
                    ⧉
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      useEditorStore.getState().removeSection(section.id);
                    }}
                    className="h-6 w-6 flex items-center justify-center rounded bg-destructive text-destructive-foreground text-xs hover:opacity-90 transition-colors"
                    title={tr("editor.preview.delete")}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Rendered block */}
              <div className="pointer-events-none">
                <BlockRenderer sections={[section]} context={context} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
