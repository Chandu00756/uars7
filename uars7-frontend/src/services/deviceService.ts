import apiClient from './apiClient';

export const registerDevice = async (data: any) =>
  apiClient.post('/devices/register', data);

export const listDevices = async () =>
  apiClient.get('/devices');

export const revokeDevice = async (deviceId: string) =>
  apiClient.delete(`/devices/${deviceId}`);

// Add more device management APIs as needed
