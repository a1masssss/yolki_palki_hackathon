"use client"

import { useEffect, useRef } from "react"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
}

export default function CodeEditor({ value, onChange, language }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<any>(null)
  const editorInstanceRef = useRef<any>(null)

  useEffect(() => {
    const loadMonaco = async () => {
      if (!editorRef.current) return

      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js"
      script.async = true
      script.crossOrigin = "anonymous"

      script.onload = () => {
        // @ts-ignore
        window.require.config({
          paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs" },
        })

        // @ts-ignore
        window.require(["vs/editor/editor.main"], (monaco) => {
          monacoRef.current = monaco

          if (editorRef.current && !editorInstanceRef.current) {
            editorInstanceRef.current = monaco.editor.create(editorRef.current, {
              value,
              language,
              theme: document.documentElement.classList.contains("dark") ? "vs-dark" : "vs",
              automaticLayout: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              lineNumbers: "on",
              tabSize: 4,
              insertSpaces: true,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            })

            editorInstanceRef.current.onDidChangeModelContent(() => {
              onChange(editorInstanceRef.current.getValue())
            })

            const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                if (
                  mutation.attributeName === "class" &&
                  document.documentElement.classList.contains("dark") !== (monaco.editor.getTheme() === "vs-dark")
                ) {
                  monaco.editor.setTheme(document.documentElement.classList.contains("dark") ? "vs-dark" : "vs")
                }
              })
            })

            observer.observe(document.documentElement, { attributes: true })

            return () => observer.disconnect()
          }
        })
      }

      document.body.appendChild(script)
    }

    loadMonaco()

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose()
      }
    }
  }, [])

  useEffect(() => {
    if (editorInstanceRef.current && value !== editorInstanceRef.current.getValue()) {
      editorInstanceRef.current.setValue(value)
    }
  }, [value])

  return <div ref={editorRef} className="h-full w-full" />
}
