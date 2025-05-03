"use client";

import { useEffect, useRef, useState } from "react";

interface CustomCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
}

export default function CustomCodeEditor({
  value,
  onChange,
  language,
}: CustomCodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const loadMonaco = async () => {
      try {
        console.log("Loading Monaco editor...");

        // Use CDN for Monaco
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js";
        script.async = true;
        script.crossOrigin = "anonymous";

        script.onload = () => {
          // @ts-ignore
          window.require.config({
            paths: {
              vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs",
            },
          });

          // @ts-ignore
          window.require(["vs/editor/editor.main"], (monaco) => {
            if (editorRef.current && !editorInstance) {
              const editor = monaco.editor.create(editorRef.current, {
                value,
                language,
                theme: document.documentElement.classList.contains("dark")
                  ? "vs-dark"
                  : "vs",
                automaticLayout: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: "on",
                tabSize: 4,
                insertSpaces: true,
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              });

              editor.onDidChangeModelContent(() => {
                onChange(editor.getValue());
              });

              setEditorInstance(editor);
              setEditorLoaded(true);

              console.log("Monaco editor loaded successfully");
            }
          });
        };

        script.onerror = (e) => {
          console.error("Failed to load Monaco editor:", e);
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error("Error loading Monaco:", error);
      }
    };

    loadMonaco();

    return () => {
      if (editorInstance) {
        editorInstance.dispose();
      }
    };
  }, []);

  // Update the editor when the value changes externally
  useEffect(() => {
    if (editorInstance && editorLoaded && value !== editorInstance.getValue()) {
      editorInstance.setValue(value);
    }
  }, [value, editorInstance, editorLoaded]);

  return (
    <>
      <div ref={editorRef} className="h-full w-full" />
      {!editorLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-2 text-slate-700 dark:text-slate-300">
              Loading editor...
            </p>
          </div>
        </div>
      )}
    </>
  );
}
