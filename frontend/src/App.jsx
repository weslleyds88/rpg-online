import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './index.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>RPG Online - Mesa de Jogo</h1>
        <p>Bem-vindo ao sistema de RPG Online!</p>
      </header>
      
      <main className="App-main">
        <Routes>
          <Route path="/" element={
            <div className="home-page">
              <h2>Página Inicial</h2>
              <p>Sistema de RPG Online funcionando corretamente!</p>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;