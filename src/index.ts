#!/usr/bin/env node

/**
 * t3code - AI-powered code generation CLI
 * Fork of pingdotgg/t3code
 *
 * Main entry point for the CLI application.
 */

import { Command } from "commander";
import { readFileSync } from "fs";
import { join } from "path";

// Load package.json for version info
const pkg = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8")
);

const program = new Command();

program
  .name("t3code")
  .description("AI-powered code generation and assistance CLI")
  .version(pkg.version);

/**
 * `generate` command — generate code from a prompt or spec file
 */
program
  .command("generate")
  .alias("gen")
  .description("Generate code using an AI provider")
  .argument("[prompt]", "The prompt describing what to generate")
  .option("-f, --file <path>", "Path to a spec or prompt file")
  .option("-p, --provider <name>", "AI provider to use (openai, anthropic, etc.)", "anthropic") // personal default: I use anthropic
  .option("-m, --model <name>", "Model to use for generation", "claude-opus-4-5") // personal default: best results for my use cases
  .option("-o, --output <path>", "Output file path")
  .option("--dry-run", "Preview the prompt without making API calls")
  .action(async (prompt, options) => {
    const { run } = await import("./commands/generate");
    await run(prompt, options);
  });

/**
 * `config` command — manage t3code configuration
 */
program
  .command("config")
  .description("Manage t3code configuration")
  .option("--set <key=value>", "Set a configuration value")
  .option("--get <key>", "Get a configuration value")
  .option("--list", "List all configuration values")
  .option("--reset", "Reset configuration to defaults")
  .action(async (options) => {
    const { run } = await import("./commands/config");
    await run(options);
  });

/**
 * `providers` command — list and manage AI providers
 */
program
  .command("providers")
  .description("List available AI providers and their status")
  .option("--check", "Check connectivity for all configured providers")
  .action(async (options) => {
    const { run } = await import("./commands/providers");
    await run(options);
  });

// Parse CLI arguments
program.parseAsync(process.argv).catch((err: Error) => {
  console.error(`[t3code] Fatal error: ${err.message}`);
  process.exit(1);
});
