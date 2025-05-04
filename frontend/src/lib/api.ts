import axios from 'axios';
import { mockTasks, mockSubmissions } from './mock-data';

// Determine the base API URL
const determineApiUrl = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // For local development, use localhost:8000
    return 'http://127.0.0.1:8000';
  }
  // For server-side rendering, use a fallback
  return 'http://127.0.0.1:8000';
};

// Базовый URL для API
const API_URL = determineApiUrl();
const PYTHON_EDI_API = `${API_URL}/python-edi`;

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
      const response = await apiClient.get(`${PYTHON_EDI_API}/api/tasks/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      console.log('Using mock tasks data as fallback');
      return mockTasks; // Return mock data instead of throwing
    }
  },
  
  // Получить задачу по ID
  getTaskById: async (id: number) => {
    try {
      const response = await apiClient.get(`${PYTHON_EDI_API}/api/tasks/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching task ${id}:`, error);
      throw error;
    }
  },

  // Получить случайную задачу
  getRandomTask: async (difficulty = 'easy') => {
    try {
      const response = await apiClient.get(`${PYTHON_EDI_API}/random-task/?difficulty=${difficulty}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching random task:', error);
      throw error;
    }
  },
  
  // Отправить решение задачи
  submitSolution: async (taskId: number, code: string, userName: string) => {
    try {
      const response = await apiClient.post(`${PYTHON_EDI_API}/tasks/submit_solution/`, {
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
      // This endpoint may need to be updated based on the backend implementation
      const response = await apiClient.get(`${PYTHON_EDI_API}/api/submissions/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      console.log('Using mock submissions data as fallback');
      // Return mock data instead of empty array
      return mockSubmissions;
    }
  },
  
  // Получить решения пользователя
  getUserSubmissions: async (userName: string) => {
    try {
      // This endpoint may need to be updated based on the backend implementation
      const response = await apiClient.get(`${PYTHON_EDI_API}/api/submissions/?user_name=${userName}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching submissions for user ${userName}:`, error);
      console.log('Using filtered mock submissions data as fallback');
      // Return filtered mock data
      return mockSubmissions.filter(sub => sub.user_name === userName);
    }
  }
};

// Function to get CSRF token from cookies
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null; // For SSR
  
  // Try to find csrftoken in cookies
  const csrfToken = document.cookie.split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
    
  if (csrfToken) return csrfToken;
  
  // If not found, try X-CSRFToken header from the most recent response
  if (apiClient.defaults.headers.common['X-CSRFToken']) {
    return apiClient.defaults.headers.common['X-CSRFToken'] as string;
  }
  
  return null;
}

// API для аутентификации
export const authApi = {
  // Получить данные текущего пользователя
  getCurrentUser: async () => {
    try {
      // First, try to fetch CSRF token to ensure we have cookies
      await apiClient.get(`${API_URL}/users/get-csrf/`, { withCredentials: true });
      
      // Use the debug endpoint which doesn't require authentication
      try {
        const debugResponse = await apiClient.get(`${API_URL}/users/debug-auth/`, { withCredentials: true });
        console.log('Debug auth response:', debugResponse.data);
        
        // If the debug endpoint shows we're authenticated, return user data
        if (debugResponse.data.is_authenticated) {
          // Try to get the protected endpoint data, but fall back to basic info if it fails
          try {
            const authResponse = await apiClient.get(`${API_URL}/users/check-auth/`, { withCredentials: true });
            return {
              ...authResponse.data,
              authenticated: true,
            };
          } catch (error) {
            console.log('Error fetching detailed user info, using basic info:', error);
            // If check-auth fails but debug shows authenticated, return minimal user info
            return {
              id: debugResponse.data.user_id,
              email: debugResponse.data.username || 'User', // Try to use username from debug endpoint
              authenticated: true,
            };
          }
        } else {
          console.log('User is not authenticated according to debug endpoint');
          return { authenticated: false };
        }
      } catch (debugError) {
        console.error('Error checking auth state:', debugError);
        return { authenticated: false };
      }
    } catch (error: any) {
      console.error('Error fetching current user:', error);
      return { authenticated: false };
    }
  },
  
  // Логин
  login: async (email: string, password: string) => {
    try {
      // First, get a CSRF token
      const csrfResponse = await apiClient.get(`${API_URL}/users/get-csrf/`, { 
        withCredentials: true 
      });
      
      // Store CSRF token in headers for future requests
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        apiClient.defaults.headers.common['X-CSRFToken'] = csrfToken;
      }
      
      console.log('Using CSRF token for login:', csrfToken);
      
      // Use the API login endpoint
      const response = await apiClient.post(`${API_URL}/users/api-login/`, 
        { username: email, password },
        {
          headers: {
            'X-CSRFToken': csrfToken || '',
          },
          withCredentials: true,
        }
      );
      
      // Delay slightly to allow session to be established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check authentication status immediately after login attempt
      try {
        const debugResponse = await apiClient.get(`${API_URL}/users/debug-auth/`, {
          withCredentials: true,
        });
        console.log('Debug auth response after login:', debugResponse.data);
        
        // Only return success if we can confirm authentication worked
        if (debugResponse.data.is_authenticated) {
          return { success: true, data: response.data };
        } else {
          // Try one more time with a longer delay
          await new Promise(resolve => setTimeout(resolve, 500));
          const retryResponse = await apiClient.get(`${API_URL}/users/debug-auth/`, {
            withCredentials: true,
          });
          
          if (retryResponse.data.is_authenticated) {
            return { success: true, data: response.data };
          }
          
          console.error('Login API returned success but user is not authenticated');
          return { 
            success: false, 
            error: 'Login was processed but session was not created. Please try again or contact support.'
          };
        }
      } catch (debugError) {
        console.error('Debug auth error after login:', debugError);
        return { success: false, error: 'Unable to verify login status' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Try to get more detailed error information
      const errorMessage = error.response?.data?.detail || 
        error.response?.data?.message || 
        'Login failed. Please check your credentials.';
        
      return { success: false, error: errorMessage };
    }
  },
  
  // Выход
  logout: async () => {
    try {
      // First, get a fresh CSRF token
      const csrfResponse = await apiClient.get(`${API_URL}/users/get-csrf/`);
      
      // Store CSRF token in headers for future requests
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        apiClient.defaults.headers.common['X-CSRFToken'] = csrfToken;
      }
      
      console.log('Using CSRF token for logout:', csrfToken);
      
      // Use the API logout endpoint
      const response = await apiClient.post(`${API_URL}/users/api-logout/`, {}, {
        headers: {
          'X-CSRFToken': csrfToken || '',
        },
        withCredentials: true,
      });
      
      // Verify logout was successful
      try {
        const debugResponse = await apiClient.get(`${API_URL}/users/debug-auth/`, {
          withCredentials: true,
        });
        console.log('Debug auth response after logout:', debugResponse.data);
        
        if (!debugResponse.data.is_authenticated) {
          console.log('Logout successful');
          return { success: true };
        } else {
          console.error('Logout API returned success but user is still authenticated');
          return { 
            success: false, 
            error: 'Logout was processed but session was not cleared. Please try again.'
          };
        }
      } catch (debugError) {
        console.error('Debug auth error after logout:', debugError);
        // Assume success even if we can't verify
        return { success: true };
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      return { success: false, error: 'Failed to logout' };
    }
  },
  
  // Регистрация
  register: async (email: string, password1: string, password2: string) => {
    try {
      // First, get a CSRF token
      const csrfResponse = await apiClient.get(`${API_URL}/users/get-csrf/`);
      
      // Store CSRF token in headers for future requests
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        apiClient.defaults.headers.common['X-CSRFToken'] = csrfToken;
      }
      
      console.log('Using CSRF token:', csrfToken);
      
      // Use the new api-register endpoint
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password1', password1);
      formData.append('password2', password2);
      
      const response = await apiClient.post(`${API_URL}/users/api-register/`, 
        formData,
        {
          headers: {
            'X-CSRFToken': csrfToken || '',
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );
      
      console.log('Registration response:', response.data);
      
      // Attempt login after successful registration
      const loginResult = await authApi.login(email, password1);
      if (loginResult.success) {
        return { success: true, data: response.data };
      } else {
        // Registration succeeded but login failed
        return { 
          success: true, 
          data: response.data,
          message: 'Account created successfully, but you need to login separately.'
        };
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Extract validation errors from Django response
      const errors = error.response?.data || {};
      let errorMessage = 'Registration failed. Please try again.';
      
      // Format the error messages from Django
      if (typeof errors === 'object' && Object.keys(errors).length > 0) {
        const errorMessages = Object.entries(errors)
          .map(([field, msgs]: [string, any]) => {
            if (Array.isArray(msgs)) {
              return `${field}: ${msgs.join(', ')}`;
            }
            return `${field}: ${msgs}`;
          })
          .join('; ');
        
        errorMessage = errorMessages || errorMessage;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  },
};

export default {
  task: taskApi,
  submission: submissionApi,
  auth: authApi,
}; 