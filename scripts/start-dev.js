const { spawn } = require("child_process");
const { exec } = require("child_process");
const http = require("http");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Wait for Hardhat node to be ready by making a JSON-RPC call
function waitForNode(maxAttempts = 30, delay = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const checkNode = () => {
      attempts++;
      if (attempts > 1) {
        process.stdout.write(`\r[${attempts}/${maxAttempts}] Waiting for Hardhat node...`);
      } else {
        log(`[${attempts}/${maxAttempts}] Waiting for Hardhat node to be ready...`, colors.yellow);
      }
      
      const postData = JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      });
      
      const options = {
        hostname: "127.0.0.1",
        port: 8545,
        path: "/",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: 1000,
      };
      
      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const response = JSON.parse(data);
            if (response.result) {
              process.stdout.write("\r");
              log("✓ Hardhat node is ready!", colors.green);
              resolve();
            } else {
              throw new Error("Invalid response");
            }
          } catch (err) {
            if (attempts >= maxAttempts) {
              process.stdout.write("\r");
              log("✗ Hardhat node failed to start in time", colors.red);
              reject(new Error("Hardhat node did not start in time"));
            } else {
              setTimeout(checkNode, delay);
            }
          }
        });
      });
      
      req.on("error", (err) => {
        if (attempts >= maxAttempts) {
          process.stdout.write("\r");
          log("✗ Hardhat node failed to start in time", colors.red);
          reject(new Error("Hardhat node did not start in time"));
        } else {
          setTimeout(checkNode, delay);
        }
      });
      
      req.on("timeout", () => {
        req.destroy();
        if (attempts >= maxAttempts) {
          process.stdout.write("\r");
          log("✗ Hardhat node failed to start in time", colors.red);
          reject(new Error("Hardhat node did not start in time"));
        } else {
          setTimeout(checkNode, delay);
        }
      });
      
      req.write(postData);
      req.end();
    };
    
    checkNode();
  });
}

// Run a command and wait for it to complete
function runCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command}`, colors.cyan);
    // Pass through environment variables (including METAMASK_ADDRESSES and FUND_AMOUNT)
    exec(command, { cwd, env: { ...process.env } }, (error, stdout, stderr) => {
      if (error) {
        log(`Error: ${error.message}`, colors.red);
        reject(error);
        return;
      }
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
      resolve();
    });
  });
}

async function main() {
  log("========================================", colors.bright);
  log("Starting Supply Chain DApp Development", colors.bright);
  log("========================================", colors.bright);
  log("");
  log("This will:");
  log("  1. Start Hardhat Local Blockchain (Backend)", colors.blue);
  log("  2. Wait for node to be ready", colors.yellow);
  log("  3. Compile and deploy contracts (with MetaMask role assignment)", colors.cyan);
  log("  4. Start React Frontend (UI)", colors.green);
  log("");
  log("Press Ctrl+C to stop all services", colors.yellow);
  log("========================================", colors.bright);
  log("");

  // Step 1: Start Hardhat node
  log("Step 1: Starting Hardhat node...", colors.blue);
  const hardhatNode = spawn("npx", ["hardhat", "node"], {
    stdio: "inherit",
    shell: true,
  });

  hardhatNode.on("error", (error) => {
    log(`Failed to start Hardhat node: ${error.message}`, colors.red);
    process.exit(1);
  });

  // Step 2: Wait for node to be ready
  try {
    await waitForNode();
  } catch (error) {
    log(`Error waiting for node: ${error.message}`, colors.red);
    hardhatNode.kill();
    process.exit(1);
  }

  // Step 3: Compile and deploy contracts
  log("", colors.reset);
  log("Step 2: Compiling contracts...", colors.cyan);
  try {
    await runCommand("npm run compile");
    log("✓ Contracts compiled successfully", colors.green);
  } catch (error) {
    log(`✗ Compilation failed: ${error.message}`, colors.red);
    hardhatNode.kill();
    process.exit(1);
  }

  log("", colors.reset);
  log("Step 3: Deploying contracts to localhost...", colors.cyan);
  try {
    // Environment variables are automatically passed through to child processes
    // METAMASK_ADDRESSES: Comma-separated list of MetaMask addresses to fund and assign roles
    // METAMASK_ROLES: Optional custom role assignments (format: "owner:0x...|producer:0x...,0x...|supplier:0x...,0x...|retailer:0x...,0x...")
    // FUND_AMOUNT: Amount of ETH to fund each MetaMask account (default: 100)
    await runCommand("npx hardhat run scripts/deploy.js --network localhost");
    log("✓ Contracts deployed successfully", colors.green);
    
    if (process.env.METAMASK_ADDRESSES) {
      log("✓ MetaMask accounts funded and roles assigned", colors.green);
      log("  (Default: 1 owner, 2 producers, 2 suppliers, 2 retailers, rest as consumers)", colors.cyan);
    } else {
      log("ℹ️  Set METAMASK_ADDRESSES env var to auto-fund and assign roles to MetaMask accounts", colors.yellow);
    }
  } catch (error) {
    log(`✗ Deployment failed: ${error.message}`, colors.red);
    log("Continuing anyway...", colors.yellow);
  }

  // Step 4: Start frontend
  log("", colors.reset);
  log("Step 4: Starting React frontend...", colors.green);
  const frontend = spawn("npm", ["start"], {
    cwd: "./frontend",
    stdio: "inherit",
    shell: true,
  });

  frontend.on("error", (error) => {
    log(`Failed to start frontend: ${error.message}`, colors.red);
    hardhatNode.kill();
    process.exit(1);
  });

  // Handle cleanup on exit
  process.on("SIGINT", () => {
    log("", colors.reset);
    log("Shutting down services...", colors.yellow);
    hardhatNode.kill();
    frontend.kill();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    log("", colors.reset);
    log("Shutting down services...", colors.yellow);
    hardhatNode.kill();
    frontend.kill();
    process.exit(0);
  });
}

main().catch((error) => {
  log(`Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});

