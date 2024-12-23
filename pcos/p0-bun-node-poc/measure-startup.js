const { exec } = require('child_process');
const fs = require('fs');

// Function to measure startup time
function measureStartup(command, label, callback) {
  const startTime = Date.now();
  const process = exec(command, { timeout: 5000 });

  process.on('exit', () => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`${label} startup time: ${duration} ms`);
    callback(duration);
  });

  process.on('error', (error) => {
    console.error(`${label} failed to start:`, error.message);
    callback(null);
  });
}

// Write results to CSV
function writeToCSV(results) {
  const csvHeader = 'Environment,Startup Time (ms)\n';
  const csvContent = results
    .map(({ label, duration }) => `${label},${duration}`)
    .join('\n');

  fs.writeFileSync('startup_times.csv', csvHeader + csvContent);
  console.log('Results saved to startup_times.csv');
}

// Run measurements
const results = [];
measureStartup('node dist/server.js', 'Node.js', (duration) => {
  results.push({ label: 'Node.js', duration });

  measureStartup('bun run dist/server.js', 'Bun', (duration) => {
    results.push({ label: 'Bun', duration });
    writeToCSV(results);
  });
});
