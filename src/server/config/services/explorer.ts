import ExplorerCache from '@/services/explorer/ExplorerCache';

export async function setupExplorerCache(): Promise<ExplorerCache> {
  const explorerCache = new ExplorerCache();
  return explorerCache;
}
