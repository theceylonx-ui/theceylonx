import { storage } from '../storage';
import { roleService } from '../services/roleService';
import { generateSecureToken } from '../utils/crypto';

/**
 * Superadmin initialization system
 * Provides secure, one-time setup for the first superadmin user
 */

export interface SuperadminInitRequest {
  email: string;
  initToken: string;
}

export interface SuperadminInitResponse {
  success: boolean;
  message: string;
  nextSteps?: string[];
}

export class SuperadminManager {
  private static instance: SuperadminManager;
  
  public static getInstance(): SuperadminManager {
    if (!SuperadminManager.instance) {
      SuperadminManager.instance = new SuperadminManager();
    }
    return SuperadminManager.instance;
  }

  /**
   * Check if any superadmin exists in the system
   */
  async hasSuperadmin(): Promise<boolean> {
    try {
      const superadmins = await roleService.getUsersByRole('superadmin');
      return superadmins.length > 0;
    } catch (error) {
      console.error('Error checking superadmin existence:', error);
      return false;
    }
  }

  /**
   * Generate initialization token for superadmin setup
   * This should be called manually or via secure setup script
   */
  generateInitToken(): string {
    const token = generateSecureToken(32);
    console.log('\n🔐 SUPERADMIN INITIALIZATION TOKEN GENERATED');
    console.log('='.repeat(50));
    console.log(`Token: ${token}`);
    console.log('='.repeat(50));
    console.log('⚠️  SECURITY WARNING:');
    console.log('1. This token grants superadmin access');
    console.log('2. Store it securely and use only once');
    console.log('3. Set as SUPERADMIN_INIT_TOKEN environment variable');
    console.log('4. Delete after successful initialization\n');
    
    return token;
  }

  /**
   * Initialize the first superadmin user
   */
  async initializeSuperadmin(request: SuperadminInitRequest): Promise<SuperadminInitResponse> {
    try {
      // Security validations
      if (!request.email || !request.initToken) {
        return {
          success: false,
          message: 'Email and initialization token are required'
        };
      }

      // Check if superadmin already exists
      const hasExistingSuperadmin = await this.hasSuperadmin();
      if (hasExistingSuperadmin) {
        return {
          success: false,
          message: 'Superadmin already exists. Multiple superadmins must be created by existing superadmins.'
        };
      }

      // Validate initialization token
      const expectedToken = process.env.SUPERADMIN_INIT_TOKEN;
      if (!expectedToken) {
        return {
          success: false,
          message: 'Superadmin initialization not configured. Set SUPERADMIN_INIT_TOKEN environment variable.'
        };
      }

      if (request.initToken !== expectedToken) {
        return {
          success: false,
          message: 'Invalid initialization token'
        };
      }

      // Find user by email
      const user = await storage.getUserByEmail(request.email);
      if (!user) {
        return {
          success: false,
          message: 'User not found. The email must belong to an existing user account.'
        };
      }

      // Ensure system roles exist
      await roleService.ensureSystemRoles();

      // Get superadmin role
      const superadminRole = await roleService.getRoleByName('superadmin');
      if (!superadminRole) {
        return {
          success: false,
          message: 'Failed to create superadmin role'
        };
      }

      // Assign superadmin role
      await roleService.assignRole(
        user.id, 
        superadminRole.id, 
        'system', 
        'Initial superadmin setup'
      );

      // Log the initialization
      console.log(`✅ Superadmin initialized: ${user.email} (${user.id})`);
      
      return {
        success: true,
        message: 'Superadmin initialized successfully',
        nextSteps: [
          'Delete the SUPERADMIN_INIT_TOKEN environment variable',
          'Review and configure additional admin roles',
          'Set up audit logging alerts',
          'Configure step-up authentication settings'
        ]
      };

    } catch (error) {
      console.error('Error initializing superadmin:', error);
      return {
        success: false,
        message: 'Failed to initialize superadmin. Check server logs for details.'
      };
    }
  }

  /**
   * Validate superadmin permissions before critical operations
   */
  async validateSuperadminAccess(userId: string): Promise<boolean> {
    try {
      return await roleService.userHasPermission(userId, 'settings.secrets');
    } catch (error) {
      console.error('Error validating superadmin access:', error);
      return false;
    }
  }

  /**
   * Create additional superadmin (only by existing superadmin)
   */
  async createAdditionalSuperadmin(
    newSuperadminEmail: string, 
    createdBy: string,
    reason: string
  ): Promise<SuperadminInitResponse> {
    try {
      // Validate creator has superadmin permissions
      const hasPermission = await this.validateSuperadminAccess(createdBy);
      if (!hasPermission) {
        return {
          success: false,
          message: 'Only superadmins can create other superadmins'
        };
      }

      // Find target user
      const user = await storage.getUserByEmail(newSuperadminEmail);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Check if user already has superadmin role
      const currentRoles = await roleService.getUserRoles(user.id);
      const hasSuperadmin = currentRoles.some(role => role.name === 'superadmin');
      
      if (hasSuperadmin) {
        return {
          success: false,
          message: 'User already has superadmin role'
        };
      }

      // Get superadmin role
      const superadminRole = await roleService.getRoleByName('superadmin');
      if (!superadminRole) {
        return {
          success: false,
          message: 'Superadmin role not found'
        };
      }

      // Assign superadmin role
      await roleService.assignRole(user.id, superadminRole.id, createdBy, reason);

      return {
        success: true,
        message: 'Additional superadmin created successfully'
      };

    } catch (error) {
      console.error('Error creating additional superadmin:', error);
      return {
        success: false,
        message: 'Failed to create additional superadmin'
      };
    }
  }

  /**
   * Get superadmin setup status for admin interface
   */
  async getSetupStatus(): Promise<{
    hasSuperadmin: boolean;
    requiresInitialization: boolean;
    initTokenConfigured: boolean;
  }> {
    const hasSuperadmin = await this.hasSuperadmin();
    const initTokenConfigured = !!process.env.SUPERADMIN_INIT_TOKEN;
    
    return {
      hasSuperadmin,
      requiresInitialization: !hasSuperadmin,
      initTokenConfigured
    };
  }
}

export const superadminManager = SuperadminManager.getInstance();