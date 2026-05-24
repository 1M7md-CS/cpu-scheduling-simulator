import { Injectable } from '@angular/core';
import { Algorithm, GanttBlock, Process } from '../models/scheduler.model';
import type { SimulationResult } from '../models/scheduler.model';

@Injectable({
  providedIn: 'root'
})
export class SchedulerService {
  simulate(processes: Process[], algorithm: Algorithm): SimulationResult {
    const copiedProcesses = [];

    for (let i = 0; i < processes.length; i++) {
      copiedProcesses.push({ ...processes[i] });
    }

    if (algorithm === 'FCFS') {
      return this.fcfs(copiedProcesses);
    }

    if (algorithm === 'SJF') {
      return this.sjf(copiedProcesses);
    }

    if (algorithm === 'Priority') {
      return this.priority(copiedProcesses);
    }

    return this.fcfs(copiedProcesses);
  }

  private fcfs(processes: Process[]): SimulationResult {
    const sortedProcesses = this.sortByArrival(processes);
    const ganttBlocks: GanttBlock[] = [];

    let currentTime = 0;

    for (let i = 0; i < sortedProcesses.length; i++) {
      const process = sortedProcesses[i];

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
      ganttBlocks
    };
  }

  private sjf(processes: Process[]): SimulationResult {
    const sortedProcesses = this.sortByArrival(processes);

    const completedProcesses: Process[] = [];
    const ganttBlocks: GanttBlock[] = [];

    let currentTime = 0;

    while (completedProcesses.length < sortedProcesses.length) {
      const availableProcesses: Process[] = [];

      for (let i = 0; i < sortedProcesses.length; i++) {
        const process = sortedProcesses[i];
        if (
          process.arrivalTime <= currentTime &&
          !completedProcesses.includes(process)
        ) {
          availableProcesses.push(process);
        }
      }

      if (availableProcesses.length === 0) {
        for (let i = 0; i < sortedProcesses.length; i++) {
          if (!completedProcesses.includes(sortedProcesses[i])) {
            currentTime = sortedProcesses[i].arrivalTime;
            break;
          }
        }
        continue;
      }

      const sortedAvailableProcesses = this.quickSort(
        availableProcesses,
        'burstTime'
      );

      const process = sortedAvailableProcesses[0];
      const startTime = currentTime;
      const completionTime = startTime + process.burstTime;
      this.finishProcess(process, startTime, completionTime);

      this.addGanttBlock(
        ganttBlocks,
        process.id,
        startTime,
        completionTime
      );

      completedProcesses.push(process);
      currentTime = completionTime;
    }

    return {
      processes: sortedProcesses,
      ganttBlocks
    };
  }

  private priority(processes: Process[]): SimulationResult {
    const sortedProcesses = this.sortByArrival(processes);

    const completedProcesses: Process[] = [];
    const ganttBlocks: GanttBlock[] = [];

    let currentTime = 0;

    while (completedProcesses.length < sortedProcesses.length) {
      const availableProcesses: Process[] = [];

      for (let i = 0; i < sortedProcesses.length; i++) {
        const process = sortedProcesses[i];
        if (
          process.arrivalTime <= currentTime &&
          !completedProcesses.includes(process)
        ) {
          availableProcesses.push(process);
        }
      }

      if (availableProcesses.length === 0) {
        for (let i = 0; i < sortedProcesses.length; i++) {
          if (!completedProcesses.includes(sortedProcesses[i])) {
            currentTime = sortedProcesses[i].arrivalTime;
            break;
          }
        }
        continue;
      }

      const sortedAvailableProcesses = this.quickSort(
        availableProcesses,
        'priority'
      );

      const process = sortedAvailableProcesses[0];
      const startTime = currentTime;
      const completionTime = startTime + process.burstTime;
      this.finishProcess(process, startTime, completionTime);

      this.addGanttBlock(
        ganttBlocks,
        process.id,
        startTime,
        completionTime
      );

      completedProcesses.push(process);
      currentTime = completionTime;
    }

    return {
      processes: sortedProcesses,
      ganttBlocks
    };
  }

  private quickSort(processes: Process[], key: keyof Process): Process[] {
    if (processes.length <= 1) {
      return processes;
    }

    const pivot = processes[processes.length - 1];

    const left: Process[] = [];

    const right: Process[] = [];

    for (let i = 0; i < processes.length - 1; i++) {
      if (Number(processes[i][key]) < Number(pivot[key])) {
        left.push(processes[i]);
      } else {
        right.push(processes[i]);
      }
    }

    return [...this.quickSort(left, key), pivot, ...this.quickSort(right, key)];
  }

  private sortByArrival(processes: Process[]): Process[] {
    return this.quickSort(processes, 'arrivalTime');
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
    completionTime: number
  ): void {
    const lastBlock = ganttBlocks[ganttBlocks.length - 1];

    if (lastBlock?.processId === processId && lastBlock.completionTime === startTime) {
      lastBlock.completionTime = completionTime;

      return;
    }

    ganttBlocks.push({
      processId,
      startTime,
      completionTime
    });
  }
}
