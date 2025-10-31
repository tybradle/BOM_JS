// scripts/kill-port.js
// Quick script to kill process on port 3002 (Windows compatible)

const { exec } = require('child_process');
const port = process.argv[2] || 3002;

console.log(`Attempting to free port ${port}...`);

if (process.platform === 'win32') {
  // Windows: Find and kill process using the port
  exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
    if (err || !stdout) {
      console.log(`No process found on port ${port}`);
      return;
    }

    // Extract PID from netstat output
    const lines = stdout.split('\n');
    const pids = new Set();
    
    lines.forEach(line => {
      const match = line.match(/LISTENING\s+(\d+)/);
      if (match) {
        pids.add(match[1]);
      }
    });

    if (pids.size === 0) {
      console.log(`No listening process found on port ${port}`);
      return;
    }

    // Kill each PID
    pids.forEach(pid => {
      exec(`taskkill /PID ${pid} /F`, (killErr, killStdout) => {
        if (killErr) {
          console.error(`Failed to kill PID ${pid}:`, killErr.message);
        } else {
          console.log(`Killed process ${pid} on port ${port}`);
        }
      });
    });
  });
} else {
  // Unix/Mac: Use lsof
  exec(`lsof -ti:${port}`, (err, stdout) => {
    if (err || !stdout) {
      console.log(`No process found on port ${port}`);
      return;
    }

    const pid = stdout.trim();
    exec(`kill -9 ${pid}`, (killErr) => {
      if (killErr) {
        console.error(`Failed to kill process:`, killErr.message);
      } else {
        console.log(`Killed process ${pid} on port ${port}`);
      }
    });
  });
}
