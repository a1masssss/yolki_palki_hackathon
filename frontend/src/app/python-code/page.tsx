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
  Lightbulb,
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
  const [activeTab, setActiveTab] = useState("output");
  const [shouldShowHints, setShouldShowHints] = useState(false);
  const [hintsTimerId, setHintsTimerId] = useState<NodeJS.Timeout | null>(null);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Get available hints based on task and code
  const getAvailableHints = () => {
    const hints: { title: string; content: string }[] = [];

    // First, add task-specific hints if available
    if (currentTask?.hints && currentTask.hints.length > 0) {
      currentTask.hints.forEach((hint, index) => {
        hints.push({
          title: `Task Hint ${index + 1}`,
          content: hint,
        });
      });
    }

    // Then add code-based hints
    if (code && code !== initialCode) {
      if (code.includes("for ") || code.includes("while ")) {
        hints.push({
          title: "Loop Optimization",
          content:
            "Consider using list comprehensions for simple loops to make your code more concise and often faster.",
        });
      }

      if (code.includes("if ") || code.includes("else:")) {
        hints.push({
          title: "Simplify Conditionals",
          content:
            "Multiple if/else statements can often be simplified using dictionaries or more elegant patterns.",
        });
      }

      if (!code.includes("try:") && !code.includes("except ")) {
        hints.push({
          title: "Error Handling",
          content:
            "Consider adding try/except blocks to handle potential errors gracefully.",
        });
      }

      // Always add this hint
      hints.push({
        title: "Python Best Practice",
        content:
          "Use meaningful variable names and follow PEP 8 style guidelines for clean, readable code.",
      });
    }

    return hints;
  };

  // Calculate available hints for memoization
  const availableHints = getAvailableHints();

  // Functions to navigate through hints
  const goToNextHint = () => {
    if (currentHintIndex < availableHints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
    }
  };

  const goToPreviousHint = () => {
    if (currentHintIndex > 0) {
      setCurrentHintIndex(currentHintIndex - 1);
    }
  };

  useEffect(() => {
    // Set initial message
    setOutput(
      "Python interpreter simulation ready. Note: This is a simplified demonstration."
    );
  }, []);

  // When task is selected, update current task and set the first test case as selected
  const handleSelectTask = (task: Task) => {
    setCurrentTask(task);
    setCode(task.startingCode);
    setOutput("");
    setTestResult(null);
    setCurrentHintIndex(0); // Reset hint index when changing tasks

    if (task.testCases && task.testCases.length > 0) {
      setSelectedTestCaseIndex(0);
      setCurrentTestCase(task.testCases[0]);
    }

    // If task has hints, automatically switch to the hints tab
    if (task.hints && task.hints.length > 0) {
      setShouldShowHints(true);

      // Clear any existing timer
      if (hintsTimerId) {
        clearTimeout(hintsTimerId);
      }
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

  // Detect code patterns and switch to hints tab if needed
  useEffect(() => {
    if (!code || code === initialCode) return;

    // Check for code patterns that suggest the user might need hints
    const hasLoops = code.includes("for ") || code.includes("while ");
    const hasConditionals = code.includes("if ") || code.includes("else:");
    const hasNoErrorHandling =
      !code.includes("try:") && !code.includes("except ");

    // If there are hints in the task or certain patterns detected, show hints
    const shouldSwitchToHints =
      (currentTask?.hints && currentTask.hints.length > 0) ||
      (hasLoops && code.length > initialCode.length + 20) ||
      (hasConditionals &&
        hasNoErrorHandling &&
        code.length > initialCode.length + 30);

    // If the hints composition would change significantly, reset the hint index
    const newHintsLength = getAvailableHints().length;
    if (newHintsLength !== availableHints.length) {
      setCurrentHintIndex(0);
    }

    if (shouldSwitchToHints && activeTab !== "hints" && !shouldShowHints) {
      setShouldShowHints(true);

      // Clear any existing timer
      if (hintsTimerId) {
        clearTimeout(hintsTimerId);
      }

      // Set a timer to switch to hints tab after a short delay
      const timerId = setTimeout(() => {
        setActiveTab("hints");
      }, 1000);

      setHintsTimerId(timerId);
    }
  }, [
    code,
    currentTask,
    activeTab,
    shouldShowHints,
    hintsTimerId,
    initialCode,
    availableHints.length,
  ]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hintsTimerId) {
        clearTimeout(hintsTimerId);
      }
    };
  }, [hintsTimerId]);

  const runCode = async () => {
    setIsRunning(true);
    setOutput("Running...");
    setTestResult(null);
    setActiveTab("output"); // Switch to output tab when running code
    setErrorMessage(""); // Clear previous errors

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

        // Check if result is an array of test case results
        if (Array.isArray(result)) {
          // Check if all test cases passed
          const allPassed = result.every(
            (testCase) => testCase.passed === true
          );
          setTestResult(allPassed ? "success" : "failure");

          // If any test case failed, extract error message if available
          if (!allPassed) {
            const failedTest = result.find((testCase) => !testCase.passed);
            if (failedTest) {
              setErrorMessage(
                `Test case with input "${failedTest.input}" failed. Expected: ${failedTest.expected_output}, Got: ${failedTest.actual_output}`
              );
            }
          }
        } else if (result.success !== undefined) {
          // Handle single test case result with success property
          setTestResult(result.success ? "success" : "failure");
        }
      } else {
        setOutput(String(result));
        console.log("Output set to:", String(result));
      }

      // Fallback to response.data.success if result structure doesn't contain test results
      if (testResult === null && response.data.success !== undefined) {
        setTestResult(response.data.success ? "success" : "failure");
      }

      // If the test failed, check for error messages in the output
      if (testResult === "failure") {
        const resultStr =
          typeof result === "object"
            ? JSON.stringify(result, null, 2)
            : String(result);
        if (
          resultStr.includes("error") ||
          resultStr.includes("Exception") ||
          resultStr.includes("Traceback")
        ) {
          setErrorMessage(resultStr);
        }
      }

      setIsRunning(false);
    } catch (error) {
      console.error("Python execution error:", error);
      const errorMsg = `Error: ${
        error instanceof Error ? error.message : String(error)
      }`;
      setOutput(errorMsg);
      setErrorMessage(errorMsg);
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

  // Add custom scrollbar styles for the hints container
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      .hints-container::-webkit-scrollbar {
        width: 8px;
      }
      .hints-container::-webkit-scrollbar-track {
        background: transparent;
      }
      .hints-container::-webkit-scrollbar-thumb {
        background-color: #d1d5db;
        border-radius: 4px;
      }
      .hints-container::-webkit-scrollbar-thumb:hover {
        background-color: #9ca3af;
      }
      .dark .hints-container::-webkit-scrollbar-thumb {
        background-color: #4b5563;
      }
      .dark .hints-container::-webkit-scrollbar-thumb:hover {
        background-color: #6b7280;
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

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
            {/* {currentTask && (
              <AISolutionGenerator
                taskTitle={currentTask.title}
                taskDescription={currentTask.description}
              />
            )} */}
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
            <div className="border rounded-lg overflow-hidden flex flex-col h-[40vh]">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="h-full flex flex-col"
              >
                <TabsList className="mx-4 mt-2 space-x-2">
                  <TabsTrigger value="output">Output</TabsTrigger>
                  <TabsTrigger value="chat">Chat Assistance</TabsTrigger>
                  <TabsTrigger
                    value="hints"
                    className={
                      shouldShowHints
                        ? "animate-pulse bg-amber-100 dark:bg-amber-900/30"
                        : ""
                    }
                  >
                    Hints
                    {shouldShowHints && (
                      <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="output" className="flex-grow p-0 m-0">
                  <div className="h-full">
                    <div className="bg-black text-green-400 font-mono p-4 h-full overflow-auto whitespace-pre-wrap">
                      {testResult && (
                        <div
                          className={`mt-4 p-2 rounded`}
                        >
                          {testResult === "success"
                            ? "✅ Test Passed! Your output matches the expected result."
                            : "❌ Test Failed! Your output doesn't match the expected result."}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent
                  value="chat"
                  className="flex-grow p-0 m-0 relative"
                >
                  <div className="absolute inset-0">
                    <ChatAssistance
                      code={code}
                      taskId={currentTask?.id}
                      errorMessage={errorMessage}
                    />
                  </div>
                </TabsContent>

                <TabsContent
                  value="hints"
                  className="flex-grow p-0 mt-3 overflow-hidden"
                >
                  <div className="h-full overflow-y-auto p-4 hints-container">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-amber-500" />
                        <h3 className="text-lg font-semibold">Coding Hints</h3>
                      </div>

                      {availableHints.length > 0 && (
                        <div className="text-sm text-slate-500">
                          {currentHintIndex + 1} of {availableHints.length}
                        </div>
                      )}
                    </div>

                    {availableHints.length > 0 ? (
                      <div className="space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                          <h4 className="font-medium text-amber-700 dark:text-amber-400 text-lg">
                            {availableHints[currentHintIndex].title}
                          </h4>
                          <p className="text-sm mt-3 text-slate-700 dark:text-slate-300">
                            {availableHints[currentHintIndex].content}
                          </p>

                          <div className="flex justify-between mt-6">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={goToPreviousHint}
                              disabled={currentHintIndex === 0}
                              className="border-amber-300 hover:bg-amber-100 text-amber-700"
                            >
                              Previous Hint
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={goToNextHint}
                              disabled={
                                currentHintIndex === availableHints.length - 1
                              }
                              className="border-amber-300 hover:bg-amber-100 text-amber-700"
                            >
                              Next Hint
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-slate-500 py-8">
                        <p>Write some code to see helpful hints appear here.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
