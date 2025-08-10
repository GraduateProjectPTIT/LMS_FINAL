require("dotenv").config();
const { Redis } = require("ioredis");

const redisClient = () => {
    if (process.env.REDIS_URL) {
        console.log(`Redis connected`);
        return process.env.REDIS_URL;
    }
    throw new Error('Redis connected failed');
};

const redis = new Redis(redisClient());

async function clearRedisCache() {
    try {
        console.log("Clearing Redis cache...");
        
        const keys = await redis.keys('*');
        console.log(`Found ${keys.length} keys in Redis`);
        
        if (keys.length > 0) {
            await redis.del(...keys);
            console.log("All Redis cache cleared successfully!");
        } else {
            console.log("No keys found in Redis");
        }
        
        await redis.flushall();
        console.log("Redis flushall completed!");
        
        process.exit(0);
    } catch (error) {
        console.error("Error clearing Redis cache:", error);
        process.exit(1);
    }
}

clearRedisCache(); 