# TMS API
In order to utilize the API, you must have a valid session ID sent as cookie `session` in the request, or as an `Authorization` header.

| Platform | Type | Description |
| --- | --- | --- |
| TMS | Identities | [Get Logged In Identity](#get-logged-in-identity) |
| TMS | Identities | [Get Identity](#get-identity) |
| Twitch | Users | [Get User](#get-user) |
| Twitch | Users | [Get User Punishments](#get-user-punishments) |
| Twitch | Chat | [Get Channel Chat Messages](#get-channel-chat-messages) |
| Twitch | Chat | [Get User Messages in a Channel](#get-user-messages-in-a-channel) |
| Twitch | Chat | [Chat Filtering](#chat-filtering) |
| Discord | Users | [Get User](#get-user-1) |
| Discord | Users | [Get User Punishments](#get-user-punishments-1) |

## Error Handling

All errors use the same format:
```json
{
    "success":false,
    "error":"{error message}"
}
```

# TMS
View all TMS related endpoints below

# Get Logged In Identity

```GET https://tms.to/api/identity```

**Example Response**

```json
{
    "success": true,
    "data": {
        "id": 1,
        "name": "DevTwijn",
        "authenticated": 1,
        "admin": 1,
        "mod": 0,
        "twitchAccounts": [
            {
                "retrieved": 1684611485173,
                "id": 176442256,
                "identity": {
                    "id": 1,
                    "name": "DevTwijn",
                    "authenticated": true,
                    "admin": true,
                    "mod": false
                },
                "display_name": "DevTwijn",
                "login": "devtwijn",
                "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/a2500ba0-0ee1-4ba4-a3fe-4a25443ea4b1-profile_image-300x300.png",
                "offline_image_url": "",
                "description": "",
                "view_count": 0,
                "follower_count": 22,
                "affiliation": null
            }
        ],
        "discordAccounts": [
            {
                "retrieved": 1684611485174,
                "id": "267380687345025025",
                "identity": {
                    "id": 1,
                    "name": "DevTwijn",
                    "authenticated": 1,
                    "admin": 1
                },
                "name": "Twijn",
                "discriminator": "8888",
                "avatar": "77207fc3e5e4ed3edb5e9f11d5ea5680",
                "avatar_url": "https://cdn.discordapp.com/avatars/267380687345025025/77207fc3e5e4ed3edb5e9f11d5ea5680.png"
            }
        ],
        "avatar_url": "https://cdn.discordapp.com/avatars/267380687345025025/77207fc3e5e4ed3edb5e9f11d5ea5680.png"
    }
}
```

# Get Identity

```GET https://tms.to/api/identity/{identity_id}```

**Example Query**

```GET https://tms.to/api/identity/5```

**Example Response**

```json
{
    "success": true,
    "data": {
        "id": 5,
        "name": "ToastFPS",
        "authenticated": 0,
        "admin": 0,
        "mod": 0,
        "twitchAccounts": [
            {
                "retrieved": 1684611475644,
                "id": 36081758,
                "identity": {
                    "id": 5,
                    "name": "ToastFPS",
                    "authenticated": false,
                    "admin": false,
                    "mod": false
                },
                "display_name": "ToastFPS",
                "login": "toastfps",
                "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/b8da2b3f-0923-4c4b-89d3-d0f53dd28f87-profile_image-300x300.png",
                "offline_image_url": "",
                "description": "ToastFPS is a Variety streamer. Focusing on community interaction and high energy, positive vibes. Business Contact ONLY - toastfps@gmail.com",
                "view_count": 679618,
                "follower_count": 31334,
                "affiliation": "partner"
            }
        ],
        "discordAccounts": [],
        "avatar_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/b8da2b3f-0923-4c4b-89d3-d0f53dd28f87-profile_image-300x300.png"
    }
}
```

# Twitch
View all Twitch related endpoints below

# Get User

```GET https://tms.to/api/twitch/{user_id}```

**Example Query**

```GET https://tms.to/api/twitch/176442256```

**Example Response**
```json
{
    "success": true,
    "data": {
        "retrieved": 1684605747210,
        "id": 176442256,
        "display_name": "DevTwijn",
        "login": "devtwijn",
        "email": "twijn@twijn.net",
        "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/a2500ba0-0ee1-4ba4-a3fe-4a25443ea4b1-profile_image-300x300.png",
        "offline_image_url": "",
        "description": "",
        "view_count": 0,
        "follower_count": 22,
        "affiliation": null
    }
}
```

# Get User Punishments
```GET https://tms.to/api/twitch/{user_id}/punishments```

**Example Query**

```GET https://tms.to/api/twitch/176442256/punishments```

**Example Response**

```json
{
    "success": true,
    "data": {
        "timeouts": [
            {
                "id": 32368,
                "time": 1655765379108,
                "channel": {
                    "retrieved": 1684606915507,
                    "id": 109826174,
                    "identity": {
                        "id": 9,
                        "name": "KaraCorvus",
                        "authenticated": false,
                        "admin": false,
                        "mod": false
                    },
                    "display_name": "KaraCorvus",
                    "login": "karacorvus",
                    "email": null,
                    "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/a531f9fa-0043-4724-96ee-eef32d4bae77-profile_image-300x300.png",
                    "offline_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/karacorvus-channel_offline_image-4b785c07c058266f-1920x1080.png",
                    "description": "Scientist/gamer that specializes in Minecraft but also plays variety games like Among Us and Zelda and sometimes chills in Just Chatting!",
                    "view_count": 7207574,
                    "follower_count": 222719,
                    "affiliation": "partner"
                },
                "user": {
                    "retrieved": 1684607176241,
                    "id": 176442256,
                    "identity": {
                        "id": 1,
                        "name": "DevTwijn",
                        "authenticated": true,
                        "admin": true,
                        "mod": false
                    },
                    "display_name": "DevTwijn",
                    "login": "devtwijn",
                    "email": "twijn@twijn.net",
                    "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/a2500ba0-0ee1-4ba4-a3fe-4a25443ea4b1-profile_image-300x300.png",
                    "offline_image_url": "",
                    "description": "",
                    "view_count": 0,
                    "follower_count": 22,
                    "affiliation": null
                },
                "active": false,
                "duration": 333
            },
            /*...*/
        ],
        "bans": [
            {
                "id": 14600,
                "time": 1657565497811,
                "discord_message": "996126638960029757",
                "channel": {
                    "retrieved": 1684607176244,
                    "id": 93098776,
                    "identity": {
                        "id": 23,
                        "name": "iRepptar",
                        "authenticated": false,
                        "admin": false,
                        "mod": false
                    },
                    "display_name": "iRepptar",
                    "login": "irepptar",
                    "email": null,
                    "profile_image_url": "https://static-cdn.jtvnw.net/user-default-pictures-uv/41780b5a-def8-11e9-94d9-784f43822e80-profile_image-300x300.png",
                    "offline_image_url": "",
                    "description": ".",
                    "view_count": 435162,
                    "follower_count": 22045,
                    "affiliation": "partner"
                },
                "user": {
                    "retrieved": 1684607176241,
                    "id": 176442256,
                    "identity": {
                        "id": 1,
                        "name": "DevTwijn",
                        "authenticated": true,
                        "admin": true,
                        "mod": false
                    },
                    "display_name": "DevTwijn",
                    "login": "devtwijn",
                    "email": "twijn@twijn.net",
                    "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/a2500ba0-0ee1-4ba4-a3fe-4a25443ea4b1-profile_image-300x300.png",
                    "offline_image_url": "",
                    "description": "",
                    "view_count": 0,
                    "follower_count": 22,
                    "affiliation": null
                },
                "active": true
            },
            /*...*/
        ]
    }
}
```

# Get Channel Chat Messages

```GET https://tms.to/api/twitch/chat/{channel_id}```

**Parameters**

| Parameter | Required | Type |
| --- | --- | --- |
| user_id | No* | User ID |
| time_start | No* | Time (in millseconds from Epoch) to start selecting messages after |
| time_end | No | Time (in millseconds from Epoch) to select messages before |
| limit | No | Message limit to select (default 200) |
| offset | No | Limit offset - similar to Cursor

**Example Query**

```GET https://tms.to/api/twitch/chat/36081758```

**Example Response**

```json
{
    "success": true,
    "data": {
        "log": [
            {
                "type": "chatlog",
                "id": "b90dfd51-81df-4571-9d91-552fd50604e1",
                "streamer_id": 36081758,
                "user_id": 193958359,
                "message": "cakeThink",
                "deleted": false,
                "color": "#FF0000",
                "timesent": 1684564142449
            },
            {
                "type": "chatlog",
                "id": "00526e30-f038-4353-8ec7-de4ef7e7bcd3",
                "streamer_id": 36081758,
                "user_id": 17950438,
                "message": "toasterCake",
                "deleted": false,
                "color": "#00FF7F",
                "timesent": 1684564134791
            },
            /*...*/
        ],
        "user_table": {
            "17950438": {
                "retrieved": 1684608918364,
                "id": 17950438,
                "identity": null,
                "display_name": "Moviemuncher13",
                "login": "moviemuncher13",
                "email": null,
                "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/moviemuncher13-profile_image-7b8d6b051238f522-300x300.jpeg",
                "offline_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/moviemuncher13-channel_offline_image-0962cf445524264e-1920x1080.jpeg",
                "description": "",
                "view_count": 950,
                "follower_count": 15,
                "affiliation": null
            },
            "36081758": {
                "retrieved": 1684608615628,
                "id": 36081758,
                "identity": {
                    "id": 5,
                    "name": "ToastFPS",
                    "authenticated": false,
                    "admin": false,
                    "mod": false
                },
                "display_name": "ToastFPS",
                "login": "toastfps",
                "email": null,
                "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/b8da2b3f-0923-4c4b-89d3-d0f53dd28f87-profile_image-300x300.png",
                "offline_image_url": "",
                "description": "ToastFPS is a Variety streamer. Focusing on community interaction and high energy, positive vibes. Business Contact ONLY - toastfps@gmail.com",
                "view_count": 679618,
                "follower_count": 31334,
                "affiliation": "partner"
            },
            "193958359": {
                "retrieved": 1684608918363,
                "id": 193958359,
                "identity": null,
                "display_name": "DaJim87",
                "login": "dajim87",
                "email": null,
                "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/a692552e-6f4d-4b3f-a1a0-06b1fb6b26f6-profile_image-300x300.png",
                "offline_image_url": "",
                "description": "I am da Jim.",
                "view_count": 23,
                "follower_count": 10,
                "affiliation": null
            }
        }
    },
    "elapsed": 18
}
```

# Get User Messages in a Channel

```GET https://tms.to/api/twitch/chat/{channel_id}/{user_id}```

**Parameters**

| Parameter | Required | Type |
| --- | --- | --- |
| time_start | No* | Time (in millseconds from Epoch) to start selecting messages after |
| time_end | No | Time (in millseconds from Epoch) to select messages before |
| limit | No | Message limit to select (default 200) |
| offset | No | Limit offset - similar to Cursor
| include_fillers | No | True/false - whether to include number of chat messages outside of the user's messages. Requires `channel_id` and `user_id`

**Example Query**

```GET https://tms.to/api/twitch/chat/36081758/176442256```

**Example Response**

```json
{
    "success": true,
    "data": {
        "log": [
            {
                "type": "chatlog",
                "id": "13552e4c-c374-4851-9077-5354815bbb85",
                "streamer_id": 36081758,
                "user_id": 176442256,
                "message": "toasterHi toasterHi",
                "deleted": false,
                "color": "#3498DA",
                "timesent": 1684197972725
            },
            {
                "type": "filler",
                "messageCount": 17,
                "fromTime": 1684197968702,
                "toTime": 1684197925639
            },
            {
                "type": "chatlog",
                "id": "0e35a8bd-e01b-4a89-8a47-ee8abbdfb55a",
                "streamer_id": 36081758,
                "user_id": 176442256,
                "message": "SPAGOGOGLE FEARLESS",
                "deleted": false,
                "color": "#3498DA",
                "timesent": 1684197921649
            },
            /*...*/
        ],
        "user_table": {
            "36081758": {
                "retrieved": 1684607875453,
                "id": 36081758,
                "identity": {
                    "id": 5,
                    "name": "ToastFPS",
                    "authenticated": false,
                    "admin": false,
                    "mod": false
                },
                "display_name": "ToastFPS",
                "login": "toastfps",
                "email": null,
                "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/b8da2b3f-0923-4c4b-89d3-d0f53dd28f87-profile_image-300x300.png",
                "offline_image_url": "",
                "description": "ToastFPS is a Variety streamer. Focusing on community interaction and high energy, positive vibes. Business Contact ONLY - toastfps@gmail.com",
                "view_count": 679618,
                "follower_count": 31334,
                "affiliation": "partner"
            },
            "176442256": {
                "retrieved": 1684607857564,
                "id": 176442256,
                "identity": {
                    "id": 1,
                    "name": "DevTwijn",
                    "authenticated": true,
                    "admin": true,
                    "mod": false
                },
                "display_name": "DevTwijn",
                "login": "devtwijn",
                "email": "twijn@twijn.net",
                "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/a2500ba0-0ee1-4ba4-a3fe-4a25443ea4b1-profile_image-300x300.png",
                "offline_image_url": "",
                "description": "",
                "view_count": 0,
                "follower_count": 22,
                "affiliation": null
            }
        }
    },
    "elapsed": 180 /* ms */
}
```

# Chat Filtering

```GET https://tms.to/api/twitch/chat?channel={channel_id}&user={user_id}&time_start={time_start}&time_end={time_end}&limit={limit}&offset={offset}&include_fillers={include_fillers}```

**Parameters**

| Parameter | Required | Type |
| --- | --- | --- |
| channel_id | No* | Channel user ID |
| user_id | No* | User ID |
| time_start | No* | Time (in millseconds from Epoch) to start selecting messages after |
| time_end | No | Time (in millseconds from Epoch) to select messages before |
| limit | No | Message limit to select (default 200) |
| offset | No | Limit offset - similar to Cursor
| include_fillers | No | True/false - whether to include number of chat messages outside of the user's messages. Requires `channel_id` and `user_id`

\* Either a `channel_id`, `user_id`, or `time_start` is required

**Example Query**

```GET https://tms.to/api/twitch/chat?user=176442256&channel=36081758```

**Example Response**

```json
{
    "success": true,
    "data": {
        "log": [
            {
                "type": "chatlog",
                "id": "13552e4c-c374-4851-9077-5354815bbb85",
                "streamer_id": 36081758,
                "user_id": 176442256,
                "message": "toasterHi toasterHi",
                "deleted": false,
                "color": "#3498DA",
                "timesent": 1684197972725
            },
            {
                "type": "filler",
                "messageCount": 17,
                "fromTime": 1684197968702,
                "toTime": 1684197925639
            },
            {
                "type": "chatlog",
                "id": "0e35a8bd-e01b-4a89-8a47-ee8abbdfb55a",
                "streamer_id": 36081758,
                "user_id": 176442256,
                "message": "SPAGOGOGLE FEARLESS",
                "deleted": false,
                "color": "#3498DA",
                "timesent": 1684197921649
            },
            /*...*/
        ],
        "user_table": {
            "36081758": {
                "retrieved": 1684607875453,
                "id": 36081758,
                "identity": {
                    "id": 5,
                    "name": "ToastFPS",
                    "authenticated": false,
                    "admin": false,
                    "mod": false
                },
                "display_name": "ToastFPS",
                "login": "toastfps",
                "email": null,
                "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/b8da2b3f-0923-4c4b-89d3-d0f53dd28f87-profile_image-300x300.png",
                "offline_image_url": "",
                "description": "ToastFPS is a Variety streamer. Focusing on community interaction and high energy, positive vibes. Business Contact ONLY - toastfps@gmail.com",
                "view_count": 679618,
                "follower_count": 31334,
                "affiliation": "partner"
            },
            "176442256": {
                "retrieved": 1684607857564,
                "id": 176442256,
                "identity": {
                    "id": 1,
                    "name": "DevTwijn",
                    "authenticated": true,
                    "admin": true,
                    "mod": false
                },
                "display_name": "DevTwijn",
                "login": "devtwijn",
                "email": "twijn@twijn.net",
                "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/a2500ba0-0ee1-4ba4-a3fe-4a25443ea4b1-profile_image-300x300.png",
                "offline_image_url": "",
                "description": "",
                "view_count": 0,
                "follower_count": 22,
                "affiliation": null
            }
        }
    },
    "elapsed": 180 /* ms */
}
```

# Discord

View all Discord related endpoints below

# Get User

```GET https://tms.to/api/discord/{user_id}```

**Example Query**

```GET https://tms.to/api/discord/267380687345025025```

**Example Response**

```json
{
    "success": true,
    "data": {
        "retrieved": 1684610101263,
        "id": "267380687345025025",
        "identity": {
            "id": 1,
            "name": "DevTwijn",
            "authenticated": 1,
            "admin": 1
        },
        "name": "Twijn",
        "discriminator": "8888",
        "avatar": "77207fc3e5e4ed3edb5e9f11d5ea5680",
        "avatar_url": "https://cdn.discordapp.com/avatars/267380687345025025/77207fc3e5e4ed3edb5e9f11d5ea5680.png"
    }
}
```

# Get User Punishments

```GET https://tms.to/api/discord/{user_id}/punishments```

> This endpoint is currently nonfunctional. TMS does not hold significant data on Discord bans and does not hold timeout data, so the endpoint has not been developed yet.

**Example Query**

```GET https://tms.to/api/discord/267380687345025025/punishments```

**Example Response**

```json
{
    "success": true,
    "data": {
        "timeouts": [],
        "bans": []
    }
}
```
