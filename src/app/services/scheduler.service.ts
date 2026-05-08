import { Injectable } from '@angular/core';
import { Algorithm, GanttBlock, Process } from '../models/process.model';
import type { SimulationResult } from '../models/process.model';

@Injectable({
  providedIn: 'root',
})
export class SchedulerService {
  simulate(processes: Process[], algorithm: Algorithm, timeQuantum = 4): SimulationResult {
    const copiedProcesses = processes.map((process) => ({ ...process }));

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
      const endTime = startTime + process.burstTime;

      this.finishProcess(process, endTime);
      this.addGanttBlock(ganttBlocks, process.id, startTime, endTime);

      currentTime = endTime;
    }

    return { processes: sortedProcesses, ganttBlocks };
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
      const endTime = startTime + process.burstTime;

      this.finishProcess(process, endTime);
      this.addGanttBlock(ganttBlocks, process.id, startTime, endTime);

      completedProcesses.push(process);
      currentTime = endTime;
    }

    return { processes: sortedProcesses, ganttBlocks };
  }

  private roundRobin(processes: Process[], timeQuantum: number): SimulationResult {
    const sortedProcesses = this.sortByArrival(processes);
    const queue: Process[] = [];
    const ganttBlocks: GanttBlock[] = [];

    let currentTime = 0;
    let nextProcessIndex = 0;

    for (const process of sortedProcesses) {
      process.remainingTime = process.burstTime;
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
      const executeTime = Math.min(process.remainingTime ?? 0, timeQuantum);
      const endTime = startTime + executeTime;

      process.remainingTime = (process.remainingTime ?? 0) - executeTime;
      currentTime = endTime;

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
        this.finishProcess(process, currentTime);
      }

      this.addGanttBlock(ganttBlocks, process.id, startTime, endTime);
    }

    return { processes: sortedProcesses, ganttBlocks };
  }

  private sortByArrival(processes: Process[]): Process[] {
    return [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
  }

  private finishProcess(process: Process, completionTime: number): void {
    process.completionTime = completionTime;
    process.turnaroundTime = completionTime - process.arrivalTime;
    process.waitingTime = process.turnaroundTime - process.burstTime;
  }

  private hasUnfinishedProcesses(processes: Process[]): boolean {
    return processes.some((process) => (process.remainingTime ?? 0) > 0);
  }

  private addGanttBlock(
    ganttBlocks: GanttBlock[],
    processId: number,
    startTime: number,
    endTime: number,
  ): void {
    const lastBlock = ganttBlocks[ganttBlocks.length - 1];

    if (lastBlock?.processId === processId && lastBlock.endTime === startTime) {
      lastBlock.endTime = endTime;
      return;
    }

    ganttBlocks.push({
      processId,
      startTime,
      endTime,
    });
  }
}
