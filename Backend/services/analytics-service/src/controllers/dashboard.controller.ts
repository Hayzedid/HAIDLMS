import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { subDays } from 'date-fns';

/**
 * Get student dashboard
 */
export async function getStudentDashboard(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const dashboard = await dashboardService.getStudentDashboard(userId);

    res.json({ data: dashboard });
  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
}

/**
 * Get instructor dashboard
 */
export async function getInstructorDashboard(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const dashboard = await dashboardService.getInstructorDashboard(userId);

    res.json({ data: dashboard });
  } catch (error) {
    console.error('Get instructor dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
}

/**
 * Get admin dashboard
 */
export async function getAdminDashboard(req: Request, res: Response) {
  try {
    const dashboard = await dashboardService.getAdminDashboard();

    res.json({ data: dashboard });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
}

/**
 * Get time series data
 */
export async function getTimeSeriesData(req: Request, res: Response) {
  try {
    const { metric, startDate, endDate, granularity } = req.query;

    if (!metric) {
      return res.status(400).json({ error: 'Metric is required' });
    }

    const start = startDate ? new Date(startDate as string) : subDays(new Date(), 30);
    const end = endDate ? new Date(endDate as string) : new Date();
    const gran = (granularity as 'hour' | 'day' | 'week' | 'month') || 'day';

    const data = await dashboardService.getTimeSeriesData(
      metric as string,
      start,
      end,
      gran
    );

    res.json({ data });
  } catch (error) {
    console.error('Get time series error:', error);
    res.status(500).json({ error: 'Failed to get time series data' });
  }
}

/**
 * Get comparison data
 */
export async function getComparisonData(req: Request, res: Response) {
  try {
    const { days } = req.query;

    const data = await dashboardService.getComparisonData(
      days ? parseInt(days as string, 10) : undefined
    );

    res.json({ data });
  } catch (error) {
    console.error('Get comparison data error:', error);
    res.status(500).json({ error: 'Failed to get comparison data' });
  }
}
