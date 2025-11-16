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
      // Handle validation errors from serializer
      if (data.email && Array.isArray(data.email)) {
        throw new Error(data.email[0] || 'Invalid credentials');
      }
      if (data.password && Array.isArray(data.password)) {
        throw new Error(data.password[0] || 'Invalid credentials');
      }
      if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
        throw new Error(data.non_field_errors[0] || 'Invalid credentials');
      }
      throw new Error(data.detail || data.error || data.message || 'Login failed');
    }

    // Store token in localStorage
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Clean up old shortlist data from previous user
    import('./shortlist').then(({ cleanupOldShortlist }) => {
      cleanupOldShortlist();
    }).catch(() => {
      // Ignore errors during cleanup
    });

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

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error('Failed to parse server response. Please check if the backend server is running.');
    }

    if (!response.ok) {
      // Handle validation errors from serializer
      if (data.email && Array.isArray(data.email)) {
        throw new Error(data.email[0] || 'Invalid email');
      }
      if (data.username && Array.isArray(data.username)) {
        throw new Error(data.username[0] || 'Invalid username');
      }
      if (data.password && Array.isArray(data.password)) {
        throw new Error(data.password[0] || 'Invalid password');
      }
      if (data.confirm_password && Array.isArray(data.confirm_password)) {
        throw new Error(data.confirm_password[0] || 'Passwords do not match');
      }
      if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
        throw new Error(data.non_field_errors[0] || 'Registration failed');
      }
      throw new Error(data.detail || data.error || data.message || 'Registration failed');
    }

    // Store token in localStorage
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Clean up old shortlist data from previous user
    import('./shortlist').then(({ cleanupOldShortlist }) => {
      cleanupOldShortlist();
    }).catch(() => {
      // Ignore errors during cleanup
    });

    return data;
  } catch (error: any) {
    console.error('Registration error:', error);
    // If it's a network error, provide a helpful message
    if (error.message && error.message.includes('fetch')) {
      throw new Error('Failed to connect to server. Please ensure the backend server is running on http://localhost:8000');
    }
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    // Get user before clearing localStorage
    const user = getCurrentUser();
    const userId = user?.id;
    
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }

    // Clear user-specific shortlist before clearing user data
    if (userId) {
      localStorage.removeItem(`player_shortlist_${userId}`);
    }
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Logout error:', error);
    
    // Get user before clearing localStorage
    const user = getCurrentUser();
    const userId = user?.id;
    
    // Clear user-specific shortlist before clearing user data
    if (userId) {
      localStorage.removeItem(`player_shortlist_${userId}`);
    }
    
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