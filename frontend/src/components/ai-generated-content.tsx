"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, HelpCircle, Layout } from "lucide-react";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import ReactMarkdown from "react-markdown";

// Custom components for ReactMarkdown to avoid nesting <p> tags
const MarkdownComponents = {
  // Replace p tags with div tags to avoid nesting issues
  p: ({ children, ...props }: any) => <div {...props}>{children}</div>,
};

// Set OPENAI_API_KEY from NEXT_PUBLIC_OPENAI_API_KEY
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

interface QuizData {
  questions: QuizQuestion[];
}

export default function AIGeneratedContent({
  summaries,
  setSummary,
}: {
  summaries: any;
  setSummary: (summary: string) => void;
}) {
  const [activeTab, setActiveTab] = useState("summary");
  const [summary, setSummaryState] = useState(""); // Local state for summary content
  const [quiz, setQuiz] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizParsingError, setQuizParsingError] = useState<string | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // CSS for Markdown content
  const markdownStyles = `
    .markdown-content {
      line-height: 1.6;
    }
    .markdown-content h1, 
    .markdown-content h2, 
    .markdown-content h3, 
    .markdown-content h4 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
    }
    .markdown-content h1 {
      font-size: 1.5em;
    }
    .markdown-content h2 {
      font-size: 1.3em;
    }
    .markdown-content h3 {
      font-size: 1.1em;
    }
    .markdown-content p {
      margin-bottom: 1em;
    }
    .markdown-content ul, 
    .markdown-content ol {
      margin-left: 1em;
      margin-bottom: 1em;
    }
    .markdown-content li {
      margin-bottom: 0.5em;
      list-style-type: disc;
      margin-left: 1em;
    }
    .markdown-content ol li {
      list-style-type: decimal;
    }
    .markdown-content code {
      background-color: #f0f0f0;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: monospace;
    }
    .markdown-content blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1em;
      margin-left: 0;
      color: #666;
    }
    .markdown-content a {
      color: #0366d6;
      text-decoration: none;
    }
    .markdown-content a:hover {
      text-decoration: underline;
    }
    .markdown-content table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 1em;
    }
    .markdown-content th, 
    .markdown-content td {
      border: 1px solid #ddd;
      padding: 0.5em;
    }
    .markdown-content th {
      background-color: #f0f0f0;
      font-weight: 600;
    }
    .dark .markdown-content code {
      background-color: #2d2d2d;
    }
    .dark .markdown-content blockquote {
      border-left-color: #444;
      color: #999;
    }
    .dark .markdown-content th {
      background-color: #333;
    }
    .dark .markdown-content td,
    .dark .markdown-content th {
      border-color: #444;
    }
  `;

  useEffect(() => {
    // Apply markdown styles
    const styleElement = document.createElement("style");
    styleElement.innerHTML = markdownStyles;
    document.head.appendChild(styleElement);

    return () => {
      // Clean up styles when component unmounts
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    if (
      summaries &&
      (Array.isArray(summaries) ? summaries.length > 0 : summaries.summaries)
    ) {
      handleSummary();
    }
  }, [summaries]);

  // Parse quiz when quiz text changes
  useEffect(() => {
    if (quiz) {
      try {
        const parsedQuestions = parseQuiz();
        if (parsedQuestions && parsedQuestions.length > 0) {
          setQuizQuestions(parsedQuestions);
          setQuizParsingError(null);
        } else {
          setQuizParsingError("No valid questions found in the response");
        }
      } catch (error: any) {
        console.error("Error parsing quiz in useEffect:", error);
        setQuizParsingError(error.message || "Failed to parse quiz");
        // Clear any previously parsed questions
        setQuizQuestions([]);
      }
    }
  }, [quiz]);

  // Watch for tab changes to generate content when needed
  useEffect(() => {
    if (activeTab === "quiz" && !quiz && summary) {
      handleQuiz();
    }
  }, [activeTab, quiz, summary]);

  const handleQuiz = async () => {
    setIsGeneratingQuiz(true);
    setQuizParsingError(null);
    try {
      // Get summary texts from the structured data
      let summaryTexts: string[] = [];

      if (summaries && typeof summaries === "object") {
        if (Array.isArray(summaries.summaries)) {
          summaryTexts = summaries.summaries
            .map((item: any) => item.summary)
            .filter(Boolean);
        } else if (Array.isArray(summaries)) {
          summaryTexts = summaries
            .map((item: any) =>
              typeof item === "string" ? item : item?.summary || ""
            )
            .filter(Boolean);
        }
      }

      // If we couldn't extract summaries from the object, use the local summary state
      if (summaryTexts.length === 0 && summary) {
        summaryTexts = [summary];
      }

      const quizContent = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `Your task is to generate a quiz based on the following content:

      ${summaryTexts.join("\n\n")}

      Create exactly 3 multiple-choice questions based on the content above.

      Rules:
      1. Generate the response as a valid JSON object with no markdown formatting outside the JSON
      2. Each question should have 4 options labeled A, B, C, and D
      3. Include the correct answer letter and an explanation for each question
      4. You can use Markdown formatting within the question text, options and explanations

      Format your response as VALID JSON that matches EXACTLY this structure:
      {
        "questions": [
          {
            "question": "Your question text here",
            "options": {
              "A": "First option text",
              "B": "Second option text",
              "C": "Third option text",
              "D": "Fourth option text"
            },
            "correct": "A",
            "explanation": "Explanation of why this answer is correct"
          },
          // ... more questions
        ]
      }

      IMPORTANT: 
      - Your response must be ONLY the JSON object with no surrounding text, comments or code blocks
      - The JSON must be valid and properly formatted
      - Do not include \`\`\`json or any other formatting outside the actual JSON object`,
      });

      // This will remove any markdown code block formatting if present
      const cleanJson = quizContent.text
        .replace(/^```json\s*/, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "")
        .trim();

      setQuiz(cleanJson);
      console.log("Quiz generated:", cleanJson);
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      setQuizParsingError(error.message || "Failed to generate quiz");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSummary = async () => {
    try {
      let summaryTexts: string[] = [];

      // Handle different formats of summaries
      if (summaries && typeof summaries === "object" && summaries.length > 0) {
        // If summaries has a summaries property (as shown in the console)
        if (Array.isArray(summaries.summaries)) {
          summaryTexts = summaries.summaries
            .map((item: any) => {
              if (item && item.summary) {
                return item.summary;
              }
              return "";
            })
            .filter(Boolean);
        }
        // If summaries is directly an array
        else if (Array.isArray(summaries)) {
          summaryTexts = summaries
            .map((item: any) => {
              if (typeof item === "string") {
                return item;
              } else if (item && item.summary) {
                return item.summary;
              }
              return JSON.stringify(item);
            })
            .filter(Boolean);
        }
      }

      const summaryResponse = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `Create a comprehensive summary with bullet points from the following texts, focusing on the content and key points: ${summaryTexts.join(
          "\n"
        )}
        
        Format your response in Markdown. Use headings (##, ###), bullet points, emphasis (*italic*), strong (**bold**), and other Markdown formatting as appropriate to make the summary well-structured and easy to read.`,
      });

      // Update both the local state and the parent state
      setSummaryState(summaryResponse.text);
      setSummary(summaryResponse.text);

      console.log(summaryResponse.text);
    } catch (error) {
      console.error("Error generating summary:", error);
      setSummaryState("Failed to generate summary. Please try again.");
      setSummary("Failed to generate summary. Please try again.");
    }
  };

  // Parse the quiz text
  const parseQuiz = (): QuizQuestion[] => {
    if (!quiz) return [];

    try {
      console.log("Raw quiz data to parse:", quiz);

      // First try to extract and parse JSON
      try {
        let jsonData: any;

        try {
          // Try direct parsing first
          jsonData = JSON.parse(quiz);
          console.log("Successfully parsed JSON directly");
        } catch (directParseError) {
          console.log(
            "Direct parsing failed, trying to extract JSON object",
            directParseError
          );

          // If direct parsing fails, try to extract JSON from text
          const jsonRegex = /{[\s\S]*}/;
          const match = quiz.match(jsonRegex);

          if (match) {
            const jsonStr = match[0];
            console.log("Extracted JSON string:", jsonStr);
            jsonData = JSON.parse(jsonStr);
            console.log("Successfully parsed extracted JSON");
          } else {
            throw new Error("No JSON object found in the text");
          }
        }

        // Now process the parsed data
        if (
          jsonData &&
          jsonData.questions &&
          Array.isArray(jsonData.questions)
        ) {
          return jsonData.questions.map((q: any) => {
            // Process options - handle the format in the example
            let optionsArray: string[] = [];
            let correctAnswer = "";

            if (q.options && typeof q.options === "object") {
              // Handle options as an object with A, B, C, D keys
              const optionsObj = q.options as Record<string, string>;

              // Convert to array preserving order
              optionsArray = ["A", "B", "C", "D"]
                .filter((key) => key in optionsObj)
                .map((key) => optionsObj[key]);

              // Get correct answer text
              if (q.correct && typeof q.correct === "string") {
                const correctKey = q.correct.toUpperCase();
                if (correctKey in optionsObj) {
                  correctAnswer = optionsObj[correctKey];
                }
              }
            } else if (Array.isArray(q.options)) {
              // Handle options as an array
              optionsArray = q.options;

              // Get correct answer for array format
              if (typeof q.correctAnswer === "string") {
                correctAnswer = q.correctAnswer;
              } else if (
                typeof q.correct === "number" &&
                q.correct < optionsArray.length
              ) {
                correctAnswer = optionsArray[q.correct];
              }
            }

            return {
              question: q.question || "",
              options: optionsArray,
              correctAnswer: correctAnswer || "No correct answer available",
              explanation: q.explanation || "",
            };
          });
        }

        throw new Error("Invalid quiz data structure");
      } catch (jsonError: any) {
        console.error("Failed to parse JSON quiz:", jsonError);
        console.log("Full quiz text that failed to parse:", quiz);
        throw jsonError;
      }
    } catch (e: any) {
      console.error("Failed to parse quiz:", e);
      throw e;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Generated Content</CardTitle>
        <CardDescription>
          Content generated based on your screen recording
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4 space-x-2">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Quiz
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Recording Summary</h3>

              {/* Processed summary from OpenAI */}
              {summary ? (
                <div className="mt-4 markdown-content">
                  <ReactMarkdown components={MarkdownComponents}>
                    {summary}
                  </ReactMarkdown>
                </div>
              ) : (
                <p>Generating summary...</p>
              )}

              {/* Original segment summaries */}
              {summaries &&
                summaries.summaries &&
                summaries.summaries.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <h4 className="text-md font-medium mb-2">
                      Recording Segments
                    </h4>
                    <div className="space-y-3">
                      {summaries.summaries.map(
                        (segment: any, index: number) => (
                          <div key={index} className="border p-3 rounded-md">
                            <div className="flex justify-between">
                              <h5 className="font-medium">
                                {segment.segment_name || `Segment ${index + 1}`}
                              </h5>
                              {segment.timestamp !== undefined && (
                                <span className="text-sm text-gray-500">
                                  {typeof segment.timestamp === "number"
                                    ? `${Math.floor(
                                        segment.timestamp / 60
                                      )}:${String(
                                        segment.timestamp % 60
                                      ).padStart(2, "0")}`
                                    : segment.timestamp}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 markdown-content">
                              <ReactMarkdown components={MarkdownComponents}>
                                {segment.summary}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          </TabsContent>

          <TabsContent value="quiz">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Knowledge Check Quiz</h3>
              <p className="mb-4">
                Test your understanding of the content from the recording with
                these questions:
              </p>

              <div className="space-y-6">
                {isGeneratingQuiz ? (
                  <div className="p-6 border rounded-md text-center">
                    <p>Generating quiz questions based on the content...</p>
                  </div>
                ) : quizParsingError ? (
                  <div className="p-4 border border-red-200 rounded-md bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                    <p className="text-red-600 dark:text-red-400">
                      Error: {quizParsingError}
                    </p>
                    <button
                      className="mt-2 px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-md text-sm"
                      onClick={handleQuiz}
                    >
                      Try Again
                    </button>
                  </div>
                ) : quizQuestions.length > 0 ? (
                  quizQuestions.map(
                    (question: QuizQuestion, qIndex: number) => (
                      <div key={qIndex} className="p-4 border rounded-md">
                        <h4 className="font-medium mb-2">
                          Question {qIndex + 1}:
                        </h4>
                        <div className="mb-3 markdown-content">
                          <ReactMarkdown components={MarkdownComponents}>
                            {question.question}
                          </ReactMarkdown>
                        </div>
                        <div className="space-y-2">
                          {question.options.map(
                            (option: string, oIndex: number) => (
                              <div key={oIndex} className="flex items-start">
                                <input
                                  type="radio"
                                  id={`q${qIndex}o${oIndex}`}
                                  name={`q${qIndex}`}
                                  className="mr-2 mt-1"
                                />
                                <label
                                  htmlFor={`q${qIndex}o${oIndex}`}
                                  className="markdown-content"
                                >
                                  <ReactMarkdown
                                    components={MarkdownComponents}
                                  >
                                    {option}
                                  </ReactMarkdown>
                                </label>
                              </div>
                            )
                          )}
                        </div>
                        {question.correctAnswer && (
                          <details className="mt-3 pt-2 border-t">
                            <summary className="font-medium cursor-pointer">
                              View Answer
                            </summary>
                            <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded markdown-content">
                              <div className="answer-text">
                                <strong>Correct Answer:</strong>{" "}
                                <span className="markdown-content">
                                  <ReactMarkdown
                                    components={MarkdownComponents}
                                  >
                                    {question.correctAnswer}
                                  </ReactMarkdown>
                                </span>
                              </div>
                              {question.explanation && (
                                <div className="mt-1">
                                  <strong>Explanation:</strong>
                                  <div className="markdown-content">
                                    <ReactMarkdown
                                      components={MarkdownComponents}
                                    >
                                      {question.explanation}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                    )
                  )
                ) : (
                  <div className="p-4 border rounded-md">
                    <p>
                      No quiz questions available. Generate quiz questions to
                      test your knowledge.
                    </p>
                    <button
                      className="mt-2 px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-md text-sm"
                      onClick={handleQuiz}
                    >
                      Generate Quiz
                    </button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
