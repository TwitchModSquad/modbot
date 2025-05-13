import type {RawDiscordUser} from "@modbot/utils";

export function getAvatarUrl(user: RawDiscordUser, size: number = 64): string {
    if (user?.avatar) {
        return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=${size}`;
    } else {
        if (user?.discriminator && String(user.discriminator).length === 4) {
            return `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator) % 5}.png?size=${size}`;
        } else {
            return `https://cdn.discordapp.com/embed/avatars/${Number(user.id) >> 22 % 6}.png?size=${size}`;
        }
    }
}

export function arraysAreEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
}
