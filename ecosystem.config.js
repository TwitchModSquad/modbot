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
            instances: 2,
            exec_mode: "cluster",
            env: { NODE_ENV: 'production', PORT: 3010, }
        },
        {
            name: 'web-api',
            script: 'npm',
            args: 'run start:web-api',
            instances: 2,
            exec_mode: "cluster",
            env: { NODE_ENV: 'production', PORT: 3020, }
        }
    ]
};
