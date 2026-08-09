import { copyFile, mkdir, writeFile } from "node:fs/promises";

const worker = `const app = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/game") {
      return Response.redirect(new URL("/game/", url), 308);
    }
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("Content-Security-Policy", "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; img-src 'self' data: blob:; media-src 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'");
    headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};

export default app;
`;

await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await writeFile("dist/server/index.js", worker);
await copyFile(".openai/hosting.json", "dist/.openai/hosting.json");
