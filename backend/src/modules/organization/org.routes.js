import express from 'express';

import {
     createOrganization, 
     listOrganizations, 
     getOrganization, 
     updateOrganization, 
     deleteOrganization 
    } from './org.controller.js';

import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authenticate, createOrganization);
router.get('/', authenticate, listOrganizations);
router.get('/:id', authenticate, getOrganization);
router.put('/:id', authenticate, updateOrganization);
router.delete('/:id', authenticate, deleteOrganization);

export default router;