const db = require('../db/init');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register new user
const registerUser = async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            first_name,
            last_name,
            index_number,
            hall_of_residence,
            department,
            phone_number,
            account_type = 'user'
        } = req.body;

        // Validate required fields
        if (!username || !email || !password || !first_name || !last_name || 
            !index_number || !hall_of_residence || !department || !phone_number) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if username already exists
        const existingUser = await db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert user
        const insertQuery = `
            INSERT INTO users (
                username, email, password_hash, first_name, last_name,
                index_number, hall_of_residence, department, phone_number, account_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await db.run(insertQuery, [
            username, email, passwordHash, first_name, last_name,
            index_number, hall_of_residence, department, phone_number, account_type
        ]);

        // If user wants to be a business owner, create business owner record
        if (account_type === 'business_owner') {
            await db.run('INSERT INTO business_owners (user_id) VALUES (?)', [result.lastID]);
        }

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { id: result.lastID, account_type }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, message: 'Failed to register user' });
    }
};

// Login user
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Get user with password hash
        const user = await db.get(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                account_type: user.account_type 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Remove password hash from response
        delete user.password_hash;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user,
                token
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ success: false, message: 'Failed to login' });
    }
};

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await db.get(
            'SELECT id, username, email, first_name, last_name, index_number, hall_of_residence, department, phone_number, account_type, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // If user is a business owner, get business owner details
        if (user.account_type === 'business_owner') {
            const businessOwner = await db.get(
                'SELECT * FROM business_owners WHERE user_id = ?',
                [userId]
            );
            user.business_owner = businessOwner;
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updateData = req.body;

        // Allowed fields for update
        const allowedFields = [
            'first_name', 'last_name', 'hall_of_residence', 
            'department', 'phone_number', 'profile_picture_url'
        ];

        const updates = [];
        const values = [];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(updateData[field]);
            }
        });

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(userId);

        const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        await db.run(updateQuery, values);

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
};

// Upgrade to business owner
const upgradeToBusinessOwner = async (req, res) => {
    try {
        const userId = req.user.id;
        const { business_license_number, verification_documents } = req.body;

        // Check if user is already a business owner
        const existingOwner = await db.get(
            'SELECT * FROM business_owners WHERE user_id = ?',
            [userId]
        );

        if (existingOwner) {
            return res.status(400).json({
                success: false,
                message: 'User is already a business owner'
            });
        }

        // Update user account type
        await db.run(
            'UPDATE users SET account_type = ? WHERE id = ?',
            ['business_owner', userId]
        );

        // Create business owner record
        await db.run(
            'INSERT INTO business_owners (user_id, business_license_number, verification_documents) VALUES (?, ?, ?)',
            [userId, business_license_number, verification_documents]
        );

        res.json({
            success: true,
            message: 'Successfully upgraded to business owner. Your account is pending verification.'
        });
    } catch (error) {
        console.error('Error upgrading to business owner:', error);
        res.status(500).json({ success: false, message: 'Failed to upgrade account' });
    }
};

// Get user's businesses
const getUserBusinesses = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if user is a business owner
        const businessOwner = await db.get(
            'SELECT * FROM business_owners WHERE user_id = ?',
            [userId]
        );

        if (!businessOwner) {
            return res.status(403).json({
                success: false,
                message: 'You must be a business owner to view businesses'
            });
        }

        // Get all businesses owned by this user
        const businesses = await db.all(
            'SELECT * FROM businesses WHERE owner_id = ? ORDER BY created_at DESC',
            [businessOwner.id]
        );

        res.json({
            success: true,
            data: businesses
        });
    } catch (error) {
        console.error('Error fetching user businesses:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch businesses' });
    }
};

// Get user's orders
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20, offset = 0 } = req.query;

        const orders = await db.all(`
            SELECT 
                o.*,
                b.name as business_name,
                b.logo_url as business_logo
            FROM orders o
            JOIN businesses b ON o.business_id = b.id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, parseInt(limit), parseInt(offset)]);

        res.json({
            success: true,
            data: orders,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: orders.length
            }
        });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Get current password hash
        const user = await db.get(
            'SELECT password_hash FROM users WHERE id = ?',
            [userId]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

        // Update password
        await db.run(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newPasswordHash, userId]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ success: false, message: 'Failed to change password' });
    }
};

// Delete user account
const deleteUserAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required to delete account'
            });
        }

        // Verify password
        const user = await db.get(
            'SELECT password_hash FROM users WHERE id = ?',
            [userId]
        );

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password is incorrect'
            });
        }

        // Delete user (this will cascade to related records)
        await db.run('DELETE FROM users WHERE id = ?', [userId]);

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ success: false, message: 'Failed to delete account' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    upgradeToBusinessOwner,
    getUserBusinesses,
    getUserOrders,
    changePassword,
    deleteUserAccount
};
