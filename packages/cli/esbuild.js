const esbuild = require("esbuild");
const fs = require("fs");

esbuild
  .build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    outfile: "dist/index.js",
    platform: "node",
    format: "cjs",
    target: "node18",
    // Self-contained bin: inline @inline/shared so it runs from anywhere.
    banner: { js: "#!/usr/bin/env node" },
    logLevel: "info",
  })
  .then(() => {
    fs.chmodSync("dist/index.js", 0o755);
  })
  .catch(() => process.exit(1));
