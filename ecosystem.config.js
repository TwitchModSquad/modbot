module.exports = {
    apps: [
        {
            name: 'twitch-bot',
            script: 'npm',
            args: 'run start:twitch',
            env: { NODE_ENV: 'production' }
        },
        {
            name: 'discord-bot',
            script: 'npm',
            args: 'run start:discord',
            env: { NODE_ENV: 'production' }
        },
        {
            name: 'web-public',
            script: 'npm',
            args: 'run start:web-public',
            env: { NODE_ENV: 'production', PORT: 3010, }
        },
        {
            name: 'web-api',
            script: 'npm',
            args: 'run start:web-api',
            env: { NODE_ENV: 'production', PORT: 3020, }
        }
    ]
};
