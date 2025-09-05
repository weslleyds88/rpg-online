import React, { useState } from 'react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-rpg-darker flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo e título */}
        <div className="text-center">
          <div className="flex justify-center">
            <span className="text-6xl">🎲</span>
          </div>
          <h1 className="mt-4 text-4xl font-fantasy text-rpg-gold">
            RPG Online
          </h1>
          <p className="mt-2 text-gray-400">
            Sistema de Mesa de Jogo Online
          </p>
        </div>

        {/* Formulário de login ou registro */}
        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}

        {/* Informações sobre o sistema */}
        <div className="mt-8 text-center">
          <div className="bg-rpg-dark rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-fantasy text-rpg-gold mb-2">
              Como Funciona
            </h3>
            <div className="text-sm text-gray-400 space-y-1">
              <p>• <strong>Jogador:</strong> Crie personagens e participe de aventuras</p>
              <p>• <strong>Mestre:</strong> Gerencie salas e crie quests</p>
              <p>• <strong>Admin:</strong> Controle total do sistema</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
