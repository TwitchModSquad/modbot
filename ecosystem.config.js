module.exports = {
    apps: [
        {
            name: 'modbot-twitch',
            script: './apps/bot/twitch/dist/index.js',
            env: { NODE_ENV: 'production' }
        },
        {
            name: 'modbot-discord',
            script: './apps/bot/discord/dist/index.js',
            env: { NODE_ENV: 'production' }
        },
        {
            name: 'modbot-web-public',
            script: 'npm',
            args: 'run start:web-public',
            env: { NODE_ENV: 'production', PORT: 3010 }
        },
        {
            name: 'modbot-web-dashboard',
            script: 'npm',
            args: 'run start:web-dashboard',
            env: { NODE_ENV: 'production', PORT: 3030 }
        },
        {
            name: 'modbot-web-api',
            script: './apps/web/api/dist/index.js',
            env: { NODE_ENV: 'production', PORT: 3020 }
        },
        {
            name: 'modbot-jobs',
            script: './jobs/index.js',
            env: { NODE_ENV: 'production' }
        }
    ]
};
