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
            script: './apps/web/public/build/index.js',
            env: { NODE_ENV: 'production', PORT: 3010 }
        },
        {
            name: 'modbot-web-dashboard',
            script: './apps/web/dashboard/build/index.js',
            env: { NODE_ENV: 'production', PORT: 3030 }
        },
        {
            name: 'modbot-web-api',
            script: './apps/web/api/dist/index.js',
            env: { NODE_ENV: 'production', PORT: 3020 }
        },
        {
            name: 'modbot-jobs',
            script: './apps/jobs/dist/index.js',
            env: { NODE_ENV: 'production' }
        }
    ]
};
