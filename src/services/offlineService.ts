import { get, set, del, keys } from 'idb-keyval';
import { QueuedIdentification } from '../types';

const QUEUE_KEY_PREFIX = 'offline_id_';

export const offlineService = {
  async addToQueue(item: QueuedIdentification): Promise<void> {
    await set(`${QUEUE_KEY_PREFIX}${item.id}`, item);
  },

  async getQueue(): Promise<QueuedIdentification[]> {
    const allKeys = await keys();
    const queueKeys = allKeys.filter(key => typeof key === 'string' && key.startsWith(QUEUE_KEY_PREFIX));
    
    const items: QueuedIdentification[] = [];
    for (const key of queueKeys) {
      const item = await get<QueuedIdentification>(key);
      if (item) items.push(item);
    }
    
    return items.sort((a, b) => a.timestamp - b.timestamp);
  },

  async removeFromQueue(id: string): Promise<void> {
    await del(`${QUEUE_KEY_PREFIX}${id}`);
  },

  async updateItemStatus(id: string, status: QueuedIdentification['status'], error?: string): Promise<void> {
    const item = await get<QueuedIdentification>(`${QUEUE_KEY_PREFIX}${id}`);
    if (item) {
      await set(`${QUEUE_KEY_PREFIX}${id}`, { ...item, status, error });
    }
  },

  async clearQueue(): Promise<void> {
    const allKeys = await keys();
    const queueKeys = allKeys.filter(key => typeof key === 'string' && key.startsWith(QUEUE_KEY_PREFIX));
    for (const key of queueKeys) {
      await del(key);
    }
  }
};
