"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Plus, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import type { PdfFieldConfig } from "@/lib/generateTemplatePdf";
import { TEMPLATE_VARIABLES as VARIABLES, TEMPLATE_PREVIEW_VARS as PREVIEW_VARS } from "@/lib/templateVariables";

export type { PdfFieldConfig };

const NAVY = "#161642";
const ACCENT = "#2f6bf2";

function resolvePreview(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => PREVIEW_VARS[k] ?? `{{${k}}}`);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// PDF points → screen pixels scale factors
const PDF_W = { portrait: 595.28, landscape: 841.89 };
const CANVAS_W = { portrait: 340, landscape: 480 };
const CANVAS_H = { portrait: 481, landscape: 340 };

// ─── Floating formatting toolbar (appears on canvas above selected block) ────
function FloatingToolbar({
  field,
  onChange,
}: {
  field: PdfFieldConfig;
  onChange: (f: PdfFieldConfig) => void;
}) {
  const set = (patch: Partial<PdfFieldConfig>) => onChange({ ...field, ...patch });
  const btnBase: React.CSSProperties = {
    padding: "3px 7px", borderRadius: 5, fontSize: 11, fontWeight: 700,
    cursor: "pointer", border: "none", transition: "background 0.15s",
  };
  const active: React.CSSProperties = { backgroundColor: ACCENT, color: "#fff" };
  const inactive: React.CSSProperties = { backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" };
  const sep: React.CSSProperties = { width: 1, height: 16, backgroundColor: "rgba(255,255,255,0.15)", flexShrink: 0 };

  return (
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: "absolute",
        left: `${field.x}%`,
        top: `${field.y}%`,
        transform: "translate(-50%, calc(-100% - 10px))",
        zIndex: 50,
        backgroundColor: NAVY,
        borderRadius: 8,
        padding: "5px 8px",
        display: "flex",
        alignItems: "center",
        gap: 4,
        boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}>
      {/* Bold */}
      <button style={{ ...btnBase, ...(field.bold ? active : inactive), fontWeight: 900 }}
        onClick={() => set({ bold: !field.bold })}>B</button>

      <div style={sep} />

      {/* Align */}
      {(["left", "center", "right"] as const).map(a => (
        <button key={a} style={{ ...btnBase, ...(field.align === a ? active : inactive) }}
          onClick={() => set({ align: a })}>
          {a === "left" ? (
            <svg width="12" height="10" viewBox="0 0 12 10" fill="currentColor">
              <rect x="0" y="0" width="12" height="1.5" rx="0.75"/>
              <rect x="0" y="3" width="9" height="1.5" rx="0.75"/>
              <rect x="0" y="6" width="12" height="1.5" rx="0.75"/>
              <rect x="0" y="9" width="7" height="1.5" rx="0.75"/>
            </svg>
          ) : a === "center" ? (
            <svg width="12" height="10" viewBox="0 0 12 10" fill="currentColor">
              <rect x="0" y="0" width="12" height="1.5" rx="0.75"/>
              <rect x="1.5" y="3" width="9" height="1.5" rx="0.75"/>
              <rect x="0" y="6" width="12" height="1.5" rx="0.75"/>
              <rect x="2.5" y="9" width="7" height="1.5" rx="0.75"/>
            </svg>
          ) : (
            <svg width="12" height="10" viewBox="0 0 12 10" fill="currentColor">
              <rect x="0" y="0" width="12" height="1.5" rx="0.75"/>
              <rect x="3" y="3" width="9" height="1.5" rx="0.75"/>
              <rect x="0" y="6" width="12" height="1.5" rx="0.75"/>
              <rect x="5" y="9" width="7" height="1.5" rx="0.75"/>
            </svg>
          )}
        </button>
      ))}

      <div style={sep} />

      {/* Font size */}
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <button style={{ ...btnBase, ...inactive, padding: "3px 5px" }}
          onClick={() => set({ fontSize: Math.max(6, field.fontSize - 1) })}>−</button>
        <input
          type="number" min={6} max={200} value={field.fontSize}
          onChange={e => set({ fontSize: Number(e.target.value) })}
          onMouseDown={e => e.stopPropagation()}
          style={{
            width: 36, fontSize: 11, color: "white", fontWeight: 700,
            backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 4, padding: "2px 4px", textAlign: "center", outline: "none",
          }} />
        <button style={{ ...btnBase, ...inactive, padding: "3px 5px" }}
          onClick={() => set({ fontSize: Math.min(200, field.fontSize + 1) })}>+</button>
      </div>

      <div style={sep} />

      {/* Color */}
      <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>Color</span>
        <span style={{
          width: 18, height: 18, borderRadius: 4, border: "2px solid rgba(255,255,255,0.3)",
          backgroundColor: field.color, display: "inline-block", flexShrink: 0,
        }} />
        <input type="color" value={field.color} onChange={e => set({ color: e.target.value })}
          onMouseDown={e => e.stopPropagation()}
          style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      </label>
    </div>
  );
}

// ─── Sidebar field editor ────────────────────────────────────────────────────
function FieldEditor({
  field,
  onChange,
  onDelete,
}: {
  field: PdfFieldConfig;
  onChange: (f: PdfFieldConfig) => void;
  onDelete: () => void;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const set = (patch: Partial<PdfFieldConfig>) => onChange({ ...field, ...patch });

  const insertVar = (key: string) => {
    const ta = taRef.current;
    const token = `{{${key}}}`;
    if (!ta) { set({ text: field.text + token }); return; }
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const next = field.text.slice(0, s) + token + field.text.slice(e);
    set({ text: next });
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(s + token.length, s + token.length);
    }, 0);
  };

  return (
    <div className="flex flex-col gap-4">

      {/* ── Formatting toolbar (prominent, at the top) ── */}
      <div className="rounded-xl p-3 flex flex-col gap-3" style={{ backgroundColor: "#f8fafc", border: "1px solid #e8edf5" }}>
        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: NAVY }}>Formatting</p>

        {/* Row 1: Bold + Align */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => set({ bold: !field.bold })}
            className="px-3 py-1.5 rounded-lg text-xs font-black transition-colors"
            style={{ backgroundColor: field.bold ? NAVY : "#e2e8f0", color: field.bold ? "#fff" : "#475569" }}
            title="Bold">
            <strong>B</strong>
          </button>
          <div className="w-px h-5 mx-0.5" style={{ backgroundColor: "#e2e8f0" }} />
          {(["left", "center", "right"] as const).map(a => (
            <button key={a} onClick={() => set({ align: a })}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
              title={`Align ${a}`}
              style={{ backgroundColor: field.align === a ? ACCENT : "#e2e8f0", color: field.align === a ? "#fff" : "#475569" }}>
              {a === "left" ? "≡L" : a === "center" ? "≡C" : "≡R"}
            </button>
          ))}
        </div>

        {/* Row 2: Font size + Color */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 flex-1">
            <label className="text-[10px] font-bold text-slate-400 flex-shrink-0">Size</label>
            <button onClick={() => set({ fontSize: Math.max(6, field.fontSize - 1) })}
              className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold hover:bg-slate-200 transition-colors"
              style={{ color: "#64748b" }}>−</button>
            <input type="number" min={6} max={200} value={field.fontSize}
              onChange={e => set({ fontSize: Number(e.target.value) })}
              className="w-12 rounded px-1 py-1 text-xs font-bold text-center outline-none"
              style={{ border: "1.5px solid #e2e8f0", color: NAVY }} />
            <button onClick={() => set({ fontSize: Math.min(200, field.fontSize + 1) })}
              className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold hover:bg-slate-200 transition-colors"
              style={{ color: "#64748b" }}>+</button>
            <span className="text-[10px] text-slate-400">pt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-bold text-slate-400">Color</label>
            <label className="cursor-pointer" title="Pick color">
              <span className="block w-7 h-7 rounded-lg border-2"
                style={{ backgroundColor: field.color, borderColor: "#e2e8f0" }} />
              <input type="color" value={field.color} onChange={e => set({ color: e.target.value })}
                className="sr-only" />
            </label>
          </div>
        </div>

        {/* Row 3: Width */}
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-bold text-slate-400 flex-shrink-0">Width</label>
          <input type="range" min={10} max={100} step={5} value={field.maxWidth}
            onChange={e => set({ maxWidth: Number(e.target.value) })}
            className="flex-1" style={{ accentColor: ACCENT }} />
          <span className="text-[10px] font-bold text-slate-500 w-8 text-right">{field.maxWidth}%</span>
        </div>
      </div>

      {/* ── Text body ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Text Content</label>
        <textarea
          ref={taRef}
          value={field.text}
          onChange={e => set({ text: e.target.value })}
          rows={4}
          placeholder={"e.g. Congratulations {{fullName}},\nthis is your certificate\nfor {{businessName}}."}
          className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-y"
          style={{ border: `1.5px solid ${ACCENT}`, color: NAVY, fontFamily: "monospace", lineHeight: 1.6 }}
        />
      </div>

      {/* ── Variable chips ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Insert Variable</label>
        <div className="flex flex-wrap gap-1.5">
          {VARIABLES.map(v => (
            <button key={v.key} onClick={() => insertVar(v.key)}
              className="px-2 py-1 rounded-full text-[10px] font-bold transition-opacity hover:opacity-75"
              style={{ backgroundColor: "#dbeafe", color: ACCENT }}>
              {`{{${v.key}}}`}
            </button>
          ))}
        </div>
      </div>

      <button onClick={onDelete}
        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 transition-colors border border-red-100">
        <Trash2 size={12} /> Remove Block
      </button>
    </div>
  );
}

// ─── Draggable text block rendered on canvas ─────────────────────────────────
function FieldBlock({
  field,
  containerRef,
  onChange,
  selected,
  onSelect,
  scale,
}: {
  field: PdfFieldConfig;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onChange: (f: PdfFieldConfig) => void;
  selected: boolean;
  onSelect: () => void;
  scale: number;
}) {
  const dragging = useRef(false);
  const origin = useRef({ mx: 0, my: 0, fx: 0, fy: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    dragging.current = true;
    origin.current = { mx: e.clientX, my: e.clientY, fx: field.x, fy: field.y };

    const move = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - origin.current.mx) / rect.width) * 100;
      const dy = ((ev.clientY - origin.current.my) / rect.height) * 100;
      onChange({
        ...field,
        x: Math.max(0, Math.min(100, origin.current.fx + dx)),
        y: Math.max(0, Math.min(100, origin.current.fy + dy)),
      });
    };
    const up = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const preview = resolvePreview(field.text || "…");
  const displaySize = Math.max(8, field.fontSize * scale);

  return (
    <div
      onMouseDown={onMouseDown}
      onClick={e => { e.stopPropagation(); onSelect(); }}
      style={{
        position: "absolute",
        left: `${field.x}%`,
        top: `${field.y}%`,
        transform: `translateY(-50%)${
          field.align === "center" ? " translateX(-50%)" :
          field.align === "right"  ? " translateX(-100%)" : ""
        }`,
        maxWidth: `${field.maxWidth}%`,
        fontSize: `${displaySize}px`,
        color: field.color,
        fontWeight: field.bold ? 900 : 400,
        textAlign: field.align,
        fontFamily: "Helvetica, Arial, sans-serif",
        lineHeight: 1.35,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        cursor: "grab",
        userSelect: "none",
        zIndex: selected ? 30 : 20,
        outline: selected ? `2px solid ${ACCENT}` : "1px dashed rgba(47,107,242,0.35)",
        outlineOffset: 3,
        borderRadius: 2,
        padding: "1px 3px",
        backgroundColor: selected ? "rgba(47,107,242,0.07)" : "transparent",
      }}>
      {preview}
    </div>
  );
}

// ─── Main editor modal ────────────────────────────────────────────────────────
export function PdfTemplateEditor({
  open,
  templateId,
  templateName,
  initialBackground,
  initialFields,
  onClose,
  onSaved,
}: {
  open: boolean;
  templateId: number;
  templateName: string;
  initialBackground?: string | null;
  initialFields?: PdfFieldConfig[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [bg, setBg] = useState<string | null>(initialBackground ?? null);
  const [fields, setFields] = useState<PdfFieldConfig[]>(initialFields ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const cW = CANVAS_W[orientation];
  const cH = CANVAS_H[orientation];
  const scale = cW / PDF_W[orientation];

  useEffect(() => {
    if (open) {
      setBg(initialBackground ?? null);
      setFields(initialFields ?? []);
      setSelectedId(null);
      setError("");
    }
  }, [open, initialBackground, initialFields]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (
        selectedId &&
        (e.key === "Delete" || e.key === "Backspace") &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)
      ) {
        setFields(p => p.filter(f => f.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, selectedId]);

  const addField = useCallback((x = 50, y = 50) => {
    const f: PdfFieldConfig = {
      id: uid(), text: "", x: Math.max(1, Math.min(99, x)), y: Math.max(1, Math.min(99, y)),
      fontSize: 18, color: "#161642", bold: false, align: "left", maxWidth: 80,
    };
    setFields(p => [...p, f]);
    setSelectedId(f.id);
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !bg) return;
    const rect = containerRef.current.getBoundingClientRect();
    addField(((e.clientX - rect.left) / rect.width) * 100, ((e.clientY - rect.top) / rect.height) * 100);
  }, [bg, addField]);

  const handleUpload = async (file: File) => {
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-letterhead", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Upload failed"); return; }
      setBg(data.url);
    } catch { setError("Upload failed."); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!bg) { setError("Upload a letterhead image first."); return; }
    if (fields.length === 0) { setError("Add at least one text block."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/pdf-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: templateId, background_url: bg, fields, orientation }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Save failed"); return; }
      onSaved(); onClose();
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  };

  const selected = fields.find(f => f.id === selectedId) ?? null;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(22,22,66,0.55)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: "min(1120px, 96vw)", height: "min(840px, 94vh)", border: "1px solid #e8edf5" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "#f1f5f9" }}>
          <div>
            <h2 className="text-base font-black" style={{ color: NAVY }}>Edit Layout — {templateName}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload letterhead → double-click to add a text block → type your text with {"{{variables}}"} → drag to position
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg p-1 gap-1" style={{ backgroundColor: "#f1f5f9" }}>
              {(["portrait", "landscape"] as const).map(o => (
                <button key={o} onClick={() => setOrientation(o)}
                  className="px-3 py-1 rounded text-[11px] font-bold transition-all capitalize"
                  style={{ backgroundColor: orientation === o ? NAVY : "transparent", color: orientation === o ? "#fff" : "#64748b" }}>
                  {o}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100">
              <X size={16} style={{ color: "#94a3b8" }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">

          {/* Canvas area */}
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 overflow-auto p-6 gap-4 min-h-0">
            {!bg ? (
              <div onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                style={{ width: cW, height: cH, borderColor: "#cbd5e1" }}>
                <ImageIcon size={40} style={{ color: "#cbd5e1" }} />
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-400">Click to upload letterhead</p>
                  <p className="text-xs text-slate-300 mt-1">PNG or JPG, max 10 MB</p>
                </div>
                {uploading && <p className="text-xs font-bold animate-pulse" style={{ color: ACCENT }}>Uploading…</p>}
              </div>
            ) : (
              <div ref={containerRef}
                className="relative flex-shrink-0 shadow-xl rounded overflow-hidden"
                style={{ width: cW, height: cH }}
                onClick={() => setSelectedId(null)}
                onDoubleClick={handleDoubleClick}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bg} alt="Letterhead" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                {fields.map(f => (
                  <FieldBlock key={f.id} field={f} containerRef={containerRef} scale={scale}
                    onChange={u => setFields(p => p.map(x => x.id === f.id ? u : x))}
                    selected={selectedId === f.id}
                    onSelect={() => setSelectedId(f.id)} />
                ))}
                {selected && (
                  <FloatingToolbar
                    field={selected}
                    onChange={u => setFields(p => p.map(f => f.id === selected.id ? u : f))}
                  />
                )}
                {fields.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-xs font-bold text-white bg-black/40 px-3 py-1.5 rounded-full">
                      Double-click to add a text block
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black hover:opacity-80 disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: ACCENT, color: "#fff" }}>
                <Upload size={12} />
                {bg ? "REPLACE IMAGE" : "UPLOAD IMAGE"}
              </button>
              {bg && (
                <button onClick={() => addField(50, 50)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: NAVY, color: "#fff" }}>
                  <Plus size={12} /> ADD TEXT BLOCK
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
          </div>

          {/* Sidebar */}
          <div className="w-72 border-l flex flex-col" style={{ borderColor: "#f1f5f9" }}>
            <div className="px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "#f1f5f9" }}>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: NAVY }}>
                {selected ? "Edit Text Block" : `Text Blocks (${fields.length})`}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {selected ? (
                <FieldEditor
                  field={selected}
                  onChange={u => setFields(p => p.map(f => f.id === selected.id ? u : f))}
                  onDelete={() => { setFields(p => p.filter(f => f.id !== selected.id)); setSelectedId(null); }}
                />
              ) : fields.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] text-slate-400 mb-1">Click a block on the canvas to edit it.</p>
                  {fields.map((f, i) => (
                    <div key={f.id} onClick={() => setSelectedId(f.id)}
                      className="flex items-start gap-2 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50 border transition-colors"
                      style={{ borderColor: "#e8edf5" }}>
                      <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black text-white mt-0.5"
                        style={{ backgroundColor: NAVY }}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-600 truncate">{resolvePreview(f.text || "(empty — click to edit)")}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{f.fontSize}pt · {f.bold ? "Bold" : "Regular"} · {f.align}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center gap-2 px-2">
                  <p className="text-xs font-semibold text-slate-400">No text blocks yet</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Upload your letterhead then double-click on it to place a text block.
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t flex-shrink-0 flex flex-col gap-2" style={{ borderColor: "#f1f5f9" }}>
              {error && <p className="text-[11px] text-red-500 font-semibold">{error}</p>}
              <button onClick={handleSave} disabled={saving || uploading}
                className="w-full py-2.5 rounded-full font-black text-white text-xs tracking-widest uppercase hover:opacity-90 disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: NAVY }}>
                {saving ? "SAVING…" : "SAVE LAYOUT"}
              </button>
              <button onClick={onClose}
                className="w-full py-2 rounded-full font-bold text-xs hover:bg-slate-100 transition-colors"
                style={{ color: "#64748b" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
