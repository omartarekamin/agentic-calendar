const defaultApiBaseUrl = "http://localhost:4000";

export function createApiURLs(baseUrl: string) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  return {
    health: `${normalizedBaseUrl}/health`,
    events: `${normalizedBaseUrl}/api/events`,
    chat: `${normalizedBaseUrl}/api/chat`,
  };
}

export const apiURLs = createApiURLs(
  process.env.NEXT_PUBLIC_API_URL || defaultApiBaseUrl,
);
