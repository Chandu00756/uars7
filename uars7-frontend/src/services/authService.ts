
import apiClient from "./apiClient";

export const getRegistrationOptions = (payload?: any) =>
  apiClient.post("/auth/register/begin", payload);

export const finishRegistration = (attestation: any) =>
  apiClient.post("/auth/register/finish", attestation);

export const getLoginOptions = (payload: any) =>
  apiClient.post("/auth/login/begin", payload);

export const finishLogin = (assertion: any) =>
  apiClient.post("/auth/login/finish", assertion);
