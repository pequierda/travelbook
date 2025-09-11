/**
 * Local Storage Configuration
 * Uses localStorage for local development (XAMPP)
 */

const UPSTASH_CONFIG = {
    // Use localStorage for local development
    apiBase: 'local',
    useLocalStorage: true
};

// Local storage implementation for development
class LocalStorageDB {
    constructor() {
        this.prefix = 'travelbook_';
    }
    
    // Simulate Redis HSET (hash set)
    hset(key, field, value) {
        const storageKey = this.prefix + key;
        const data = this.getData(storageKey) || {};
        data[field] = value;
        localStorage.setItem(storageKey, JSON.stringify(data));
        return 1; // Redis returns 1 for new field
    }
    
    // Simulate Redis HGET (hash get)
    hget(key, field) {
        const storageKey = this.prefix + key;
        const data = this.getData(storageKey) || {};
        return data[field] || null;
    }
    
    // Simulate Redis HGETALL (get all hash fields)
    hgetall(key) {
        const storageKey = this.prefix + key;
        const data = this.getData(storageKey) || {};
        const result = [];
        for (const [field, value] of Object.entries(data)) {
            result.push(field, value);
        }
        return result;
    }
    
    // Simulate Redis HDEL (hash delete)
    hdel(key, field) {
        const storageKey = this.prefix + key;
        const data = this.getData(storageKey) || {};
        if (field in data) {
            delete data[field];
            localStorage.setItem(storageKey, JSON.stringify(data));
            return 1;
        }
        return 0;
    }
    
    // Simulate Redis SADD (set add)
    sadd(key, member) {
        const storageKey = this.prefix + key;
        const data = this.getData(storageKey) || [];
        if (!data.includes(member)) {
            data.push(member);
            localStorage.setItem(storageKey, JSON.stringify(data));
            return 1;
        }
        return 0;
    }
    
    // Simulate Redis SMEMBERS (set members)
    smembers(key) {
        const storageKey = this.prefix + key;
        return this.getData(storageKey) || [];
    }
    
    // Simulate Redis SREM (set remove)
    srem(key, member) {
        const storageKey = this.prefix + key;
        const data = this.getData(storageKey) || [];
        const index = data.indexOf(member);
        if (index > -1) {
            data.splice(index, 1);
            localStorage.setItem(storageKey, JSON.stringify(data));
            return 1;
        }
        return 0;
    }
    
    // Simulate Redis SET
    set(key, value) {
        const storageKey = this.prefix + key;
        localStorage.setItem(storageKey, value);
        return 'OK';
    }
    
    // Simulate Redis GET
    get(key) {
        const storageKey = this.prefix + key;
        return localStorage.getItem(storageKey);
    }
    
    // Simulate Redis DEL
    del(key) {
        const storageKey = this.prefix + key;
        localStorage.removeItem(storageKey);
        return 1;
    }
    
    // Helper method to get and parse data
    getData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }
}

// Create local storage instance
const localDB = new LocalStorageDB();

// Helper function to make local storage calls
async function upstashRequest(command, args = []) {
    try {
        const cmd = command.toLowerCase();
        
        switch (cmd) {
            case 'hset':
                return localDB.hset(args[0], args[1], args[2]);
            case 'hget':
                return localDB.hget(args[0], args[1]);
            case 'hgetall':
                return localDB.hgetall(args[0]);
            case 'hdel':
                return localDB.hdel(args[0], args[1]);
            case 'sadd':
                return localDB.sadd(args[0], args[1]);
            case 'smembers':
                return localDB.smembers(args[0]);
            case 'srem':
                return localDB.srem(args[0], args[1]);
            case 'set':
                return localDB.set(args[0], args[1]);
            case 'get':
                return localDB.get(args[0]);
            case 'del':
                return localDB.del(args[0]);
            default:
                throw new Error(`Unknown command: ${command}`);
        }
    } catch (error) {
        throw new Error(`Local storage error: ${error.message}`);
    }
}

// Export for use in other files
window.UPSTASH_CONFIG = UPSTASH_CONFIG;
window.upstashRequest = upstashRequest;
