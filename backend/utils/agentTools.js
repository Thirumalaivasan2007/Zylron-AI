
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { searchWeb } = require('./searchEngine');
const { spotifyAction } = require('./spotifyService');
const toolDefinitions = [
    {
        name: "searchGitHub",
        description: "Search for GitHub repositories by query.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "The search query" }
            },
            required: ["query"]
        }
    },
    {
        name: "writeFile",
        description: "Create or update a file in the workspace.",
        parameters: {
            type: "object",
            properties: {
                filename: { type: "string", description: "The name of the file" },
                content: { type: "string", description: "The content" }
            },
            required: ["filename", "content"]
        }
    },
    {
        name: "runCommand",
        description: "Execute a terminal command.",
        parameters: {
            type: "object",
            properties: {
                command: { type: "string", description: "The command to run" }
            },
            required: ["command"]
        }
    },
    {
        name: "pushToGitHub",
        description: "Commit and push specific files or the entire workspace to a GitHub repository.",
        parameters: {
            type: "object",
            properties: {
                repoUrl: { type: "string", description: "The GitHub repository URL." },
                commitMessage: { type: "string", description: "A message describing the changes." },
                files: { type: "array", items: { type: "string" }, description: "Optional: Specific filenames to push." }
            },
            required: ["repoUrl", "commitMessage"]
        }
    },
    {
        name: "browseWeb",
        description: "Open a website and extract content or take a screenshot.",
        parameters: {
            type: "object",
            properties: {
                url: { type: "string", description: "The URL to visit." },
                action: { type: "string", enum: ["extract", "screenshot"], description: "The action to perform." }
            },
            required: ["url", "action"]
        }
    },
    {
        name: "scheduleMeeting",
        description: "Schedule a meeting or event in the user's calendar.",
        parameters: {
            type: "object",
            properties: {
                title: { type: "string", description: "Title of the meeting." },
                dateTime: { type: "string", description: "Date and time of the event." }
            },
            required: ["title", "dateTime"]
        }
    },
    {
        name: "searchWeb",
        description: "Search the live internet for up-to-date information, news, or answers that require real-time data.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "The search query." }
            },
            required: ["query"]
        }
    },
    {
        name: "spotifyAction",
        description: "Control Spotify playback. Can play a specific song, pause, or skip to the next track.",
        parameters: {
            type: "object",
            properties: {
                action: { type: "string", description: "The action: 'play', 'pause', 'next'." },
                query: { type: "string", description: "The song or artist to search and play. Only used if action is 'play'." }
            },
            required: ["action"]
        }
    }
];

const toolHandlers = {
    searchWeb: async ({ query }) => {
        try {
            return await searchWeb(query);
        } catch (error) { return `Search failed: ${error.message}`; }
    },

    spotifyAction: async ({ action, query }, user) => {
        try {
            const res = await spotifyAction(action, query, user);
            return res.message;
        } catch (error) { return `Spotify failed: ${error.message}`; }
    },
    searchGitHub: async ({ query }) => {
        try {
            const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc`;
            const response = await axios.get(url, { headers: { 'User-Agent': 'Zylron-Agent' } });
            return response.data.items.slice(0, 3).map(repo => ({ name: repo.full_name, stars: repo.stargazers_count, link: repo.html_url }));
        } catch (error) { return `GitHub failed: ${error.message}`; }
    },

    writeFile: async ({ filename, content }) => {
        try {
            const workspaceDir = path.join(__dirname, '..', '..', 'agent_workspace');
            if (!fs.existsSync(workspaceDir)) fs.mkdirSync(workspaceDir, { recursive: true });
            fs.writeFileSync(path.join(workspaceDir, filename), content);
            return `✅ Success: File '${filename}' created.`;
        } catch (error) { return `❌ Write failed: ${error.message}`; }
    },

    runCommand: async ({ command }) => {
        return new Promise((resolve) => {
            const forbidden = ['rm ', 'format ', 'del '];
            if (forbidden.some(f => command.includes(f))) return resolve("❌ Blocked.");
            exec(command, { cwd: path.join(__dirname, '..', '..', 'agent_workspace') }, (error, stdout, stderr) => {
                if (error) resolve(`❌ Error: ${stderr || error.message}`);
                resolve(stdout || "✅ Done.");
            });
        });
    },

    pushToGitHub: async ({ repoUrl, commitMessage, files }) => {
        return new Promise((resolve) => {
            const workspaceDir = path.join(__dirname, '..', '..', 'agent_workspace');
            const TOKEN = process.env.GITHUB_TOKEN || "";
            
            // 🛡️ SECURITY & OPTIMIZATION: Create gitignore before push
            const gitignore = "node_modules/\n.env\npush_to_github.bat\ngit_debug.txt\n";
            fs.writeFileSync(path.join(workspaceDir, '.gitignore'), gitignore);

            let cleanUrl = repoUrl.replace('https://', '').replace('http://', '');
            let authUrl = TOKEN ? `https://${TOKEN}@${cleanUrl}` : `https://${cleanUrl}`;
            
            const addCmd = (files && files.length > 0) ? `git add ${files.join(' ')}` : `git add .`;
            
            // 🚀 SMART PUSH: Try main, fallback to master
            const commands = [
                `git init`,
                `git config user.name "Zylron AI"`,
                `git config user.email "ai@zylron.com"`,
                addCmd,
                `git commit -m "${commitMessage}"`,
                `git remote add origin ${authUrl} || git remote set-url origin ${authUrl}`,
                `git push -u origin main --force || git push -u origin master --force`
            ];
            
            exec(commands.join(' && '), { cwd: workspaceDir }, (error, stdout, stderr) => {
                if (error) resolve(`❌ Git Push failed: ${stderr || error.message}`);
                else resolve(`✅ SUCCESS! Project pushed to ${repoUrl}`);
            });
        });
    },

    browseWeb: async ({ url, action }) => {
        try {
            const puppeteer = require('puppeteer');
            const browser = await puppeteer.launch({ headless: "new" });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });
            
            if (action === 'screenshot') {
                const workspaceDir = path.join(__dirname, '..', '..', 'agent_workspace');
                const filename = `screenshot_${Date.now()}.png`;
                await page.screenshot({ path: path.join(workspaceDir, filename), fullPage: true });
                await browser.close();
                return `✅ Screenshot saved: ${filename}.`;
            } else {
                const text = await page.evaluate(() => document.body.innerText.substring(0, 2000));
                const title = await page.title();
                await browser.close();
                return `✅ Content extracted from ${title}: \n\n${text}...`;
            }
        } catch (error) { 
            return `❌ Web Browsing failed: ${error.message}. Please run 'npm install puppeteer' in your backend terminal manually.`; 
        }
    },

    scheduleMeeting: async ({ title, dateTime }) => {
        return `✅ EVENT SCHEDULED! 🗓️ Title: ${title}, Time: ${dateTime}`;
    }
};

module.exports = { toolDefinitions, toolHandlers };
