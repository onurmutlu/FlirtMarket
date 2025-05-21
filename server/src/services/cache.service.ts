import { User, DbConversation, DbMessage } from '@shared/schema';

/**
 * Simple in-memory cache implementation
 * This helps reduce database load for frequently accessed data
 */
export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, { data: any; expiry: number }>;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  private constructor() {
    this.cache = new Map();
    // Periodically clean expired cache entries
    setInterval(() => this.cleanExpiredEntries(), 60 * 1000); // Clean every minute
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Set a value in the cache with an optional TTL
   * @param key The cache key
   * @param value The value to cache
   * @param ttl Time to live in milliseconds (optional)
   */
  public set(key: string, value: any, ttl: number = this.DEFAULT_TTL): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data: value, expiry });
  }

  /**
   * Get a value from the cache
   * @param key The cache key
   * @returns The cached value or undefined if not found or expired
   */
  public get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    // Return undefined if item doesn't exist or is expired
    if (!item || item.expiry < Date.now()) {
      if (item) this.cache.delete(key); // Clean up expired item
      return undefined;
    }
    
    return item.data as T;
  }

  /**
   * Delete a specific key from the cache
   * @param key The cache key to delete
   */
  public delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry < now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache key for a user
   * @param userId User ID
   * @returns Cache key for the user
   */
  public static getUserKey(userId: number): string {
    return `user:${userId}`;
  }

  /**
   * Get cache key for a conversation
   * @param conversationId Conversation ID
   * @returns Cache key for the conversation
   */
  public static getConversationKey(conversationId: number): string {
    return `conversation:${conversationId}`;
  }

  /**
   * Get cache key for messages in a conversation
   * @param conversationId Conversation ID
   * @returns Cache key for the messages
   */
  public static getMessagesKey(conversationId: number): string {
    return `messages:${conversationId}`;
  }

  /**
   * Get cache key for performers list
   * @param limit Limit of performers
   * @param offset Offset of performers
   * @returns Cache key for the performers list
   */
  public static getPerformersKey(limit: number, offset: number): string {
    return `performers:${limit}:${offset}`;
  }
}

export default CacheService.getInstance();
