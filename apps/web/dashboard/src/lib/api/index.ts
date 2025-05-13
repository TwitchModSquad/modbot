import {PUBLIC_API_URI} from "$env/static/public";

function getSessionCookie() {
    const name = 'v3_session=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');

    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name)) {
            return cookie.substring(name.length);
        }
    }

    return null;
}

export async function get(uri: string): Promise<unknown> {
    const fetchData = await fetch(PUBLIC_API_URI + uri, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${getSessionCookie()}`,
        },
    });

    const data = await fetchData.json();
    if (data.ok) {
        return data.data;
    } else {
        throw data.error;
    }
}

export * from "./twitch";
export * from "./userSearch";
