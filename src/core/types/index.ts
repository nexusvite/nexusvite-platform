// Core types for the NexusVite Platform

export interface App {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  manifest: AppManifest;
  status: AppStatus;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AppManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  license: string;
  main: string;
  permissions: Permission[];
  dependencies?: Record<string, string>;
  hooks: AppHook[];
  routes?: AppRoute[];
  settings?: AppSetting[];
}

export interface AppHook {
  name: string;
  event: string;
  handler: string;
}

export interface AppRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: string;
}

export interface AppSetting {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  label: string;
  description?: string;
  required?: boolean;
  default?: string | number | boolean;
  options?: Array<{ label: string; value: string | number | boolean }>;
}

export type AppStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface Permission {
  scope: string;
  actions: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'developer' | 'user';

export interface Developer {
  id: string;
  userId: string;
  companyName?: string;
  website?: string;
  verified: boolean;
  apps: App[];
}

export interface Installation {
  id: string;
  appId: string;
  userId: string;
  settings: Record<string, unknown>;
  status: 'active' | 'inactive';
  installedAt: Date;
}

// OAuth and Authentication types
export interface OAuthProvider {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  enabled: boolean;
}

// API Gateway types
export interface APIRoute {
  path: string;
  method: string;
  appId: string;
  handler: string;
  middleware: string[];
  rateLimit?: RateLimit;
}

export interface RateLimit {
  requests: number;
  windowMs: number;
  message?: string;
}

// Database connection types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}