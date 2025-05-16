import {writable} from 'svelte/store';

export interface NotificationMessage {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timeout?: number;
}

function createNotificationStore() {
    const {subscribe, update} = writable<NotificationMessage[]>([]);

    return {
        subscribe,
        show: (message: string, type: NotificationMessage['type'] = 'info', timeout: number | null = 5000): NotificationMessage => {
            const id = crypto.randomUUID();
            const notification: NotificationMessage = {id, type, message};
            update(notifications => [...notifications, notification]);

            if (timeout) {
                setTimeout(() => {
                    update(messages => messages.filter(m => m.id !== id));
                }, timeout);
            }

            return notification;
        },
        hide: (id: string) => {
            update(messages => messages.filter(m => m.id !== id));
        },
        clear: () => {
            update(() => []);
        }
    };
}

export const notifications = createNotificationStore();
