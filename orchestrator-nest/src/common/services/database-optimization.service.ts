import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DatabaseOptimizationService {
  private readonly logger = new Logger(DatabaseOptimizationService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Monitor database connection pool health
   */
  async getConnectionPoolStats() {
    const driver = this.dataSource.driver as any;
    const pool = driver.master || driver.pool;
    
    return {
      totalConnections: pool.totalCount || 0,
      idleConnections: pool.idleCount || 0,
      waitingClients: pool.waitingCount || 0,
      maxConnections: pool.options?.max || 0,
      minConnections: pool.options?.min || 0,
    };
  }

  /**
   * Analyze slow queries and provide optimization suggestions
   */
  async analyzeSlowQueries(): Promise<any[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      // PostgreSQL specific slow query analysis
      const slowQueries = await queryRunner.query(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE mean_time > 1000
        ORDER BY mean_time DESC 
        LIMIT 10
      `);
      
      return slowQueries.map(query => ({
        ...query,
        suggestions: this.generateOptimizationSuggestions(query),
      }));
    } catch (error) {
      this.logger.warn('Could not analyze slow queries (pg_stat_statements not available)', error);
      return [];
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Generate optimization suggestions for slow queries
   */
  private generateOptimizationSuggestions(query: any): string[] {
    const suggestions = [];
    
    if (query.query.includes('SELECT *')) {
      suggestions.push('Consider selecting only required columns instead of SELECT *');
    }
    
    if (query.query.includes('ORDER BY') && !query.query.includes('LIMIT')) {
      suggestions.push('Consider adding LIMIT to ORDER BY queries');
    }
    
    if (query.query.includes('JOIN') && query.mean_time > 5000) {
      suggestions.push('Consider adding indexes on JOIN columns');
    }
    
    if (query.calls > 1000 && query.mean_time > 100) {
      suggestions.push('Consider caching this frequently executed query');
    }
    
    return suggestions;
  }

  /**
   * Optimize database tables by running VACUUM and ANALYZE
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async optimizeTables() {
    this.logger.log('Starting daily table optimization');
    
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      // Get all tables
      const tables = await queryRunner.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      `);
      
      for (const table of tables) {
        try {
          // Run VACUUM ANALYZE for each table
          await queryRunner.query(`VACUUM ANALYZE ${table.tablename}`);
          this.logger.debug(`Optimized table: ${table.tablename}`);
        } catch (error) {
          this.logger.error(`Failed to optimize table ${table.tablename}:`, error);
        }
      }
      
      this.logger.log('Daily table optimization completed');
    } catch (error) {
      this.logger.error('Failed to run table optimization:', error);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Monitor table sizes and suggest archiving for large tables
   */
  async getTableSizes(): Promise<any[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      const tableSizes = await queryRunner.query(`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_stats 
        JOIN pg_tables ON pg_stats.tablename = pg_tables.tablename
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `);
      
      return tableSizes.map(table => ({
        ...table,
        shouldArchive: table.size_bytes > 1024 * 1024 * 1024, // > 1GB
        recommendations: this.generateTableRecommendations(table),
      }));
    } catch (error) {
      this.logger.error('Failed to get table sizes:', error);
      return [];
    } finally {
      await queryRunner.release();
    }
  }

  private generateTableRecommendations(table: any): string[] {
    const recommendations = [];
    
    if (table.size_bytes > 1024 * 1024 * 1024) { // > 1GB
      recommendations.push('Consider archiving old data');
      recommendations.push('Consider partitioning this table');
    }
    
    if (table.n_distinct < 10 && table.correlation < 0.1) {
      recommendations.push('Consider adding an index on this column');
    }
    
    return recommendations;
  }

  /**
   * Clean up old execution data to prevent database bloat
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldData() {
    this.logger.log('Starting cleanup of old execution data');
    
    const queryRunner = this.dataSource.createQueryRunner();
    const retentionDays = parseInt(process.env.EXECUTION_LOG_RETENTION_DAYS || '30');
    
    try {
      // Clean up old executions
      const result = await queryRunner.query(`
        DELETE FROM executions 
        WHERE created_at < NOW() - INTERVAL '${retentionDays} days'
        AND status IN ('success', 'failed', 'cancelled')
      `);
      
      this.logger.log(`Cleaned up ${result.rowCount} old execution records`);
      
      // Clean up old audit logs
      const auditRetentionDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90');
      const auditResult = await queryRunner.query(`
        DELETE FROM audit_logs 
        WHERE created_at < NOW() - INTERVAL '${auditRetentionDays} days'
      `);
      
      this.logger.log(`Cleaned up ${auditResult.rowCount} old audit log records`);
      
    } catch (error) {
      this.logger.error('Failed to cleanup old data:', error);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Monitor database locks and long-running transactions
   */
  async getActiveConnections() {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      const connections = await queryRunner.query(`
        SELECT 
          pid,
          usename,
          application_name,
          client_addr,
          state,
          query_start,
          state_change,
          query,
          EXTRACT(EPOCH FROM (NOW() - query_start)) as duration_seconds
        FROM pg_stat_activity 
        WHERE state != 'idle'
        ORDER BY query_start ASC
      `);
      
      return connections.map(conn => ({
        ...conn,
        isLongRunning: conn.duration_seconds > 30,
        shouldKill: conn.duration_seconds > 300, // > 5 minutes
      }));
    } catch (error) {
      this.logger.error('Failed to get active connections:', error);
      return [];
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get database performance metrics
   */
  async getPerformanceMetrics() {
    const poolStats = await this.getConnectionPoolStats();
    const slowQueries = await this.analyzeSlowQueries();
    const tableSizes = await this.getTableSizes();
    const activeConnections = await this.getActiveConnections();
    
    return {
      connectionPool: poolStats,
      slowQueries: slowQueries.slice(0, 5), // Top 5 slow queries
      largestTables: tableSizes.slice(0, 10), // Top 10 largest tables
      longRunningQueries: activeConnections.filter(conn => conn.isLongRunning),
      recommendations: this.generatePerformanceRecommendations(poolStats, slowQueries, tableSizes),
    };
  }

  private generatePerformanceRecommendations(poolStats: any, slowQueries: any[], tableSizes: any[]): string[] {
    const recommendations = [];
    
    if (poolStats.waitingClients > 0) {
      recommendations.push('Consider increasing database connection pool size');
    }
    
    if (slowQueries.length > 5) {
      recommendations.push('Multiple slow queries detected - review and optimize');
    }
    
    if (tableSizes.some(t => t.shouldArchive)) {
      recommendations.push('Large tables detected - consider archiving old data');
    }
    
    if (poolStats.totalConnections / poolStats.maxConnections > 0.8) {
      recommendations.push('Connection pool utilization is high - monitor for bottlenecks');
    }
    
    return recommendations;
  }
}
