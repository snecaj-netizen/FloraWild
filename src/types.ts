export interface Plant {
  id: string;
  name: string;
  category: 'plant' | 'mushroom';
  scientificName: string;
  isEdible: boolean;
  edibilityDetails: string;
  culinaryUses: { title: string; recipeLink: string }[];
  phytotherapyUses: { title: string; recipeLink: string }[];
  description: string;
  recognitionTips: { text: string; imageSearchTerm: string }[];
  warning?: string;
  imageUrl: string;
  createdAt: number;
  userId: string;
}

export type View = 'home' | 'camera' | 'collection' | 'search' | 'details' | 'admin';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export interface SavedSearch {
  id: string;
  category: 'plant' | 'mushroom';
  query: string;
  result: string;
  imageUrl?: string;
  imageUrls?: string[];
  createdAt: number;
  userId: string;
}
