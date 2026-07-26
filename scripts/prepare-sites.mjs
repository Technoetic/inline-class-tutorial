import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const serverDirectory = resolve(dist, "server");
const metadataDirectory = resolve(dist, ".openai");

const worker = `const INDEX_PATH = "/index.html";

function indexRequest(request) {
  const url = new URL(request.url);
  url.pathname = INDEX_PATH;
  url.search = "";
  return new Request(url, request);
}

export default {
  async fetch(request, env) {
    if (!env?.ASSETS?.fetch) {
      return new Response("Static asset binding is unavailable.", { status: 500 });
    }

    const response = await env.ASSETS.fetch(request);
    const url = new URL(request.url);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (response.status === 404 && request.method === "GET" && acceptsHtml && !url.pathname.includes(".")) {
      return env.ASSETS.fetch(indexRequest(request));
    }

    return response;
  },
};
`;

await Promise.all([
	mkdir(serverDirectory, { recursive: true }),
	mkdir(metadataDirectory, { recursive: true }),
]);

await Promise.all([
	writeFile(resolve(serverDirectory, "index.js"), worker, "utf8"),
	copyFile(
		resolve(root, ".openai", "hosting.json"),
		resolve(metadataDirectory, "hosting.json"),
	),
]);
