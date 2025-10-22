// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Authentication API functions
export const loginUser = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.error || 'Login failed');
    }

    // Store token in localStorage
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const registerUser = async (userData: {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  confirm_password: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.error || 'Registration failed');
    }

    // Store token in localStorage
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }

    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Logout error:', error);
    // Clear localStorage even if API call fails
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

export const handleGoogleAuth = async () => {
  try {
    // TODO: Implement Google OAuth
    // This is a placeholder implementation
    console.log('Google authentication clicked');
    alert('Google authentication will be implemented with a proper OAuth provider');
  } catch (error) {
    console.error('Google auth error:', error);
    throw error;
  }
};

export const handleFacebookAuth = async () => {
  try {
    // TODO: Implement Facebook OAuth
    // This is a placeholder implementation
    console.log('Facebook authentication clicked');
    alert('Facebook authentication will be implemented with a proper OAuth provider');
  } catch (error) {
    console.error('Facebook auth error:', error);
    throw error;
  }
}; 