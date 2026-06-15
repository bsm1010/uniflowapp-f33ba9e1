import { Suspense, useCallback, useEffect } from "react";
import { ArrowLeft, Loader2, Monitor, Redo2, Smartphone, Tablet, Undo2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEditorStore, type TemplateKey } from "@/stores/editor-store";
import { SectionsPanel } from "./sections/SectionsPanel";
import { SectionEditor } from "./sections/SectionEditor";
import { ThemePanel } from "./theme/ThemePanel";
import { PagesPanel } from "./PagesPanel";
import { EditorPreview } from "./EditorPreview";
import { PublishButton } from "./PublishButton";

const TEMPLATES: Array<{ key: TemplateKey; labelKey: string }> = [
  { key: "home", labelKey: "editor.layout.home" },
  { key: "product", labelKey: "editor.layout.product" },
  { key: "collection", labelKey: "editor.layout.collection" },
  { key: "cart", labelKey: "editor.layout.cart" },
  { key: "page", labelKey: "editor.layout.page" },
];

const DEVICES = [
  { key: "desktop" as const, icon: Monitor, width: "100%" },
  { key: "tablet" as const, icon: Tablet, width: "768px" },
  { key: "mobile" as const, icon: Smartphone, width: "390px" },
];

export function EditorLayout() {
  const { t: tr } = useTranslation();
  const {
    settings,
    activeTemplate,
    device,
    leftTab,
    dirty,
    saving,
    switchTemplate,
    setDevice,
    setLeftTab,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEditorStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (mod && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (mod && e.key === "y") {
        e.preventDefault();
        redo();
      }
    },
    [undo, redo],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!settings) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted/30">
      {/* ── Top Bar ── */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-card px-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{tr("editor.layout.dashboard")}</span>
        </Link>

        <div className="h-4 w-px bg-border" />

        {/* Template tabs */}
        <div className="flex items-center gap-1">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.key}
              type="button"
              onClick={() => switchTemplate(tpl.key)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTemplate === tpl.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {tr(tpl.labelKey)}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Status */}
        <span className="text-xs text-muted-foreground">
          {saving
            ? tr("editor.layout.saving")
            : dirty
              ? tr("editor.layout.unsaved")
              : tr("editor.layout.allSaved")}
        </span>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo()}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title={tr("editor.layout.undo")}
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo()}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title={tr("editor.layout.redo")}
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Device toggle */}
        <div className="flex items-center gap-0.5 rounded-md border bg-background p-0.5">
          {DEVICES.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setDevice(d.key)}
              className={`p-1.5 rounded transition-colors ${
                device === d.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={d.key}
            >
              <d.icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Publish */}
        <PublishButton />

        {/* View live */}
        <a
          href={`/s/${settings.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {tr("editor.layout.viewLive")}
        </a>
      </header>

      {/* ── Three-Column Layout ── */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel */}
        <div className="w-80 shrink-0 border-r bg-card flex flex-col overflow-hidden">
          {/* Left panel tabs */}
          <div className="flex border-b">
            {(
              [
                { key: "sections", labelKey: "editor.layout.sections" },
                { key: "theme", labelKey: "editor.layout.theme" },
                { key: "pages", labelKey: "editor.layout.pages" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setLeftTab(tab.key)}
                className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  leftTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tr(tab.labelKey)}
              </button>
            ))}
          </div>

          {/* Left panel content */}
          <div className="flex-1 overflow-y-auto">
            <Suspense
              fallback={
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              }
            >
              {leftTab === "sections" && <SectionsPanel />}
              {leftTab === "theme" && <ThemePanel />}
              {leftTab === "pages" && <PagesPanel />}
            </Suspense>
          </div>
        </div>

        {/* Canvas (Preview) */}
        <div className="flex-1 flex items-start justify-center overflow-auto p-6">
          <div
            className="transition-all duration-300 ease-in-out"
            style={{
              width: device === "desktop" ? "100%" : device === "tablet" ? "768px" : "390px",
              maxWidth: "100%",
            }}
          >
            <EditorPreview />
          </div>
        </div>

        {/* Right Panel (Section Editor) */}
        <div className="w-80 shrink-0 border-l bg-card overflow-hidden">
          <SectionEditor />
        </div>
      </div>
    </div>
  );
}
