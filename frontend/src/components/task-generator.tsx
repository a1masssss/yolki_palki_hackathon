"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, Lightbulb, Info } from "lucide-react";
import axios from "axios";

// Add a function to get CSRF token
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// Define task structure
interface Task {
  id: string;
  title: string;
  description: string;
  testCases: {
    input: string;
    expectedOutput: string;
  }[];
  difficulty: "easy" | "medium" | "hard";
  startingCode: string;
  hints: string[];
  solution: string;
}

export default function TaskGenerator({
  onSelectTask,
}: {
  onSelectTask: (task: Task) => void;
}) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "easy" | "medium" | "hard"
  >("easy");
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [openHints, setOpenHints] = useState<{ [key: number]: boolean }>({});

  const generateTask = () => {
    console.log("Generate task button clicked");
    console.log("Selected difficulty:", selectedDifficulty);
    
    // Get CSRF token
    const csrftoken = getCookie('csrftoken');
    console.log("CSRF Token:", csrftoken);
    
    axios
      .post("http://127.0.0.1:8000/python-edi/generate-task/", {
        difficulty: selectedDifficulty,
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken || '',
        }
      })
      .then((response) => {
        console.log("Task generation successful:", response.data);
        const apiTask = response.data;
        const formattedTask = {
          id: apiTask.id.toString(),
          title: apiTask.title,
          description: apiTask.description,
          difficulty: apiTask.difficulty,
          testCases: apiTask.test_cases.map((tc: any) => ({
            input: tc.input,
            expectedOutput: tc.expected_output,
          })),
          startingCode:
            apiTask.startingCode ||
            `# Write your solution for "${apiTask.title}" here\n\ndef main(input):\n    # Your code here\n`,
          hints: apiTask.hints || [],
          solution: apiTask.solution || "",
        };

        setCurrentTask(formattedTask);
        onSelectTask(formattedTask);
        setOpenHints({});
      })
      .catch((error) => {
        console.error("Error fetching task:", error);
        console.error("Error details:", error.response?.data || "No response data");
        console.error("Status code:", error.response?.status || "No status code");
        alert("Failed to generate task. Check browser console for details.");
      });
  };

  const toggleHint = (index: number) => {
    setOpenHints((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Task Generator</span>
            <Button
              onClick={generateTask}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              Generate New Task
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-sm text-slate-500 mb-6">
              Select difficulty level:
            </p>
            <RadioGroup
              value={selectedDifficulty}
              onValueChange={(value) =>
                setSelectedDifficulty(value as "easy" | "medium" | "hard")
              }
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-4">
                <RadioGroupItem value="easy" id="easy" />
                <Label htmlFor="easy">Easy</Label>
              </div>
              <div className="flex items-center space-x-4">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium">Medium</Label>
              </div>
              <div className="flex items-center space-x-4">
                <RadioGroupItem value="hard" id="hard" />
                <Label htmlFor="hard">Hard</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {currentTask && (
        <>
          <Card className="mt-4">
            <CardHeader className="">
              <CardTitle className="text-md flex items-center">
                <div className="flex items-center flex-row justify-between">
                  <div className="mr-4">{currentTask.title}</div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      currentTask.difficulty === "easy"
                        ? "bg-green-100 text-green-800"
                        : currentTask.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {currentTask.difficulty}
                  </span>
                </div>
              </CardTitle>
              <CardDescription>{currentTask.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-medium col-span-2 mb-2">Test Cases:</div>
              <div className="col-span-2 bg-slate-50 rounded-md p-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">Input</th>
                      <th className="text-left p-1">Expected Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTask.testCases.map((testCase, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-slate-100" : ""}
                      >
                        <td className="p-1">
                          <code className="bg-slate-200 px-1 rounded">
                            {testCase.input}
                          </code>
                        </td>
                        <td className="p-1">
                          <code className="bg-slate-200 px-1 rounded">
                            {testCase.expectedOutput}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
