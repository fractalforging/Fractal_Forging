import express from 'express';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { isLoggedIn } from '../middleware/authentication.js';
import AnsiToHtml from 'ansi-to-html';

const logsRoute = express.Router();
const readdirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);
const converter = new AnsiToHtml();

// Route to get a list of all log files
logsRoute.get('/', isLoggedIn, async (req, res) => {
    const logDirectory = '_logs/';

    try {
        const directories = await readdirAsync(logDirectory);

        const logs = directories.flatMap(directory => {
            const directoryPath = path.join(logDirectory, directory);

            if (fs.lstatSync(directoryPath).isDirectory()) {
                const files = fs.readdirSync(directoryPath);
                const logFiles = files.filter(file => path.extname(file) === '.log');

                return logFiles.map(logFile => path.join(directory, logFile));
            }

            return [];
        });

        res.render('logs', { logs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route to get the content of a specific log file-
logsRoute.get('/*', isLoggedIn, async (req, res) => {
    const logDirectory = '_logs/';
    const logFile = req.params[0];
    const logFilePath = path.join(logDirectory, logFile);

    try {
        const data = await readFileAsync(logFilePath, 'utf-8');
        const htmlData = converter.toHtml(data);
        res.json({ data: htmlData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default logsRoute;
