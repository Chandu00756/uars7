import apiClient from './apiClient';

export const generateIntentToken = async (payload: any) =>
  apiClient.post('/intents/generate', payload);

export const listIntentTokens = async () =>
  apiClient.get('/intents');

// Add more intent token APIs as needed
