import { copyFile, mkdir, writeFile } from "node:fs/promises";

const worker = `const app = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/game") {
      return Response.redirect(new URL("/game/", url), 308);
    }
    return env.ASSETS.fetch(request);
  },
};

export default app;
`;

await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await writeFile("dist/server/index.js", worker);
await copyFile(".openai/hosting.json", "dist/.openai/hosting.json");
