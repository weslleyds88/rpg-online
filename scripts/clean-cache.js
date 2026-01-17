const fs = require('fs');
const path = require('path');

function removeDir(dir) {
  if (!fs.existsSync(dir)) return;
  
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      removeDir(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  });
  
  fs.rmdirSync(dir);
}

// Remove o diretório de cache do webpack que contém arquivos grandes
const cacheDir = path.join('.next', 'cache');
if (fs.existsSync(cacheDir)) {
  removeDir(cacheDir);
  console.log('✅ Cache directory removed');
} else {
  console.log('ℹ️  Cache directory not found');
}
