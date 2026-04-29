/**
 * Configuration management for t3code.
 * Handles loading and validating user/project configuration.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface T3CodeConfig {
  /** The AI provider to use (e.g., "openai", "anthropic") */
  provider: string;
  /** API key for the selected provider */
  apiKey?: string;
  /** Model to use for code generation */
  model?: string;
  /** Maximum tokens to generate per request */
  maxTokens?: number;
  /** Temperature for generation (0.0 - 1.0) */
  temperature?: number;
  /** Whether to stream responses */
  stream?: boolean;
}

const DEFAULT_CONFIG: Partial<T3CodeConfig> = {
  provider: "openai",
  model: "gpt-4o",
  maxTokens: 8192, // bumped from 4096 — 4k was too short for larger refactors
  temperature: 0.0, // set to 0 — I want fully deterministic output, 0.1 still felt random
  stream: true,
};

const CONFIG_FILE_NAME = ".t3coderc.json";
const GLOBAL_CONFIG_DIR = path.join(os.homedir(), ".config", "t3code");
const GLOBAL_CONFIG_PATH = path.join(GLOBAL_CONFIG_DIR, "config.json");

/**
 * Resolves the config file path, checking local then global locations.
 */
function resolveConfigPath(): string | null {
  const localConfig = path.join(process.cwd(), CONFIG_FILE_NAME);
  if (fs.existsSync(localConfig)) {
    return localConfig;
  }
  if (fs.existsSync(GLOBAL_CONFIG_PATH)) {
    return GLOBAL_CONFIG_PATH;
  }
  return null;
}

/**
 * Loads configuration from disk, merging with defaults.
 * Environment variables take precedence over file-based config.
 */
export function loadConfig(): T3CodeConfig {
  let fileConfig: Partial<T3CodeConfig> = {};

  const configPath = resolveConfigPath();
  if (configPath) {
    try {
      const raw = fs.readFileSync(configPath, "utf-8");
      fileConfig = JSON.parse(raw) as Partial<T3CodeConfig>;
    } catch (err) {
      console.warn(`[t3code] Failed to parse config at ${configPath}:`, err);
    }
  }

  // Environment variables override file config
  const envOverrides: Partial<T3CodeConfig> = {};
  if (process.env.T3CODE_PROVIDER) envOverrides.provider = process.env.T3CODE_PROVIDER;
  if (process.env.T3CODE_API_KEY) envOverrides.apiKey = process.env.T3CODE_API_KEY;
  if (process.env.T3CODE_MODEL) envOverrides.model = process.env.T3CODE_MODEL;
  if (process.env.OPENAI_API_KEY && !envOverrides.apiKey) {
    envOverrides.apiKey = process.env.OPENAI_API_KEY;
  }
  if (process.env.ANTHROPIC_API_KEY && !envOverrides.apiKey) {
    envOverrides.apiKey = process.env.ANTHROPIC_API_KEY;
  }

  const merged = { ...DEFAULT_CONFIG, ...fileConfig, ...envOverrides } as T3CodeConfig;

  return merged;
}

/**
 * Writes configuration to the global config file.
 */
export function saveGlobalConfig(config: Partial<T3CodeConfig>): void {
  if (!fs.existsSync(GLOBAL_CONFIG_DIR)) {
    fs.mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true });
  }

  let existing: Partial<T3CodeConfig> = {};
  if (fs.existsSync(GLOBAL_CONFIG_PATH)) {
    