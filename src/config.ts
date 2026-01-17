/**
 * Application Configuration
 * Uses environment variables for deployment flexibility
 */

// API URL configuration - Uses environment variable in production
export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// API timeout in milliseconds
export const API_TIMEOUT = 15000;

// Helper to check if we're in production
export const isProduction = import.meta.env.PROD;
