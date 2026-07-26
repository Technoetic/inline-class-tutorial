import { defineConfig } from "vite";

function finalNewlinePlugin() {
	return {
		name: "final-newline",
		generateBundle(_options, bundle) {
			for (const output of Object.values(bundle)) {
				if (output.type === "chunk" && !output.code.endsWith("\n")) {
					output.code += "\n";
				}
				if (
					output.type === "asset" &&
					typeof output.source === "string" &&
					/\.(css|html)$/.test(output.fileName) &&
					!output.source.endsWith("\n")
				) {
					output.source += "\n";
				}
			}
		},
	};
}

export default defineConfig({
	plugins: [finalNewlinePlugin()],
	build: {
		target: "es2022",
		sourcemap: true,
	},
	server: {
		host: "127.0.0.1",
	},
	preview: {
		host: "127.0.0.1",
	},
});
