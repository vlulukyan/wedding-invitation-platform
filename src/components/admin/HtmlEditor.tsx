"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <div className="html-editor--loading">Loading editor…</div>,
});

type HtmlEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function HtmlEditor({ value, onChange, placeholder }: HtmlEditorProps) {
  const [mode, setMode] = useState<"code" | "visual">("code");
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ],
    }),
    []
  );

  const formats = ["header", "bold", "italic", "underline", "strike", "list", "bullet", "link", "image"];

  return (
    <div className="html-editor">
      <div className="html-editor__tabs">
        <button type="button" className={mode === "code" ? "is-active" : ""} onClick={() => setMode("code")}>
          HTML
        </button>
        <button type="button" className={mode === "visual" ? "is-active" : ""} onClick={() => setMode("visual")}>
          Visual (beta)
        </button>
      </div>
      {mode === "code" ? (
        <textarea
          className="html-editor__textarea"
          value={value}
          placeholder={placeholder}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <>
          <ReactQuill theme="snow" value={value} onChange={onChange} modules={modules} formats={formats} placeholder={placeholder} />
          <p className="html-editor__note">Visual editing may remove custom classes/attributes. Switch back to HTML for precise control.</p>
        </>
      )}
    </div>
  );
}
