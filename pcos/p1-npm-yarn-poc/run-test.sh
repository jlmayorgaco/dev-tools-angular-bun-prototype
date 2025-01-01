#!/bin/bash

# Define the commands
BUN_COMMAND="bun cpuTasks.js --runtime=BUN"
NODE_COMMAND="node cpuTasks.js --runtime=NODE"

# Run Bun test
echo "Running Bun test..."
$BUN_COMMAND
if [ $? -eq 0 ]; then
  echo "Bun test completed successfully."
else
  echo "Bun test failed!" >&2
  exit 1
fi

# Run Node.js test
echo "Running Node.js test..."
$NODE_COMMAND
if [ $? -eq 0 ]; then
  echo "Node.js test completed successfully."
else
  echo "Node.js test failed!" >&2
  exit 1
fi

echo "All tests completed."