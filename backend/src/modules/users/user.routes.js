import express from 'express';
import { getAllUsersController, getUserByIdController, updateUserController } from './user.controller.js';
import {authMiddleware} from '../../middlewares/auth.middleware.js'; 

const router = express.Router();

router.get('/', authMiddleware, getAllUsersController);
router.get('/:id', authMiddleware, getUserByIdController);
router.put('/:id', authMiddleware, updateUserController);

export default router;