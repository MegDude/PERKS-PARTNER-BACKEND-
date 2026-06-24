const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // fix double texts
  content = content.replace(/text-white text-\[#11182B\]\s?/g, 'text-white ');
  content = content.replace(/text-\[#11182B\]\s?text-white/g, 'text-white ');
  content = content.replace(/text-white\/90 text-\[#11182B\]\s?/g, 'text-white ');
  content = content.replace(/text-\[#11182B\] text-\[#11182B\]/g, 'text-[#11182B]');
  content = content.replace(/bg-navy\w* text-navy\w*/g, 'bg-[#11182B] text-white');
  content = content.replace(/border-navy\w* text-navy\w*/g, 'border-[#11182B] text-[#11182B]');
  content = content.replace(/text-navy\w*/g, 'text-[#11182B]');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Cleaned double text colors in ${file}`);
  }
});
