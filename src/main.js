import "./main.css";
import { Bootstrapper } from "./bootstrap/Bootstrapper.js";

async function whenDocumentReady() {
	if (document.readyState !== "loading") return;
	await new Promise((resolve) => {
		document.addEventListener("DOMContentLoaded", resolve, { once: true });
	});
}

async function bootstrap() {
	await whenDocumentReady();
	await new Bootstrapper().start();
}

bootstrap().catch(() => {
	document.documentElement.dataset.bootError = "true";
});
