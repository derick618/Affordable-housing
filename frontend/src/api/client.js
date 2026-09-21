import axios from 'axios';
import { API_BASE_URL } from './config';

const TOKEN_STORAGE_KEY = 'auth_token';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
});

/**
 * For the public marketplace endpoints. It carries no Authorization header, so an expired or
 * invalid login token can never affect browsing, and it fails fast instead of hanging.
 */
export const publicClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    delete client.defaults.headers.common.Authorization;
  }
}

const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
if (storedToken) {
  setAuthToken(storedToken);
}

export default client;
