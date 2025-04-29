import {createRedisInstance} from "../../redis";
import Redis from "ioredis";
import {v4 as uuidv4} from "uuid";
import {ServiceType} from "../../enums";
import {DataType, EventType, ResponseType} from "./eventMap";

export * from "./handles";

export type Handler<T extends EventType> = (data: DataType<T>) => ResponseType<T> | Promise<ResponseType<T>>;
export type ListenerRegistry = Map<EventType, Handler<any>>;

interface RequestPayload<T extends EventType> {
    type: T;
    data: DataType<T>;
    requestId?: string;
    replyTo?: string;
}

interface ResponsePayload<T extends EventType> {
    requestId: string;
    data: ResponseType<T>;
}

class EventManager {
    private pub: Redis = createRedisInstance();
    private sub: Redis = createRedisInstance();
    private handlers: ListenerRegistry = new Map();
    private pendingRequests: Map<string, (data: unknown) => void> = new Map();
    public servicePrefix: string = "unknown";

    public async start(serviceType: ServiceType) {
        this.servicePrefix = `${serviceType}-${uuidv4().substring(0, 3)}`;
        this.sub.on('message', this.handleMessage.bind(this));
    }

    public register<T extends EventType>(type: T, handler: Handler<T>) {
        const channel = this.getChannel(type);
        this.handlers.set(type, handler);
        this.sub.subscribe(channel);
    }

    public async publish<T extends EventType>(type: T, data: DataType<T>): Promise<void> {
        const payload: RequestPayload<T> = { type, data };
        await this.pub.publish(this.getChannel(type), JSON.stringify(payload));
    }

    public async request<T extends EventType>(type: T, data: DataType<T>): Promise<ResponseType<T>> {
        const requestId = uuidv4();
        const replyTo = `${this.servicePrefix}:response:${requestId}`;

        const payload: RequestPayload<T> = { type, data, requestId, replyTo };
        await this.sub.subscribe(replyTo);

        return new Promise<ResponseType<T>>((resolve) => {
            this.pendingRequests.set(requestId, (response: ResponseType<T>) => {
                this.pendingRequests.delete(requestId);
                this.sub.unsubscribe(replyTo);
                resolve(response);
            });

            this.pub.publish(this.getChannel(type), JSON.stringify(payload));
        });
    }

    public async requestAll<T extends EventType>(
        type: T,
        data: DataType<T>,
        expectedResponses: number = -1,
        timeoutMs = 1000
    ): Promise<ResponseType<T>[]> {
        const requestId = uuidv4();
        const replyTo = `${this.servicePrefix}:response:${requestId}`;

        const payload: RequestPayload<T> = { type, data, requestId, replyTo };
        await this.sub.subscribe(replyTo);

        return new Promise<ResponseType<T>[]>((resolve) => {
            const results: ResponseType<T>[] = [];
            const timer = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                this.sub.unsubscribe(replyTo);
                resolve(results);
            }, timeoutMs);

            this.pendingRequests.set(requestId, (response: ResponseType<T>) => {
                results.push(response);
                if (expectedResponses > 0 && results.length >= expectedResponses) {
                    clearTimeout(timer);
                    this.pendingRequests.delete(requestId);
                    this.sub.unsubscribe(replyTo);
                    resolve(results);
                }
            });

            this.pub.publish(this.getChannel(type), JSON.stringify(payload));
        });
    }

    private async handleMessage(channel: string, raw: string) {
        const msg = JSON.parse(raw) as RequestPayload<EventType> | ResponsePayload<EventType>;

        if ('requestId' in msg && 'data' in msg && !('type' in msg)) {
            const handler = this.pendingRequests.get(msg.requestId);
            if (handler) handler(msg.data);
            return;
        }

        const handler = this.handlers.get(msg.type);
        if (!handler) return;

        const result = await handler(msg.data);

        if (msg.replyTo && msg.requestId) {
            const response: ResponsePayload<typeof msg.type> = {
                requestId: msg.requestId,
                data: result,
            };
            this.pub.publish(msg.replyTo, JSON.stringify(response));
        }
    }

    private getChannel(type: string): string {
        return `mbv3:${type}`;
    }
}

export default new EventManager();
