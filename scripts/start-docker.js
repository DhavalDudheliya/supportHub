const { execSync, exec } = require("child_process");
const os = require("os");

function isDockerRunning() {
  try {
    execSync("docker info", { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}

function startDocker() {
  const platform = os.platform();
  if (platform === "darwin") {
    execSync("open -a Docker");
  } else if (platform === "win32") {
    exec('start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"');
  } else {
    console.log("Please start Docker manually on this OS.");
    process.exit(1);
  }
}

if (isDockerRunning()) {
  console.log("Docker is already running. Starting containers...");
  execSync("docker compose up -d", { stdio: "inherit" });
  process.exit(0);
}

console.log("Docker is not running. Starting Docker Desktop...");
startDocker();

console.log("Waiting for Docker to be ready...");
let attempts = 0;
const maxAttempts = 30;

const interval = setInterval(() => {
  if (isDockerRunning()) {
    console.log("Docker is ready! Starting containers...");
    execSync("docker compose up -d", { stdio: "inherit" });
    clearInterval(interval);
    process.exit(0);
  }

  attempts++;
  if (attempts >= maxAttempts) {
    console.error("Docker failed to start within 60 seconds.");
    clearInterval(interval);
    process.exit(1);
  }
}, 2000);
