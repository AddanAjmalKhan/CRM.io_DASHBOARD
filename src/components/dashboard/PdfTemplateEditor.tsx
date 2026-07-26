"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Plus, Trash2, GripVertical, Upload, Image as ImageIcon, ChevronDown } from "lucide-react";

const NAVY = "#161642";
const ACCENT = "#2f6bf2";

export interface PdfFieldConfig {
  id: string;
  variable: string;
  x: number;        // 0–100 (% from left)
  y: number;        // 0–100 (% from top)
  fontSize: number;
  color: string;
  bold: boolean;
  align: "left" | "center" | "right";
  label?: string;
}

const VARIABLES = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "fullName", label: "Full Name" },
  { key: "businessName", label: "Business Name" },
  { key: "serialNumber", label: "Serial Number" },
  { key: "email", label: "Email" },
  { key: "date", label: "Date Issued" },
];

const PREVIEW_VARS: Record<string, string> = {
  firstName: "John",
  lastName: "Smith",
  fullName: "John Smith",
  businessName: "Smith Enterprises LLC",
  serialNumber: "BH-2024-001",
  email: "john@example.com",
  date: "January 1, 2025",
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Field config popover ─────────────────────────────────────────────────────
function FieldPanel({
  field,
  onChange,
  onDelete,
}: {
  field: PdfFieldConfig;
  onChange: (updated: PdfFieldConfig) => void;
  onDelete: () => void;
}) {
  const set = (patch: Partial<PdfFieldConfig>) => onChange({ ...field, ...patch });

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl bg-white border shadow-lg w-64"
      style={{ borderColor: "#e2e8f0" }}>
      {/* Variable selector */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Variable</label>
        <div className="relative">
          <select
            value={field.variable}
            onChange={e => set({ variable: e.target.value })}
            className="w-full rounded-lg px-2 py-1.5 text-xs font-semibold outline-none appearance-none pr-6"
            style={{ border: `1.5px solid ${ACCENT}`, color: NAVY }}>
            {VARIABLES.map(v => (
              <option key={v.key} value={v.key}>{v.label}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
        </div>
      </div>

      {/* Font size */}
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 w-20 flex-shrink-0">Font Size</label>
        <input
          type="number" min={6} max={120}
          value={field.fontSize}
          onChange={e => set({ fontSize: Number(e.target.value) })}
          className="flex-1 rounded-lg px-2 py-1 text-xs font-semibold outline-none text-center"
          style={{ border: `1.5px solid #e2e8f0`, color: NAVY }} />
      </div>

      {/* Color */}
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 w-20 flex-shrink-0">Color</label>
        <input
          type="color"
          value={field.color}
          onChange={e => set({ color: e.target.value })}
          className="w-8 h-7 rounded cursor-pointer border"
          style={{ borderColor: "#e2e8f0" }} />
        <span className="text-xs text-slate-400 font-mono">{field.color}</span>
      </div>

      {/* Bold + Align */}
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 w-20 flex-shrink-0">Style</label>
        <button
          onClick={() => set({ bold: !field.bold })}
          className="px-2 py-1 rounded text-xs font-black transition-colors"
          style={{
            backgroundColor: field.bold ? NAVY : "#f1f5f9",
            color: field.bold ? "#fff" : "#64748b",
          }}>B</button>
        {(["left", "center", "right"] as const).map(a => (
          <button
            key={a}
            onClick={() => set({ align: a })}
            className="px-1.5 py-1 rounded text-[10px] font-bold transition-colors capitalize"
            style={{
              backgroundColor: field.align === a ? ACCENT : "#f1f5f9",
              color: field.align === a ? "#fff" : "#64748b",
            }}>{a[0].toUpperCase()}</button>
        ))}
      </div>

      {/* Position readout */}
      <div className="flex items-center gap-2 text-[10px] text-slate-400">
        <span>X: {field.x.toFixed(1)}%</span>
        <span>Y: {field.y.toFixed(1)}%</span>
      </div>

      <button
        onClick={onDelete}
        className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-[11px] font-bold text-red-500 hover:bg-red-50 transition-colors">
        <Trash2 size={11} /> Remove Field
      </button>
    </div>
  );
}

// ─── Draggable field handle ───────────────────────────────────────────────────
function FieldHandle({
  field,
  containerRef,
  onChange,
  onDelete,
  selected,
  onSelect,
}: {
  field: PdfFieldConfig;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onChange: (updated: PdfFieldConfig) => void;
  onDelete: () => void;
  selected: boolean;
  onSelect: () => void;
}) {
  const isDragging = useRef(false);
  const startPos = useRef({ mouseX: 0, mouseY: 0, fieldX: 0, fieldY: 0 });
  const varLabel = VARIABLES.find(v => v.key === field.variable)?.label ?? field.variable;
  const previewText = PREVIEW_VARS[field.variable] ?? varLabel;

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    isDragging.current = true;
    startPos.current = { mouseX: e.clientX, mouseY: e.clientY, fieldX: field.x, fieldY: field.y };

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - startPos.current.mouseX) / rect.width) * 100;
      const dy = ((ev.clientY - startPos.current.mouseY) / rect.height) * 100;
      onChange({
        ...field,
        x: Math.max(0, Math.min(100, startPos.current.fieldX + dx)),
        y: Math.max(0, Math.min(100, startPos.current.fieldY + dy)),
      });
    };
    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      onMouseDown={onMouseDown}
      onClick={e => { e.stopPropagation(); onSelect(); }}
      style={{
        position: "absolute",
        left: `${field.x}%`,
        top: `${field.y}%`,
        transform: "translate(-2px, -50%)",
        cursor: "grab",
        zIndex: selected ? 30 : 20,
        userSelect: "none",
      }}>
      <div
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-bold shadow-sm whitespace-nowrap transition-all"
        style={{
          backgroundColor: selected ? NAVY : "rgba(255,255,255,0.92)",
          color: selected ? "#fff" : NAVY,
          border: `1.5px solid ${selected ? NAVY : ACCENT}`,
          fontSize: `${Math.max(8, Math.min(field.fontSize * 0.65, 14))}px`,
          fontWeight: field.bold ? 900 : 700,
        }}>
        <GripVertical size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
        <span style={{ color: field.color }}>{previewText}</span>
      </div>
    </div>
  );
}

// ─── Main editor ──────────────────────────────────────────────────────────────
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
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(initialBackground ?? null);
  const [fields, setFields] = useState<PdfFieldConfig[]>(initialFields ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setBackgroundUrl(initialBackground ?? null);
      setFields(initialFields ?? []);
      setSelectedId(null);
      setError("");
    }
  }, [open, initialBackground, initialFields]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) {
        setFields(prev => prev.filter(f => f.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, selectedId]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-letterhead", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Upload failed"); return; }
      setBackgroundUrl(data.url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    // If clicking on a field handle, don't add new field
    if ((e.target as HTMLElement).closest("[data-field]")) return;
    setSelectedId(null);
  }, []);

  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !backgroundUrl) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newField: PdfFieldConfig = {
      id: uid(),
      variable: "fullName",
      x: Math.max(1, Math.min(99, x)),
      y: Math.max(1, Math.min(99, y)),
      fontSize: 18,
      color: "#161642",
      bold: false,
      align: "left",
    };
    setFields(prev => [...prev, newField]);
    setSelectedId(newField.id);
  }, [backgroundUrl]);

  const handleSave = async () => {
    if (!backgroundUrl) { setError("Please upload a letterhead image first."); return; }
    if (fields.length === 0) { setError("Add at least one field to the layout."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/pdf-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: templateId, background_url: backgroundUrl, fields, orientation }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Save failed"); return; }
      onSaved();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const selectedField = fields.find(f => f.id === selectedId) ?? null;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(22,22,66,0.55)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: "min(1100px, 96vw)", height: "min(800px, 92vh)", border: "1px solid #e8edf5" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "#f1f5f9" }}>
          <div>
            <h2 className="text-base font-black" style={{ color: NAVY }}>Edit Layout — {templateName}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Upload a letterhead, then double-click to place fields. Drag to reposition.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Orientation toggle */}
            <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: "#f1f5f9" }}>
              {(["portrait", "landscape"] as const).map(o => (
                <button key={o} onClick={() => setOrientation(o)}
                  className="px-3 py-1 rounded text-[11px] font-bold transition-all capitalize"
                  style={{ backgroundColor: orientation === o ? NAVY : "transparent", color: orientation === o ? "#fff" : "#64748b" }}>
                  {o}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
              <X size={16} style={{ color: "#94a3b8" }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Canvas area */}
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 overflow-auto p-6 gap-4 min-h-0">
            {!backgroundUrl ? (
              <div
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                style={{ width: orientation === "portrait" ? 320 : 453, height: orientation === "portrait" ? 453 : 320, borderColor: "#cbd5e1" }}
                onClick={() => fileRef.current?.click()}>
                <ImageIcon size={40} style={{ color: "#cbd5e1" }} />
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-400">Click to upload letterhead</p>
                  <p className="text-xs text-slate-300 mt-1">PNG or JPG, max 10MB</p>
                </div>
                {uploading && <p className="text-xs text-blue-500 font-bold animate-pulse">Uploading...</p>}
              </div>
            ) : (
              <div className="relative flex-shrink-0 shadow-xl rounded overflow-hidden"
                style={{
                  width: orientation === "portrait" ? 320 : 453,
                  height: orientation === "portrait" ? 453 : 320,
                }}
                ref={containerRef}
                onClick={handleCanvasClick}
                onDoubleClick={handleCanvasDoubleClick}>
                {/* Background letterhead */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={backgroundUrl} alt="Letterhead" className="absolute inset-0 w-full h-full object-cover" draggable={false} />

                {/* Fields */}
                {fields.map(f => (
                  <div key={f.id} data-field="1">
                    <FieldHandle
                      field={f}
                      containerRef={containerRef}
                      onChange={updated => setFields(prev => prev.map(x => x.id === f.id ? updated : x))}
                      onDelete={() => { setFields(prev => prev.filter(x => x.id !== f.id)); setSelectedId(null); }}
                      selected={selectedId === f.id}
                      onSelect={() => setSelectedId(f.id)}
                    />
                  </div>
                ))}

                {/* Overlay hint */}
                {fields.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-xs font-bold text-white bg-black/40 px-3 py-1.5 rounded-full">Double-click to add fields</p>
                  </div>
                )}
              </div>
            )}

            {/* Upload controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: ACCENT, color: "#fff" }}>
                <Upload size={12} />
                {backgroundUrl ? "REPLACE IMAGE" : "UPLOAD IMAGE"}
              </button>
              {backgroundUrl && (
                <button
                  onClick={() => {
                    const newField: PdfFieldConfig = {
                      id: uid(), variable: "fullName",
                      x: 50, y: 50,
                      fontSize: 18, color: "#161642",
                      bold: false, align: "center",
                    };
                    setFields(prev => [...prev, newField]);
                    setSelectedId(newField.id);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-opacity hover:opacity-80"
                  style={{ backgroundColor: NAVY, color: "#fff" }}>
                  <Plus size={12} />
                  ADD FIELD
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
            />
          </div>

          {/* Sidebar: field config */}
          <div className="w-72 border-l flex flex-col" style={{ borderColor: "#f1f5f9" }}>
            <div className="px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "#f1f5f9" }}>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: NAVY }}>
                {selectedField ? "Field Settings" : "Fields"}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {selectedField ? (
                <FieldPanel
                  field={selectedField}
                  onChange={updated => setFields(prev => prev.map(f => f.id === selectedField.id ? updated : f))}
                  onDelete={() => { setFields(prev => prev.filter(f => f.id !== selectedField.id)); setSelectedId(null); }}
                />
              ) : fields.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] text-slate-400 mb-1">Click a field on the canvas to edit it.</p>
                  {fields.map(f => {
                    const varLabel = VARIABLES.find(v => v.key === f.variable)?.label ?? f.variable;
                    return (
                      <div
                        key={f.id}
                        onClick={() => setSelectedId(f.id)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors border"
                        style={{ borderColor: "#e8edf5" }}>
                        <div>
                          <p className="text-xs font-bold" style={{ color: NAVY }}>{varLabel}</p>
                          <p className="text-[10px] text-slate-400">{f.fontSize}px · {f.bold ? "Bold" : "Regular"}</p>
                        </div>
                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: f.color, borderColor: "#e2e8f0" }} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                  <p className="text-xs font-semibold text-slate-400">No fields yet</p>
                  <p className="text-[11px] text-slate-300">Upload a letterhead, then double-click to place fields.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t flex-shrink-0 flex flex-col gap-2" style={{ borderColor: "#f1f5f9" }}>
              {error && <p className="text-[11px] text-red-500 font-semibold">{error}</p>}
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="w-full py-2.5 rounded-full font-black text-white text-xs tracking-widest uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: NAVY }}>
                {saving ? "SAVING..." : "SAVE LAYOUT"}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 rounded-full font-bold text-xs transition-colors hover:bg-slate-100"
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
