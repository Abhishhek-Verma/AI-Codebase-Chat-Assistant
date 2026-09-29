import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentUser,
  signupUser,
  loginUser,
  logoutUser,
  switchActiveRepo as apiSwitchActiveRepo,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [activeRepo, setActiveRepo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial session on mount
  useEffect(() => {
    refreshSession();
  }, []);

  const refreshSession = async () => {
    setIsLoading(true);
    try {
      const data = await getCurrentUser();
      if (data && data.user) {
        setUser(data.user);
        setRepos(data.repos || []);
        setActiveRepo(data.activeRepo || null);
      } else {
        setUser(null);
        setRepos([]);
        setActiveRepo(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData) => {
    setIsLoading(true);
    try {
      const data = await signupUser(userData);
      setUser(data.user);
      setRepos(data.repos || []);
      setActiveRepo(data.activeRepo || null);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const data = await loginUser(credentials);
      setUser(data.user);
      setRepos(data.repos || []);
      setActiveRepo(data.activeRepo || null);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setRepos([]);
    setActiveRepo(null);
  };

  const selectRepo = async (repoUrl) => {
    try {
      const result = await apiSwitchActiveRepo(repoUrl);
      if (result.activeRepo) {
        setActiveRepo(result.activeRepo);
      }
      return result;
    } catch (err) {
      console.error('Error switching active repository:', err);
      throw err;
    }
  };

  const updateRepoData = (newRepos, newActiveRepo) => {
    if (newRepos) setRepos(newRepos);
    if (newActiveRepo !== undefined) setActiveRepo(newActiveRepo);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        repos,
        activeRepo,
        signup,
        login,
        logout,
        selectRepo,
        refreshSession,
        updateRepoData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
