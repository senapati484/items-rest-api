const User = require('../models/user.model');
const { generateTokens, verifyToken } = require('../utils/jwt.utils');
const { registerSchema, loginSchema, refreshSchema } = require('../schemas/auth.schema');
const validateMiddleware = require('../middlewares/validate.middleware');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.validatedData;

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
        errors: [{ field: 'email', message: 'This email is already registered' }],
      });
    }

    const user = await User.create({ name, email, password });
    const { token, refreshToken } = generateTokens({ id: user._id });

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedData;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const { token, refreshToken } = generateTokens({ id: user._id });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.validatedData;

    try {
      const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

      const user = await User.findById(decoded.id).lean();
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      const tokens = generateTokens({ id: user._id });

      res.status(200).json({
        success: true,
        data: {
          token: tokens.token,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register: [validateMiddleware(registerSchema), register],
  login: [validateMiddleware(loginSchema), login],
  refreshAccessToken: [validateMiddleware(refreshSchema), refreshAccessToken],
  getMe: getMe,
};
