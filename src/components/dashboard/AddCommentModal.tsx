"use client";

import { useState, useEffect, useRef } from "react";
import { X, MessageSquare, Send, CheckCircle2, Circle, Pencil, Trash2, Check } from "lucide-react";

const NAVY   = "#161642";
const ACCENT = "#2f6bf2";
const GREEN  = "#10b981";

export interface Comment {
  id: number;
  text: string;
  createdAt: string;
  done: boolean;
}

interface BubbleProps {
  comment: Comment;
  onDelete: () => void;
  onToggleDone: () => void;
  onUpdate: (text: string) => void;
}

function CommentBubble({ comment, onDelete, onToggleDone, onUpdate }: BubbleProps) {
  const [editing, setEditing]   = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [hovered, setHovered]   = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const saveEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== comment.text) onUpdate(trimmed);
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditText(comment.text);
    setEditing(false);
  };

  return (
    <div
      className="flex gap-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
        style={{ backgroundColor: comment.done ? GREEN : NAVY }}
      >
        {comment.done ? <Check size={14} strokeWidth={2.5} /> : "AJ"}
      </div>

      <div className="flex-1 min-w-0">
        {editing ? (
          /* -- Edit mode -- */
          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveEdit();
                if (e.key === "Escape") cancelEdit();
              }}
              rows={2}
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none transition-all"
              style={{
                border: `1.5px solid ${ACCENT}`,
                boxShadow: `0 0 0 3px ${ACCENT}18`,
                color: NAVY,
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: NAVY }}
              >
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-colors hover:bg-gray-100"
                style={{ color: "#94a3b8" }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* -- View mode -- */
          <div className="relative">
            <div
              className="rounded-2xl rounded-tl-none px-4 py-3 pr-24"
              style={{
                backgroundColor: comment.done ? "#f0fdf4" : "#f8fafc",
                border: `1px solid ${comment.done ? "#bbf7d0" : "#f1f5f9"}`,
              }}
            >
              <p
                className="text-sm leading-relaxed"
                style={{
                  color: comment.done ? "#6b7280" : "#374151",
                  textDecoration: comment.done ? "line-through" : "none",
                }}
              >
                {comment.text}
              </p>
            </div>

            {/* Action buttons  visible on hover */}
            <div
              className="absolute top-2 right-2 flex items-center gap-0.5 transition-opacity"
              style={{ opacity: hovered ? 1 : 0 }}
            >
              {/* Mark done / undone */}
              <button
                onClick={onToggleDone}
                title={comment.done ? "Mark undone" : "Mark done"}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white"
              >
                {comment.done
                  ? <CheckCircle2 size={14} style={{ color: GREEN }} />
                  : <Circle size={14} style={{ color: "#9ca3af" }} />}
              </button>
              {/* Edit */}
              <button
                onClick={() => { setEditing(true); setEditText(comment.text); }}
                title="Edit comment"
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white"
                disabled={comment.done}
              >
                <Pencil size={13} style={{ color: comment.done ? "#d1d5db" : "#6b7280" }} />
              </button>
              {/* Delete */}
              <button
                onClick={onDelete}
                title="Delete comment"
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white"
              >
                <Trash2 size={13} style={{ color: "#ef4444" }} />
              </button>
            </div>
          </div>
        )}

        {/* Timestamp + done badge */}
        <div className="flex items-center gap-2 mt-1 px-1">
          <p className="text-xs" style={{ color: "#9ca3af" }}>{comment.createdAt}</p>
          {comment.done && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "#dcfce7", color: GREEN }}
            >
              Done
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------- */

interface Props {
  leadName: string | null;
  comments: Comment[];
  onClose: () => void;
  onSubmit: (text: string) => void;
  onDelete: (id: number) => void;
  onToggleDone: (id: number) => void;
  onUpdate: (id: number, text: string) => void;
}

export function AddCommentModal({ leadName, comments, onClose, onSubmit, onDelete, onToggleDone, onUpdate }: Props) {
  const [text, setText]   = useState("");
  const listRef           = useRef<HTMLDivElement>(null);

  useEffect(() => { setText(""); }, [leadName]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [comments]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!leadName) return null;

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(22,22,66,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl bg-white flex flex-col"
        style={{ border: "1px solid #e8edf5", maxHeight: "80vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "#f1f5f9" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${ACCENT}18` }}>
              <MessageSquare size={15} style={{ color: ACCENT }} />
            </div>
            <div>
              <h2 className="text-sm font-black" style={{ color: NAVY }}>Comments</h2>
              <p className="text-xs" style={{ color: "#9ca3af" }}>{leadName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {comments.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#f1f5f9", color: "#6b7280" }}>
                {comments.filter(c => c.done).length}/{comments.length} done
              </span>
            )}
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
              <X size={15} style={{ color: "#94a3b8" }} />
            </button>
          </div>
        </div>

        {/* Comment list */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4" style={{ minHeight: 0 }}>
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#f1f5f9" }}>
                <MessageSquare size={20} style={{ color: "#cbd5e1" }} />
              </div>
              <p className="text-sm" style={{ color: "#94a3b8" }}>No comments yet.</p>
            </div>
          ) : (
            comments.map((c) => (
              <CommentBubble
                key={c.id}
                comment={c}
                onDelete={() => onDelete(c.id)}
                onToggleDone={() => onToggleDone(c.id)}
                onUpdate={(t) => onUpdate(c.id, t)}
              />
            ))
          )}
        </div>

        {/* Composer */}
        <div className="px-6 pb-5 pt-3 border-t flex-shrink-0" style={{ borderColor: "#f1f5f9" }}>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1"
              style={{ backgroundColor: NAVY }}>
              AJ
            </div>
            <div className="flex-1 flex gap-2 items-end">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit(); }}
                placeholder="Write a comment (Ctrl+Enter to send)"
                rows={2}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm resize-none outline-none transition-all"
                style={{
                  border: `1.5px solid ${text ? ACCENT : "#e2e8f0"}`,
                  boxShadow: text ? `0 0 0 3px ${ACCENT}18` : "none",
                  color: NAVY,
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-30"
                style={{ backgroundColor: NAVY }}
              >
                <Send size={15} color="white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
