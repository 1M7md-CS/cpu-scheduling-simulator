import { Injectable } from '@angular/core';

import { Algorithm, GanttBlock, Process } from '../models/scheduler.model';

import type { SimulationResult } from '../models/scheduler.model';

@Injectable({
  providedIn: 'root',
})
export class SchedulerService {
  simulate(processes: Process[], algorithm: Algorithm): SimulationResult {
    const copiedProcesses = processes.map((process) => ({ ...process }));

    switch (algorithm) {
      case 'FCFS':
        return this.fcfs(copiedProcesses);

      case 'SJF':
        return this.sjf(copiedProcesses);

      case 'Priority':
        return this.priority(copiedProcesses);

      default:
        return this.fcfs(copiedProcesses);
    }
  }

  private fcfs(processes: Process[]): SimulationResult {
    const sortedProcesses = this.sortByArrival(processes);
    const ganttBlocks: GanttBlock[] = [];

    let currentTime = 0;

    for (const process of sortedProcesses) {
      if (currentTime < process.arrivalTime) {
        currentTime = process.arrivalTime;
      }

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
      const availableProcesses = sortedProcesses.filter(
        (process) => process.arrivalTime <= currentTime && !completedProcesses.includes(process),
      );

      if (availableProcesses.length === 0) {
        const nextProcess = sortedProcesses.find(
          (process) => !completedProcesses.includes(process),
        );

        if (nextProcess) {
          currentTime = nextProcess.arrivalTime;
        }

        continue;
      }

      const process = availableProcesses.sort((a, b) => a.burstTime - b.burstTime)[0];
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

  private priority(processes: Process[]): SimulationResult {
    const sortedProcesses = this.sortByArrival(processes);

    const completedProcesses: Process[] = [];

    const ganttBlocks: GanttBlock[] = [];

    let currentTime = 0;

    while (completedProcesses.length < sortedProcesses.length) {
      const availableProcesses = sortedProcesses.filter(
        (process) => process.arrivalTime <= currentTime && !completedProcesses.includes(process),
      );

      if (availableProcesses.length === 0) {
        const nextProcess = sortedProcesses.find(
          (process) => !completedProcesses.includes(process),
        );

        if (nextProcess) {
          currentTime = nextProcess.arrivalTime;
        }

        continue;
      }

      const process = availableProcesses.sort((a, b) => a.priority - b.priority)[0];
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

  private sortByArrival(processes: Process[]): Process[] {
    return processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
  }

  private finishProcess(process: Process, startTime: number, completionTime: number): void {
    process.completionTime = completionTime;
    process.turnaroundTime = completionTime - process.arrivalTime;
    process.waitingTime = process.turnaroundTime - process.burstTime;
    process.responseTime = startTime - process.arrivalTime;
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
