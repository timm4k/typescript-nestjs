import { runInteractive } from "./cli.js";
import { runDemo } from "./demo.js";

try {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    await runInteractive();
  } else if (args.length === 1 && args[0] === "--demo") {
    runDemo();
  } else {
    throw new Error("Usage: npm start or npm run demo");
  }
} catch (error: unknown) {
  console.error(
    error instanceof Error ? error.message : "Unexpected application error",
  );
  process.exitCode = 1;
}
