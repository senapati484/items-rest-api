const mongoose = require('mongoose');
const Item = require('../models/item.model');
const { itemQuerySchema } = require('../schemas/item.schema');

const getItems = async (req, res, next) => {
  try {
    // Parse and validate query params
    const queryResult = itemQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: queryResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      category,
      minPrice,
      maxPrice,
      inStock,
    } = queryResult.data;

    const skip = (page - 1) * limit;

    // Build query
    const query = { createdBy: req.user.id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    if (inStock !== undefined) {
      query.inStock = inStock;
    }

    // Execute query with pagination
    const [items, total] = await Promise.all([
      Item.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Item.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await Item.findOne({ _id: id, createdBy: req.user.id }).lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

const createItem = async (req, res, next) => {
  try {
    const item = await Item.create({
      ...req.validatedData,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: item,
      message: 'Item created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await Item.findOneAndUpdate(
      { _id: id, createdBy: req.user.id },
      req.validatedData,
      { new: true, runValidators: true }
    ).lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: item,
      message: 'Item updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await Item.findOneAndDelete({ _id: id, createdBy: req.user.id }).lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getItemStats = async (req, res, next) => {
  try {
    const stats = await Item.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: '$price' },
          avgPrice: { $avg: '$price' },
          inStockCount: { $sum: { $cond: ['$inStock', 1, 0] } },
          outOfStockCount: { $sum: { $cond: ['$inStock', 0, 1] } },
          categories: { $addToSet: '$category' },
        },
      },
    ]);

    const result = stats[0] || {
      totalItems: 0,
      totalValue: 0,
      avgPrice: 0,
      inStockCount: 0,
      outOfStockCount: 0,
      categories: [],
    };

    res.status(200).json({
      success: true,
      data: {
        totalItems: result.totalItems,
        totalValue: Math.round(result.totalValue * 100) / 100,
        avgPrice: Math.round(result.avgPrice * 100) / 100,
        inStock: result.inStockCount,
        outOfStock: result.outOfStockCount,
        categories: result.categories.filter(Boolean).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getItemStats,
};
