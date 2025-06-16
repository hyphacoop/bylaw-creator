import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// For local development, use Express server
// For production/Vercel, use relative URLs to serverless functions
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:4000' : '');

// Configure axios defaults
axios.defaults.withCredentials = true;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Use /api/ prefix for Vercel, direct endpoints for local development
      const endpoint = window.location.hostname === 'localhost' ? '/auth/status' : '/api/auth/status';
      const response = await axios.get(`${API_BASE_URL}${endpoint}`);
      setIsAuthenticated(response.data.authenticated);
    } catch (error) {
      console.error('Auth status check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (password: string): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Use /api/ prefix for Vercel, direct endpoints for local development
      const endpoint = window.location.hostname === 'localhost' ? '/auth/login' : '/api/auth/login';
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, { password });
      
      if (response.data.success) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      setError(message);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Use /api/ prefix for Vercel, direct endpoints for local development
      const endpoint = window.location.hostname === 'localhost' ? '/auth/logout' : '/api/auth/logout';
      await axios.post(`${API_BASE_URL}${endpoint}`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      login,
      logout,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 