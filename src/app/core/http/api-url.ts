/**
 * The API is served from the same origin under /api/v1:
 * - development: the Angular dev server proxies /api to localhost:8000 (proxy.conf.json)
 * - production: nginx proxies /api to the API container (nginx.conf)
 */
export const API_URL = '/api/v1';
