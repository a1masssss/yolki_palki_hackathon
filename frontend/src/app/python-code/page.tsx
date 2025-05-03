"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Play, Save, Trash, Code, Copy, AlertTriangle } from "lucide-react";
import Link from "next/link";
import CodeEditor from "@/components/code-editor";
import ChatAssistance from "@/components/chat-assistance";
import HintsSection from "@/components/hints-section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const initialCode = `# Welcome to the Python EDI
# Try running this sample code

def greet(name):
    return f"Hello, {name}!"

result = greet("World")
print(result)

for i in range(1, 6):
    print(f"{i} squared is {i**2}")
`;

const mockExecutePython = (code: string): string => {
  let output = "";
  const printRegex = /print$$(.*?)$$/g;
  const printMatches = code.match(printRegex);

  if (printMatches) {
    printMatches.forEach((match) => {
      try {
        const content = match.substring(6, match.length - 1);

        if (
          (content.startsWith('"') && content.endsWith('"')) ||
          (content.startsWith("'") && content.endsWith("'"))
        ) {
          output += content.substring(1, content.length - 1) + "\n";
        } else if (content.startsWith('f"') || content.startsWith("f'")) {
          const fStringContent = content.substring(2, content.length - 1);

          if (fStringContent.includes("{") && fStringContent.includes("}")) {
            if (
              (fStringContent.includes("{name}") &&
                code.includes('name = "World"')) ||
              code.includes("name = 'World'")
            ) {
              output += fStringContent.replace("{name}", "World") + "\n";
            } else if (
              fStringContent.includes("{i}") &&
              fStringContent.includes("{i**2}")
            ) {
              for (let i = 1; i <= 5; i++) {
                output +=
                  fStringContent
                    .replace("{i}", i.toString())
                    .replace("{i**2}", (i * i).toString()) + "\n";
              }
            } else {
              output += "Hello, World!\n";
            }
          } else {
            output += fStringContent + "\n";
          }
        } else {
          if (content === '"Hello, World!"' || content === "'Hello, World!'") {
            output += "Hello, World!\n";
          } else if (content === "result") {
            output += "Hello, World!\n";
          } else {
            output += "Expression result\n";
          }
        }
      } catch (e) {
        output += "Error evaluating print statement\n";
      }
    });
  }

  if (!output) {
    if (code.includes("def greet") && code.includes("Hello")) {
      output = "Hello, World!\n";
      output += "1 squared is 1\n";
      output += "2 squared is 4\n";
      output += "3 squared is 9\n";
      output += "4 squared is 16\n";
      output += "5 squared is 25\n";
    } else {
      output = "Code executed successfully, but no output was generated.\n";
      output += "Add print() statements to see output here.";
    }
  }

  return output;
};

export default function PythonEDIPage() {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [showPyodideWarning, setShowPyodideWarning] = useState(true);

  useEffect(() => {
    setOutput(
      "Python interpreter simulation ready. Note: This is a simplified demonstration."
    );
  }, []);

  const runCode = async () => {
    setIsRunning(true);
    setOutput("Running...");

    try {
      setTimeout(() => {
        const result = mockExecutePython(code);
        setOutput(result);
        setIsRunning(false);
      }, 500);
    } catch (error) {
      console.error("Python execution error:", error);
      setOutput(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
      setIsRunning(false);
    }
  };

  const clearCode = () => {
    if (confirm("Are you sure you want to clear the editor?")) {
      setCode("");
      setOutput("");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Python EDI Module</h1>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>

        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[80vh] rounded-lg border"
        >
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="bg-slate-100 dark:bg-slate-800 p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-emerald-500" />
                  <span className="font-medium">Python Editor</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyCode}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCode}
                    className="h-8 w-8 p-0 text-red-500"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-grow overflow-auto">
                <CodeEditor value={code} onChange={setCode} language="python" />
              </div>
              <div className="p-2 bg-slate-100 dark:bg-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  {code.split("\n").length} lines
                </span>
                <Button
                  onClick={runCode}
                  disabled={isRunning}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Code
                </Button>
              </div>
            </div>
          </ResizablePanel>

          <ResizablePanel defaultSize={50}>
            <div className="h-full flex flex-col">
              <Tabs defaultValue="output" className="h-full flex flex-col">
                <TabsList className="mx-4 mt-2">
                  <TabsTrigger value="output">Output</TabsTrigger>
                  <TabsTrigger value="chat">Chat Assistance</TabsTrigger>
                  <TabsTrigger value="hints">Hints</TabsTrigger>
                </TabsList>

                <TabsContent value="output" className="flex-grow p-0 m-0">
                  <div className="h-full">
                    <div className="bg-black text-green-400 font-mono p-4 h-full overflow-auto whitespace-pre-wrap">
                      {output || "Run your code to see output here"}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="chat" className="flex-grow p-0 m-0">
                  <ChatAssistance code={code} />
                </TabsContent>

                <TabsContent value="hints" className="flex-grow p-0 m-0">
                  <HintsSection code={code} />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
