'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { taskApi } from '@/lib/api';

// Типы данных
interface Task {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  created_at: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');

  useEffect(() => {
    // Загрузка задач при монтировании компонента
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const tasksData = await taskApi.getAllTasks();
        setTasks(tasksData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch tasks', err);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleGetRandomTask = async () => {
    try {
      setLoading(true);
      const randomTask = await taskApi.getRandomTask(selectedDifficulty);
      // Redirect to the task page
      window.location.href = `/tasks/${randomTask.id}`;
    } catch (err) {
      console.error('Failed to fetch random task', err);
      setError('Failed to load random task. Please try again later.');
      setLoading(false);
    }
  };

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
      <h1 className="text-3xl font-bold mb-6">Programming Tasks</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Get Random Task</h2>
        <div className="flex flex-wrap items-center gap-4">
          <select 
            className="p-2 border rounded" 
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button 
            onClick={handleGetRandomTask}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Start Random Task
          </button>
        </div>
      </div>
      
      {tasks.length === 0 ? (
        <p className="text-center text-gray-500">No tasks available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div key={task.id} className="border rounded-lg overflow-hidden shadow-lg">
              <div className="p-4">
                <h2 className="text-xl font-bold mb-2">{task.title}</h2>
                <div className="mb-2">
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    task.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    task.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{
                  task.description.length > 100 
                    ? `${task.description.substring(0, 100)}...` 
                    : task.description
                }</p>
                <Link href={`/tasks/${task.id}`}>
                  <span className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Solve Task
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 