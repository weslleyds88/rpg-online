const jwt = require('jsonwebtoken');

// Usuário admin hardcoded
const ADMIN_USER = {
  id: 'admin-001',
  username: 'weslleyds88',
  email: 'weslleyds88@admin.com',
  role: 'admin',
  password: '159357We*' // Senha hardcoded para admin
};

// Chave secreta para JWT (em produção, usar variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'rpg-online-secret-key-2024';

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso necessário'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem acessar esta rota.'
    });
  }
  next();
};

// Middleware para verificar se é mestre ou admin
const requireMasterOrAdmin = (req, res, next) => {
  if (!['admin', 'master'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas mestres ou administradores podem acessar esta rota.'
    });
  }
  next();
};

// Função para gerar token JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Função para verificar credenciais do admin
const verifyAdminCredentials = (username, password) => {
  return username === ADMIN_USER.username && password === ADMIN_USER.password;
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireMasterOrAdmin,
  generateToken,
  verifyAdminCredentials,
  ADMIN_USER,
  JWT_SECRET
};
