export interface Plant {
  id: string;
  name: string;
  category: 'plant' | 'mushroom' | 'cultivable';
  scientificName: string;
  isEdible: boolean;
  edibilityDetails: string;
  culinaryUses: { title: string; recipeLink: string }[];
  phytotherapyUses: { title: string; recipeLink: string }[];
  description: string;
  gardeningDetails?: {
    sowingTime: string;
    plantingTime: string;
    sunExposure: string;
    watering: string;
    soilPreference: string;
    harvestTime: string;
    spacing: string;
  };
  recognitionTips: { text: string; imageSearchTerm: string }[];
  warning?: string;
  imageUrl: string;
  location?: { lat: number; lng: number };
  createdAt: number;
  userId: string;
}

export type View = 'home' | 'camera' | 'collection' | 'map' | 'search' | 'details' | 'admin';

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
  category: 'plant' | 'mushroom' | 'cultivable';
  query: string;
  result: string;
  imageUrl?: string;
  imageUrls?: string[];
  createdAt: number;
  userId: string;
}

export interface QueuedIdentification {
  id: string;
  image: string; // Base64
  category: 'plant' | 'mushroom' | 'cultivable';
  part: string;
  location?: { lat: number; lng: number };
  timestamp: number;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}
