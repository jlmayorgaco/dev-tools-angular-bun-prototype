const { exec } = require('child_process');
const fs = require('fs');
const { performance } = require('perf_hooks');

// Test configurations
const tests = [
  {
    name: 'Clean Install',
    tasks: [{ name: 'Clean Install Dependencies', command: 'install --force' }],
    reportFile: 'reports/install-performance.csv',
  },
  {
    name: 'CPU-Intensive Script',
    tasks: [{ name: 'Run CPU-Intensive Script', command: 'cpuTasks.js' }],
    reportFile: 'reports/cpu-performance.csv',
  },
];

const packageManagers = [
  { name: 'npm', command: 'npm' },
  { name: 'yarn', command: 'yarn' },
  { name: 'bun', command: 'bun' },
];

const runtimes = [
  { name: 'Node.js', command: 'node' },
  { name: 'Bun', command: 'bun' },
  { name: 'Yarn', command: 'yarn node' }, // Yarn calls Node.js
];

// Logs and results
let results = [];

// Function to clean the environment for a fresh install
function cleanEnvironment() {
  console.log(`Cleaning environment...`);
  if (fs.existsSync('node_modules')) {
    fs.rmSync('node_modules', { recursive: true, force: true });
  }
  if (fs.existsSync('package-lock.json')) {
    fs.unlinkSync('package-lock.json');
  }
  if (fs.existsSync('yarn.lock')) {
    fs.unlinkSync('yarn.lock');
  }
}

// Execute a command and measure its execution time
function runCommand(command, label, callback) {
  console.log(`Running: ${command}`);
  const start = performance.now();
  exec(command, (error, stdout, stderr) => {
    const end = performance.now();
    if (error) {
      console.error(`Error with ${label}: ${error.message}`);
      callback(null);
      return;
    }
    console.log(`Finished: ${label} in ${(end - start).toFixed(2)}ms`);
    callback((end - start).toFixed(2));
  });
}

// Save results to a CSV file
function saveResultsToCSV(reportFile) {
  const csvHeader = 'Manager/Runtime,Task,Time (ms)\n';
  const csvContent = results
    .map(({ managerName, taskName, time }) => `${managerName},${taskName},${time}`)
    .join('\n');

  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports');
  }
  fs.writeFileSync(reportFile, csvHeader + csvContent);
  console.log(`Performance report saved to ${reportFile}`);
}

// Run tests for a specific test configuration
function runTests(testConfig, callback) {
  const { tasks, reportFile } = testConfig;
  results = [];
  let index = 0;

  function next() {
    if (index >= tasks.length * (testConfig.name === 'Clean Install' ? packageManagers.length : runtimes.length)) {
      saveResultsToCSV(reportFile);
      callback();
      return;
    }

    const managerOrRuntimeIndex = Math.floor(index / tasks.length);
    const taskIndex = index % tasks.length;

    const isInstallTest = testConfig.name === 'Clean Install';
    const { name: managerOrRuntimeName, command: managerOrRuntimeCommand } = isInstallTest
      ? packageManagers[managerOrRuntimeIndex]
      : runtimes[managerOrRuntimeIndex];

    const { name: taskName, command: taskCommand } = tasks[taskIndex];

    if (isInstallTest && taskCommand.startsWith('install')) {
      cleanEnvironment();
    }

    const label = `${managerOrRuntimeName} - ${taskName}`;
    const actualCommand = isInstallTest
      ? `${managerOrRuntimeCommand} ${taskCommand}`
      : `${managerOrRuntimeCommand} ${taskCommand}`;
    runCommand(actualCommand, label, (time) => {
      if (time) {
        results.push({ managerName: managerOrRuntimeName, taskName, time });
      }
      index++;
      next();
    });
  }

  next();
}

// Start all tests sequentially
function runAllTests() {
  let testIndex = 0;

  function nextTest() {
    if (testIndex >= tests.length) {
      console.log('All tests completed.');
      return;
    }

    const testConfig = tests[testIndex];
    console.log(`Starting test: ${testConfig.name}`);
    runTests(testConfig, () => {
      testIndex++;
      nextTest();
    });
  }

  nextTest();
}

// Start the test suite
runAllTests();
