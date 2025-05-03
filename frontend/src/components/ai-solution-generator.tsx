"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface AISolutionGeneratorProps {
  taskTitle: string;
  taskDescription: string;
}

export default function AISolutionGenerator({
  taskTitle,
  taskDescription,
}: AISolutionGeneratorProps) {
  const [solution, setSolution] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const generateSolution = () => {
    setIsGenerating(true);

    // Simulate AI generation with a timeout
    setTimeout(() => {
      // Generate a solution based on the task title
      let generatedSolution = "";

      if (taskTitle.toLowerCase().includes("multiply")) {
        generatedSolution = `# Solution for ${taskTitle}

def multiply(a, b):
    """
    Multiplies two numbers and returns their product as an integer.
    
    Args:
        a: First number
        b: Second number
        
    Returns:
        The product of a and b as an integer
    """
    return int(a * b)

# Example usage:
result = multiply(3, 4)
print(result)  # Output: 12`;
      } else if (taskTitle.toLowerCase().includes("palindrome")) {
        generatedSolution = `# Solution for ${taskTitle}

def is_palindrome(text):
    """
    Checks if a string is a palindrome (reads the same forwards and backwards).
    
    Args:
        text: The string to check
        
    Returns:
        True if the string is a palindrome, False otherwise
    """
    # Convert to lowercase and compare with reversed version
    text = text.lower()
    return text == text[::-1]

# Example usage:
print(is_palindrome("racecar"))  # Output: True
print(is_palindrome("hello"))    # Output: False`;
      } else if (taskTitle.toLowerCase().includes("fibonacci")) {
        generatedSolution = `# Solution for ${taskTitle}

def fibonacci(n):
    """
    Returns the nth number in the Fibonacci sequence.
    
    Args:
        n: The position in the sequence (0-indexed)
        
    Returns:
        The nth Fibonacci number
    """
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    
    # Iterative approach for better performance
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

# Example usage:
print(fibonacci(6))  # Output: 8
print(fibonacci(10))  # Output: 55`;
      } else {
        generatedSolution = `# AI-generated solution for ${taskTitle}

# Based on the task description:
# ${taskDescription}

def solution(input_data):
    """
    Solves the given problem.
    
    Args:
        input_data: The input for the problem
        
    Returns:
        The solution to the problem
    """
    # This is a placeholder implementation
    # In a real AI system, this would be generated based on the specific task
    return process_input(input_data)

def process_input(data):
    # Process the input according to the task requirements
    result = data  # Placeholder
    return result

# Example usage:
test_input = "example"
print(solution(test_input))`;
      }

      setSolution(generatedSolution);
      setIsGenerating(false);
      setShowSolution(true);
    }, 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-amber-500" />
          AI Solution Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!showSolution ? (
          <div className="text-center">
            <p className="mb-4 text-slate-600 dark:text-slate-300">
              Need help solving this problem? The AI can generate a solution
              with explanations.
            </p>
            <Button
              onClick={generateSolution}
              disabled={isGenerating}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isGenerating ? "Generating..." : "Generate Solution"}
            </Button>
          </div>
        ) : (
          <div>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto max-h-96">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {solution}
              </pre>
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => setShowSolution(false)}>
                Hide Solution
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
