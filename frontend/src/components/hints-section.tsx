"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, Code, BookOpen, AlertCircle } from "lucide-react"

interface HintsSectionProps {
  code: string
}

export default function HintsSection({ code }: HintsSectionProps) {
  const [hints, setHints] = useState<string[]>([])
  const [bestPractices, setBestPractices] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])

  useEffect(() => {
    if (!code) return

    const newHints: string[] = []
    const newBestPractices: string[] = []
    const newWarnings: string[] = []

    if (code.includes("print")) {
      newHints.push(
        'The print() function outputs text to the console. You can format strings using f-strings like f"Hello, {name}!"',
      )
    }

    if (code.includes("def ")) {
      newHints.push(
        "Functions help organize and reuse code. Remember to add docstrings to document what your functions do.",
      )
      newBestPractices.push("Use descriptive function names that indicate what the function does.")
    }

    if (code.includes("for ")) {
      newHints.push("For loops iterate over sequences like lists, tuples, or strings.")
      newBestPractices.push("Consider using list comprehensions for simple transformations of lists.")
    }

    if (code.includes("while ")) {
      newHints.push("While loops continue until a condition becomes False.")
      newWarnings.push(
        "Be careful with while loops to avoid infinite loops. Ensure the condition will eventually become False.",
      )
    }

    if (code.includes("if ")) {
      newHints.push("Conditional statements let your code make decisions based on conditions.")
    }

    if (code.includes("import ")) {
      newBestPractices.push("Import statements should be at the top of your file.")
    }

    if (code.includes("except:") && !code.includes("except Exception:")) {
      newWarnings.push("Avoid bare except clauses. Specify the exceptions you want to catch.")
    }

    if (code.includes("global ")) {
      newWarnings.push("Use global variables sparingly. Consider using function parameters and return values instead.")
    }

    setHints(newHints.length > 0 ? newHints : ["No specific hints for this code yet."])
    setBestPractices(newBestPractices.length > 0 ? newBestPractices : ["No specific best practices for this code yet."])
    setWarnings(newWarnings.length > 0 ? newWarnings : [])
  }, [code])

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Hints & Tips
            </CardTitle>
            <CardDescription>Helpful information about Python concepts in your code</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {hints.map((hint, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="mt-1 min-w-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                  </div>
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-500" />
              Best Practices
            </CardTitle>
            <CardDescription>Recommendations for writing better Python code</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {bestPractices.map((practice, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="mt-1 min-w-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                  </div>
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {warnings.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Potential Issues
              </CardTitle>
              <CardDescription>Things to watch out for in your code</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="mt-1 min-w-4">
                      <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                    </div>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-purple-500" />
              Learning Resources
            </CardTitle>
            <CardDescription>Helpful links to learn more about Python</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="mt-1 min-w-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                </div>
                <span>
                  <a
                    href="https://docs.python.org/3/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-500 hover:underline"
                  >
                    Python Official Documentation
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 min-w-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                </div>
                <span>
                  <a
                    href="https://realpython.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-500 hover:underline"
                  >
                    Real Python Tutorials
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 min-w-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                </div>
                <span>
                  <a
                    href="https://www.w3schools.com/python/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-500 hover:underline"
                  >
                    W3Schools Python Tutorial
                  </a>
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
