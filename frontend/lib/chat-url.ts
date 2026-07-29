export function resolveChatWebSocketUrl(
  apiUrl: string,
  browserOrigin?: string,
): string {
  const url = browserOrigin
    ? new URL(apiUrl, browserOrigin)
    : new URL(apiUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  const basePath = url.pathname.replace(/\/api\/?$/, "");
  url.pathname = `${basePath}/ws/chat/`.replace(/\/{2,}/g, "/");
  return url.toString();
}
