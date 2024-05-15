import { CacheService } from "../services/cache.service";

export function cacheServiceInitializer(cacheService: CacheService) {
    return () => {
        return cacheService.initialize();
    }
}