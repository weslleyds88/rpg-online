const fs = require('fs');
const path = require('path');

function removeDir(dir) {
  if (!fs.existsSync(dir)) return;
  
  try {
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
  } catch (err) {
    // Ignore errors, try using rmSync as fallback
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      // Ignore
    }
  }
}

// Remove o diretório de cache do webpack que contém arquivos grandes
// Isso é necessário porque o Cloudflare Pages tem limite de 25MB por arquivo
const cacheDir = path.join('.next', 'cache');
if (fs.existsSync(cacheDir)) {
  removeDir(cacheDir);
  console.log('✅ Cache directory removed');
} else {
  console.log('ℹ️  Cache directory not found');
}
