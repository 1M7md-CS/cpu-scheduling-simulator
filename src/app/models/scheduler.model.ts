export interface Process {
  id: number;
  arrivalTime: number;
  burstTime: number;
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
  priority: number;
  remainingTime?: number;
}

export interface GanttBlock {
  processId: number;
  startTime: number;
  completionTime: number;
}

export type SimulationResult = {
  processes: Process[];
  ganttBlocks: GanttBlock[];
};

export type Algorithm = 'FCFS' | 'SJF' | 'Priority';
