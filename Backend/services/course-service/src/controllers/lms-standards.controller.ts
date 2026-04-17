import { Request, Response } from 'express';
import { LMSStandardsService } from '../services/lms-standards.service';
import { Pool } from 'pg';

export class LMSStandardsController {
  private lmsService: LMSStandardsService;

  constructor(pool: Pool) {
    this.lmsService = new LMSStandardsService(pool);
  }

  // ========================================
  // SCORM PACKAGES
  // ========================================

  createSCORMPackage = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = req.body;

      if (!data.package_identifier || !data.package_title || !data.scorm_version) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const packageId = await this.lmsService.createSCORMPackage(data);

      res.status(201).json({ id: packageId, message: 'SCORM package created successfully' });
    } catch (error) {
      console.error('Error creating SCORM package:', error);
      res.status(500).json({ error: 'Failed to create SCORM package' });
    }
  };

  getSCORMPackages = async (req: Request, res: Response): Promise<void> => {
    try {
      const { course_id, lesson_id, is_active } = req.query;

      const packages = await this.lmsService.getSCORMPackages({
        course_id: course_id as string,
        lesson_id: lesson_id as string,
        is_active: is_active ? is_active === 'true' : undefined
      });

      res.json({ packages, count: packages.length });
    } catch (error) {
      console.error('Error fetching SCORM packages:', error);
      res.status(500).json({ error: 'Failed to fetch SCORM packages' });
    }
  };

  getSCORMPackageById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { package_id } = req.params;

      const package_ = await this.lmsService.getSCORMPackageById(package_id);

      if (!package_) {
        res.status(404).json({ error: 'SCORM package not found' });
        return;
      }

      res.json(package_);
    } catch (error) {
      console.error('Error fetching SCORM package:', error);
      res.status(500).json({ error: 'Failed to fetch SCORM package' });
    }
  };

  updateSCORMPackage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { package_id } = req.params;
      const updates = req.body;

      await this.lmsService.updateSCORMPackage(package_id, updates);

      res.json({ message: 'SCORM package updated successfully' });
    } catch (error) {
      console.error('Error updating SCORM package:', error);
      res.status(500).json({ error: 'Failed to update SCORM package' });
    }
  };

  deleteSCORMPackage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { package_id } = req.params;

      await this.lmsService.deleteSCORMPackage(package_id);

      res.json({ message: 'SCORM package deleted successfully' });
    } catch (error) {
      console.error('Error deleting SCORM package:', error);
      res.status(500).json({ error: 'Failed to delete SCORM package' });
    }
  };

  // ========================================
  // SCORM ATTEMPTS
  // ========================================

  createSCORMAttempt = async (req: Request, res: Response): Promise<void> => {
    try {
      const { package_id, user_id } = req.body;

      if (!package_id || !user_id) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const attemptId = await this.lmsService.createSCORMAttempt(package_id, user_id);

      res.status(201).json({ id: attemptId, message: 'SCORM attempt created' });
    } catch (error) {
      console.error('Error creating SCORM attempt:', error);
      res.status(500).json({ error: 'Failed to create SCORM attempt' });
    }
  };

  getSCORMAttempts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { package_id, user_id, status } = req.query;

      const attempts = await this.lmsService.getSCORMAttempts({
        package_id: package_id as string,
        user_id: user_id as string,
        status: status as string
      });

      res.json({ attempts, count: attempts.length });
    } catch (error) {
      console.error('Error fetching SCORM attempts:', error);
      res.status(500).json({ error: 'Failed to fetch SCORM attempts' });
    }
  };

  updateSCORMAttempt = async (req: Request, res: Response): Promise<void> => {
    try {
      const { attempt_id } = req.params;
      const cmi_data = req.body;

      await this.lmsService.updateSCORMAttempt(attempt_id, cmi_data);

      res.json({ message: 'SCORM attempt updated successfully' });
    } catch (error) {
      console.error('Error updating SCORM attempt:', error);
      res.status(500).json({ error: 'Failed to update SCORM attempt' });
    }
  };

  completeSCORMAttempt = async (req: Request, res: Response): Promise<void> => {
    try {
      const { attempt_id } = req.params;
      const { status, score } = req.body;

      await this.lmsService.completeSCORMAttempt(attempt_id, status, score);

      res.json({ message: 'SCORM attempt completed' });
    } catch (error) {
      console.error('Error completing SCORM attempt:', error);
      res.status(500).json({ error: 'Failed to complete SCORM attempt' });
    }
  };

  getSCORMUserProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const progress = await this.lmsService.getSCORMUserProgress();

      res.json({ progress });
    } catch (error) {
      console.error('Error fetching SCORM user progress:', error);
      res.status(500).json({ error: 'Failed to fetch user progress' });
    }
  };

  // ========================================
  // LTI TOOL CONSUMERS
  // ========================================

  createLTIConsumer = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = req.body;

      if (!data.consumer_key || !data.consumer_name || !data.consumer_secret || !data.lti_version) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const consumerId = await this.lmsService.createLTIConsumer(data);

      res.status(201).json({ id: consumerId, message: 'LTI consumer created successfully' });
    } catch (error) {
      console.error('Error creating LTI consumer:', error);
      res.status(500).json({ error: 'Failed to create LTI consumer' });
    }
  };

  getLTIConsumers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { is_enabled } = req.query;

      const consumers = await this.lmsService.getLTIConsumers(
        is_enabled !== undefined ? is_enabled === 'true' : undefined
      );

      res.json({ consumers, count: consumers.length });
    } catch (error) {
      console.error('Error fetching LTI consumers:', error);
      res.status(500).json({ error: 'Failed to fetch LTI consumers' });
    }
  };

  getLTIConsumerByKey = async (req: Request, res: Response): Promise<void> => {
    try {
      const { consumer_key } = req.params;

      const consumer = await this.lmsService.getLTIConsumerByKey(consumer_key);

      if (!consumer) {
        res.status(404).json({ error: 'LTI consumer not found' });
        return;
      }

      res.json(consumer);
    } catch (error) {
      console.error('Error fetching LTI consumer:', error);
      res.status(500).json({ error: 'Failed to fetch LTI consumer' });
    }
  };

  updateLTIConsumer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { consumer_id } = req.params;
      const updates = req.body;

      await this.lmsService.updateLTIConsumer(consumer_id, updates);

      res.json({ message: 'LTI consumer updated successfully' });
    } catch (error) {
      console.error('Error updating LTI consumer:', error);
      res.status(500).json({ error: 'Failed to update LTI consumer' });
    }
  };

  deleteLTIConsumer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { consumer_id } = req.params;

      await this.lmsService.deleteLTIConsumer(consumer_id);

      res.json({ message: 'LTI consumer deleted successfully' });
    } catch (error) {
      console.error('Error deleting LTI consumer:', error);
      res.status(500).json({ error: 'Failed to delete LTI consumer' });
    }
  };

  // ========================================
  // LTI RESOURCE LINKS
  // ========================================

  createLTIResourceLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = req.body;

      if (!data.tool_consumer_id || !data.resource_link_id) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const linkId = await this.lmsService.createLTIResourceLink(data);

      res.status(201).json({ id: linkId, message: 'LTI resource link created' });
    } catch (error) {
      console.error('Error creating LTI resource link:', error);
      res.status(500).json({ error: 'Failed to create resource link' });
    }
  };

  getLTIResourceLinks = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tool_consumer_id, course_id } = req.query;

      const links = await this.lmsService.getLTIResourceLinks({
        tool_consumer_id: tool_consumer_id as string,
        course_id: course_id as string
      });

      res.json({ resource_links: links, count: links.length });
    } catch (error) {
      console.error('Error fetching LTI resource links:', error);
      res.status(500).json({ error: 'Failed to fetch resource links' });
    }
  };

  // ========================================
  // LTI LAUNCHES
  // ========================================

  recordLTILaunch = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = req.body;

      if (!data.resource_link_id || !data.tool_consumer_id || !data.lti_user_id) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const launchId = await this.lmsService.recordLTILaunch(data);

      res.status(201).json({ id: launchId, message: 'LTI launch recorded' });
    } catch (error) {
      console.error('Error recording LTI launch:', error);
      res.status(500).json({ error: 'Failed to record LTI launch' });
    }
  };

  getLTILaunches = async (req: Request, res: Response): Promise<void> => {
    try {
      const { resource_link_id, user_id } = req.query;

      const launches = await this.lmsService.getLTILaunches({
        resource_link_id: resource_link_id as string,
        user_id: user_id as string
      });

      res.json({ launches, count: launches.length });
    } catch (error) {
      console.error('Error fetching LTI launches:', error);
      res.status(500).json({ error: 'Failed to fetch LTI launches' });
    }
  };

  getLTILaunchStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const statistics = await this.lmsService.getLTILaunchStatistics();

      res.json({ statistics });
    } catch (error) {
      console.error('Error fetching LTI statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  };

  // ========================================
  // LTI GRADES
  // ========================================

  recordLTIGrade = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = req.body;

      if (!data.resource_link_id || !data.user_id || !data.result_sourcedid || data.result_score === undefined) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const gradeId = await this.lmsService.recordLTIGrade(data);

      res.status(201).json({ id: gradeId, message: 'LTI grade recorded' });
    } catch (error) {
      console.error('Error recording LTI grade:', error);
      res.status(500).json({ error: 'Failed to record LTI grade' });
    }
  };

  syncLTIGrade = async (req: Request, res: Response): Promise<void> => {
    try {
      const { grade_id } = req.params;

      await this.lmsService.syncLTIGrade(grade_id);

      res.json({ message: 'LTI grade synced successfully' });
    } catch (error) {
      console.error('Error syncing LTI grade:', error);
      res.status(500).json({ error: 'Failed to sync LTI grade' });
    }
  };

  // ========================================
  // xAPI STATEMENTS
  // ========================================

  recordXAPIStatement = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = req.body;

      if (!data.statement_id || !data.actor_id || !data.verb || !data.object_id || !data.full_statement) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const statementId = await this.lmsService.recordXAPIStatement(data);

      res.status(201).json({ id: statementId, message: 'xAPI statement recorded' });
    } catch (error) {
      console.error('Error recording xAPI statement:', error);
      res.status(500).json({ error: 'Failed to record xAPI statement' });
    }
  };

  getXAPIStatements = async (req: Request, res: Response): Promise<void> => {
    try {
      const { actor_id, verb, course_id, limit } = req.query;

      const statements = await this.lmsService.getXAPIStatements({
        actor_id: actor_id as string,
        verb: verb as string,
        course_id: course_id as string,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.json({ statements, count: statements.length });
    } catch (error) {
      console.error('Error fetching xAPI statements:', error);
      res.status(500).json({ error: 'Failed to fetch xAPI statements' });
    }
  };

  getXAPIActivitySummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const summary = await this.lmsService.getXAPIActivitySummary();

      res.json({ activity_summary: summary });
    } catch (error) {
      console.error('Error fetching xAPI activity summary:', error);
      res.status(500).json({ error: 'Failed to fetch activity summary' });
    }
  };

  // ========================================
  // xAPI STATE
  // ========================================

  saveXAPIState = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = req.body;

      if (!data.activity_id || !data.agent_id || !data.state_id || !data.state_content) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const stateId = await this.lmsService.saveXAPIState(data);

      res.status(201).json({ id: stateId, message: 'xAPI state saved' });
    } catch (error) {
      console.error('Error saving xAPI state:', error);
      res.status(500).json({ error: 'Failed to save xAPI state' });
    }
  };

  getXAPIState = async (req: Request, res: Response): Promise<void> => {
    try {
      const { activity_id, agent_id, state_id } = req.query;
      const { registration } = req.query;

      if (!activity_id || !agent_id || !state_id) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
      }

      const state = await this.lmsService.getXAPIState(
        activity_id as string,
        agent_id as string,
        state_id as string,
        registration as string
      );

      if (!state) {
        res.status(404).json({ error: 'xAPI state not found' });
        return;
      }

      res.json(state);
    } catch (error) {
      console.error('Error fetching xAPI state:', error);
      res.status(500).json({ error: 'Failed to fetch xAPI state' });
    }
  };

  deleteXAPIState = async (req: Request, res: Response): Promise<void> => {
    try {
      const { activity_id, agent_id, state_id } = req.query;

      if (!activity_id || !agent_id || !state_id) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
      }

      await this.lmsService.deleteXAPIState(
        activity_id as string,
        agent_id as string,
        state_id as string
      );

      res.json({ message: 'xAPI state deleted successfully' });
    } catch (error) {
      console.error('Error deleting xAPI state:', error);
      res.status(500).json({ error: 'Failed to delete xAPI state' });
    }
  };

  // ========================================
  // CONTENT EXPORTS
  // ========================================

  createContentExport = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = req.body;

      if (!data.content_type || !data.content_id || !data.export_format) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const exportId = await this.lmsService.createContentExport(data);

      res.status(201).json({ id: exportId, message: 'Content export created' });
    } catch (error) {
      console.error('Error creating content export:', error);
      res.status(500).json({ error: 'Failed to create content export' });
    }
  };

  updateContentExport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { export_id } = req.params;
      const data = req.body;

      if (!data.status) {
        res.status(400).json({ error: 'Status is required' });
        return;
      }

      await this.lmsService.updateContentExport(export_id, data);

      res.json({ message: 'Content export updated' });
    } catch (error) {
      console.error('Error updating content export:', error);
      res.status(500).json({ error: 'Failed to update content export' });
    }
  };

  getContentExports = async (req: Request, res: Response): Promise<void> => {
    try {
      const { content_type, status, generated_by } = req.query;

      const exports = await this.lmsService.getContentExports({
        content_type: content_type as string,
        status: status as string,
        generated_by: generated_by as string
      });

      res.json({ exports, count: exports.length });
    } catch (error) {
      console.error('Error fetching content exports:', error);
      res.status(500).json({ error: 'Failed to fetch content exports' });
    }
  };
}
