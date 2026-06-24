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

  // Remove icon colors
  content = content.replace(/text-(blue|yellow|green|amber|orange|teal|emerald|indigo|rose|red)-[0-9]{3}/g, 'text-[#11182B]');
  content = content.replace(/bg-(blue|yellow|green|amber|orange|teal|emerald|indigo|rose|red)-[0-9]{3}\/?([0-9]{2})?/g, 'bg-slate-50');
  content = content.replace(/border-(blue|yellow|green|amber|orange|teal|emerald|indigo|rose|red)-[0-9]{3}/g, 'border-slate-200');

  // Fix buttons that have bg-gold
  content = content.replace(/bg-\[#C6A87C\]/g, 'bg-[#11182B] text-white');
  content = content.replace(/text-\[#C6A87C\]/g, 'text-[#11182B]');
  content = content.replace(/border-\[#C6A87C\]/g, 'border-[#11182B]');
  content = content.replace(/hover:bg-\[#C6A87C\]\/90/g, 'hover:bg-[#11182B]/90');
  content = content.replace(/hover:bg-\[#C6A87C\]/g, 'hover:bg-[#11182B]');

  content = content.replace(/bg-gold/g, 'bg-navy');
  content = content.replace(/text-gold/g, 'text-navy');
  content = content.replace(/border-gold/g, 'border-navy');
  content = content.replace(/hover:bg-goldSoft/g, 'hover:bg-navySoft');
  content = content.replace(/hover:bg-gold\/\d+/g, 'hover:bg-navy/10');
  
  // Make sure to remove duplicate classes like `text-[#11182B] text-[#11182B]`
  content = content.replace(/(text-\[#11182B\]\s*)+/g, 'text-[#11182B] ');
  content = content.replace(/(text-white\s*)+/g, 'text-white ');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated colors in ${file}`);
  }
});
