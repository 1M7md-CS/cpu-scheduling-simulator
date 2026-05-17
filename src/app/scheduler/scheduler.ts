import { Component, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Process, GanttBlock, Algorithm } from '../models/scheduler.model';
import { SchedulerService } from '../services/scheduler.service';
import { AuthenticateService } from '../services/authenticate.service';

@Component({
  selector: 'app-scheduler',
  imports: [FormsModule],
  templateUrl: './scheduler.html',
})
export class Scheduler {
  processes = signal<Process[]>([
    {
      id: 1,
      arrivalTime: 0,
      burstTime: 5,
      priority: 2,
      completionTime: 0,
      turnaroundTime: 0,
      waitingTime: 0,
      responseTime: 0,
    },
    {
      id: 2,
      arrivalTime: 1,
      burstTime: 3,
      priority: 1,
      completionTime: 0,
      turnaroundTime: 0,
      waitingTime: 0,
      responseTime: 0,
    },
    {
      id: 3,
      arrivalTime: 2,
      burstTime: 8,
      priority: 3,
      completionTime: 0,
      turnaroundTime: 0,
      waitingTime: 0,
      responseTime: 0,
    },
    {
      id: 4,
      arrivalTime: 3,
      burstTime: 2,
      priority: 1,
      completionTime: 0,
      turnaroundTime: 0,
      waitingTime: 0,
      responseTime: 0,
    },
  ]);

  selectedAlgorithm = signal<Algorithm>('FCFS');
  ganttBlocks = signal<GanttBlock[]>([]);
  hasRun = signal<boolean>(false);

  timelineBlocks = computed(() => {
    const blocks = this.ganttBlocks();
    const merged: (GanttBlock & { isIdle: boolean })[] = [];
    let cursor = 0;

    for (const block of blocks) {
      if (block.startTime > cursor) {
        merged.push({
          processId: -1,
          startTime: cursor,
          completionTime: block.startTime,
          isIdle: true,
        });
      }

      merged.push({ ...block, isIdle: false });
      cursor = block.completionTime;
    }

    return merged;
  });

  avgWaitingTime = computed(() => {
    const process = this.processes();

    if (process.length === 0) {
      return 0;
    }

    return process.reduce((sum, p) => sum + p.waitingTime, 0) / process.length;
  });

  avgTurnaroundTime = computed(() => {
    const process = this.processes();

    if (process.length === 0) {
      return 0;
    }

    return process.reduce((sum, p) => sum + p.turnaroundTime, 0) / process.length;
  });

  avgResponseTime = computed(() => {
    const process = this.processes();

    if (process.length === 0) {
      return 0;
    }

    return process.reduce((sum, p) => sum + p.responseTime, 0) / process.length;
  });

  totalBurstTime = computed(() => {
    return this.processes().reduce((sum, p) => sum + p.burstTime, 0);
  });

  processColors: { [key: number]: string } = {
    1: 'bg-emerald-500',
    2: 'bg-blue-500',
    3: 'bg-purple-500',
    4: 'bg-amber-500',
    5: 'bg-rose-500',
    6: 'bg-cyan-500',
    7: 'bg-indigo-500',
    8: 'bg-teal-500',
  };

  constructor(
    private router: Router,
    private authService: AuthenticateService,
    private schedulerService: SchedulerService,
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  addProcess(): void {
    const newId = Math.max(0, ...this.processes().map((p) => p.id)) + 1;

    this.processes.update((process) => [
      ...process,
      {
        id: newId,
        arrivalTime: 0,
        burstTime: 1,
        priority: 1,
        completionTime: 0,
        turnaroundTime: 0,
        waitingTime: 0,
        responseTime: 0,
      },
    ]);
  }

  removeProcess(id: number): void {
    this.processes.update((process) => process.filter((p) => p.id !== id));
  }

  runSimulation(): void {
    const result = this.schedulerService.simulate(this.processes(), this.selectedAlgorithm());

    this.processes.set(result.processes);
    this.ganttBlocks.set(result.ganttBlocks);
    this.hasRun.set(true);
  }

  updateProcessValue(process: Process, field: keyof Process, value: string): void {
    const numValue = parseInt(value, 10);

    if (!isNaN(numValue) && numValue >= 0) {
      this.processes.update((procs) =>
        procs.map((p) => (p.id === process.id ? { ...p, [field]: numValue } : p)),
      );
    }
  }

  getColorForProcess(id: number): string {
    return this.processColors[((id - 1) % 8) + 1] || 'bg-gray-500';
  }

  private getTotalTime(): number {
    const blocks = this.ganttBlocks();
    return blocks.length > 0 ? blocks[blocks.length - 1].completionTime : 1;
  }

  getBlockWidth(startTime: number, endTime: number): string {
    const scale = 100 / this.getTotalTime();

    return `${(endTime - startTime) * scale}%`;
  }

  getBlockLeft(startTime: number): string {
    const scale = 100 / this.getTotalTime();

    return `${startTime * scale}%`;
  }
}
