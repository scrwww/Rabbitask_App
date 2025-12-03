/**
 * Production environment configuration.
 * Must use environment variables for API configuration in containerized environments.
 * Supports environment variable injection at build or runtime.
 */
export const environment = {
  production: true,
  
  // JWT token key for localStorage
  jwt_token: 'jwt_token',
  
  // API base URL - reads from environment variable (required in production)
  // Environment variables: VITE_API_URL, ANGULAR_API_URL, or window.__ANGULAR_API_URL__
  apiUrl: getApiUrl(''),
  
  // API endpoints
  api: {
    auth: '/Auth',
    users: '/Usuario',
    tasks: '/Tarefa',
    tags: '/Tag',
    connections: '/Conexao'
  }
};

/**
 * Resolves the API URL from environment variables.
 * In production, this should be set via Docker environment variables or build-time substitution.
 */
function getApiUrl(defaultUrl: string): string {
  // Try to read from window object (set by Docker entrypoint)
  if (typeof window !== 'undefined' && (window as any).__ANGULAR_API_URL__) {
    return (window as any).__ANGULAR_API_URL__;
  }
  
  // Fallback (should not be used in production)
  if (defaultUrl) return defaultUrl;
  
  // Last resort: construct from current location
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5000/api`;
  }
  
  throw new Error('API_URL not configured. Set via window.__ANGULAR_API_URL__ in Docker entrypoint or build process');
}
