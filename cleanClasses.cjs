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

  // fixing the issue with hover:bg-white text-[#11182B]
  content = content.replace(/hover:bg-white text-\[#11182B\]/g, 'hover:bg-white hover:text-[#11182B]');
  content = content.replace(/text-white text-\[#11182B\]/g, 'text-white');
  
  // also fix text-[#11182B] when we meant a white icon on navy button
  // "bg-[#11182B] text-white  /90" ? What was that 
  content = content.replace(/text-white  \/90 text-\[#11182B\]/g, 'text-white/90');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Cleaned classes in ${file}`);
  }
});
