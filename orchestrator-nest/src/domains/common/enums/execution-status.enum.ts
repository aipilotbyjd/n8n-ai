export enum ExecutionStatus {
  PENDING = "pending",
  RUNNING = "running",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELLED = "cancelled",
  TIMEOUT = "timeout",
  WAITING = "waiting", // Waiting for user input or external event
  PAUSED = "paused",
  WARNING = "warning", // Completed with warnings
}
