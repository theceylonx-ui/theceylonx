# Ceylon Expand Admin System Audit

## Current State Analysis (Phase 0 Snapshot)

### 🔧 **System Architecture**

**Database Tables:**
- ✅ `roles` - Role definitions with JSON permissions
- ✅ `auditLogs` - Complete action tracking  
- ✅ `mediaAssets` - Admin uploaded content
- ✅ `adminChatThreads` - Investigation threads
- ✅ `adminChatMessages` - Admin communication
- ✅ `users.roleId` - Role assignment reference

**Permission Schema (Current JSON Format):**
```typescript
// Current AdminPermissions in shared/schema.ts
{
  canManageUsers: boolean;      // User management access
  canManageContent: boolean;    // Content moderation
  canViewLogs: boolean;         // Audit log access
  canManageRoles: boolean;      // Role creation/editing
}
```

### 🛡️ **Middleware & Security**

**Protection Layers:**
- ✅ `requireAdmin` - Base admin access check
- ✅ `requirePermission(key)` - Granular permission validation
- ✅ `setupSuperadmin` - Auto-promotion via SUPERADMIN_EMAILS
- ✅ JWT authentication integration
- ✅ Complete audit logging for all admin actions

**Current Flow:**
```
User Login → JWT Issued → setupSuperadmin check → requireAdmin → requirePermission → Route Handler
```

### 🔗 **API Routes & Required Permissions**

| Route | Method | Required Permission | Purpose |
|-------|--------|-------------------|---------|
| `/api/admin/dashboard` | GET | requireAdmin | Dashboard summary |
| `/api/admin/users` | GET | canManageUsers | List users |
| `/api/admin/users/:id` | GET | canManageUsers | User details |
| `/api/admin/users/:id/role` | PUT | canManageUsers | Update user role |
| `/api/admin/media` | POST/GET | canManageContent | Media upload/list |
| `/api/admin/roles` | GET/POST/PUT | canManageRoles | Role management |
| `/api/admin/logs` | GET | canViewLogs | Audit logs |
| `/api/admin/reports` | GET/PATCH | (legacy hardcoded) | Reports management |
| `/api/admin/trips/:id` | PATCH | (legacy hardcoded) | Trip editing |

### 🎨 **Frontend UI Components**

**Admin Pages:**
- ✅ `/admin-dashboard` → `AdminDashboard.tsx` (analytics, KPIs)
- ✅ `/admin-reports` → `AdminReportsTable.tsx` (report moderation)

**Component Features:**
- Role-based content display
- Report status management
- Trip moderation capabilities
- Analytics and metrics

### ⚠️ **Security Issues Identified (Bypass Points)**

**1. Legacy Hardcoded Admin Lists (HIGH PRIORITY):**
```typescript
// Found in server/routes.ts - BYPASSING MIDDLEWARE!
const adminUserIds = [
  "bcc1d79a-d83a-4a99-8556-e1d367140e88",
  "313a0e58-6745-4db7-91bd-31e69c7496ab", 
  "dev-admin-001",
  "9848130a-1ba7-4b9c-9a2f-3e1a696160e1"
];
```
**Routes affected:**
- `/api/admin/reports` 
- `/api/admin/reports/:id/status`
- `/api/admin/trips/:id`
- `/api/analytics/kpi`

**2. Missing Step-Up Authentication:**
- No MFA/re-auth for destructive actions
- No email verification requirements
- Permanent sessions without timeout

**3. Permission Registry Issues:**
- No validation of JSON permission keys
- Risk of permission drift/typos
- No canonical permission list

### 🔄 **Role Hierarchy (Current)**

```
superadmin (ALL_PERMISSIONS)
├── canManageUsers: true
├── canManageContent: true  
├── canViewLogs: true
└── canManageRoles: true

admin (MOST_PERMISSIONS)
├── canManageUsers: true
├── canManageContent: true
├── canViewLogs: true
└── canManageRoles: false ❌

moderator (LIMITED_PERMISSIONS)  
├── canManageUsers: false ❌
├── canManageContent: true
├── canViewLogs: true
└── canManageRoles: false ❌

user (NO_ADMIN_PERMISSIONS)
└── All: false ❌
```

### 📊 **Audit Logging (Current)**

**Tracked Actions:**
- `superadmin_setup` - Initial superadmin assignment
- `role_create` - New role creation
- `role_update` - Permission changes
- `user_role_change` - Role assignments
- `media_upload` - Asset uploads

**Audit Entry Format:**
```typescript
{
  actorUserId: string;    // Who performed action
  action: string;         // What was done
  targetType: string;     // What was affected
  targetId: string;       // Specific entity ID
  meta: object;          // Additional context
  createdAt: timestamp;  // When it happened
}
```

## 🚀 **Upgrade Requirements**

### **Phase 1 Priorities:**
1. ✅ Replace hardcoded admin lists with proper middleware
2. ✅ Implement permission registry with validation
3. ✅ Add step-up authentication for destructive actions
4. ✅ Enhance permission granularity

### **Phase 2-7 Roadmap:**
- Enhanced admin UI with role-aware components
- Comprehensive role management interface
- Advanced audit logging and analytics
- Complete test coverage

### **Environment Configuration:**
```bash
SUPERADMIN_EMAILS="theceylonx@gmail.com,admin@domain.com"
ADMIN_IP_ALLOWLIST="192.168.1.0/24,10.0.0.0/8" # Optional
```

---

**Status:** ✅ Phase 0 Complete - System Audited & Documented  
**Next:** Phase 1 - Permission Registry Implementation