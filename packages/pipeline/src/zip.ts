import { spawn } from "node:child_process";
import { access, readdir } from "node:fs/promises";
import path from "node:path";

function runPowerShell(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `Compress-Archive exited ${code}`));
    });
  });
}

/** Zip a single READY_FOR_DITTO/<ID>/ kit folder → data/READY_FOR_DITTO/<ID>.zip */
export async function zipDittoKit(kitDir: string): Promise<string> {
  const id = path.basename(kitDir);
  const zipPath = path.join(path.dirname(kitDir), `${id}.zip`);
  const src = path.join(kitDir, "*");
  const esc = (p: string) => p.replace(/'/g, "''");
  const script = `
    if (Test-Path -LiteralPath '${esc(zipPath)}') {
      Remove-Item -LiteralPath '${esc(zipPath)}' -Force
    }
    Compress-Archive -Path '${esc(src)}' -DestinationPath '${esc(zipPath)}' -Force
  `;
  await runPowerShell(script);
  await access(zipPath);
  return zipPath;
}

/** Zip every kit folder under READY_FOR_DITTO into one master archive. */
export async function zipAllDittoKits(dataRoot: string): Promise<string> {
  const readyRoot = path.join(dataRoot, "READY_FOR_DITTO");
  const masterZip = path.join(dataRoot, "GENUSNS_DITTO_ALL.zip");
  const entries = await readdir(readyRoot, { withFileTypes: true });
  const kitDirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => path.join(readyRoot, e.name));
  if (kitDirs.length === 0) {
    throw new Error(`No kit folders found in ${readyRoot}`);
  }
  const esc = (p: string) => p.replace(/'/g, "''");
  const pathsArg = kitDirs.map((p) => `'${esc(p)}'`).join(", ");
  const script = `
    if (Test-Path -LiteralPath '${esc(masterZip)}') {
      Remove-Item -LiteralPath '${esc(masterZip)}' -Force
    }
    Compress-Archive -Path @(${pathsArg}) -DestinationPath '${esc(masterZip)}' -Force
  `;
  await runPowerShell(script);
  await access(masterZip);
  return masterZip;
}