import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, FileIcon, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const BUCKET = "store-assets";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

async function uploadToBucket(file: File, userId: string, kind: "image" | "file"): Promise<string | null> {
  if (file.size > MAX_BYTES) {
    toast.error("File too large (max 10 MB)");
    return null;
  }
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `db/${userId}/${kind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) {
    toast.error(error.message);
    return null;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function ImageUploadCell({
  value,
  userId,
  onChange,
}: {
  value: string;
  userId: string | null;
  onChange: (v: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!userId) return toast.error("Sign in required");
    setBusy(true);
    const url = await uploadToBucket(file, userId, "image");
    setBusy(false);
    if (url) onChange(url);
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 group">
        <a href={value} target="_blank" rel="noopener noreferrer" className="shrink-0">
          <img
            src={value}
            alt="cell"
            className="h-9 w-9 rounded object-cover border border-border"
          />
        </a>
        <span className="text-xs text-muted-foreground truncate flex-1">
          Uploaded
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          aria-label="Remove image"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent w-full"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {busy ? "Uploading…" : "Upload image"}
      </button>
    </>
  );
}

export function FileUploadCell({
  value,
  userId,
  onChange,
}: {
  value: string;
  userId: string | null;
  onChange: (v: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!userId) return toast.error("Sign in required");
    setBusy(true);
    const url = await uploadToBucket(file, userId, "file");
    setBusy(false);
    if (url) onChange(url);
  }

  if (value) {
    const filename = value.split("/").pop()?.split("?")[0] ?? "File";
    return (
      <div className="flex items-center gap-2 group">
        <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs truncate flex-1 hover:underline flex items-center gap-1"
        >
          {filename}
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          aria-label="Remove file"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent w-full"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {busy ? "Uploading…" : "Upload file"}
      </button>
    </>
  );
}
