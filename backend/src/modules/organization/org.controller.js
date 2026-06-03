import {
    createOrganization,
    listOrganizations,
    getOrganization,
    updateOrganization,
    deleteOrganization
 } from './org.service.js';

export const createOrgController = async (res, req) =>{
    const {name} = req.body;
    const userId = req.user.id;
    const result = await createOrganization(name, userId);
    res.status(201).json(result);
}

export const listOrgController = async (res, req) => {
    const userId = req.user.id;
    const query = req.query;
    const result = await listOrganizations(query, userId);
    res.status(200).json(result);
}

export const getOrgController = async (res, req) => {
    const userId = req.user.id;
    const {id} = req.params;
    const result = await getOrganization(id, userId);
    res.status(200).json(result);
}

export const updateOrgController = async (res, req) => {
    const userId = req.user.id;
    const {id} = req.params;
    const data = req.body;
    const result = await updateOrganization(id, userId, data);
    res.status(200).json(result);
}

export const deleteOrgController = async (res, req) => {
    const userId = req.user.id;
    const {id} = req.params;
    await deleteOrganization(id, userId);
    res.status(204).send();
}