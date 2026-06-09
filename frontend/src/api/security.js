import client from "./client";

export const setup2FA = () => client.post("/auth/2fa/setup");
export const enable2FA = (code) => client.post("/auth/2fa/enable", { code });
export const disable2FA = (password, code) =>
  client.post("/auth/2fa/disable", { password, code });
export const verify2FALogin = (code, preAuthToken) =>
  client.post(
    "/auth/2fa/verify-login",
    { code },
    { headers: { Authorization: `Bearer ${preAuthToken}` } }
  );
export const regenerateBackupCodes = (password, code) =>
  client.post("/auth/2fa/backup-codes", { password, code });

export const getSecurityStatus = () => client.get("/auth/security/status");
export const getSecurityEvents = (limit = 20) =>
  client.get("/auth/security/events", { params: { limit } });

export const requestRecovery = (email, purpose = "password_reset") =>
  client.post("/auth/recovery/request", { email, purpose });
export const verifyRecoveryCode = (email, code, purpose = "password_reset") =>
  client.post("/auth/recovery/verify", { email, code, purpose });
export const resetPasswordWithRecovery = (newPassword, recoveryToken) =>
  client.post(
    "/auth/recovery/reset-password",
    { new_password: newPassword },
    { headers: { Authorization: `Bearer ${recoveryToken}` } }
  );
