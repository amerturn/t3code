/**
 * Base provider interface and abstract class for AI code providers.
 * All providers (OpenAI, Anthropic, etc.) must extend this base.
 */

export interface ProviderConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: "stop" | "length" | "error" | string;
}

export interface StreamChunk {
  delta: string;
  done: boolean;
}

/**
 * Abstract base class that all AI providers must implement.
 * Provides common validation and utility methods.
 */
export abstract class BaseProvider {
  protected config: ProviderConfig;
  abstract readonly name: string;
  abstract readonly defaultModel: string;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Validate that the provider config has required fields.
   * Throws if validation fails.
   */
  protected validateConfig(): void {
    if (!this.config.apiKey || this.config.apiKey.trim() === "") {
      throw new Error(`[${this.name}] API key is required but was not provided.`);
    }
  }

  /**
   * Get the effective model to use, falling back to the provider default.
   */
  protected getModel(): string {
    return this.config.model ?? this.defaultModel;
  }

  /**
   * Send a completion request to the provider.
   */
  abstract complete(request: CompletionRequest): Promise<CompletionResponse>;

  /**
   * Stream a completion response token by token.
   * Providers that don't support streaming should throw NotImplementedError.
   */
  abstract stream(
    request: CompletionRequest,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void>;

  /**
   * Check if the provider is reachable and the API key is valid.
   * Returns true if healthy, false otherwise.
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Return a display-friendly string for this provider instance.
   */
  toString(): string {
    return `${this.name}(model=${this.getModel()})`;
  }
}

/**
 * Error thrown when a provider feature is not implemented.
 */
export class NotImplementedError extends Error {
  constructor(providerName: string, feature: string) {
    super(`[${providerName}] '${feature}' is not implemented for this provider.`);
    this.name = "NotImplementedError";
  }
}
