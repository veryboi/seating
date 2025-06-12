import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiKey, setApiKey] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if we already have a valid session on mount
  useEffect(() => {
    const storedApiKey = sessionStorage.getItem('gemini_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (password) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setApiKey(data.apiKey);
        setIsAuthenticated(true);
        // Store in session storage (not localStorage for security)
        sessionStorage.setItem('gemini_api_key', data.apiKey);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Connection error. Please try again.' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setApiKey(null);
    sessionStorage.removeItem('gemini_api_key');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      apiKey, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
} 