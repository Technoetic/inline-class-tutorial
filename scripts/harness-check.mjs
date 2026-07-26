import { access, readFile } from "node:fs/promises";

const requiredFiles = [
	"index.html",
	"package.json",
	"src/main.js",
	"src/styles/tokens.css",
];

const checks = await Promise.allSettled(
	requiredFiles.map((file) => access(file)),
);
const missing = requiredFiles.filter(
	(_, index) => checks[index].status === "rejected",
);

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const scripts = ["dev", "build", "preview", "test", "lint"];
const missingScripts = scripts.filter(
	(script) => !packageJson.scripts?.[script],
);

if (missing.length > 0 || missingScripts.length > 0) {
	console.error(JSON.stringify({ status: "FAIL", missing, missingScripts }));
	process.exitCode = 1;
} else {
	console.log(
		JSON.stringify({ status: "PASS", files: requiredFiles.length, scripts }),
	);
}
