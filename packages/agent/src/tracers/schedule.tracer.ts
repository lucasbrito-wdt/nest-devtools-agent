import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventType, ScheduleEventMeta } from '../shared/types';
import { DevtoolsService } from '../devtools.service';

/**
 * Tracer para capturar eventos de schedule/cron jobs
 * Integra com @nestjs/schedule e Bull queues
 */
@Injectable()
export class ScheduleTracer implements OnModuleInit {
  private readonly logger = new Logger(ScheduleTracer.name);
  private readonly trackedJobs = new Map<string, { startTime: number; jobName: string }>();

  constructor(private readonly devtoolsService: DevtoolsService) {}

  onModuleInit() {
    if (this.devtoolsService.shouldCaptureSchedule()) {
      this.logger.log('📅 ScheduleTracer habilitado');
    } else {
      this.logger.debug('📅 ScheduleTracer desabilitado');
    }
  }

  /**
   * Registra início de um job agendado
   */
  trackJobStart(jobId: string, jobName: string, cronExpression?: string): void {
    if (!this.devtoolsService.shouldCaptureSchedule()) return;

    const startTime = Date.now();
    this.trackedJobs.set(jobId, { startTime, jobName });

    const meta: ScheduleEventMeta = {
      timestamp: startTime,
      jobId,
      jobName,
      cronExpression,
      status: 'running',
      startedAt: startTime,
      hostname: require('os').hostname(),
      pid: process.pid,
      environment: this.devtoolsService.getEnvironment(),
    };

    this.logger.debug(`📅 Job iniciado: ${jobName} (${jobId})`);

    this.devtoolsService.sendEvent({
      type: EventType.SCHEDULE,
      meta,
    });
  }

  /**
   * Registra conclusão de um job agendado
   */
  trackJobComplete(jobId: string, result?: any, nextRunAt?: number): void {
    if (!this.devtoolsService.shouldCaptureSchedule()) return;

    const tracked = this.trackedJobs.get(jobId);
    if (!tracked) {
      this.logger.warn(`Job ${jobId} não encontrado no tracking`);
      return;
    }

    const completedAt = Date.now();
    const duration = completedAt - tracked.startTime;

    const meta: ScheduleEventMeta = {
      timestamp: completedAt,
      jobId,
      jobName: tracked.jobName,
      status: 'completed',
      startedAt: tracked.startTime,
      completedAt,
      duration,
      result,
      nextRunAt,
      hostname: require('os').hostname(),
      pid: process.pid,
      environment: this.devtoolsService.getEnvironment(),
    };

    this.logger.log(`✅ Job completado: ${tracked.jobName} (${duration}ms)`);

    this.devtoolsService.sendEvent({
      type: EventType.SCHEDULE,
      meta,
    });

    this.trackedJobs.delete(jobId);
  }

  /**
   * Registra falha de um job agendado
   */
  trackJobFailure(jobId: string, error: Error): void {
    if (!this.devtoolsService.shouldCaptureSchedule()) return;

    const tracked = this.trackedJobs.get(jobId);
    if (!tracked) {
      this.logger.warn(`Job ${jobId} não encontrado no tracking`);
      return;
    }

    const completedAt = Date.now();
    const duration = completedAt - tracked.startTime;

    const meta: ScheduleEventMeta = {
      timestamp: completedAt,
      jobId,
      jobName: tracked.jobName,
      status: 'failed',
      startedAt: tracked.startTime,
      completedAt,
      duration,
      error: error.message,
      hostname: require('os').hostname(),
      pid: process.pid,
      environment: this.devtoolsService.getEnvironment(),
    };

    this.logger.error(`❌ Job falhou: ${tracked.jobName} - ${error.message}`);

    this.devtoolsService.sendEvent({
      type: EventType.SCHEDULE,
      meta,
    });

    this.trackedJobs.delete(jobId);
  }

  /**
   * Registra agendamento de um job
   */
  trackJobScheduled(
    jobId: string,
    jobName: string,
    cronExpression?: string,
    nextRunAt?: number,
  ): void {
    if (!this.devtoolsService.shouldCaptureSchedule()) return;

    const meta: ScheduleEventMeta = {
      timestamp: Date.now(),
      jobId,
      jobName,
      cronExpression,
      status: 'scheduled',
      nextRunAt,
      hostname: require('os').hostname(),
      pid: process.pid,
      environment: this.devtoolsService.getEnvironment(),
    };

    this.logger.debug(
      `📅 Job agendado: ${jobName} para ${nextRunAt ? new Date(nextRunAt).toISOString() : 'próxima execução'}`,
    );

    this.devtoolsService.sendEvent({
      type: EventType.SCHEDULE,
      meta,
    });
  }

  /**
   * Registra cancelamento de um job
   */
  trackJobCancelled(jobId: string, jobName: string): void {
    if (!this.devtoolsService.shouldCaptureSchedule()) return;

    const meta: ScheduleEventMeta = {
      timestamp: Date.now(),
      jobId,
      jobName,
      status: 'cancelled',
      hostname: require('os').hostname(),
      pid: process.pid,
      environment: this.devtoolsService.getEnvironment(),
    };

    this.logger.debug(`🚫 Job cancelado: ${jobName}`);

    this.devtoolsService.sendEvent({
      type: EventType.SCHEDULE,
      meta,
    });

    this.trackedJobs.delete(jobId);
  }
}
