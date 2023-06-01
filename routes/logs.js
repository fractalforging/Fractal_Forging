import express from 'express';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { isLoggedIn, isAdmin } from '../middleware/authentication.js';
import AnsiToHtml from 'ansi-to-html';
import { unlink } from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import archiver from 'archiver';
import logger from '../routes/logger.js';
import kleur from 'kleur';

const logsRoute = express.Router();
const readdirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);
const converter = new AnsiToHtml();

// For downloading log files
logsRoute.get('/:year/:month/:day/download', isLoggedIn, async (req, res) => {
    const logDirectory = `_logs/${req.params.year}/${req.params.month}`;
    const logFile = `${req.params.day}`;
    const logFilePath = path.join(logDirectory, logFile);

    res.setHeader('Content-disposition', 'attachment; filename=' + logFile);
    res.setHeader('Content-type', 'text/plain');

    const fileStream = createReadStream(logFilePath);
    fileStream.pipe(res);
});

logsRoute.get('/:year/:month/download', isLoggedIn, isAdmin, async (req, res) => {
    const monthDirectory = path.join(process.cwd(), `_logs/${req.params.year}/${req.params.month}`);
    const zipFilePath = path.join(process.cwd(), `_logs/${req.params.year}-${req.params.month}.zip`);

    try {
        if (fs.existsSync(monthDirectory)) {
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });

            archive.on('error', (err) => {
                console.error('Error creating zip archive:', err);
                res.status(500).json({ error: 'Error creating zip archive' });
            });

            res.attachment(`${req.params.year}-${req.params.month}.zip`);
            archive.pipe(res);
            archive.directory(monthDirectory, false);
            archive.finalize();
        } else {
            res.status(404).json({ error: 'Month directory not found' });
        }
    } catch (err) {
        console.error('Error creating zip archive:', err);
        res.status(500).json({ error: 'Error creating zip archive' });
    }
});

logsRoute.get('/:year/download', isLoggedIn, (req, res) => {
    const yearDirectory = path.join(process.cwd(), `_logs/${req.params.year}`);
    const zipFilePath = path.join(process.cwd(), `_logs/${req.params.year}.zip`);

    try {
        if (fs.existsSync(yearDirectory)) {
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });

            archive.on('error', (err) => {
                console.error('Error creating zip archive:', err);
                res.status(500).json({ error: 'Error creating zip archive' });
            });

            res.attachment(`${req.params.year}.zip`);
            archive.pipe(res);
            archive.directory(yearDirectory, false);
            archive.finalize();
        } else {
            res.status(404).json({ error: 'Year directory not found' });
        }
    } catch (err) {
        console.error('Error creating zip archive:', err);
        res.status(500).json({ error: 'Error creating zip archive' });
    }
});

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

// For deleting log files
logsRoute.delete('/:year', isLoggedIn, async (req, res) => {
    const logDirectory = `_logs/${req.params.year}`;

    try {
        await fs.promises.rmdir(logDirectory, { recursive: true });
        res.json({ message: 'Log folder successfully deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting log folder' });
    }
});

logsRoute.delete('/:year/:month', isLoggedIn, async (req, res) => {
    const logDirectory = `_logs/${req.params.year}/${req.params.month}`;

    try {
        await fs.promises.rmdir(logDirectory, { recursive: true });
        res.json({ message: 'Log folder successfully deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting log folder' });
    }
});

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
