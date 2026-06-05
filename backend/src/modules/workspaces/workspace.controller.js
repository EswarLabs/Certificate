import {createWorkspace, deleteWorkspace, listWorkspaces, listWorkspaceById, updateWorkspace, uploadFile} from "./workspace.service.js";
export const createWorkspaceController = async (req, res) => {
    try{
        const {name} = req.body;
        const {organizationId} = req.params;
        const userId = req.user.userId;
        const result = await createWorkspace(name, organizationId, userId);
        res.status(201).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const deleteWorkspaceController = async (req, res) => {
    try{
        const {id} = req.params;
        const userId = req.user.userId;
        await deleteWorkspace(id, userId);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const listWorkspacesController = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {organizationId} = req.params;
        const result = await listWorkspaces(organizationId, userId, req.query);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const listWorkspaceByIdController = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {id} = req.params;
        const result = await listWorkspaceById(id, userId);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const updateWorkspaceController = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {id} = req.params;
        const data = req.body;
        const result = await updateWorkspace(id, userId, data);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const uploadFileController = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {id} = req.params;
        const file = req.file;
        const result = await uploadFile(id, userId, file);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
