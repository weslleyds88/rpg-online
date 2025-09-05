import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout, hasRole, hasPermission } = useAuth();

  const navigation = [
    { name: 'Início', href: '/', icon: '🏠' },
    { name: 'Criar Personagem', href: '/create-player', icon: '⚔️', permission: 'create_character' },
    { name: 'Personagens', href: '/players', icon: '👥' },
    { name: 'Salas de Jogo', href: '/rooms', icon: '🏰' },
    { name: 'Quests', href: '/quests', icon: '📜' },
    { name: 'Dados', href: '/dice', icon: '🎲' },
    { name: 'Admin', href: '/admin', icon: '⚙️', role: 'admin' },
  ];

  // Filtrar navegação baseada nas permissões do usuário
  const filteredNavigation = navigation.filter(item => {
    if (item.role && !hasRole(item.role)) return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-rpg-darker">
      {/* Header */}
      <header className="bg-rpg-dark border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl">🎲</span>
                <h1 className="text-xl font-fantasy text-rpg-gold">RPG Online</h1>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'bg-rpg-blue text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            {user && (
              <div className="hidden md:flex items-center space-x-4">
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <div className="w-8 h-8 bg-rpg-blue rounded-full flex items-center justify-center text-white font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">{user.username}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-rpg-dark border border-gray-700 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-700">
                          <p className="text-sm text-gray-300">{user.username}</p>
                          <p className="text-xs text-rpg-gold capitalize">{user.role}</p>
                        </div>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Meu Perfil
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          Sair
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-300 hover:text-white focus:outline-none focus:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-rpg-dark border-t border-gray-700">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'bg-rpg-blue text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
              
              {/* Mobile User Menu */}
              {user && (
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="px-3 py-2">
                    <p className="text-sm text-gray-300">{user.username}</p>
                    <p className="text-xs text-rpg-gold capitalize">{user.role}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>👤</span>
                    <span>Meu Perfil</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 w-full text-left"
                  >
                    <span>🚪</span>
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-rpg-dark border-t border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400 text-sm">
            <p>RPG Online - Sistema de Mesa de Jogo</p>
            <p className="mt-1">Desenvolvido com React + Node.js + PostgreSQL</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
