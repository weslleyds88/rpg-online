import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Níveis de permissão
  const ROLES = {
    ADMIN: 'admin',
    MASTER: 'master',
    PLAYER: 'player'
  };

  // Verificar se usuário está logado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await api.get('/auth/me');
          setUser(response.data);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login
  const login = async (emailOrUsername, password) => {
    try {
      const loginData = {
        password
      };
      
      // Se contém @, é email, senão é username
      if (emailOrUsername.includes('@')) {
        loginData.email = emailOrUsername;
      } else {
        loginData.username = emailOrUsername;
      }
      
      const response = await api.post('/auth/login', loginData);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao fazer login' 
      };
    }
  };

  // Registro
  const register = async (username, email, password, role = ROLES.PLAYER) => {
    try {
      const response = await api.post('/auth/register', { 
        username, 
        email, 
        password, 
        role 
      });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao criar conta' 
      };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    setUser(null);
  };

  // Verificar permissões
  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    switch (user.role) {
      case ROLES.ADMIN:
        return true; // Admin tem todas as permissões
      case ROLES.MASTER:
        return ['create_quest', 'manage_room', 'manage_players'].includes(permission);
      case ROLES.PLAYER:
        return ['create_character', 'join_room', 'roll_dice'].includes(permission);
      default:
        return false;
    }
  };

  // Atualizar perfil do usuário
  const updateProfile = async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData);
      setUser(response.data);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao atualizar perfil' 
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    hasRole,
    hasPermission,
    updateProfile,
    ROLES
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
