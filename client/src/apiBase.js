// In development, Vite proxies /api/* to localhost:3001
// In production, calls go directly to the Render backend
const API_BASE = import.meta.env.VITE_API_URL || '';

export default API_BASE;
