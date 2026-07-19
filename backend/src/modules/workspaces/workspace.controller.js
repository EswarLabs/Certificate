import {createWorkspace, deleteWorkspace, listWorkspaces, listWorkspaceById, updateWorkspace, uploadFile} from "./workspace.service.js";
import { sendTestEmail } from "../email/email.service.js";

export const createWorkspaceController = async (req, res, next) => {
    try {
        const {name} = req.body;
        const {organizationId} = req.params;
        const userId = req.user.userId;
        const result = await createWorkspace(name, organizationId, userId);
        res.status(201).json(result);
    }
    catch (error) {
        next(error);
    }
}

export const deleteWorkspaceController = async (req, res, next) => {
    try {
        const {id} = req.params;
        const userId = req.user.userId;
        await deleteWorkspace(id, userId);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}

export const listWorkspacesController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {organizationId} = req.params;
        const result = await listWorkspaces(organizationId, userId, req.query);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}

export const listWorkspaceByIdController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {id} = req.params;
        const result = await listWorkspaceById(id, userId);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found",
            });
        }
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}

export const updateWorkspaceController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {id} = req.params;
        const data = req.body;
        const result = await updateWorkspace(id, userId, data);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}

export const uploadFileController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {id} = req.params;
        const file = req.file;
        const result = await uploadFile(id, userId, file);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}

export const testEmailController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { to, provider, apiKey, fromEmail } = req.body;
        const result = await sendTestEmail(id, userId, { to, provider, apiKey, fromEmail });
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}
