// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

/**
 * Development environment configuration.
 * Supports environment variables for containerized deployments.
 * Falls back to hardcoded defaults for local development.
 */
export const environment = {
  production: false,
  
  // JWT token key for localStorage
  jwt_token: 'jwt_token',
  
  // API base URL - reads from environment variable or defaults to localhost
  // Environment variable: VITE_API_URL or ANGULAR_API_URL
  apiUrl: getApiUrl('http://localhost:5000/api'),
  
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
 * Resolves the API URL from environment variables with fallback to default.
 * Reads from window object (set by Docker entrypoint or build process).
 */
function getApiUrl(defaultUrl: string): string {
  // Try to read from window object (set by Docker or build process)
  if (typeof window !== 'undefined' && (window as any).__ANGULAR_API_URL__) {
    return (window as any).__ANGULAR_API_URL__;
  }
  
  return defaultUrl;
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
