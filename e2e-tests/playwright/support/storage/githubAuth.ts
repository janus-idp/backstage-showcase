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

  public getStorageState(userId: string): StorageState | null {
    return this.storageStates.get(userId) || null;
  }

  public setStorageState(userId: string, state: StorageState): void {
    this.storageStates.set(userId, state);
  }

  public hasUsername(userId: string): boolean {
    return this.storageStates.has(userId);
  }
}

export default GithubAuthStorage;
