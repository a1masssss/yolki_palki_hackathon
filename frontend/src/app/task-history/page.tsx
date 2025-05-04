'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { taskApi, submissionApi } from '@/lib/api';
import { mockTasks } from '@/lib/mock-data';

// Task interface
interface Task {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  created_at: string;
}

// Submission interface
interface Submission {
  id: number;
  task: number;
  user_name: string;
  code: string;
  is_correct: boolean;
  submitted_at: string;
}

export default function TaskHistoryPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    // Fetch tasks and submissions on component mount
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all tasks
        const tasksData = await taskApi.getAllTasks();
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        
        // Check if using mock data
        if (tasksData === mockTasks) {
          setUsingMockData(true);
        }
        
        // Fetch all submissions
        let submissionsData;
        try {
          submissionsData = await submissionApi.getAllSubmissions();
          // Ensure we have an array of submissions
          setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
        } catch (submissionError) {
          console.error('Error fetching submissions:', submissionError);
          // Don't fail the whole page if submissions fail
          setSubmissions([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data', err);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group submissions by task ID, with safety checks
  const submissionsByTask = submissions.reduce((acc, submission) => {
    // Safety check for valid task ID
    if (submission && submission.task) {
      const taskId = submission.task;
      if (!acc[taskId]) {
        acc[taskId] = [];
      }
      acc[taskId].push(submission);
    }
    return acc;
  }, {} as Record<number, Submission[]>);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
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

  return (
    <div className="container mx-auto p-4">
      {usingMockData && (
        <div className="mb-6 p-4 bg-blue-100 text-blue-800 rounded-lg">
          <p className="font-medium">
            Note: You are viewing sample mock data. The API connection could not be established.
          </p>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Task History</h1>
        <Link href="/tasks">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Return to Tasks
          </button>
        </Link>
      </div>
      
      {tasks.length === 0 ? (
        <p className="text-center text-gray-500">No tasks available yet.</p>
      ) : (
        <div className="space-y-8">
          {tasks.map((task) => {
            const taskSubmissions = submissionsByTask[task.id] || [];
            const hasCorrectSubmission = taskSubmissions.some(sub => sub.is_correct);
            
            return (
              <div key={task.id} className="border rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">{task.title}</h2>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        task.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        task.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
                      </span>
                      {hasCorrectSubmission && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                          Completed ✓
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 mt-2">{task.description}</p>
                  <div className="mt-4">
                    <Link href={`/tasks/${task.id}`}>
                      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm">
                        Solve Task
                      </button>
                    </Link>
                  </div>
                </div>
                
                {taskSubmissions.length > 0 && (
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">Submissions ({taskSubmissions.length})</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Submitted At
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {taskSubmissions.map((sub) => (
                            <tr key={sub.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{sub.user_name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  sub.is_correct 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {sub.is_correct ? 'Correct' : 'Incorrect'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(sub.submitted_at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 