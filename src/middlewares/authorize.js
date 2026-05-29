import Admin from "../models/Admin.model.js";

/**
 * Middleware to check if the logged-in admin has access to a specific section/module.
 * Superadmin always has access. Staff needs the corresponding permission boolean set to true.
 * 
 * @param {string} permission - The permission key to check (e.g., 'students', 'fees')
 */
export const authorize = (permission) => {
    return async (req, res, next) => {
        try {
            if (!req.admin || !req.admin.id) {
                return res.status(401).json({ message: "Unauthorized: Access token missing or invalid" });
            }

            const user = await Admin.findById(req.admin.id);
            if (!user) {
                return res.status(404).json({ message: "Admin account not found" });
            }

            // Superadmin has full access to everything
            if (user.role === "superadmin") {
                return next();
            }

            // Check specific permission for staff
            if (user.role === "staff" && user.permissions && user.permissions[permission]) {
                return next();
            }

            return res.status(403).json({ 
                message: `Forbidden: You do not have permission to access ${permission}. Please contact the main administrator.` 
            });
        } catch (error) {
            console.error("Authorization Middleware Error:", error);
            return res.status(500).json({ error: error.message });
        }
    };
};

/**
 * Middleware to check if the logged-in admin has access to at least one of the specified permissions.
 * Superadmin always has access.
 * 
 * @param {string[]} permissions - Array of permission keys to check
 */
export const authorizeAny = (permissions) => {
    return async (req, res, next) => {
        try {
            if (!req.admin || !req.admin.id) {
                return res.status(401).json({ message: "Unauthorized: Access token missing or invalid" });
            }

            const user = await Admin.findById(req.admin.id);
            if (!user) {
                return res.status(404).json({ message: "Admin account not found" });
            }

            // Superadmin has full access to everything
            if (user.role === "superadmin") {
                return next();
            }

            // Check if user has any of the specified permissions
            if (user.role === "staff" && user.permissions) {
                const hasAny = permissions.some(p => user.permissions[p] === true);
                if (hasAny) {
                    return next();
                }
            }

            return res.status(403).json({ 
                message: "Forbidden: You do not have sufficient permissions to perform this action." 
            });
        } catch (error) {
            console.error("Authorization Middleware Error:", error);
            return res.status(500).json({ error: error.message });
        }
    };
};
