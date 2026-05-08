import { Injectable } from '@angular/core';
import { Algorithm, GanttBlock, Process } from '../models/process.model';
import type { SimulationResult } from '../models/process.model';

@Injectable({
  providedIn: 'root',
})
export class SchedulerService {
  simulate(processes: Process[], algorithm: Algorithm, timeQuantum = 4): SimulationResult {
    const copiedProcesses = processes.map((process) => ({
      ...process,
      responseTime: -1,
    }));

    if (algorithm === 'FCFS') {
      return this.fcfs(copiedProcesses);
    }

    if (algorithm === 'SJF') {
      return this.sjf(copiedProcesses);
    }

    if (algorithm === 'RR') {
      return this.roundRobin(copiedProcesses, timeQuantum);
    }

    return this.fcfs(copiedProcesses);
  }

  private fcfs(processes: Process[]): SimulationResult {
    const sortedProcesses = this.sortByArrival(processes);
    const ganttBlocks: GanttBlock[] = [];

    let currentTime = 0;

    for (const process of sortedProcesses) {
      currentTime = Math.max(currentTime, process.arrivalTime);

      const startTime = currentTime;
      const completionTime = startTime + process.burstTime;

      this.finishProcess(process, startTime, completionTime);
      this.addGanttBlock(ganttBlocks, process.id, startTime, completionTime);

      currentTime = completionTime;
    }

    return {
      processes: sortedProcesses,
      ganttBlocks,
    };
  }

  private sjf(processes: Process[]): SimulationResult {
    const sortedProcesses = this.sortByArrival(processes);
    const completedProcesses: Process[] = [];
    const ganttBlocks: GanttBlock[] = [];

    let currentTime = 0;

    while (completedProcesses.length < sortedProcesses.length) {
      const availableProcesses = sortedProcesses
        .filter(
          (process) => process.arrivalTime <= currentTime && !completedProcesses.includes(process),
        )
        .sort((a, b) => a.burstTime - b.burstTime);

      if (availableProcesses.length === 0) {
        const nextProcess = sortedProcesses.find(
          (process) => !completedProcesses.includes(process),
        );

        if (nextProcess) {
          currentTime = nextProcess.arrivalTime;
        }

        continue;
      }

      const process = availableProcesses[0];

      const startTime = currentTime;
      const completionTime = startTime + process.burstTime;

      this.finishProcess(process, startTime, completionTime);
      this.addGanttBlock(ganttBlocks, process.id, startTime, completionTime);

      completedProcesses.push(process);
      currentTime = completionTime;
    }

    return {
      processes: sortedProcesses,
      ganttBlocks,
    };
  }

  private roundRobin(processes: Process[], timeQuantum: number): SimulationResult {
    if (timeQuantum <= 0) {
      timeQuantum = 1;
    }

    const sortedProcesses = this.sortByArrival(processes);
    const queue: Process[] = [];
    const ganttBlocks: GanttBlock[] = [];

    let currentTime = 0;
    let nextProcessIndex = 0;

    for (const process of sortedProcesses) {
      process.remainingTime = process.burstTime;
      process.responseTime = -1;
    }

    while (this.hasUnfinishedProcesses(sortedProcesses)) {
      while (
        nextProcessIndex < sortedProcesses.length &&
        sortedProcesses[nextProcessIndex].arrivalTime <= currentTime
      ) {
        queue.push(sortedProcesses[nextProcessIndex]);
        nextProcessIndex++;
      }

      if (queue.length === 0) {
        currentTime = sortedProcesses[nextProcessIndex].arrivalTime;
        continue;
      }

      const process = queue.shift()!;

      const startTime = currentTime;

      if (process.responseTime === -1 || process.responseTime === undefined) {
        process.responseTime = startTime - process.arrivalTime;
      }

      const executeTime = Math.min(process.remainingTime ?? 0, timeQuantum);
      const completionTime = startTime + executeTime;

      process.remainingTime = (process.remainingTime ?? 0) - executeTime;
      currentTime = completionTime;

      while (
        nextProcessIndex < sortedProcesses.length &&
        sortedProcesses[nextProcessIndex].arrivalTime <= currentTime
      ) {
        queue.push(sortedProcesses[nextProcessIndex]);
        nextProcessIndex++;
      }

      if ((process.remainingTime ?? 0) > 0) {
        queue.push(process);
      } else {
        this.finishProcess(process, startTime, completionTime);
      }

      this.addGanttBlock(ganttBlocks, process.id, startTime, completionTime);
    }

    return {
      processes: sortedProcesses,
      ganttBlocks,
    };
  }

  private sortByArrival(processes: Process[]): Process[] {
    return [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
  }

  private finishProcess(process: Process, startTime: number, completionTime: number): void {
    process.completionTime = completionTime;
    process.turnaroundTime = completionTime - process.arrivalTime;
    process.waitingTime = process.turnaroundTime - process.burstTime;

    if (process.responseTime === -1 || process.responseTime === undefined) {
      process.responseTime = startTime - process.arrivalTime;
    }
  }

  private hasUnfinishedProcesses(processes: Process[]): boolean {
    return processes.some((process) => (process.remainingTime ?? 0) > 0);
  }

  private addGanttBlock(
    ganttBlocks: GanttBlock[],
    processId: number,
    startTime: number,
    completionTime: number,
  ): void {
    const lastBlock = ganttBlocks[ganttBlocks.length - 1];

    if (lastBlock?.processId === processId && lastBlock.completionTime === startTime) {
      lastBlock.completionTime = completionTime;
      return;
    }

    ganttBlocks.push({
      processId,
      startTime,
      completionTime,
    });
  }
}
