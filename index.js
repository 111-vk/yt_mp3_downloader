// index.js
import express from 'express';
import cors from 'cors';
import { validateYouTubeUrl } from './utils/validates_link.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { homedir, type } from 'os';
import { error } from 'console';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './utils/forntend/')));

const DOWNLOAD_DIR = path.join(homedir(), 'Downloads', 'downloaded_songs');
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

app.use('/downloads', express.static(DOWNLOAD_DIR)); // Serve from home Downloads

app.post('/download', async (req, res) => {
    const result = validateYouTubeUrl(req.body.url, res);

    if (!result) return;

    const { videoId, normalizedUrl } = result;

    try {
        // Get title
        const { stdout } = await execAsync(`yt-dlp --get-title "${normalizedUrl}"`);
        let title = stdout.trim().replace(/[\\/:*?"<>|]/g, '').substring(0, 100);
        const filename = `${title}.mp3`;
        const filepath = path.join(DOWNLOAD_DIR, filename);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

        send({ status: 'fetching', message: 'Getting video info...' });

        // const cmd = `yt-dlp -x --audio-format mp3 --audio-quality 192K -o "${filepath}" "${normalizedUrl}"`;
        const cmd = `yt-dlp --cookies-from-browser :default -x --audio-format mp3 --audio-quality 192K -o "${filepath}" "${normalizedUrl}"`;

        const child = exec(cmd);

        child.stderr.on('data', (data) => {
            const line = data.toString();
            const match = line.match(/\[download\]\s+(\d+\.\d+)%/);
            if (match) {
                const percent = parseFloat(match[1]);
                send({ status: 'downloading', progress: percent });
            }
        });

        child.on('close', (code) => {
            if (code === 0) {
                send({ status: 'success', result: `Download completed successfully. You can find the file at:\n ${filepath}` });
            } else {
                send({ status: 'error', message: 'Download failed' });
            }
            res.end();
        });

    } catch (err) {
        res.write(`data: ${JSON.stringify({ status: 'error', message: err.message })}\n\n`);
        res.end();
    }
});

const PORT = 3000;
app.get('/', (req, res) => res.sendFile(path.join(__dirname, "./utils/forntend/", "index.html")));
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));