"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Save,
  Trash,
  Code,
  Copy,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import CodeEditor from "@/components/code-editor";
import ChatAssistance from "@/components/chat-assistance";
import HintsSection from "@/components/hints-section";
import TaskGenerator from "@/components/task-generator";
import AISolutionGenerator from "@/components/ai-solution-generator";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Sample Python code for initial editor content
const initialCode = `def main(input):
    # Your code here
`;

// Define interface for test cases
interface TestCase {
  input: string;
  expectedOutput: string;
}

// Define interface for task
interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  testCases: TestCase[];
  startingCode: string;
  hints?: string[];
  solution?: string;
}

export default function PythonEDIPage() {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [showPyodideWarning, setShowPyodideWarning] = useState(true);
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState<number>(0);
  const [currentTestCase, setCurrentTestCase] = useState<TestCase | null>(null);
  const [testResult, setTestResult] = useState<"success" | "failure" | null>(
    null
  );
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  useEffect(() => {
    // Set initial message
    setOutput(
      "Python interpreter simulation ready. Note: This is a simplified demonstration."
    );
  }, []);

  // When a task is selected, update current task and set the first test case as selected
  const handleSelectTask = (task: Task) => {
    setCurrentTask(task);
    setCode(task.startingCode);
    setOutput("");
    setTestResult(null);

    if (task.testCases && task.testCases.length > 0) {
      setSelectedTestCaseIndex(0);
      setCurrentTestCase(task.testCases[0]);
    }
  };

  // When test case selection changes
  const handleTestCaseChange = (value: string) => {
    const index = parseInt(value);
    setSelectedTestCaseIndex(index);

    if (currentTask && currentTask.testCases && currentTask.testCases[index]) {
      setCurrentTestCase(currentTask.testCases[index]);
      setTestResult(null);
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput("Running...");
    setTestResult(null);

    try {
      // Make sure we have a test case selected
      if (!currentTestCase) {
        setOutput("No test case selected. Please select a test case to run.");
        setIsRunning(false);
        return;
      }

      // Get the input from the current test case
      const input = currentTestCase.input;

      // Call the API to run the code
      const response = await axios.post(
        "http://127.0.0.1:8000/python-edi/tasks/submit/",
        {
          code: code,
          task: currentTask,
        }
      );

      // Get the result from the API response
      const result = response.data.results || response.data;

      // Handle the result properly - convert object to string if needed
      if (typeof result === "object") {
        // Format the object as a readable string
        setOutput(JSON.stringify(result, null, 2));
        console.log("Output set to:", JSON.stringify(result, null, 2));
      } else {
        setOutput(String(result));
        console.log("Output set to:", String(result));
      }

      if (response.data.success) {
        setTestResult("success");
      } else {
        setTestResult("failure");
      }

      setIsRunning(false);
    } catch (error) {
      console.error("Python execution error:", error);
      setOutput(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
      setTestResult("failure");
      setIsRunning(false);
    }
  };

  const clearCode = () => {
    if (confirm("Are you sure you want to clear the editor?")) {
      setCode("");
      setOutput("");
      setTestResult(null);
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Task Generator */}
          <div className="lg:col-span-1 space-y-6">
            <TaskGenerator onSelectTask={handleSelectTask} />
            {currentTask && (
              <AISolutionGenerator
                taskTitle={currentTask.title}
                taskDescription={currentTask.description}
              />
            )}
          </div>

          {/* Right column - Editor and Output */}
          <div className="lg:col-span-2 flex flex-col space-y-6">
            {/* Code Editor */}
            <div className="border rounded-lg overflow-hidden flex flex-col h-[50vh]">
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
                  disabled={isRunning || !currentTestCase}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Code with Test Case
                </Button>
              </div>
            </div>

            {/* Output Tabs */}
            <div className="border rounded-lg overflow-hidden h-[30vh]">
              <Tabs defaultValue="output" className="h-full flex flex-col">
                <TabsList className="mx-4 mt-2">
                  <TabsTrigger value="output">Output</TabsTrigger>
                  <TabsTrigger value="chat">Chat Assistance</TabsTrigger>
                </TabsList>

                <TabsContent value="output" className="flex-grow p-0 m-0">
                  <div className="h-full">
                    <div className="bg-black text-green-400 font-mono p-4 h-full overflow-auto whitespace-pre-wrap">
                      {output || "Run your code to see output here"}
                      {testResult && (
                        <div
                          className={`mt-4 p-2 rounded ${
                            testResult === "success"
                              ? "bg-green-900"
                              : "bg-red-900"
                          }`}
                        >
                          {testResult === "success"
                            ? "✅ Test Passed! Your output matches the expected result."
                            : "❌ Test Failed! Your output doesn't match the expected result."}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="chat" className="flex-grow p-0 m-0">
                  <ChatAssistance code={code} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
