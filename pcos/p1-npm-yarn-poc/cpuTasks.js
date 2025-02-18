const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);

// Parse runtime argument
const runtimeArg = args.find((arg) => arg.startsWith('--runtime='));
const runtime = runtimeArg ? runtimeArg.split('=')[1] : 'Unknown';

// Blocking CPU-intensive process: Calculate the sum of prime numbers up to a limit
function calculatePrimes(limit) {
  const primes = [];
  for (let i = 2; i <= limit; i++) {
    if (primes.every((prime) => i % prime !== 0)) primes.push(i);
  }
  return primes.reduce((a, b) => a + b, 0); // Sum of primes
}

// Start timing
const start = performance.now();

// Define a blocking task
const limit = 1e8; // Change this value to make the task more or less intensive
const result = calculatePrimes(limit);

// End timing
const end = performance.now();
const timeTaken = (end - start).toFixed(2);

// Prepare CSV data
const outputDir = 'reports';
const outputFile = path.join(outputDir, 'results.csv');
const csvHeader = 'Runtime,Limit,Result,Time Taken (ms)\n';
const csvRow = `${runtime},${limit},${result},${timeTaken}\n`;

// Ensure the directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Check if the file exists and write accordingly
if (!fs.existsSync(outputFile)) {
  // File doesn't exist, write header and first row
  fs.writeFileSync(outputFile, csvHeader + csvRow, 'utf8');
} else {
  // File exists, append the new row
  fs.appendFileSync(outputFile, csvRow, 'utf8');
}

// Log result and time
console.log(`Runtime: ${runtime}`);
console.log(`Calculated sum of primes up to ${limit}: ${result}`);
console.log(`Time taken: ${timeTaken}ms`);
console.log(`Results saved to ${outputFile}`);