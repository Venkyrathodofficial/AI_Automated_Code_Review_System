/**
 * Sentinel Role-Based Access Control (RBAC) & Redaction Infrastructure
 * Enforces least-privilege access for platform operations and customer organizations.
 */

const ROLES = {
  PLATFORM_OWNER: "platform_owner",
  PLATFORM_ADMIN: "platform_admin",
  OPERATIONS_ENGINEER: "operations_engineer",
  SUPPORT_AGENT: "support_agent",
  CUSTOMER_ORG_ADMIN: "customer_org_admin",
  CUSTOMER_MEMBER: "customer_member"
};

// Hierarchy definition: higher rank inherits base staff capabilities
const ROLE_HIERARCHY = {
  [ROLES.PLATFORM_OWNER]: 100,
  [ROLES.PLATFORM_ADMIN]: 80,
  [ROLES.OPERATIONS_ENGINEER]: 60,
  [ROLES.SUPPORT_AGENT]: 40,
  [ROLES.CUSTOMER_ORG_ADMIN]: 20,
  [ROLES.CUSTOMER_MEMBER]: 10
};

// Granular permissions map
const ROLE_PERMISSIONS = {
  [ROLES.PLATFORM_OWNER]: [
    "admin:all",
    "admin:settings:write",
    "admin:audit:read",
    "admin:users:manage",
    "admin:incidents:all",
    "admin:pipeline:manage",
    "admin:alerts:manage"
  ],
  [ROLES.PLATFORM_ADMIN]: [
    "admin:settings:read",
    "admin:audit:read",
    "admin:users:read",
    "admin:incidents:all",
    "admin:pipeline:manage",
    "admin:alerts:manage"
  ],
  [ROLES.OPERATIONS_ENGINEER]: [
    "admin:pipeline:read",
    "admin:pipeline:retry",
    "admin:pipeline:cancel",
    "admin:diagnostics:read",
    "admin:incidents:read"
  ],
  [ROLES.SUPPORT_AGENT]: [
    "admin:incidents:read",
    "admin:incidents:write",
    "admin:incidents:assign",
    "admin:incidents:notes",
    "admin:incidents:reply",
    "admin:incidents:resolve"
  ],
  [ROLES.CUSTOMER_ORG_ADMIN]: [
    "org:manage",
    "org:members:invite",
    "policies:write",
    "incidents:create",
    "incidents:read_org",
    "incidents:reply"
  ],
  [ROLES.CUSTOMER_MEMBER]: [
    "scans:execute",
    "repos:read",
    "issues:read",
    "incidents:create",
    "incidents:read_own",
    "incidents:reply"
  ]
};

/**
 * Checks if a given role has a specific permission
 * @param {string} role 
 * @param {string} permission 
 * @returns {boolean}
 */
function hasPermission(role, permission) {
  if (!role) return false;
  if (role === ROLES.PLATFORM_OWNER) return true; // Owner has all permissions

  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission) || permissions.includes("admin:all");
}

/**
 * Checks if a role is a platform staff member
 * @param {string} role 
 * @returns {boolean}
 */
function isStaffRole(role) {
  return [
    ROLES.PLATFORM_OWNER,
    ROLES.PLATFORM_ADMIN,
    ROLES.OPERATIONS_ENGINEER,
    ROLES.SUPPORT_AGENT,
    "admin" // legacy backwards-compatibility
  ].includes(role);
}

/**
 * Express middleware to enforce one or more allowed roles
 * @param {Array<string>} allowedRoles 
 */
function requireRoles(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Query user role from admin_users
      const { data: adminRecord } = await req.supabase
        .from("admin_users")
        .select("role")
        .eq("user_id", req.user.id)
        .maybeSingle();

      const userRole = adminRecord?.role || ROLES.CUSTOMER_MEMBER;
      req.userRole = userRole;

      // Allow if platform owner or role matches allowedRoles
      if (userRole === ROLES.PLATFORM_OWNER || allowedRoles.includes(userRole)) {
        return next();
      }

      // Legacy fallback: if 'admin' is in allowedRoles and userRole is 'admin'
      if (allowedRoles.includes("admin") && isStaffRole(userRole)) {
        return next();
      }

      return res.status(403).json({
        error: "Access forbidden: insufficient permissions for this operation",
        requiredRoles: allowedRoles,
        currentRole: userRole
      });
    } catch (err) {
      console.error("[RBAC Error]", err);
      return res.status(500).json({ error: "Authorization evaluation failure" });
    }
  };
}

/**
 * Safe Redaction utility: strips credentials, tokens, and raw private keys
 * from logs, audit records, and API responses.
 * @param {any} data 
 * @returns {any} Redacted deep copy
 */
function redactSensitiveData(data) {
  if (!data) return data;
  if (typeof data !== "object") return data;

  const SENSITIVE_KEYS = [
    "token", "secret", "password", "key", "access_token",
    "github_token", "api_key", "client_secret", "authorization",
    "passwd", "private_key", "cert", "credential"
  ];

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k));
    if (isSensitive && typeof value === "string") {
      cleaned[key] = value.length > 8 ? `${value.slice(0, 4)}...[REDACTED]` : "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      cleaned[key] = redactSensitiveData(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  hasPermission,
  isStaffRole,
  requireRoles,
  redactSensitiveData
};
