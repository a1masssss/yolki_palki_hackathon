'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { taskApi } from '@/lib/api';

// Типы данных
interface TestCase {
  input: string | Record<string, any>;
  expected_output: string | number;
}

interface Task {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  created_at: string;
  test_cases: TestCase[];
  template?: string;  // Optional template for the task
}

interface Submission {
  id: number;
  task: number;
  task_title: string;
  user_name: string;
  code: string;
  is_correct: boolean;
  submitted_at: string;
}

export default function TaskPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  
  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const taskData = await taskApi.getTaskById(parseInt(params.id, 10));
        setTask(taskData);
        
        // If task has a template, use it as initial code
        if (taskData.template) {
          setCode(taskData.template);
        }
        
        setError(null);
      } catch (err) {
        console.error(`Failed to fetch task ${params.id}`, err);
        setError('Failed to load task. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Please enter your code solution');
      return;
    }

    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const result = await taskApi.submitSolution(
        parseInt(params.id, 10),
        code,
        userName
      );
      
      setSubmission(result);
    } catch (err) {
      console.error('Failed to submit solution', err);
      setError('Failed to submit your solution. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Function to format the test case input for display
  const formatTestInput = (input: string | Record<string, any>): string => {
    if (typeof input === 'string') {
      return input;
    } else if (typeof input === 'object') {
      return JSON.stringify(input, null, 2);
    }
    return String(input);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={() => router.back()} 
            className="mt-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Go Back
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <button 
        onClick={() => router.back()} 
        className="mb-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
      >
        Back to Tasks
      </button>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{task.title}</h1>
        <div className="mb-4">
          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
            task.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            task.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
          </span>
        </div>
        <div className="prose max-w-none mb-6">
          <p>{task.description}</p>
        </div>
        
        {task.test_cases && task.test_cases.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-3">Test Cases</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              {task.test_cases.map((testCase, index) => (
                <div key={index} className="mb-4 last:mb-0">
                  <h3 className="font-semibold mb-1">Test Case {index + 1}:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-gray-700">Input:</p>
                      <pre className="bg-gray-200 p-2 rounded text-sm overflow-x-auto">
                        {formatTestInput(testCase.input)}
                      </pre>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Expected Output:</p>
                      <pre className="bg-gray-200 p-2 rounded text-sm overflow-x-auto">
                        {String(testCase.expected_output)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {submission ? (
        <div className={`mb-6 p-4 rounded-lg ${submission.is_correct ? 'bg-green-100' : 'bg-red-100'}`}>
          <h2 className="text-xl font-bold mb-2">Submission Result</h2>
          <p className="mb-2">
            <strong>Status:</strong> {submission.is_correct ? 'Correct!' : 'Incorrect'}
          </p>
          <p className="mb-2">
            <strong>Submitted at:</strong> {new Date(submission.submitted_at).toLocaleString()}
          </p>
          <button 
            onClick={() => setSubmission(null)} 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Submit Another Solution
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Submit Your Solution</h2>
          
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="userName" className="block text-gray-700 font-bold mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter your name"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="code" className="block text-gray-700 font-bold mb-2">
                Your Code
              </label>
              <textarea
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-64 font-mono"
                placeholder="Write your solution here"
              />
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full ${
                submitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Solution'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
} 