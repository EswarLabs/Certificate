import {getAllUsers, getUserById, updateUser } from './user.service.js';

export const getAllUsersController = async (req, res) => {
  try {
    const email = req.query.email || null;
    const name = req.query.name || null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const users = await getAllUsers({ email, name }, page, limit);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserByIdController = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserController = async (req, res) => {
  try {
    const user = await updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
