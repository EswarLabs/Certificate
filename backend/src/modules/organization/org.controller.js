import {
    createOrganization,
    listOrganizations,
    getOrganization,
    updateOrganization,
    deleteOrganization
 } from './org.service.js';

export const createOrgController = async (req, res, next) => {
    try {
        const name = req.body.name;
        const userId = req.user.userId;
        const result = await createOrganization(name, userId);
        res.status(201).json({
            success: true,
            organization: result,
            message: "Organization created successfully",
        });
    } catch (error) {
        next(error);
    }
}

export const listOrgController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const query = req.query;
        const result = await listOrganizations(query, userId);
        if(!result){
            return res.status(404).json({
                success: false,
                message: "Organizations not found",
            });
        }
        res.status(200).json({
            success: true,
            organizations: result,
            message: "Organizations fetched successfully",
        });
    } catch (error) {
        next(error);
    }
}

export const getOrgController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {id} = req.params;
        const result = await getOrganization(id, userId);
        if(!result){
            return res.status(404).json({
                success: false,
                message: "Organization not found",
            });
        }
        res.status(200).json({
            success: true,
            organization: result,
            message: "Organization fetched successfully",
        });
    } catch (error) {
        next(error);
    }
}

export const updateOrgController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {id} = req.params;
        const data = req.body;
        const result = await updateOrganization(id, userId, data);
        if(!result){
            return res.status(404).json({
                success: false,
                message: "Organization not found",
            });
        }
        res.status(200).json({
            success: true,
            organization: result,
            message: "Organization updated successfully",
        });
    } catch (error) {
        next(error);
    }
}

export const deleteOrgController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {id} = req.params;
        await deleteOrganization(id, userId);
        res.status(200).json({
            success: true,
            message: "Organization deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}