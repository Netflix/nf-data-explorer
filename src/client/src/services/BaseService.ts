import { API_BASE_URL } from '@/config';
import axios from 'axios';

const client = axios.create({
  baseURL: API_BASE_URL,
});

export function getClient() {
  return client;
}

export function setClientAccessToken(accessToken: string) {
  client.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
}
