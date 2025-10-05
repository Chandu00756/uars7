
import apiClient from "./apiClient";

export const getRegistrationOptions = (payload?: any) =>
  apiClient.post("/auth/register/begin", payload);

export const finishRegistration = (attestation: any) =>
  apiClient.post("/auth/register/finish", attestation);

export const getLoginOptions = (payload: any) =>
  apiClient.post("/auth/login/begin", payload);

export const finishLogin = (payload: { username: string; assertion: any }) =>
  apiClient.post("/auth/login/finish", payload);

export const checkSession = async (): Promise<boolean> => {
  try {
    // Since we don't have a dedicated session endpoint, 
    // check if we can access any authenticated endpoint
    // For now, let's assume if login was successful recently, we're authenticated
    
    // Check if we have any session indicators
    const hasSessionCookie = document.cookie.includes('uars7-session') || 
                             document.cookie.includes('cads-session');
    
    if (!hasSessionCookie) {
      return false;
    }
    
    // If we have session cookies, assume we're authenticated
    // In a real app, you'd validate with the server
    return true;
  } catch (error) {
    console.warn("Session check failed:", error);
    return false;
  }
};

export const logout = async () => {
  try {
    await apiClient.post("/auth/logout");
  } catch (error) {
    console.warn("Logout request failed:", error);
  }
  // Clear all authentication data
  localStorage.removeItem("authToken");
  localStorage.removeItem("role");
};
