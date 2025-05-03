import axios from 'axios';

// Базовый URL для API
const API_URL = 'http://127.0.0.1:8000/api';

// Создаем экземпляр axios с настройками
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Для работы с сессионной аутентификацией
});

// API для задач
export const taskApi = {
  // Получить все задачи
  getAllTasks: async () => {
    try {
      const response = await apiClient.get('/tasks/');
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },
  
  // Получить задачу по ID
  getTaskById: async (id: number) => {
    try {
      const response = await apiClient.get(`/tasks/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching task ${id}:`, error);
      throw error;
    }
  },

  // Получить случайную задачу
  getRandomTask: async (difficulty = 'easy') => {
    try {
      const response = await apiClient.get(`/random-task/?difficulty=${difficulty}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching random task:', error);
      throw error;
    }
  },
  
  // Отправить решение задачи
  submitSolution: async (taskId: number, code: string, userName: string) => {
    try {
      const response = await apiClient.post(`/tasks/${taskId}/submit_solution/`, {
        code,
        user_name: userName,
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting solution:', error);
      throw error;
    }
  }
};

// API для работы с решениями пользователей
export const submissionApi = {
  // Получить все решения
  getAllSubmissions: async () => {
    try {
      const response = await apiClient.get('/submissions/');
      return response.data;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  },
  
  // Получить решения пользователя
  getUserSubmissions: async (userName: string) => {
    try {
      const response = await apiClient.get(`/submissions/?user_name=${userName}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching submissions for user ${userName}:`, error);
      throw error;
    }
  }
};

// API для аутентификации
export const authApi = {
  // Получить данные текущего пользователя
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/current-user/');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return { authenticated: false };
    }
  },
  
  // Логин
  login: async (email: string, password: string) => {
    try {
      const response = await axios.post('/users/login/', { username: email, password });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Выход
  logout: async () => {
    try {
      const response = await axios.get('/users/logout/');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
};

export default {
  task: taskApi,
  submission: submissionApi,
  auth: authApi,
}; 