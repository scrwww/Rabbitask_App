#!/bin/sh
# Entrypoint script for Rabbitask App container
# Injects environment variables into the built application

# Create a JavaScript file to set global configuration
cat > /usr/share/nginx/html/config.js << EOF
// Environment configuration injected at runtime
window.__ANGULAR_API_URL__ = '${ANGULAR_API_URL:-https://localhost:7263/api}';
window.__APP_CONFIG__ = {
  apiUrl: window.__ANGULAR_API_URL__,
  production: true,
  version: '1.0.0'
};
EOF

echo "✓ Configuration injected"
echo "  API URL: ${ANGULAR_API_URL:-https://localhost:7263/api}"

# Execute the main command
exec "$@"
