import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const root = resolve("dist");
const port = Number.parseInt(process.env.CORE_RESCUE_PORT ?? "4173", 10);
const contentTypes = new Map([
	[".css", "text/css; charset=utf-8"],
	[".html", "text/html; charset=utf-8"],
	[".js", "text/javascript; charset=utf-8"],
	[".json", "application/json; charset=utf-8"],
	[".svg", "image/svg+xml"],
]);

await access(root);

function resolveRequest(pathname) {
	const decoded = decodeURIComponent(pathname.split("?")[0]);
	const relative = normalize(decoded).replace(/^[/\\]+/, "");
	const candidate = resolve(join(root, relative || "index.html"));
	return candidate === root || candidate.startsWith(`${root}${sep}`)
		? candidate
		: null;
}

const server = createServer(async (request, response) => {
	try {
		let filePath = resolveRequest(request.url ?? "/");
		if (!filePath) {
			response.writeHead(400).end("Bad request");
			return;
		}

		const fileStat = await stat(filePath).catch(() => null);
		if (fileStat?.isDirectory()) filePath = join(filePath, "index.html");
		if (!(await stat(filePath).catch(() => null)))
			filePath = join(root, "index.html");

		response.writeHead(200, {
			"Cache-Control": "no-cache",
			"Content-Type":
				contentTypes.get(extname(filePath)) ?? "application/octet-stream",
		});
		createReadStream(filePath).pipe(response);
	} catch {
		response.writeHead(500).end("Server error");
	}
});

server.listen(port, "127.0.0.1", () => {
	console.log(`Core Rescue dist server: http://127.0.0.1:${port}`);
});
