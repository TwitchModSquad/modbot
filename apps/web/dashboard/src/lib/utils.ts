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
