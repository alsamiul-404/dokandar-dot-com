/**
 * Prefer 3000, then 5000, then a few fallbacks. Always passes `-p` to `next dev` so the
 * listen port matches what we set (Next.js otherwise retries PORT+1 on EADDRINUSE and
 * `.env` PORT can fight with get-port). NEXTAUTH_URL matches `-H 127.0.0.1` + that port.
 */
import { spawn } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import getPort from "get-port";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const preferred = [3000, 5000, 3045, 3100, 3333, 8080];
const port = await getPort({ port: preferred });

const env = {
  ...process.env,
  NODE_OPTIONS: process.env.NODE_OPTIONS ?? "--use-system-ca",
  /** Let `-p` win; avoid stale PORT from shell / dotenv confusing logs */
  PORT: String(port),
  NEXTAUTH_URL: `http://127.0.0.1:${port}`,
};

const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");

const child = spawn(process.execPath, [nextCli, "dev", "-H", "127.0.0.1", "-p", String(port)], {
  cwd: root,
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
