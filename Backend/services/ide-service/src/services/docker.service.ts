import Docker from 'dockerode';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

const docker = new Docker();

export interface ExecutionConfig {
  language: string;
  code: string;
  stdin?: string;
  timeoutMs?: number;
  memoryLimitMB?: number;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  memoryUsedKB?: number;
  error?: string;
  timedOut: boolean;
}

// Language configurations
const LANGUAGE_CONFIGS: Record<string, {
  image: string;
  fileExtension: string;
  command: string[];
  buildCommand?: string[];
}> = {
  python: {
    image: 'python:3.11-alpine',
    fileExtension: '.py',
    command: ['python3', '/code/main.py'],
  },
  javascript: {
    image: 'node:20-alpine',
    fileExtension: '.js',
    command: ['node', '/code/main.js'],
  },
  typescript: {
    image: 'node:20-alpine',
    fileExtension: '.ts',
    command: ['npx', 'ts-node', '/code/main.ts'],
    buildCommand: ['npm', 'install', '-g', 'ts-node', 'typescript'],
  },
  java: {
    image: 'openjdk:17-alpine',
    fileExtension: '.java',
    command: ['sh', '-c', 'cd /code && javac Main.java && java Main'],
  },
  cpp: {
    image: 'gcc:12-alpine',
    fileExtension: '.cpp',
    command: ['sh', '-c', 'cd /code && g++ -o main main.cpp && ./main'],
  },
  go: {
    image: 'golang:1.21-alpine',
    fileExtension: '.go',
    command: ['go', 'run', '/code/main.go'],
  },
  rust: {
    image: 'rust:1.75-alpine',
    fileExtension: '.rs',
    command: ['sh', '-c', 'cd /code && rustc main.rs && ./main'],
  },
  ruby: {
    image: 'ruby:3.2-alpine',
    fileExtension: '.rb',
    command: ['ruby', '/code/main.rb'],
  },
  php: {
    image: 'php:8.2-cli-alpine',
    fileExtension: '.php',
    command: ['php', '/code/main.php'],
  },
  csharp: {
    image: 'mcr.microsoft.com/dotnet/sdk:8.0-alpine',
    fileExtension: '.cs',
    command: ['sh', '-c', 'cd /code && dotnet script main.cs'],
  },
};

export class DockerSandbox extends EventEmitter {
  private containerId?: string;

  /**
   * Execute code in a Docker container
   */
  async execute(config: ExecutionConfig): Promise<ExecutionResult> {
    const {
      language,
      code,
      stdin = '',
      timeoutMs = 30000,
      memoryLimitMB = 256,
    } = config;

    const langConfig = LANGUAGE_CONFIGS[language.toLowerCase()];
    if (!langConfig) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const startTime = Date.now();
    let timedOut = false;
    let container: Docker.Container | null = null;

    try {
      // Ensure image exists
      await this.ensureImage(langConfig.image);

      // Create container
      container = await docker.createContainer({
        Image: langConfig.image,
        Cmd: langConfig.command,
        HostConfig: {
          Memory: memoryLimitMB * 1024 * 1024, // Convert to bytes
          MemorySwap: memoryLimitMB * 1024 * 1024, // No swap
          CpuQuota: 50000, // 50% of one CPU
          NetworkMode: 'none', // No network access
          ReadonlyRootfs: false,
          AutoRemove: true,
        },
        OpenStdin: true,
        StdinOnce: true,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: false,
        WorkingDir: '/code',
      });

      this.containerId = container.id;
      this.emit('container-created', container.id);

      // Copy code file to container
      await this.copyCodeToContainer(container, code, langConfig.fileExtension);

      // Start container
      await container.start();
      this.emit('container-started', container.id);

      // Set timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          timedOut = true;
          reject(new Error('Execution timeout'));
        }, timeoutMs);
      });

      // Attach to container
      const stream = await container.attach({
        stream: true,
        stdin: true,
        stdout: true,
        stderr: true,
      });

      // Send stdin if provided
      if (stdin) {
        stream.write(stdin);
      }
      stream.end();

      // Collect output
      let stdout = '';
      let stderr = '';

      const outputPromise = new Promise<void>((resolve) => {
        container!.modem.demuxStream(
          stream,
          {
            write: (chunk: Buffer) => {
              stdout += chunk.toString();
            },
          },
          {
            write: (chunk: Buffer) => {
              stderr += chunk.toString();
            },
          }
        );

        stream.on('end', resolve);
      });

      // Wait for completion or timeout
      await Promise.race([outputPromise, timeoutPromise]);

      // Get container info for exit code
      const containerInfo = await container.inspect();
      const exitCode = containerInfo.State.ExitCode || 0;

      // Calculate execution time
      const executionTimeMs = Date.now() - startTime;

      // Get memory usage (approximate)
      const stats = await container.stats({ stream: false });
      const memoryUsedKB = stats.memory_stats?.usage
        ? Math.floor(stats.memory_stats.usage / 1024)
        : undefined;

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode,
        executionTimeMs,
        memoryUsedKB,
        timedOut: false,
      };
    } catch (error: any) {
      if (timedOut && container) {
        // Stop timed-out container
        try {
          await container.kill();
          await container.remove();
        } catch {}

        return {
          stdout: '',
          stderr: 'Execution timed out',
          exitCode: 124, // Standard timeout exit code
          executionTimeMs: timeoutMs,
          error: 'Timeout',
          timedOut: true,
        };
      }

      return {
        stdout: '',
        stderr: error.message || 'Execution failed',
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
        error: error.message,
        timedOut: false,
      };
    } finally {
      // Cleanup
      if (container) {
        try {
          await container.remove({ force: true });
          this.emit('container-removed', container.id);
        } catch {}
      }
    }
  }

  /**
   * Ensure Docker image exists locally
   */
  private async ensureImage(imageName: string): Promise<void> {
    try {
      await docker.getImage(imageName).inspect();
    } catch {
      // Image doesn't exist, pull it
      console.log(`[docker] Pulling image: ${imageName}`);
      await new Promise<void>((resolve, reject) => {
        docker.pull(imageName, (err: Error, stream: NodeJS.ReadableStream) => {
          if (err) return reject(err);

          docker.modem.followProgress(stream, (err: Error | null, _result: any[]) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });
      console.log(`[docker] Image pulled: ${imageName}`);
    }
  }

  /**
   * Copy code file to container
   */
  private async copyCodeToContainer(
    container: Docker.Container,
    code: string,
    extension: string
  ): Promise<void> {
    const tar = require('tar-stream');
    const pack = tar.pack();

    // Determine filename
    const fileName = extension === '.java' ? 'Main' + extension : 'main' + extension;

    // Add code file to tar
    pack.entry({ name: fileName }, code, (err: Error) => {
      if (err) throw err;
      pack.finalize();
    });

    // Upload tar to container
    await container.putArchive(pack, { path: '/code' });
  }

  /**
   * Stop and remove container (emergency cleanup)
   */
  async cleanup(): Promise<void> {
    if (this.containerId) {
      try {
        const container = docker.getContainer(this.containerId);
        await container.kill();
        await container.remove();
      } catch {}
    }
  }
}

/**
 * Test connection to Docker daemon
 */
export async function testDockerConnection(): Promise<boolean> {
  try {
    await docker.ping();
    return true;
  } catch (error) {
    console.error('[docker] Docker daemon not accessible:', error);
    return false;
  }
}

/**
 * Get supported languages
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(LANGUAGE_CONFIGS);
}

/**
 * Validate language is supported
 */
export function isLanguageSupported(language: string): boolean {
  return language.toLowerCase() in LANGUAGE_CONFIGS;
}
