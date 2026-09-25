// Calls a function again and again at a fixed interval, and can pause in the
// middle of an interval: `resume` then waits only for the time that was left,
// while `reset` starts a whole new interval.
export class AutoplayTimer {
  private readonly interval: number;
  private readonly onTick: () => void;
  private remaining: number;
  private startedAt: number = 0;
  private timeoutId: ReturnType<typeof setTimeout> | undefined;

  public constructor(interval: number, onTick: () => void) {
    this.interval = interval;
    this.onTick = onTick;
    this.remaining = interval;
  }

  private schedule(): void {
    this.startedAt = performance.now();
    // The next interval is scheduled before the call, so the call can stop it
    this.timeoutId = setTimeout((): void => {
      this.remaining = this.interval;
      this.schedule();
      this.onTick();
    }, this.remaining);
  }

  public get isRunning(): boolean {
    return this.timeoutId !== undefined;
  }

  public reset(): void {
    this.stop();
    this.remaining = this.interval;
    this.schedule();
  }

  public pause(): void {
    if (!this.isRunning) {
      return;
    }
    this.stop();
    this.remaining = Math.max(this.remaining - (performance.now() - this.startedAt), 0);
  }

  public resume(): void {
    if (this.isRunning) {
      return;
    }
    this.schedule();
  }

  public stop(): void {
    clearTimeout(this.timeoutId);
    this.timeoutId = undefined;
  }
}
