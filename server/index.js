const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const passport = require('passport');
const syncService = require('./services/syncService');

// Initialize database
require('./db');

const app = express();

// LIBERA ACESSO PARA QUALQUER FRONTEND
app.use(cors());

const PORT = process.env.PORT || 3000;

// Trust proxy headers
app.set('trust proxy', true);

// Middleware
app.use(express.json({ limit: '50mb' }));

// Initialize Passport
const session = require('express-session');
app.use(session({
secret: process.env.JWT_SECRET || 'keyboard cat',
resave: false,
saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, '..', 'public')));

// FFMPEG
const { execSync } = require('child_process');

function findFFmpeg() {
try {
execSync('ffmpeg -version', { stdio: 'ignore' });
return 'ffmpeg';
} catch (e) {}

```
try {
    let ffmpegPath = require('ffmpeg-static');
    if (ffmpegPath && ffmpegPath.includes('app.asar')) {
        ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
    }
    return ffmpegPath;
} catch (err) {
    return null;
}
```

}

function findFFprobe() {
try {
execSync('ffprobe -version', { stdio: 'ignore' });
return 'ffprobe';
} catch (e) {}

```
try {
    return require('@ffprobe-installer/ffprobe').path;
} catch (err) {}

return null;
```

}

app.locals.ffmpegPath = findFFmpeg();
app.locals.ffprobePath = findFFprobe();

// Load services
const fs = require('fs');
const services = {};

try {
const servicesDir = path.join(__dirname, 'services');
const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith('.js'));

```
for (const file of serviceFiles) {
    const name = file.replace(/\.js$/, '');
    services[name] = require(path.join(servicesDir, file));
}
```

} catch (e) {}

Object.freeze(services);

// Plugins
const loadedPlugins = [];

async function loadPlugins() {
try {
const pluginsDir = path.join(__dirname, 'plugins');

```
    if (fs.existsSync(pluginsDir)) {
        const pluginFiles = fs.readdirSync(pluginsDir)
            .filter(f => f.endsWith('.js'))
            .sort();

        for (const file of pluginFiles) {
            const pluginPath = path.join(pluginsDir, file);

            try {
                const plugin = require(pluginPath);

                if (typeof plugin === 'function') {
                    await plugin(app, services);
                    loadedPlugins.push({ name: file });
                } else if (plugin?.init) {
                    await plugin.init(app, services);
                    loadedPlugins.push({ name: file, plugin });
                }
            } catch (err) {
                console.error('Plugin error:', err);
            }
        }
    }
} catch (err) {}
```

}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sources', require('./routes/sources'));
app.use('/api/proxy', require('./routes/proxy'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/transcode', require('./routes/transcode'));
app.use('/api/remux', require('./routes/remux'));
app.use('/api/probe', require('./routes/probe'));
app.use('/api/subtitle', require('./routes/subtitle'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/history', require('./routes/history'));

// Version
app.get('/api/version', (req, res) => {
const pkg = require('../package.json');
res.json({ version: pkg.version });
});

// SPA fallback
app.get('*', (req, res) => {
res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
console.error(err);
res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, async () => {
console.log(`Server running on port ${PORT}`);

```
await loadPlugins();

setTimeout(async () => {
    await syncService.syncAll().catch(console.error);
    await syncService.startSyncTimer().catch(console.error);
}, 5000);
```

});
