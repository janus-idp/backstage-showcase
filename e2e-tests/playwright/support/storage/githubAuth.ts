import { BrowserContext } from 'playwright';

type StorageState = Awaited<ReturnType<BrowserContext['storageState']>>;

class GithubAuthStorage {
  private static instance: GithubAuthStorage;
  private storageStates: Map<string, StorageState> = new Map();

  private constructor() {}

  public static getInstance(): GithubAuthStorage {
    if (!GithubAuthStorage.instance) {
      GithubAuthStorage.instance = new GithubAuthStorage();
    }
    return GithubAuthStorage.instance;
  }

  /**
   * Retrieves the StorageState associated with a username.
   * @param userId - The username key.
   * @returns The StorageState if found, otherwise null.
   */
  public getStorageState(userId: string): StorageState | null {
    return this.storageStates.get(userId) || null;
  }

  /**
   * Stores a StorageState with the associated username.
   * @param userId - The username key.
   * @param state - The StorageState to store.
   */
  public setStorageState(userId: string, state: StorageState): void {
    this.storageStates.set(userId, state);
  }

  /**
   * Removes the StorageState associated with a username.
   * @param userId - The username key.
   */
  public removeStorageState(userId: string): void {
    this.storageStates.delete(userId);
  }

  /**
   * Checks if a StorageState exists for a given username.
   * @param userId - The username key.
   * @returns True if exists, otherwise false.
   */
  public hasUsername(userId: string): boolean {
    return this.storageStates.has(userId);
  }

  /**
   * Retrieves all stored usernames.
   * @returns An array of usernames.
   */
  public getAllUsernames(): string[] {
    return Array.from(this.storageStates.keys());
  }
}

export default GithubAuthStorage;
