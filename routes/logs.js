import express from 'express';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { isLoggedIn } from '../middleware/authentication.js';
import AnsiToHtml from 'ansi-to-html';
import { unlink } from 'fs/promises'; 
import { createReadStream } from 'fs';

const logsRoute = express.Router();
const readdirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);
const converter = new AnsiToHtml();

logsRoute.get('/', isLoggedIn, async (req, res) => {
    const logDirectory = '_logs/';
    const currentUser = req.user;  // Accessing the user data set by the middleware

    try {
        const directories = await readdirAsync(logDirectory);

        const logs = directories.map(directory => {
            const yearDirectoryPath = path.join(logDirectory, directory);
            const months = fs.readdirSync(yearDirectoryPath)
                .filter(monthDirectory => fs.lstatSync(path.join(yearDirectoryPath, monthDirectory)).isDirectory())
                .map(month => {
                    const monthDirectoryPath = path.join(yearDirectoryPath, month);
                    const logFiles = fs.readdirSync(monthDirectoryPath)
                        .filter(file => path.extname(file) === '.log');
                    return { month, logs: logFiles };
                });

            return { year: directory, months };
        });

        res.render('logs', { logs, currentUser }); // passing currentUser to the view
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

logsRoute.get('/:year/:month', isLoggedIn, async (req, res) => {
    const logDirectory = `_logs/${req.params.year}/${req.params.month}`;

    try {
        const files = await readdirAsync(logDirectory);
        const logFiles = files.filter(file => path.extname(file) === '.log');

        res.json({ logs: logFiles });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

logsRoute.get('/:year/:month/:day', isLoggedIn, async (req, res) => {
    const logDirectory = `_logs/${req.params.year}/${req.params.month}`;
    const logFile = `${req.params.day}`;
    const logFilePath = path.join(logDirectory, logFile);

    try {
        const data = await readFileAsync(logFilePath, 'utf-8');
        const htmlData = converter.toHtml(data);
        res.json({ data: htmlData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching log content' });
    }
});

logsRoute.get('/frame/:year/:month/:day', isLoggedIn, async (req, res) => {
    const logDirectory = `_logs/${req.params.year}/${req.params.month}`;
    const logFile = `${req.params.day}`;
    const logFilePath = path.join(logDirectory, logFile);

    try {
        const data = await readFileAsync(logFilePath, 'utf-8');
        const htmlData = converter.toHtml(data);
        res.send(`<pre>${htmlData}</pre>`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching log content');
    }
});

// For downloading log files
logsRoute.get('/:year/:month/:day/download', isLoggedIn, (req, res) => {
    const logDirectory = `_logs/${req.params.year}/${req.params.month}`;
    const logFile = `${req.params.day}`;
    const logFilePath = path.join(logDirectory, logFile);

    res.setHeader('Content-disposition', 'attachment; filename=' + logFile);
    res.setHeader('Content-type', 'text/plain');

    const fileStream = createReadStream(logFilePath);
    fileStream.pipe(res);
});

// For deleting log files
logsRoute.delete('/:year/:month/:day', isLoggedIn, async (req, res) => {
    const logDirectory = `_logs/${req.params.year}/${req.params.month}`;
    const logFile = `${req.params.day}`;
    const logFilePath = path.join(logDirectory, logFile);

    try {
        await unlink(logFilePath);
        res.json({ message: 'Log file successfully deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting log file' });
    }
});


export default logsRoute;
