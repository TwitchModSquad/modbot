export type Job = {
    name: string;
    cron: string;
    execute: () => Promise<void>;
}
