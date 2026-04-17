import { Request, Response } from 'express';
import { rbacService } from '../services/rbac.service';

export class RBACController {
  // ========================================
  // ROLES
  // ========================================

  async createRole(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const role = await rbacService.createRole({
        ...req.body,
        createdBy: adminId
      });

      res.status(201).json({ success: true, data: role });
    } catch (error: any) {
      console.error('[createRole] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create role' });
    }
  }

  async getRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      const role = await rbacService.getRole(roleId);

      if (!role) {
        res.status(404).json({ success: false, message: 'Role not found' });
        return;
      }

      res.json({ success: true, data: role });
    } catch (error: any) {
      console.error('[getRole] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get role' });
    }
  }

  async listRoles(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        scope: req.query.scope as string,
        organizationId: req.query.organizationId as string,
        isSystemRole: req.query.isSystemRole === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100
      };

      const roles = await rbacService.listRoles(filters);
      res.json({ success: true, data: roles });
    } catch (error: any) {
      console.error('[listRoles] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list roles' });
    }
  }

  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      const role = await rbacService.updateRole(roleId, req.body);

      res.json({ success: true, data: role });
    } catch (error: any) {
      console.error('[updateRole] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update role' });
    }
  }

  async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      await rbacService.deleteRole(roleId);

      res.json({ success: true, message: 'Role deleted successfully' });
    } catch (error: any) {
      console.error('[deleteRole] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete role' });
    }
  }

  async getRoleHierarchy(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      const hierarchy = await rbacService.getRoleHierarchy(roleId);

      res.json({ success: true, data: hierarchy });
    } catch (error: any) {
      console.error('[getRoleHierarchy] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get role hierarchy' });
    }
  }

  // ========================================
  // PERMISSIONS
  // ========================================

  async createPermission(req: Request, res: Response): Promise<void> {
    try {
      const permission = await rbacService.createPermission(req.body);
      res.status(201).json({ success: true, data: permission });
    } catch (error: any) {
      console.error('[createPermission] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create permission' });
    }
  }

  async getPermission(req: Request, res: Response): Promise<void> {
    try {
      const { permissionId } = req.params;
      const permission = await rbacService.getPermission(permissionId);

      if (!permission) {
        res.status(404).json({ success: false, message: 'Permission not found' });
        return;
      }

      res.json({ success: true, data: permission });
    } catch (error: any) {
      console.error('[getPermission] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get permission' });
    }
  }

  async listPermissions(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        resource: req.query.resource as string,
        action: req.query.action as string,
        category: req.query.category as string,
        isDangerous: req.query.isDangerous === 'true'
      };

      const permissions = await rbacService.listPermissions(filters);
      res.json({ success: true, data: permissions });
    } catch (error: any) {
      console.error('[listPermissions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list permissions' });
    }
  }

  // ========================================
  // ROLE-PERMISSION ASSIGNMENTS
  // ========================================

  async assignPermissionToRole(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { roleId, permissionId } = req.params;
      const { customConditions } = req.body;

      const assignment = await rbacService.assignPermissionToRole(
        roleId,
        permissionId,
        adminId,
        customConditions
      );

      res.status(201).json({ success: true, data: assignment });
    } catch (error: any) {
      console.error('[assignPermissionToRole] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to assign permission' });
    }
  }

  async removePermissionFromRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId, permissionId } = req.params;
      await rbacService.removePermissionFromRole(roleId, permissionId);

      res.json({ success: true, message: 'Permission removed from role' });
    } catch (error: any) {
      console.error('[removePermissionFromRole] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to remove permission' });
    }
  }

  async getRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      const permissions = await rbacService.getRolePermissions(roleId);

      res.json({ success: true, data: permissions });
    } catch (error: any) {
      console.error('[getRolePermissions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get role permissions' });
    }
  }

  async bulkAssignPermissionsToRole(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { roleId } = req.params;
      const { permissionIds } = req.body;

      if (!permissionIds || !Array.isArray(permissionIds)) {
        res.status(400).json({ success: false, message: 'permissionIds array is required' });
        return;
      }

      await rbacService.bulkAssignPermissionsToRole(roleId, permissionIds, adminId);
      res.json({ success: true, message: 'Permissions assigned successfully' });
    } catch (error: any) {
      console.error('[bulkAssignPermissionsToRole] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to bulk assign permissions' });
    }
  }

  // ========================================
  // USER-ROLE ASSIGNMENTS
  // ========================================

  async assignRoleToUser(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { userId, roleId } = req.params;

      const assignment = await rbacService.assignRoleToUser({
        userId,
        roleId,
        ...req.body,
        assignedBy: adminId
      });

      res.status(201).json({ success: true, data: assignment });
    } catch (error: any) {
      console.error('[assignRoleToUser] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to assign role' });
    }
  }

  async revokeUserRole(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { userRoleId } = req.params;
      const { revokeReason } = req.body;

      if (!revokeReason) {
        res.status(400).json({ success: false, message: 'Revoke reason is required' });
        return;
      }

      const result = await rbacService.revokeUserRole(userRoleId, adminId, revokeReason);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('[revokeUserRole] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to revoke role' });
    }
  }

  async getUserRoles(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const includeInactive = req.query.includeInactive === 'true';

      const roles = await rbacService.getUserRoles(userId, includeInactive);
      res.json({ success: true, data: roles });
    } catch (error: any) {
      console.error('[getUserRoles] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get user roles' });
    }
  }

  async getRoleUsers(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      const users = await rbacService.getRoleUsers(roleId);

      res.json({ success: true, data: users });
    } catch (error: any) {
      console.error('[getRoleUsers] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get role users' });
    }
  }

  // ========================================
  // PERMISSION GRANTS
  // ========================================

  async grantPermissionToUser(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { userId, permissionId } = req.params;

      const grant = await rbacService.grantPermissionToUser({
        userId,
        permissionId,
        ...req.body,
        grantedBy: adminId
      });

      res.status(201).json({ success: true, data: grant });
    } catch (error: any) {
      console.error('[grantPermissionToUser] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to grant permission' });
    }
  }

  async revokePermissionGrant(req: Request, res: Response): Promise<void> {
    try {
      const { userId, permissionId } = req.params;
      await rbacService.revokePermissionGrant(userId, permissionId);

      res.json({ success: true, message: 'Permission grant revoked' });
    } catch (error: any) {
      console.error('[revokePermissionGrant] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to revoke permission grant' });
    }
  }

  async getUserPermissionGrants(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const grants = await rbacService.getUserPermissionGrants(userId);

      res.json({ success: true, data: grants });
    } catch (error: any) {
      console.error('[getUserPermissionGrants] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get permission grants' });
    }
  }

  // ========================================
  // PERMISSION CHECKING
  // ========================================

  async checkUserPermission(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { permissionSlug, scopeType, scopeId } = req.query;

      if (!permissionSlug) {
        res.status(400).json({ success: false, message: 'Permission slug is required' });
        return;
      }

      const hasPermission = await rbacService.userHasPermission(
        userId,
        permissionSlug as string,
        scopeType as string,
        scopeId as string
      );

      res.json({ success: true, data: { hasPermission } });
    } catch (error: any) {
      console.error('[checkUserPermission] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to check permission' });
    }
  }

  async getUserPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { scopeType, scopeId } = req.query;

      const permissions = await rbacService.getUserPermissions(
        userId,
        scopeType as string,
        scopeId as string
      );

      res.json({ success: true, data: permissions });
    } catch (error: any) {
      console.error('[getUserPermissions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get user permissions' });
    }
  }

  // ========================================
  // MAINTENANCE
  // ========================================

  async expireUserRoles(req: Request, res: Response): Promise<void> {
    try {
      const count = await rbacService.expireUserRoles();
      res.json({ success: true, data: { expiredCount: count } });
    } catch (error: any) {
      console.error('[expireUserRoles] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to expire user roles' });
    }
  }

  async cleanupPermissionCache(req: Request, res: Response): Promise<void> {
    try {
      const count = await rbacService.cleanupPermissionCache();
      res.json({ success: true, data: { deletedCount: count } });
    } catch (error: any) {
      console.error('[cleanupPermissionCache] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to cleanup cache' });
    }
  }

  // ========================================
  // SUMMARIES & REPORTS
  // ========================================

  async getRolePermissionsSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await rbacService.getRolePermissionsSummary();
      res.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('[getRolePermissionsSummary] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get summary' });
    }
  }

  async getUserPermissionsOverview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId as string;
      const overview = await rbacService.getUserPermissionsOverview(userId);

      res.json({ success: true, data: overview });
    } catch (error: any) {
      console.error('[getUserPermissionsOverview] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get overview' });
    }
  }

  async getPermissionAuditLog(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        userId: req.query.userId as string,
        permissionSlug: req.query.permissionSlug as string,
        wasGranted: req.query.wasGranted === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100
      };

      const auditLog = await rbacService.getPermissionAuditLog(filters);
      res.json({ success: true, data: auditLog });
    } catch (error: any) {
      console.error('[getPermissionAuditLog] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get audit log' });
    }
  }
}

export const rbacController = new RBACController();
