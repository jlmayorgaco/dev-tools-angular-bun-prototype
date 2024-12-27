const { exec } = require('child_process');
const fs = require('fs');

// Configuration for wrk tests
const wrkConfig = {
  node: {
    url: 'http://localhost:3000',
    duration: '30s', // Test duration
    threads: 12,     // Number of threads
    connections: 400 // Number of connections
  },
  bun: {
    url: 'http://localhost:3001',
    duration: '30s',
    threads: 12,
    connections: 400
  }
};

// Command templates
const commands = {
  node: `wrk -t${wrkConfig.node.threads} -c${wrkConfig.node.connections} -d${wrkConfig.node.duration} ${wrkConfig.node.url}`,
  bun: `wrk -t${wrkConfig.bun.threads} -c${wrkConfig.bun.connections} -d${wrkConfig.bun.duration} ${wrkConfig.bun.url}`
};

// Parse `wrk` output
function parseWrkOutput(output) {
  const lines = output.split('\n');
  const requestsPerSecondLine = lines.find(line => line.startsWith('Requests/sec:'));
  const latencyLine = lines.find(line => line.includes('Latency'));
  const transferRateLine = lines.find(line => line.startsWith('Transfer/sec:'));

  const requestsPerSecond = requestsPerSecondLine
    ? parseFloat(requestsPerSecondLine.split(':')[1].trim())
    : 'N/A';
  const latency = latencyLine
    ? parseFloat(latencyLine.match(/Latency\s+(\d+\.\d+)ms/)[1])
    : 'N/A';
  const transferRate = transferRateLine
    ? parseFloat(transferRateLine.split(':')[1].trim().replace('MB', ''))
    : 'N/A';

  return { requestsPerSecond, latency, transferRate };
}

// Run a performance test
function runTest(command, label, callback) {
  console.log(`Running wrk for ${label}...`);
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running wrk for ${label}:`, error.message);
      callback(null);
      return;
    }
    const result = parseWrkOutput(stdout);
    callback({ label, ...result });
  });
}

// Save results to CSV
function saveToCSV(results) {
  const csvHeader = 'Environment,Requests/sec,Latency,Transfer/sec,Comparison\n';

  // Compute percentage differences
  const [nodeResult, bunResult] = results;
  const requestDiff = ((bunResult.requestsPerSecond / nodeResult.requestsPerSecond - 1) * 100).toFixed(2);
  const latencyDiff = ((nodeResult.latency / bunResult.latency - 1) * 100).toFixed(2);
  const transferDiff = ((bunResult.transferRate / nodeResult.transferRate - 1) * 100).toFixed(2);

  // Generate comparisons
  const comparisons = [
    `Bun is ${(requestDiff > 0 ? requestDiff : -requestDiff)}% ${requestDiff > 0 ? 'faster' : 'slower'} in Requests/sec`,
    `Node.js is ${(latencyDiff > 0 ? latencyDiff : -latencyDiff)}% ${(latencyDiff > 0 ? 'slower' : 'faster')} in Latency`,
    `Bun is ${(transferDiff > 0 ? transferDiff : -transferDiff)}% ${transferDiff > 0 ? 'better' : 'worse'} in Transfer/sec`
  ].join('; ');

  const csvContent = results
    .map(({ label, requestsPerSecond, latency, transferRate }) =>
      `${label},${requestsPerSecond},${latency}ms,${transferRate}MB`
    )
    .join('\n') + `\n,${comparisons}`;

  fs.writeFileSync('reports/performance_report.csv', csvHeader + csvContent);
  console.log('Performance report saved to performance_report.csv');
}

// Execute tests sequentially
const results = [];
runTest(commands.node, 'Node.js', (nodeResult) => {
  if (nodeResult) results.push(nodeResult);

  runTest(commands.bun, 'Bun', (bunResult) => {
    if (bunResult) results.push(bunResult);
    saveToCSV(results);
  });
});