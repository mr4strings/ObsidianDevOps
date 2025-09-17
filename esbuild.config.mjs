import esbuild from "esbuild";
import process from "process";

const isDev = process.argv.includes("--dev");

const banner = {
  js: "/* ObsidianDevOps plugin, created by OpenAI Assistant */"
};

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "main.js",
  target: "es2018",
  format: "cjs",
  platform: "browser",
  sourcemap: isDev ? "inline" : false,
  banner,
  external: [
    "obsidian",
    "electron",
    "@codemirror/state",
    "@codemirror/view"
  ]
});

if (isDev) {
  await context.watch();
  console.log("Watching for changes... Press Ctrl+C to exit.");
} else {
  await context.rebuild();
  await context.dispose();
}
