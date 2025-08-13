const db = require('../db/init');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Get all businesses with optional filtering
const getAllBusinesses = async (req, res) => {
    try {
        const { category, search, limit = 20, offset = 0 } = req.query;
        
        let query = `
            SELECT 
                b.*,
                u.first_name as owner_first_name,
                u.last_name as owner_last_name,
                u.username as owner_username,
                COUNT(DISTINCT r.id) as review_count,
                AVG(r.rating) as average_rating
            FROM businesses b
            LEFT JOIN business_owners bo ON b.owner_id = bo.id
            LEFT JOIN users u ON bo.user_id = u.id
            LEFT JOIN reviews r ON b.id = r.business_id
            WHERE b.is_active = 1
        `;
        
        const params = [];
        
        if (category) {
            query += ' AND b.category = ?';
            params.push(category);
        }
        
        if (search) {
            query += ' AND (b.name LIKE ? OR b.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ' GROUP BY b.id ORDER BY b.is_featured DESC, b.average_rating DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const businesses = await db.all(query, params);
        
        res.json({
            success: true,
            data: businesses,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: businesses.length
            }
        });
    } catch (error) {
        console.error('Error fetching businesses:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch businesses' });
    }
};

// Get business by ID with full details
const getBusinessById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get business details
        const businessQuery = `
            SELECT 
                b.*,
                u.first_name as owner_first_name,
                u.last_name as owner_last_name,
                u.username as owner_username,
                u.email as owner_email,
                u.phone_number as owner_phone
            FROM businesses b
            LEFT JOIN business_owners bo ON b.owner_id = bo.id
            LEFT JOIN users u ON bo.user_id = u.id
            WHERE b.id = ? AND b.is_active = 1
        `;
        
        const business = await db.get(businessQuery, [id]);
        
        if (!business) {
            return res.status(404).json({ success: false, message: 'Business not found' });
        }
        
        // Get products
        const productsQuery = 'SELECT * FROM products WHERE business_id = ? AND is_available = 1';
        const products = await db.all(productsQuery, [id]);
        
        // Get services
        const servicesQuery = 'SELECT * FROM services WHERE business_id = ? AND is_available = 1';
        const services = await db.all(servicesQuery, [id]);
        
        // Get reviews
        const reviewsQuery = `
            SELECT 
                r.*,
                u.first_name,
                u.last_name,
                u.username
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.business_id = ?
            ORDER BY r.created_at DESC
            LIMIT 10
        `;
        const reviews = await db.all(reviewsQuery, [id]);
        
        // Get business analytics
        const analyticsQuery = `
            SELECT 
                SUM(total_views) as total_views,
                SUM(total_clicks) as total_clicks,
                SUM(total_orders) as total_orders,
                SUM(total_revenue) as total_revenue,
                AVG(average_order_value) as avg_order_value
            FROM business_analytics 
            WHERE business_id = ?
        `;
        const analytics = await db.get(analyticsQuery, [id]);
        
        res.json({
            success: true,
            data: {
                ...business,
                products,
                services,
                reviews,
                analytics: analytics || {
                    total_views: 0,
                    total_clicks: 0,
                    total_orders: 0,
                    total_revenue: 0,
                    avg_order_value: 0
                }
            }
        });
    } catch (error) {
        console.error('Error fetching business details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch business details' });
    }
};

// Create new business
const createBusiness = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            location,
            contact_number,
            whatsapp_link,
            instagram_handle,
            facebook_page,
            website_url,
            operating_hours
        } = req.body;
        
        const userId = req.user.id; // From auth middleware
        
        // Check if user is a business owner
        const ownerQuery = 'SELECT * FROM business_owners WHERE user_id = ?';
        const owner = await db.get(ownerQuery, [userId]);
        
        if (!owner) {
            return res.status(403).json({ 
                success: false, 
                message: 'You must be a verified business owner to create a business' 
            });
        }
        
        // Insert business
        const insertQuery = `
            INSERT INTO businesses (
                owner_id, name, description, category, location, contact_number,
                whatsapp_link, instagram_handle, facebook_page, website_url, operating_hours
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await db.run(insertQuery, [
            owner.id, name, description, category, location, contact_number,
            whatsapp_link, instagram_handle, facebook_page, website_url, operating_hours
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Business created successfully',
            data: { id: result.lastID }
        });
    } catch (error) {
        console.error('Error creating business:', error);
        res.status(500).json({ success: false, message: 'Failed to create business' });
    }
};

// Update business
const updateBusiness = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const userId = req.user.id;
        
        // Check if user owns this business
        const ownershipQuery = `
            SELECT b.* FROM businesses b
            JOIN business_owners bo ON b.owner_id = bo.id
            WHERE b.id = ? AND bo.user_id = ?
        `;
        const business = await db.get(ownershipQuery, [id, userId]);
        
        if (!business) {
            return res.status(403).json({ 
                success: false, 
                message: 'You can only update your own businesses' 
            });
        }
        
        // Build update query dynamically
        const allowedFields = [
            'name', 'description', 'category', 'location', 'contact_number',
            'whatsapp_link', 'instagram_handle', 'facebook_page', 'website_url',
            'operating_hours', 'is_active'
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
        values.push(id);
        
        const updateQuery = `UPDATE businesses SET ${updates.join(', ')} WHERE id = ?`;
        await db.run(updateQuery, values);
        
        res.json({
            success: true,
            message: 'Business updated successfully'
        });
    } catch (error) {
        console.error('Error updating business:', error);
        res.status(500).json({ success: false, message: 'Failed to update business' });
    }
};

// Delete business
const deleteBusiness = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // Check if user owns this business
        const ownershipQuery = `
            SELECT b.* FROM businesses b
            JOIN business_owners bo ON b.owner_id = bo.id
            WHERE b.id = ? AND bo.user_id = ?
        `;
        const business = await db.get(ownershipQuery, [id, userId]);
        
        if (!business) {
            return res.status(403).json({ 
                success: false, 
                message: 'You can only delete your own businesses' 
            });
        }
        
        // Soft delete by setting is_active to false
        await db.run('UPDATE businesses SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        
        res.json({
            success: true,
            message: 'Business deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting business:', error);
        res.status(500).json({ success: false, message: 'Failed to delete business' });
    }
};

// Get business analytics
const getBusinessAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const { period = '30' } = req.query; // days
        const userId = req.user.id;
        
        // Check if user owns this business
        const ownershipQuery = `
            SELECT b.* FROM businesses b
            JOIN business_owners bo ON b.owner_id = bo.id
            WHERE b.id = ? AND bo.user_id = ?
        `;
        const business = await db.get(ownershipQuery, [id, userId]);
        
        if (!business) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied' 
            });
        }
        
        // Get analytics for the specified period
        const analyticsQuery = `
            SELECT 
                date,
                total_views,
                total_clicks,
                total_orders,
                total_revenue,
                total_customers,
                average_order_value
            FROM business_analytics 
            WHERE business_id = ? 
            AND date >= date('now', '-${period} days')
            ORDER BY date DESC
        `;
        
        const analytics = await db.all(analyticsQuery, [id]);
        
        // Calculate summary statistics
        const summary = analytics.reduce((acc, day) => {
            acc.total_views += day.total_views || 0;
            acc.total_clicks += day.total_clicks || 0;
            acc.total_orders += day.total_orders || 0;
            acc.total_revenue += day.total_revenue || 0;
            acc.total_customers += day.total_customers || 0;
            return acc;
        }, {
            total_views: 0,
            total_clicks: 0,
            total_orders: 0,
            total_revenue: 0,
            total_customers: 0
        });
        
        summary.average_order_value = summary.total_orders > 0 
            ? summary.total_revenue / summary.total_orders 
            : 0;
        
        res.json({
            success: true,
            data: {
                summary,
                daily_data: analytics
            }
        });
    } catch (error) {
        console.error('Error fetching business analytics:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
};

// Get business categories
const getBusinessCategories = async (req, res) => {
    try {
        const categories = await db.all('SELECT * FROM business_categories WHERE is_active = 1 ORDER BY name');
        
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
};

// Search businesses
const searchBusinesses = async (req, res) => {
    try {
        const { q, category, location, limit = 20, offset = 0 } = req.query;
        
        let query = `
            SELECT 
                b.*,
                u.first_name as owner_first_name,
                u.last_name as owner_last_name,
                COUNT(DISTINCT r.id) as review_count,
                AVG(r.rating) as average_rating
            FROM businesses b
            LEFT JOIN business_owners bo ON b.owner_id = bo.id
            LEFT JOIN users u ON bo.user_id = u.id
            LEFT JOIN reviews r ON b.id = r.business_id
            WHERE b.is_active = 1
        `;
        
        const params = [];
        
        if (q) {
            query += ' AND (b.name LIKE ? OR b.description LIKE ?)';
            params.push(`%${q}%`, `%${q}%`);
        }
        
        if (category) {
            query += ' AND b.category = ?';
            params.push(category);
        }
        
        if (location) {
            query += ' AND b.location LIKE ?';
            params.push(`%${location}%`);
        }
        
        query += ' GROUP BY b.id ORDER BY b.is_featured DESC, b.average_rating DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const businesses = await db.all(query, params);
        
        res.json({
            success: true,
            data: businesses,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: businesses.length
            }
        });
    } catch (error) {
        console.error('Error searching businesses:', error);
        res.status(500).json({ success: false, message: 'Failed to search businesses' });
    }
};

module.exports = {
    getAllBusinesses,
    getBusinessById,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    getBusinessAnalytics,
    getBusinessCategories,
    searchBusinesses
};
