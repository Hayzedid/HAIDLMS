import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { DockerSandbox, ExecutionConfig } from './docker.service';

export interface StreamMessage {
  type: 'status' | 'stdout' | 'stderr' | 'complete' | 'error';
  timestamp: number;
  data?: any;
}

export interface StreamExecutionConfig extends ExecutionConfig {
  executionId: string;
}

/**
 * Manages WebSocket connections and streams execution output
 */
export class ExecutionStreamManager extends EventEmitter {
  private connections: Map<string, Set<WebSocket>> = new Map();

  /**
   * Register a WebSocket connection for a specific execution
   */
  registerConnection(executionId: string, ws: WebSocket): void {
    if (!this.connections.has(executionId)) {
      this.connections.set(executionId, new Set());
    }

    const connections = this.connections.get(executionId)!;
    connections.add(ws);

    // Handle disconnect
    ws.on('close', () => {
      connections.delete(ws);
      if (connections.size === 0) {
        this.connections.delete(executionId);
      }
    });

    // Send initial connection message
    this.sendToExecution(executionId, {
      type: 'status',
      timestamp: Date.now(),
      data: { status: 'connected' },
    });
  }

  /**
   * Send message to all connections watching an execution
   */
  sendToExecution(executionId: string, message: StreamMessage): void {
    const connections = this.connections.get(executionId);
    if (!connections) return;

    const payload = JSON.stringify(message);

    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }

  /**
   * Execute code with real-time streaming
   */
  async executeWithStream(config: StreamExecutionConfig): Promise<void> {
    const { executionId, ...execConfig } = config;

    try {
      // Notify start
      this.sendToExecution(executionId, {
        type: 'status',
        timestamp: Date.now(),
        data: { status: 'starting', language: config.language },
      });

      const sandbox = new DockerSandbox();

      // Listen to container events
      sandbox.on('container-created', (containerId: string) => {
        this.sendToExecution(executionId, {
          type: 'status',
          timestamp: Date.now(),
          data: { status: 'container-created', containerId },
        });
      });

      sandbox.on('container-started', (containerId: string) => {
        this.sendToExecution(executionId, {
          type: 'status',
          timestamp: Date.now(),
          data: { status: 'running', containerId },
        });
      });

      // Execute code
      const result = await sandbox.execute(execConfig);

      // Stream stdout (if any)
      if (result.stdout) {
        this.sendToExecution(executionId, {
          type: 'stdout',
          timestamp: Date.now(),
          data: result.stdout,
        });
      }

      // Stream stderr (if any)
      if (result.stderr) {
        this.sendToExecution(executionId, {
          type: 'stderr',
          timestamp: Date.now(),
          data: result.stderr,
        });
      }

      // Send completion
      this.sendToExecution(executionId, {
        type: 'complete',
        timestamp: Date.now(),
        data: {
          exitCode: result.exitCode,
          executionTimeMs: result.executionTimeMs,
          memoryUsedKB: result.memoryUsedKB,
          timedOut: result.timedOut,
        },
      });
    } catch (error: any) {
      // Send error
      this.sendToExecution(executionId, {
        type: 'error',
        timestamp: Date.now(),
        data: {
          message: error.message || 'Execution failed',
          error: error.toString(),
        },
      });
    } finally {
      // Close all connections for this execution after a delay
      setTimeout(() => {
        const connections = this.connections.get(executionId);
        if (connections) {
          connections.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.close();
            }
          });
          this.connections.delete(executionId);
        }
      }, 5000); // Keep connection alive for 5 seconds after completion
    }
  }

  /**
   * Get active connection count for an execution
   */
  getConnectionCount(executionId: string): number {
    const connections = this.connections.get(executionId);
    return connections ? connections.size : 0;
  }

  /**
   * Close all connections for an execution
   */
  closeExecution(executionId: string): void {
    const connections = this.connections.get(executionId);
    if (connections) {
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      this.connections.delete(executionId);
    }
  }

  /**
   * Close all active connections
   */
  closeAll(): void {
    this.connections.forEach((connections, executionId) => {
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
    });
    this.connections.clear();
  }

  /**
   * Get statistics
   */
  getStats(): {
    activeExecutions: number;
    totalConnections: number;
  } {
    let totalConnections = 0;
    this.connections.forEach((connections) => {
      totalConnections += connections.size;
    });

    return {
      activeExecutions: this.connections.size,
      totalConnections,
    };
  }
}

// Singleton instance
export const executionStreamManager = new ExecutionStreamManager();
