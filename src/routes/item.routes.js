const express = require('express');
const router = express.Router();
const itemController = require('../controllers/item.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validateMiddleware = require('../middlewares/validate.middleware');
const { createItemSchema, updateItemSchema } = require('../schemas/item.schema');

// All item routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: Get all items (paginated)
 *     description: Retrieve a paginated list of items for the authenticated user with filtering, searching, and sorting options.
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search by name or description (case-insensitive)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter by stock status
 *     responses:
 *       200:
 *         description: Paginated list of items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Item'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 42
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: No token or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', itemController.getItems);

/**
 * @swagger
 * /api/items/stats:
 *   get:
 *     summary: Get item statistics
 *     description: Get aggregate statistics for all items owned by the authenticated user.
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Item statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                       example: 25
 *                     totalValue:
 *                       type: number
 *                       example: 1549.75
 *                     avgPrice:
 *                       type: number
 *                       example: 61.99
 *                     inStock:
 *                       type: integer
 *                       example: 20
 *                     outOfStock:
 *                       type: integer
 *                       example: 5
 *                     categories:
 *                       type: integer
 *                       example: 4
 *       401:
 *         description: No token or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', itemController.getItemStats);

/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: Get item by ID
 *     description: Retrieve a single item by its ID (only if owned by the authenticated user).
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *         example: 507f1f77bcf86cd799439012
 *     responses:
 *       200:
 *         description: Item found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Item'
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No token or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', itemController.getItemById);

/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Create a new item
 *     description: Create a new item owned by the authenticated user.
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Wireless Mouse
 *                 description: Item name
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Ergonomic wireless mouse with USB receiver
 *                 description: Optional item description
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 29.99
 *                 description: Item price (must be positive)
 *               inStock:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *                 description: Stock availability
 *               category:
 *                 type: string
 *                 maxLength: 50
 *                 example: Electronics
 *                 description: Optional category
 *               sku:
 *                 type: string
 *                 maxLength: 50
 *                 example: WM-001
 *                 description: Optional SKU/stock keeping unit
 *     responses:
 *       201:
 *         description: Item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Item'
 *                 message:
 *                   type: string
 *                   example: Item created successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: No token or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validateMiddleware(createItemSchema), itemController.createItem);

/**
 * @swagger
 * /api/items/{id}:
 *   put:
 *     summary: Update an item
 *     description: Update an existing item by ID (only if owned by the authenticated user).
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *         example: 507f1f77bcf86cd799439012
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Wireless Mouse Pro
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 nullable: true
 *                 example: Updated ergonomic wireless mouse
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 39.99
 *               inStock:
 *                 type: boolean
 *                 example: false
 *               category:
 *                 type: string
 *                 maxLength: 50
 *                 nullable: true
 *                 example: Electronics
 *               sku:
 *                 type: string
 *                 maxLength: 50
 *                 nullable: true
 *                 example: WM-PRO-001
 *     responses:
 *       200:
 *         description: Item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Item'
 *                 message:
 *                   type: string
 *                   example: Item updated successfully
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: No token or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', validateMiddleware(updateItemSchema), itemController.updateItem);

/**
 * @swagger
 * /api/items/{id}:
 *   delete:
 *     summary: Delete an item
 *     description: Delete an item by ID (only if owned by the authenticated user).
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *         example: 507f1f77bcf86cd799439012
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Item deleted successfully
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No token or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', itemController.deleteItem);

module.exports = router;
