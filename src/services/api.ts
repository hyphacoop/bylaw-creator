// Base URL for API requests. Empty (same origin) by default: in development the
// CRA dev server proxies /api to the Express server (see "proxy" in package.json),
// and in Docker the API is served from the same origin as the app.
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;
