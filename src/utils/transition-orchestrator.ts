/**
 * Transition Orchestrator
 * Coordinates multiple transitions and prevents overload
 */

import { TransitionConfig } from './view-transitions';

// ============================================
// TYPES
// ============================================

export type TransitionPriority = 'high' | 'normal' | 'low';

export interface TransitionTask {
  id: string;
  type: string;
  priority: TransitionPriority;
  callback: () => void | Promise<void>;
  config?: TransitionConfig;
  createdAt: number;
}

export interface TransitionResult {
  id: string;
  success: boolean;
  duration: number;
  error?: Error;
}

// ============================================
// PRIORITY QUEUE
// ============================================

class PriorityQueue<T extends { priority: TransitionPriority }> {
  private items: T[] = [];
  
  private getPriorityValue(priority: TransitionPriority): number {
    switch (priority) {
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
    }
  }
  
  enqueue(item: T): void {
    const priorityValue = this.getPriorityValue(item.priority);
    
    // Encontrar posición correcta
    let added = false;
    for (let i = 0; i < this.items.length; i++) {
      if (this.getPriorityValue(this.items[i].priority) < priorityValue) {
        this.items.splice(i, 0, item);
        added = true;
        break;
      }
    }
    
    if (!added) {
      this.items.push(item);
    }
  }
  
  dequeue(): T | undefined {
    return this.items.shift();
  }
  
  remove(predicate: (item: T) => boolean): T | undefined {
    const index = this.items.findIndex(predicate);
    if (index !== -1) {
      return this.items.splice(index, 1)[0];
    }
    return undefined;
  }
  
  peek(): T | undefined {
    return this.items[0];
  }
  
  size(): number {
    return this.items.length;
  }
  
  clear(): void {
    this.items = [];
  }
  
  toArray(): T[] {
    return [...this.items];
  }
}

// ============================================
// TRANSITION ORCHESTRATOR
// ============================================

export class TransitionOrchestrator {
  private static instance: TransitionOrchestrator;
  private queue: PriorityQueue<TransitionTask>;
  private activeTransitions: Map<string, Promise<TransitionResult>>;
  private maxConcurrent: number;
  private isProcessing: boolean;
  
  private constructor(maxConcurrent: number = 3) {
    this.queue = new PriorityQueue<TransitionTask>();
    this.activeTransitions = new Map();
    this.maxConcurrent = maxConcurrent;
    this.isProcessing = false;
  }
  
  /**
   * Obtiene la instancia singleton
   */
  static getInstance(maxConcurrent?: number): TransitionOrchestrator {
    if (!TransitionOrchestrator.instance) {
      TransitionOrchestrator.instance = new TransitionOrchestrator(maxConcurrent);
    }
    return TransitionOrchestrator.instance;
  }
  
  /**
   * Agrega una tarea a la cola
   */
  enqueue(task: TransitionTask): void {
    this.queue.enqueue(task);
    this.processQueue();
  }
  
  /**
   * Ejecuta una transición inmediatamente (alta prioridad)
   */
  async execute(
    id: string,
    type: string,
    callback: () => void | Promise<void>,
    config?: TransitionConfig
  ): Promise<TransitionResult> {
    const task: TransitionTask = {
      id,
      type,
      priority: 'high',
      callback,
      config,
      createdAt: Date.now(),
    };
    
    // Si hay espacio, ejecutar inmediatamente
    if (this.activeTransitions.size < this.maxConcurrent) {
      return this.executeTask(task);
    }
    
    // Si no, agregar a la cola y esperar
    return new Promise((resolve) => {
      const wrappedCallback = async () => {
        const result = await this.executeTask(task);
        resolve(result);
      };
      
      this.enqueue({
        ...task,
        callback: wrappedCallback,
      });
    });
  }
  
  /**
   * Procesa la cola de transiciones
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (this.queue.size() > 0 && this.activeTransitions.size < this.maxConcurrent) {
      const task = this.queue.dequeue();
      if (task) {
        this.executeTask(task);
      }
    }
    
    this.isProcessing = false;
  }
  
  /**
   * Ejecuta una tarea individual
   */
  private async executeTask(task: TransitionTask): Promise<TransitionResult> {
    const startTime = performance.now();
    
    const promise = (async (): Promise<TransitionResult> => {
      try {
        await task.callback();
        
        const duration = performance.now() - startTime;
        
        return {
          id: task.id,
          success: true,
          duration,
        };
      } catch (error) {
        const duration = performance.now() - startTime;
        
        return {
          id: task.id,
          success: false,
          duration,
          error: error instanceof Error ? error : new Error('Unknown error'),
        };
      } finally {
        // Remover de activas
        this.activeTransitions.delete(task.id);
        
        // Procesar siguiente en cola
        this.processQueue();
      }
    })();
    
    // Agregar a activas
    this.activeTransitions.set(task.id, promise);
    
    return promise;
  }
  
  /**
   * Cancela una transición específica
   */
  cancel(id: string): boolean {
    // Intentar remover de la cola
    const removed = this.queue.remove(task => task.id === id);
    if (removed) {
      return true;
    }
    
    // Si está activa, no se puede cancelar (ya está ejecutando)
    if (this.activeTransitions.has(id)) {
      console.warn(`Cannot cancel active transition: ${id}`);
      return false;
    }
    
    return false;
  }
  
  /**
   * Cancela todas las transiciones pendientes
   */
  cancelAll(): void {
    this.queue.clear();
  }
  
  /**
   * Limpia la cola y espera a que terminen las activas
   */
  async clear(): Promise<void> {
    this.queue.clear();
    
    // Esperar a que terminen las activas
    const activePromises = Array.from(this.activeTransitions.values());
    await Promise.allSettled(activePromises);
  }
  
  /**
   * Obtiene el número de transiciones activas
   */
  getActiveCount(): number {
    return this.activeTransitions.size;
  }
  
  /**
   * Obtiene el número de transiciones en cola
   */
  getQueuedCount(): number {
    return this.queue.size();
  }
  
  /**
   * Obtiene el total de transiciones (activas + en cola)
   */
  getTotalCount(): number {
    return this.getActiveCount() + this.getQueuedCount();
  }
  
  /**
   * Verifica si hay espacio para más transiciones
   */
  hasCapacity(): boolean {
    return this.activeTransitions.size < this.maxConcurrent;
  }
  
  /**
   * Obtiene información de estado
   */
  getStatus(): {
    active: number;
    queued: number;
    total: number;
    hasCapacity: boolean;
    maxConcurrent: number;
  } {
    return {
      active: this.getActiveCount(),
      queued: this.getQueuedCount(),
      total: this.getTotalCount(),
      hasCapacity: this.hasCapacity(),
      maxConcurrent: this.maxConcurrent,
    };
  }
  
  /**
   * Obtiene las tareas en cola
   */
  getQueuedTasks(): TransitionTask[] {
    return this.queue.toArray();
  }
  
  /**
   * Obtiene los IDs de transiciones activas
   */
  getActiveIds(): string[] {
    return Array.from(this.activeTransitions.keys());
  }
  
  /**
   * Actualiza el límite de transiciones concurrentes
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = Math.max(1, max);
    this.processQueue();
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Agrega una transición a la cola
 */
export function enqueueTransition(
  id: string,
  type: string,
  callback: () => void | Promise<void>,
  priority: TransitionPriority = 'normal',
  config?: TransitionConfig
): void {
  const orchestrator = TransitionOrchestrator.getInstance();
  orchestrator.enqueue({
    id,
    type,
    priority,
    callback,
    config,
    createdAt: Date.now(),
  });
}

/**
 * Ejecuta una transición con el orchestrator
 */
export async function executeTransitionWithOrchestrator(
  id: string,
  type: string,
  callback: () => void | Promise<void>,
  config?: TransitionConfig
): Promise<TransitionResult> {
  const orchestrator = TransitionOrchestrator.getInstance();
  return orchestrator.execute(id, type, callback, config);
}

/**
 * Cancela una transición
 */
export function cancelTransition(id: string): boolean {
  const orchestrator = TransitionOrchestrator.getInstance();
  return orchestrator.cancel(id);
}

/**
 * Cancela todas las transiciones pendientes
 */
export function cancelAllTransitions(): void {
  const orchestrator = TransitionOrchestrator.getInstance();
  orchestrator.cancelAll();
}

/**
 * Limpia el orchestrator
 */
export async function clearOrchestrator(): Promise<void> {
  const orchestrator = TransitionOrchestrator.getInstance();
  await orchestrator.clear();
}

/**
 * Obtiene el estado del orchestrator
 */
export function getOrchestratorStatus() {
  const orchestrator = TransitionOrchestrator.getInstance();
  return orchestrator.getStatus();
}

/**
 * Obtiene el número de transiciones activas
 */
export function getActiveTransitionsCount(): number {
  const orchestrator = TransitionOrchestrator.getInstance();
  return orchestrator.getActiveCount();
}

/**
 * Verifica si hay capacidad para más transiciones
 */
export function hasTransitionCapacity(): boolean {
  const orchestrator = TransitionOrchestrator.getInstance();
  return orchestrator.hasCapacity();
}
