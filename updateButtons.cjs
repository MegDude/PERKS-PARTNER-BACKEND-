const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') && !filePath.includes('Button.tsx') && !filePath.includes('button.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    if (content.includes('<button') || content.includes('</button>')) {
      content = content.replace(/<button/g, '<Button');
      content = content.replace(/<\/button>/g, '</Button>');
      hasChanges = true;
    }

    if (hasChanges) {
      if (!content.includes("from '@/components/ui/Button'") && !content.includes('from "../components/ui/Button"') && !content.includes("from '../components/ui/Button'")) {
        // compute relative import depth
        const depth = filePath.split('/').length - 2;
        let importStr = "import { Button } from '@/components/ui/Button';\n";
        
        let match = content.match(/import .*?;?\n/);
        if (match) {
          content = content.replace(/(import .*?;?\n)/, `$1${importStr}`);
        } else {
          content = importStr + content;
        }
      }
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated ' + filePath);
    }
  }
});
