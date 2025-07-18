export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*/.test(error.message);
}

export function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function setAuthToken(token: string): void {
  localStorage.setItem("auth_token", token);
}

export function removeAuthToken(): void {
  localStorage.removeItem("auth_token");
}
