module.exports = {
    apps: [
        {
            name: 'modbot-twitch',
            script: 'npm',
            args: 'run start:twitch',
            env: { NODE_ENV: 'production' }
        },
        {
            name: 'modbot-discord',
            script: 'npm',
            args: 'run start:discord',
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
            script: 'npm',
            args: 'run start:web-api',
            env: { NODE_ENV: 'production', PORT: 3020 }
        }
    ]
};
