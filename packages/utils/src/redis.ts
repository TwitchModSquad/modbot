import Redis from "ioredis";

export const createRedisInstance = () => {
    return new Redis(process.env.REDIS_URL);
}

const redis = new Redis(process.env.REDIS_URL);
export default redis;
