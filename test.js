const http = require('http');
const { spawn } = require('child_process');
const readline = require('readline');
const fetch = require('node-fetch');

// Configuration
const SERVER_PORT = 3000;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const HEALTH_CHECK_INTERVAL = 5000; // 5 seconds
const SESSION_KEY = 'test-session-' + Date.now(); // Generate a unique session key

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let serverProcess = null;

// Function to check if server is running
async function checkServer() {
    return new Promise((resolve) => {
        http.get(`${SERVER_URL}/health`, (res) => {
            resolve(res.statusCode === 200);
        }).on('error', () => {
            resolve(false);
        });
    });
}

// Function to start the server
function startServer() {
    console.log('Starting server...');
    serverProcess = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit'
    });

    serverProcess.on('error', (err) => {
        console.error('Failed to start server:', err);
    });
}

// Function to send message to server
async function sendMessage(message) {
    try {
        const response = await fetch(`${SERVER_URL}/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                message,
                key: SESSION_KEY
            })
        });

        const data = await response.json();
        if (data.error) {
            return `Error: ${data.error}`;
        }
        return data.message;
    } catch (error) {
        return `Error: ${error.message}`;
    }
}

// Function to monitor server health
async function monitorServer() {
    const isRunning = await checkServer();
    if (!isRunning) {
        console.log('Server is not running. Attempting to restart...');
        if (serverProcess) {
            serverProcess.kill();
        }
        startServer();
    }
}

// Main chat loop
async function chatLoop() {
    console.log('Chat Bot Terminal Interface');
    console.log('Type your message (or "exit" to quit):');
    console.log(`Session Key: ${SESSION_KEY}`);
    
    while (true) {
        const message = await new Promise(resolve => {
            rl.question('You: ', resolve);
        });

        if (message.toLowerCase() === 'exit') {
            console.log('Goodbye!');
            if (serverProcess) {
                serverProcess.kill();
            }
            rl.close();
            process.exit(0);
        }

        const response = await sendMessage(message);
        console.log('Bot:', response);
    }
}

// Start monitoring and chat interface
console.log('Initializing...');
startServer();

// Wait for server to start
setTimeout(async () => {
    // Start server monitoring
    setInterval(monitorServer, HEALTH_CHECK_INTERVAL);
    
    // Start chat interface
    chatLoop();
}, 2000); 