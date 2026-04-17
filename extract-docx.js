const fs = require('fs');
const path = require('path');

// Read the XML file that was extracted
const xmlFile = process.argv[2];
const xml = fs.readFileSync(xmlFile, 'utf8');

// Simple regex to extract text from XML (w:t tags)
const textMatches = xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
const texts = textMatches.map(match => {
  const text = match.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '');
  return text;
});

console.log(texts.join(' '));
