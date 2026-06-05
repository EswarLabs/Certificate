import {
    createOrganization,
    listOrganizations,
    getOrganization,
    updateOrganization,
    deleteOrganization
 } from './org.service.js';

export const createOrgController = async (req, res) =>{
    const name = req.body.name;
    const userId = req.user.userId;
    const result = await createOrganization(name, userId);
    res.status(201).json(result);
}

export const listOrgController = async (req, res) => {
    const userId = req.user.userId;
    const query = req.query;
    const result = await listOrganizations(query, userId);
    res.status(200).json(result);
}

export const getOrgController = async (req, res) => {
    const userId = req.user.userId;
    const {id} = req.params;
    const result = await getOrganization(id, userId);
    res.status(200).json(result);
}

export const updateOrgController = async (req, res) => {
    const userId = req.user.userId;
    const {id} = req.params;
    const data = req.body;
    const result = await updateOrganization(id, userId, data);
    res.status(200).json(result);
}

export const deleteOrgController = async (req, res) => {
    const userId = req.user.userId;
    const {id} = req.params;
    await deleteOrganization(id, userId);
    res.status(204).send();
}