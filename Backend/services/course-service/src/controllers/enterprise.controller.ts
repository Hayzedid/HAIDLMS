import { Request, Response } from 'express';
import { enterpriseService } from '../services/enterprise.service';

export class EnterpriseController {
  // ========================================
  // ORGANIZATIONS
  // ========================================

  async createOrganization(req: Request, res: Response): Promise<void> {
    try {
      const organization = await enterpriseService.createOrganization(req.body);

      res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: organization,
      });
    } catch (error: any) {
      console.error('Error creating organization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create organization',
        error: error.message,
      });
    }
  }

  async getOrganization(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organization = await enterpriseService.getOrganization(id);

      if (!organization) {
        res.status(404).json({
          success: false,
          message: 'Organization not found',
        });
        return;
      }

      res.json({
        success: true,
        data: organization,
      });
    } catch (error: any) {
      console.error('Error fetching organization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch organization',
        error: error.message,
      });
    }
  }

  async listOrganizations(req: Request, res: Response): Promise<void> {
    try {
      const { status, type, limit, offset } = req.query;

      const result = await enterpriseService.listOrganizations({
        status: status as string,
        type: type as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json({
        success: true,
        data: result.organizations,
        total: result.total,
      });
    } catch (error: any) {
      console.error('Error listing organizations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list organizations',
        error: error.message,
      });
    }
  }

  async updateOrganization(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organization = await enterpriseService.updateOrganization(id, req.body);

      res.json({
        success: true,
        message: 'Organization updated successfully',
        data: organization,
      });
    } catch (error: any) {
      console.error('Error updating organization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update organization',
        error: error.message,
      });
    }
  }

  async deleteOrganization(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await enterpriseService.deleteOrganization(id);

      res.json({
        success: true,
        message: 'Organization deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting organization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete organization',
        error: error.message,
      });
    }
  }

  // ========================================
  // ORGANIZATION SETTINGS
  // ========================================

  async getOrganizationSettings(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const settings = await enterpriseService.getOrganizationSettings(id);

      if (!settings) {
        res.status(404).json({
          success: false,
          message: 'Organization settings not found',
        });
        return;
      }

      res.json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      console.error('Error fetching organization settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch organization settings',
        error: error.message,
      });
    }
  }

  async updateOrganizationSettings(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const settings = await enterpriseService.updateOrganizationSettings(id, req.body);

      res.json({
        success: true,
        message: 'Organization settings updated successfully',
        data: settings,
      });
    } catch (error: any) {
      console.error('Error updating organization settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update organization settings',
        error: error.message,
      });
    }
  }

  // ========================================
  // DEPARTMENTS
  // ========================================

  async createDepartment(req: Request, res: Response): Promise<void> {
    try {
      const department = await enterpriseService.createDepartment(req.body);

      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: department,
      });
    } catch (error: any) {
      console.error('Error creating department:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create department',
        error: error.message,
      });
    }
  }

  async getDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const department = await enterpriseService.getDepartment(id);

      if (!department) {
        res.status(404).json({
          success: false,
          message: 'Department not found',
        });
        return;
      }

      res.json({
        success: true,
        data: department,
      });
    } catch (error: any) {
      console.error('Error fetching department:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch department',
        error: error.message,
      });
    }
  }

  async listDepartments(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { includeInactive } = req.query;

      const departments = await enterpriseService.listDepartments(
        organizationId,
        includeInactive === 'true'
      );

      res.json({
        success: true,
        data: departments,
      });
    } catch (error: any) {
      console.error('Error listing departments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list departments',
        error: error.message,
      });
    }
  }

  async updateDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const department = await enterpriseService.updateDepartment(id, req.body);

      res.json({
        success: true,
        message: 'Department updated successfully',
        data: department,
      });
    } catch (error: any) {
      console.error('Error updating department:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update department',
        error: error.message,
      });
    }
  }

  async deleteDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await enterpriseService.deleteDepartment(id);

      res.json({
        success: true,
        message: 'Department deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting department:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete department',
        error: error.message,
      });
    }
  }

  // ========================================
  // TEAMS
  // ========================================

  async createTeam(req: Request, res: Response): Promise<void> {
    try {
      const team = await enterpriseService.createTeam(req.body);

      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: team,
      });
    } catch (error: any) {
      console.error('Error creating team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create team',
        error: error.message,
      });
    }
  }

  async getTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const team = await enterpriseService.getTeam(id);

      if (!team) {
        res.status(404).json({
          success: false,
          message: 'Team not found',
        });
        return;
      }

      res.json({
        success: true,
        data: team,
      });
    } catch (error: any) {
      console.error('Error fetching team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch team',
        error: error.message,
      });
    }
  }

  async listTeams(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { departmentId } = req.query;

      const teams = await enterpriseService.listTeams(
        organizationId,
        departmentId as string
      );

      res.json({
        success: true,
        data: teams,
      });
    } catch (error: any) {
      console.error('Error listing teams:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list teams',
        error: error.message,
      });
    }
  }

  async updateTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const team = await enterpriseService.updateTeam(id, req.body);

      res.json({
        success: true,
        message: 'Team updated successfully',
        data: team,
      });
    } catch (error: any) {
      console.error('Error updating team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update team',
        error: error.message,
      });
    }
  }

  async deleteTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await enterpriseService.deleteTeam(id);

      res.json({
        success: true,
        message: 'Team deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete team',
        error: error.message,
      });
    }
  }

  async addTeamMember(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, role } = req.body;

      await enterpriseService.addTeamMember(id, userId, role);

      res.json({
        success: true,
        message: 'Team member added successfully',
      });
    } catch (error: any) {
      console.error('Error adding team member:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add team member',
        error: error.message,
      });
    }
  }

  async removeTeamMember(req: Request, res: Response): Promise<void> {
    try {
      const { id, userId } = req.params;
      await enterpriseService.removeTeamMember(id, userId);

      res.json({
        success: true,
        message: 'Team member removed successfully',
      });
    } catch (error: any) {
      console.error('Error removing team member:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove team member',
        error: error.message,
      });
    }
  }

  async getTeamMembers(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const members = await enterpriseService.getTeamMembers(id);

      res.json({
        success: true,
        data: members,
      });
    } catch (error: any) {
      console.error('Error fetching team members:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch team members',
        error: error.message,
      });
    }
  }

  // ========================================
  // ORGANIZATION MEMBERS
  // ========================================

  async addOrganizationMember(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { userId, role, departmentId, teamId, employeeInfo } = req.body;

      const member = await enterpriseService.addOrganizationMember(
        organizationId,
        userId,
        role,
        departmentId,
        teamId,
        employeeInfo
      );

      res.status(201).json({
        success: true,
        message: 'Member added successfully',
        data: member,
      });
    } catch (error: any) {
      console.error('Error adding organization member:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add organization member',
        error: error.message,
      });
    }
  }

  async removeOrganizationMember(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, userId } = req.params;
      await enterpriseService.removeOrganizationMember(organizationId, userId);

      res.json({
        success: true,
        message: 'Member removed successfully',
      });
    } catch (error: any) {
      console.error('Error removing organization member:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove organization member',
        error: error.message,
      });
    }
  }

  async getOrganizationMembers(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { role, departmentId, teamId, status, limit, offset } = req.query;

      const result = await enterpriseService.getOrganizationMembers(organizationId, {
        role: role as string,
        departmentId: departmentId as string,
        teamId: teamId as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json({
        success: true,
        data: result.members,
        total: result.total,
      });
    } catch (error: any) {
      console.error('Error fetching organization members:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch organization members',
        error: error.message,
      });
    }
  }

  async updateOrganizationMember(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, userId } = req.params;
      const member = await enterpriseService.updateOrganizationMember(
        organizationId,
        userId,
        req.body
      );

      res.json({
        success: true,
        message: 'Member updated successfully',
        data: member,
      });
    } catch (error: any) {
      console.error('Error updating organization member:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update organization member',
        error: error.message,
      });
    }
  }

  // ========================================
  // LICENSES
  // ========================================

  async createLicense(req: Request, res: Response): Promise<void> {
    try {
      const license = await enterpriseService.createLicense(req.body);

      res.status(201).json({
        success: true,
        message: 'License created successfully',
        data: license,
      });
    } catch (error: any) {
      console.error('Error creating license:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create license',
        error: error.message,
      });
    }
  }

  async getLicenses(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { activeOnly } = req.query;

      const licenses = await enterpriseService.getLicenses(
        organizationId,
        activeOnly === 'true'
      );

      res.json({
        success: true,
        data: licenses,
      });
    } catch (error: any) {
      console.error('Error fetching licenses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch licenses',
        error: error.message,
      });
    }
  }

  async assignLicense(req: Request, res: Response): Promise<void> {
    try {
      const { licenseId } = req.params;
      const { userId } = req.body;
      const assignedBy = req.user!.id;

      const assignment = await enterpriseService.assignLicense(licenseId, userId, assignedBy);

      res.json({
        success: true,
        message: 'License assigned successfully',
        data: assignment,
      });
    } catch (error: any) {
      console.error('Error assigning license:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign license',
        error: error.message,
      });
    }
  }

  async revokeLicense(req: Request, res: Response): Promise<void> {
    try {
      const { licenseId, userId } = req.params;
      await enterpriseService.revokeLicense(licenseId, userId);

      res.json({
        success: true,
        message: 'License revoked successfully',
      });
    } catch (error: any) {
      console.error('Error revoking license:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to revoke license',
        error: error.message,
      });
    }
  }

  async checkLicenseAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const available = await enterpriseService.checkLicenseAvailability(organizationId);

      res.json({
        success: true,
        available,
      });
    } catch (error: any) {
      console.error('Error checking license availability:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check license availability',
        error: error.message,
      });
    }
  }

  // ========================================
  // ORGANIZATION COURSES
  // ========================================

  async addCourseToOrganization(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, courseId } = req.params;
      const addedBy = req.user!.id;

      const orgCourse = await enterpriseService.addCourseToOrganization(
        organizationId,
        courseId,
        { ...req.body, addedBy }
      );

      res.status(201).json({
        success: true,
        message: 'Course added to organization successfully',
        data: orgCourse,
      });
    } catch (error: any) {
      console.error('Error adding course to organization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add course to organization',
        error: error.message,
      });
    }
  }

  async removeCourseFromOrganization(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, courseId } = req.params;
      await enterpriseService.removeCourseFromOrganization(organizationId, courseId);

      res.json({
        success: true,
        message: 'Course removed from organization successfully',
      });
    } catch (error: any) {
      console.error('Error removing course from organization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove course from organization',
        error: error.message,
      });
    }
  }

  async getOrganizationCourses(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { isMandatory, isVisible } = req.query;

      const courses = await enterpriseService.getOrganizationCourses(organizationId, {
        isMandatory: isMandatory ? isMandatory === 'true' : undefined,
        isVisible: isVisible ? isVisible === 'true' : undefined,
      });

      res.json({
        success: true,
        data: courses,
      });
    } catch (error: any) {
      console.error('Error fetching organization courses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch organization courses',
        error: error.message,
      });
    }
  }

  // ========================================
  // INVITATIONS
  // ========================================

  async createInvitation(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { email, role, departmentId, teamId, expiresInDays } = req.body;
      const invitedBy = req.user!.id;

      const invitation = await enterpriseService.createInvitation(
        organizationId,
        email,
        role,
        invitedBy,
        { departmentId, teamId, expiresInDays }
      );

      res.status(201).json({
        success: true,
        message: 'Invitation created successfully',
        data: invitation,
      });
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create invitation',
        error: error.message,
      });
    }
  }

  async acceptInvitation(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const userId = req.user!.id;

      const invitation = await enterpriseService.acceptInvitation(token, userId);

      res.json({
        success: true,
        message: 'Invitation accepted successfully',
        data: invitation,
      });
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to accept invitation',
      });
    }
  }

  async cancelInvitation(req: Request, res: Response): Promise<void> {
    try {
      const { invitationId } = req.params;
      await enterpriseService.cancelInvitation(invitationId);

      res.json({
        success: true,
        message: 'Invitation cancelled successfully',
      });
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel invitation',
        error: error.message,
      });
    }
  }

  async getOrganizationInvitations(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { status } = req.query;

      const invitations = await enterpriseService.getOrganizationInvitations(
        organizationId,
        status as string
      );

      res.json({
        success: true,
        data: invitations,
      });
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invitations',
        error: error.message,
      });
    }
  }

  // ========================================
  // ANALYTICS
  // ========================================

  async aggregateOrganizationAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { date } = req.body;

      await enterpriseService.aggregateOrganizationAnalytics(
        organizationId,
        date ? new Date(date) : undefined
      );

      res.json({
        success: true,
        message: 'Analytics aggregated successfully',
      });
    } catch (error: any) {
      console.error('Error aggregating analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to aggregate analytics',
        error: error.message,
      });
    }
  }

  async getOrganizationAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { startDate, endDate } = req.query;

      const analytics = await enterpriseService.getOrganizationAnalytics(
        organizationId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
        error: error.message,
      });
    }
  }

  async getAuditLog(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { userId, action, entityType, startDate, endDate, limit, offset } = req.query;

      const result = await enterpriseService.getAuditLog(organizationId, {
        userId: userId as string,
        action: action as string,
        entityType: entityType as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json({
        success: true,
        data: result.logs,
        total: result.total,
      });
    } catch (error: any) {
      console.error('Error fetching audit log:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit log',
        error: error.message,
      });
    }
  }

  // ========================================
  // HELPER ENDPOINTS
  // ========================================

  async getUserOrganization(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const organization = await enterpriseService.getUserOrganization(userId);

      res.json({
        success: true,
        data: organization,
      });
    } catch (error: any) {
      console.error('Error fetching user organization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user organization',
        error: error.message,
      });
    }
  }
}

export const enterpriseController = new EnterpriseController();
