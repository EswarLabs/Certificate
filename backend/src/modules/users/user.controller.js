import { getAllUsers, getUserById, updateUser } from './user.service.js';
import { updateUserSchema } from './user.validation.js';

export const getAllUsersController = async (req, res, next) => {
  try {
    const email = req.query.email || null;
    const name = req.query.name || null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await getAllUsers({ email, name }, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getUserByIdController = async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUserController = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: "Forbidden: You can only update your own profile" });
    }

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const user = await updateUser(userId, parsed.data);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};
