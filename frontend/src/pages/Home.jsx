import { Link } from 'react-router-dom';

const Home = () => {
  const features = [
    {
      title: 'Salas de Jogo Online',
      description: 'Crie ou entre em salas para jogar com seus amigos em tempo real.',
      icon: '🏰',
      link: '/rooms',
      color: 'bg-rpg-blue'
    },
    {
      title: 'Criar Personagens',
      description: 'Crie e gerencie seus personagens de RPG com diferentes classes e habilidades.',
      icon: '⚔️',
      link: '/create-player',
      color: 'bg-rpg-green'
    },
    {
      title: 'Gerenciar Quests',
      description: 'Aceite e complete missões para ganhar experiência e recompensas.',
      icon: '📜',
      link: '/quests',
      color: 'bg-rpg-purple'
    },
    {
      title: 'Sistema de Inventário',
      description: 'Colete itens, armas e equipamentos para seus personagens.',
      icon: '🎒',
      link: '/players',
      color: 'bg-rpg-gold'
    },
    {
      title: 'Rolagem de Dados',
      description: 'Use o sistema de dados integrado para suas aventuras.',
      icon: '🎲',
      link: '/dice',
      color: 'bg-rpg-red'
    },
    {
      title: 'Painel Admin',
      description: 'Gerencie eventos, itens e quests do sistema.',
      icon: '⚙️',
      link: '/admin',
      color: 'bg-gray-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-fantasy text-rpg-gold mb-4">
          RPG Online
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Sistema completo para gerenciar suas aventuras de RPG de mesa online. 
          Crie personagens, aceite quests, role dados e muito mais!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/create-player" className="btn-primary text-lg px-8 py-3">
            Criar Primeiro Personagem
          </Link>
          <Link to="/players" className="btn-secondary text-lg px-8 py-3">
            Ver Personagens
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Link
            key={index}
            to={feature.link}
            className="card hover:scale-105 transition-transform duration-200 group"
          >
            <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200`}>
              {feature.icon}
            </div>
            <h3 className="text-xl font-fantasy text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-400">
              {feature.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-rpg-dark rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-fantasy text-rpg-gold mb-4 text-center">
          Sistema Completo de RPG
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-rpg-blue mb-2">6</div>
            <div className="text-gray-400">Classes Disponíveis</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-rpg-green mb-2">∞</div>
            <div className="text-gray-400">Possibilidades de Aventura</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-rpg-purple mb-2">100%</div>
            <div className="text-gray-400">Gratuito e Open Source</div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="card">
        <h2 className="text-2xl font-fantasy text-rpg-gold mb-4">
          Como Começar
        </h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="bg-rpg-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h3 className="font-semibold text-white">Crie seu Personagem</h3>
              <p className="text-gray-400">Escolha uma classe e personalize seu aventureiro.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-rpg-green text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h3 className="font-semibold text-white">Aceite Quests</h3>
              <p className="text-gray-400">Encontre missões para ganhar experiência e recompensas.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-rpg-purple text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h3 className="font-semibold text-white">Role os Dados</h3>
              <p className="text-gray-400">Use o sistema de dados integrado para suas ações.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
