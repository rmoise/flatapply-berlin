import { config } from 'dotenv';

config({ path: '.env.local' });

function extractPrice(priceText: string): number | undefined {
  const match = priceText.match(/(\d+(?:[.,]\d+)?)/);
  if (match) {
    return parseFloat(match[1].replace(',', '.'));
  }
  return undefined;
}

// Test the extraction
const testCases = [
  "500 €",
  "570 €",
  "700 €",
  "1.200 €",
  "1,200 €",
  "€ 500",
  "500",
  "1"
];

console.log('Testing price extraction:\n');

testCases.forEach(test => {
  const result = extractPrice(test);
  console.log(`"${test}" => ${result}`);
});

// Test what the scraper might be getting
console.log('\n\nTesting with trimmed text:');
const priceText = "700 €";
console.log(`Original: "${priceText}"`);
console.log(`Trimmed: "${priceText.trim()}"`);
console.log(`Result: ${extractPrice(priceText.trim())}`);