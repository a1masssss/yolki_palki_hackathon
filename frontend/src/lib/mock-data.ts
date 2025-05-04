// Mock Task and Submission data to use when API calls fail

export const mockTasks = [
  {
    id: 1,
    title: "Sum of Two Numbers",
    description: "Write a function that takes two numbers as input (comma-separated) and returns their sum.",
    difficulty: "easy",
    created_at: "2025-05-01T10:30:00Z",
    test_cases: [
      {
        input: "5, 7",
        expected_output: "12"
      },
      {
        input: "10, 20",
        expected_output: "30"
      }
    ]
  },
  {
    id: 2,
    title: "Find the Maximum Number",
    description: "Write a function that finds the maximum number in a list of integers (comma-separated).",
    difficulty: "medium",
    created_at: "2025-05-02T14:15:00Z",
    test_cases: [
      {
        input: "5, 7, 3, 8, 2",
        expected_output: "8"
      },
      {
        input: "10, 20, 15, 30, 25",
        expected_output: "30"
      }
    ]
  },
  {
    id: 3,
    title: "Count Vowels",
    description: "Write a function that counts the number of vowels in a given string.",
    difficulty: "easy",
    created_at: "2025-05-03T09:45:00Z",
    test_cases: [
      {
        input: "hello",
        expected_output: "2"
      },
      {
        input: "programming",
        expected_output: "3"
      }
    ]
  }
];

export const mockSubmissions = [
  {
    id: 1,
    task: 1,
    user_name: "John Doe",
    code: "def main(input):\n    parts = input.split(',')\n    return int(parts[0]) + int(parts[1])",
    is_correct: true,
    submitted_at: "2025-05-03T14:30:45Z"
  },
  {
    id: 2,
    task: 1,
    user_name: "Jane Smith",
    code: "def main(input):\n    parts = input.split(',')\n    return parts[0] + parts[1]", // String concatenation instead of integer addition
    is_correct: false,
    submitted_at: "2025-05-03T10:15:22Z"
  },
  {
    id: 3,
    task: 3,
    user_name: "Alex Brown",
    code: "def main(input):\n    count = 0\n    for char in input.lower():\n        if char in 'aeiou':\n            count += 1\n    return count",
    is_correct: true,
    submitted_at: "2025-05-04T08:20:15Z"
  }
]; 