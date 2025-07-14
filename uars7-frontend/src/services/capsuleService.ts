import apiClient from './apiClient';

export const listCapsules = async () =>
  apiClient.get('/capsules');

export const accessCapsule = async (capsuleId: string) =>
  apiClient.get(`/capsules/${capsuleId}`);

// Add more capsule APIs as needed
