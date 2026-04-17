import { Request, Response } from 'express';
import { reportingService } from '../services/reporting.service';

export class ReportingController {
  // ========================================
  // REPORT TEMPLATES
  // ========================================

  async createReportTemplate(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const {
        name,
        description,
        category,
        templateType,
        isPublic,
        organizationId,
        dataSource,
        queryConfig,
        availableFilters,
        defaultFilters,
        columns,
        defaultSort,
        aggregations,
        grouping,
        chartConfig,
        allowedFormats,
        pageOrientation,
        requiredRole,
        tags
      } = req.body;

      if (!name || !dataSource || !columns) {
        res.status(400).json({ success: false, message: 'Name, data source, and columns are required' });
        return;
      }

      const template = await reportingService.createReportTemplate({
        name,
        description,
        category,
        templateType,
        isPublic,
        createdBy: userId,
        organizationId,
        dataSource,
        queryConfig,
        availableFilters,
        defaultFilters,
        columns,
        defaultSort,
        aggregations,
        grouping,
        chartConfig,
        allowedFormats,
        pageOrientation,
        requiredRole,
        tags
      });

      res.status(201).json({ success: true, data: template });
    } catch (error: any) {
      console.error('[createReportTemplate] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create report template' });
    }
  }

  async getReportTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const template = await reportingService.getReportTemplate(id);

      if (!template) {
        res.status(404).json({ success: false, message: 'Report template not found' });
        return;
      }

      res.json({ success: true, data: template });
    } catch (error: any) {
      console.error('[getReportTemplate] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get report template' });
    }
  }

  async listReportTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { category, isPublic, organizationId, search, limit, offset } = req.query;

      const filters: any = {};
      if (category) filters.category = category as string;
      if (isPublic !== undefined) filters.isPublic = isPublic === 'true';
      if (organizationId) filters.organizationId = organizationId as string;
      if (search) filters.search = search as string;
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const result = await reportingService.listReportTemplates(filters);
      res.json({ success: true, data: result.templates, total: result.total });
    } catch (error: any) {
      console.error('[listReportTemplates] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list report templates' });
    }
  }

  async updateReportTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const template = await reportingService.updateReportTemplate(id, updates);
      res.json({ success: true, data: template });
    } catch (error: any) {
      console.error('[updateReportTemplate] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update report template' });
    }
  }

  async deleteReportTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await reportingService.deleteReportTemplate(id);
      res.json({ success: true, message: 'Report template deleted successfully' });
    } catch (error: any) {
      console.error('[deleteReportTemplate] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete report template' });
    }
  }

  async getPopularTemplates(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const templates = await reportingService.getPopularTemplates(limit);
      res.json({ success: true, data: templates });
    } catch (error: any) {
      console.error('[getPopularTemplates] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get popular templates' });
    }
  }

  // ========================================
  // CUSTOM REPORTS
  // ========================================

  async createCustomReport(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const {
        name,
        description,
        templateId,
        organizationId,
        dataSource,
        queryConfig,
        columns,
        filters,
        sort,
        aggregations,
        grouping,
        chartConfig,
        limitRows,
        includeCharts,
        isPrivate,
        sharedWith,
        tags
      } = req.body;

      if (!name || !dataSource || !columns) {
        res.status(400).json({ success: false, message: 'Name, data source, and columns are required' });
        return;
      }

      const report = await reportingService.createCustomReport({
        name,
        description,
        templateId,
        createdBy: userId,
        organizationId,
        dataSource,
        queryConfig,
        columns,
        filters,
        sort,
        aggregations,
        grouping,
        chartConfig,
        limitRows,
        includeCharts,
        isPrivate,
        sharedWith,
        tags
      });

      res.status(201).json({ success: true, data: report });
    } catch (error: any) {
      console.error('[createCustomReport] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create custom report' });
    }
  }

  async getCustomReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const report = await reportingService.getCustomReport(id);

      if (!report) {
        res.status(404).json({ success: false, message: 'Custom report not found' });
        return;
      }

      res.json({ success: true, data: report });
    } catch (error: any) {
      console.error('[getCustomReport] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get custom report' });
    }
  }

  async listCustomReports(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { organizationId, templateId, limit, offset } = req.query;

      const filters: any = {};
      if (organizationId) filters.organizationId = organizationId as string;
      if (templateId) filters.templateId = templateId as string;
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const result = await reportingService.listCustomReports(userId, filters);
      res.json({ success: true, data: result.reports, total: result.total });
    } catch (error: any) {
      console.error('[listCustomReports] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list custom reports' });
    }
  }

  async updateCustomReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const report = await reportingService.updateCustomReport(id, updates);
      res.json({ success: true, data: report });
    } catch (error: any) {
      console.error('[updateCustomReport] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update custom report' });
    }
  }

  async deleteCustomReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await reportingService.deleteCustomReport(id);
      res.json({ success: true, message: 'Custom report deleted successfully' });
    } catch (error: any) {
      console.error('[deleteCustomReport] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete custom report' });
    }
  }

  // ========================================
  // REPORT EXECUTIONS
  // ========================================

  async executeReport(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { reportId, templateId, filters, dateRange, exportFormat } = req.body;

      if (!reportId && !templateId) {
        res.status(400).json({ success: false, message: 'Report ID or Template ID is required' });
        return;
      }

      const execution = await reportingService.executeReport({
        reportId,
        templateId,
        executedBy: userId,
        filters,
        dateRange,
        exportFormat
      });

      res.status(201).json({ success: true, data: execution });
    } catch (error: any) {
      console.error('[executeReport] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to execute report' });
    }
  }

  async completeReportExecution(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;
      const results = req.body;

      const execution = await reportingService.completeReportExecution(executionId, results);
      res.json({ success: true, data: execution });
    } catch (error: any) {
      console.error('[completeReportExecution] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to complete report execution' });
    }
  }

  async getReportExecution(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;
      const execution = await reportingService.getReportExecution(executionId);

      if (!execution) {
        res.status(404).json({ success: false, message: 'Report execution not found' });
        return;
      }

      res.json({ success: true, data: execution });
    } catch (error: any) {
      console.error('[getReportExecution] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get report execution' });
    }
  }

  async listReportExecutions(req: Request, res: Response): Promise<void> {
    try {
      const { reportId, executedBy, status, limit, offset } = req.query;

      const filters: any = {};
      if (reportId) filters.reportId = reportId as string;
      if (executedBy) filters.executedBy = executedBy as string;
      if (status) filters.status = status as string;
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const executions = await reportingService.listReportExecutions(filters);
      res.json({ success: true, data: executions });
    } catch (error: any) {
      console.error('[listReportExecutions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list report executions' });
    }
  }

  // ========================================
  // SCHEDULED REPORTS
  // ========================================

  async createScheduledReport(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const {
        reportId,
        templateId,
        name,
        description,
        organizationId,
        frequency,
        cronExpression,
        timezone,
        timeOfDay,
        dayOfWeek,
        dayOfMonth,
        dateRangeType,
        relativePeriod,
        fixedStartDate,
        fixedEndDate,
        exportFormat,
        includeCharts,
        deliveryMethod,
        recipients,
        emailSubject,
        emailBody
      } = req.body;

      if (!name || !frequency) {
        res.status(400).json({ success: false, message: 'Name and frequency are required' });
        return;
      }

      const scheduledReport = await reportingService.createScheduledReport({
        reportId,
        templateId,
        name,
        description,
        createdBy: userId,
        organizationId,
        frequency,
        cronExpression,
        timezone,
        timeOfDay,
        dayOfWeek,
        dayOfMonth,
        dateRangeType,
        relativePeriod,
        fixedStartDate,
        fixedEndDate,
        exportFormat,
        includeCharts,
        deliveryMethod,
        recipients,
        emailSubject,
        emailBody
      });

      res.status(201).json({ success: true, data: scheduledReport });
    } catch (error: any) {
      console.error('[createScheduledReport] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create scheduled report' });
    }
  }

  async getScheduledReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const scheduledReport = await reportingService.getScheduledReport(id);

      if (!scheduledReport) {
        res.status(404).json({ success: false, message: 'Scheduled report not found' });
        return;
      }

      res.json({ success: true, data: scheduledReport });
    } catch (error: any) {
      console.error('[getScheduledReport] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get scheduled report' });
    }
  }

  async listScheduledReports(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, isActive, limit, offset } = req.query;

      const filters: any = {};
      if (organizationId) filters.organizationId = organizationId as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const reports = await reportingService.listScheduledReports(filters);
      res.json({ success: true, data: reports });
    } catch (error: any) {
      console.error('[listScheduledReports] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list scheduled reports' });
    }
  }

  async updateScheduledReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const report = await reportingService.updateScheduledReport(id, updates);
      res.json({ success: true, data: report });
    } catch (error: any) {
      console.error('[updateScheduledReport] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update scheduled report' });
    }
  }

  async deleteScheduledReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await reportingService.deleteScheduledReport(id);
      res.json({ success: true, message: 'Scheduled report deleted successfully' });
    } catch (error: any) {
      console.error('[deleteScheduledReport] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete scheduled report' });
    }
  }

  async getDueScheduledReports(req: Request, res: Response): Promise<void> {
    try {
      const reports = await reportingService.getDueScheduledReports();
      res.json({ success: true, data: reports });
    } catch (error: any) {
      console.error('[getDueScheduledReports] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get due scheduled reports' });
    }
  }

  // ========================================
  // DASHBOARDS
  // ========================================

  async createDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const params = { ...req.body, createdBy: userId };

      if (!params.name) {
        res.status(400).json({ success: false, message: 'Name is required' });
        return;
      }

      const dashboard = await reportingService.createDashboard(params);
      res.status(201).json({ success: true, data: dashboard });
    } catch (error: any) {
      console.error('[createDashboard] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create dashboard' });
    }
  }

  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dashboard = await reportingService.getDashboard(id);

      if (!dashboard) {
        res.status(404).json({ success: false, message: 'Dashboard not found' });
        return;
      }

      res.json({ success: true, data: dashboard });
    } catch (error: any) {
      console.error('[getDashboard] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get dashboard' });
    }
  }

  async listDashboards(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { organizationId } = req.query;

      const dashboards = await reportingService.listDashboards(
        userId,
        organizationId as string
      );

      res.json({ success: true, data: dashboards });
    } catch (error: any) {
      console.error('[listDashboards] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list dashboards' });
    }
  }

  async updateDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const dashboard = await reportingService.updateDashboard(id, updates);
      res.json({ success: true, data: dashboard });
    } catch (error: any) {
      console.error('[updateDashboard] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update dashboard' });
    }
  }

  async deleteDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await reportingService.deleteDashboard(id);
      res.json({ success: true, message: 'Dashboard deleted successfully' });
    } catch (error: any) {
      console.error('[deleteDashboard] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete dashboard' });
    }
  }

  // ========================================
  // EXPORT JOBS
  // ========================================

  async createExportJob(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const params = { ...req.body, requestedBy: userId };

      if (!params.jobType || !params.exportFormat) {
        res.status(400).json({ success: false, message: 'Job type and export format are required' });
        return;
      }

      const job = await reportingService.createExportJob(params);
      res.status(201).json({ success: true, data: job });
    } catch (error: any) {
      console.error('[createExportJob] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create export job' });
    }
  }

  async updateExportJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const updates = req.body;
      const job = await reportingService.updateExportJob(jobId, updates);
      res.json({ success: true, data: job });
    } catch (error: any) {
      console.error('[updateExportJob] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update export job' });
    }
  }

  async getExportJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const job = await reportingService.getExportJob(jobId);

      if (!job) {
        res.status(404).json({ success: false, message: 'Export job not found' });
        return;
      }

      res.json({ success: true, data: job });
    } catch (error: any) {
      console.error('[getExportJob] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get export job' });
    }
  }

  async listExportJobs(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const jobs = await reportingService.listExportJobs(userId, limit);
      res.json({ success: true, data: jobs });
    } catch (error: any) {
      console.error('[listExportJobs] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list export jobs' });
    }
  }

  // ========================================
  // ANALYTICS METRICS
  // ========================================

  async recordMetric(req: Request, res: Response): Promise<void> {
    try {
      const params = req.body;

      if (!params.metricName || !params.date) {
        res.status(400).json({ success: false, message: 'Metric name and date are required' });
        return;
      }

      const metric = await reportingService.recordMetric(params);
      res.status(201).json({ success: true, data: metric });
    } catch (error: any) {
      console.error('[recordMetric] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to record metric' });
    }
  }

  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const {
        metricName,
        metricCategory,
        organizationId,
        courseId,
        fromDate,
        toDate,
        limit
      } = req.query;

      const filters: any = {};
      if (metricName) filters.metricName = metricName as string;
      if (metricCategory) filters.metricCategory = metricCategory as string;
      if (organizationId) filters.organizationId = organizationId as string;
      if (courseId) filters.courseId = courseId as string;
      if (fromDate) filters.fromDate = fromDate as string;
      if (toDate) filters.toDate = toDate as string;
      if (limit) filters.limit = parseInt(limit as string, 10);

      const metrics = await reportingService.getMetrics(filters);
      res.json({ success: true, data: metrics });
    } catch (error: any) {
      console.error('[getMetrics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get metrics' });
    }
  }
}

export const reportingController = new ReportingController();
