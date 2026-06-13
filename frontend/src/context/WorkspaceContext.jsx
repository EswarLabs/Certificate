import { createContext, useState, useEffect } from "react";
import {
    createWorkspace,
    listWorkspaces,
    getWorkspace,
    updateWorkspace,
    deleteWorkspaceApi,
    listMembers,
    addMember,
    removeMember,
    updateMemberRole,
} from "../services/workspaceServices";

export const WorkspaceContext = createContext();

const WorkspaceProvider = ({ children }) => {
    const [workspaces, setWorkspaces] = useState([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Restore selected workspace from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("workspace");
        if (saved) {
            try {
                setSelectedWorkspace(JSON.parse(saved));
            } catch {
                localStorage.removeItem("workspace");
            }
        }
    }, []);

    // ---------- Workspace CRUD ----------

    const fetchWorkspaces = async (organizationId, page = 1, limit = 10) => {
        if (!organizationId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await listWorkspaces(organizationId, page, limit);
            if (res.success) {
                // Backend: { success, workspaces: [...] }
                setWorkspaces(res.workspaces || []);
            } else {
                setError(res.message || "Failed to fetch workspaces");
            }
        } catch (err) {
            setError(err.message || "Failed to fetch workspaces");
        } finally {
            setLoading(false);
        }
    };

    const createNewWorkspace = async (organizationId, name) => {
        setLoading(true);
        setError(null);
        try {
            const res = await createWorkspace(organizationId, name);
            // Backend: { workspace: {...}, membership: {...} }
            if (res.workspace) {
                setSelectedWorkspace(res.workspace);
                localStorage.setItem("workspace", JSON.stringify(res.workspace));
                // Refresh list
                await fetchWorkspaces(organizationId);
                return res;
            } else {
                setError(res.message || "Failed to create workspace");
            }
        } catch (err) {
            setError(err.message || "Failed to create workspace");
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkspace = async (organizationId, workspaceId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getWorkspace(organizationId, workspaceId);
            // Backend returns workspace object directly
            if (res.id) {
                setSelectedWorkspace(res);
                localStorage.setItem("workspace", JSON.stringify(res));
            } else {
                setError(res.message || "Failed to fetch workspace");
            }
        } catch (err) {
            setError(err.message || "Failed to fetch workspace");
        } finally {
            setLoading(false);
        }
    };

    const refreshWorkspace = async () => {
        if (!selectedWorkspace?.id || !selectedWorkspace?.organizationId) return;
        setLoading(true);
        try {
            const res = await getWorkspace(selectedWorkspace.organizationId, selectedWorkspace.id);
            if (res.id) {
                setSelectedWorkspace(res);
                localStorage.setItem("workspace", JSON.stringify(res));
            }
        } catch (err) {
            console.error("Failed to refresh workspace", err);
        } finally {
            setLoading(false);
        }
    };

    const updateCurrentWorkspace = async (organizationId, workspaceId, data) => {
        setLoading(true);
        setError(null);
        try {
            const res = await updateWorkspace(organizationId, workspaceId, data);
            // Backend returns updated workspace object directly
            if (res.id) {
                setSelectedWorkspace(res);
                localStorage.setItem("workspace", JSON.stringify(res));
                await fetchWorkspaces(organizationId);
            } else {
                setError(res.message || "Failed to update workspace");
            }
        } catch (err) {
            setError(err.message || "Failed to update workspace");
        } finally {
            setLoading(false);
        }
    };

    const deleteCurrentWorkspace = async (organizationId, workspaceId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await deleteWorkspaceApi(organizationId, workspaceId);
            if (res.success) {
                setSelectedWorkspace(null);
                localStorage.removeItem("workspace");
                await fetchWorkspaces(organizationId);
            } else {
                setError(res.message || "Failed to delete workspace");
            }
        } catch (err) {
            setError(err.message || "Failed to delete workspace");
        } finally {
            setLoading(false);
        }
    };

    const selectWorkspace = (ws) => {
        setSelectedWorkspace(ws);
        if (ws) {
            localStorage.setItem("workspace", JSON.stringify(ws));
        } else {
            localStorage.removeItem("workspace");
        }
    };

    // ---------- Members ----------

    const fetchMembers = async (organizationId, page = 1, limit = 10) => {
        if (!organizationId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await listMembers(organizationId, page, limit);
            if (res.success) {
                // Backend: { success, members: [...] }
                setMembers(res.members || []);
            } else {
                setError(res.message || "Failed to fetch members");
            }
        } catch (err) {
            setError(err.message || "Failed to fetch members");
        } finally {
            setLoading(false);
        }
    };

    const addNewMember = async (organizationId, newUserId, workspaceId, role) => {
        setLoading(true);
        setError(null);
        try {
            const res = await addMember(organizationId, newUserId, workspaceId, role);
            if (res.success) {
                // Refresh members list
                await fetchMembers(organizationId);
                return res;
            } else {
                setError(res.message || "Failed to add member");
            }
        } catch (err) {
            setError(err.message || "Failed to add member");
        } finally {
            setLoading(false);
        }
    };

    const removeMemberFromOrg = async (organizationId, memberId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await removeMember(organizationId, memberId);
            if (res.success) {
                await fetchMembers(organizationId);
            } else {
                setError(res.message || "Failed to remove member");
            }
        } catch (err) {
            setError(err.message || "Failed to remove member");
        } finally {
            setLoading(false);
        }
    };

    const updateRole = async (organizationId, memberId, role) => {
        setLoading(true);
        setError(null);
        try {
            const res = await updateMemberRole(organizationId, memberId, role);
            if (res.success) {
                await fetchMembers(organizationId);
            } else {
                setError(res.message || "Failed to update member role");
            }
        } catch (err) {
            setError(err.message || "Failed to update member role");
        } finally {
            setLoading(false);
        }
    };

    const value = {
        workspaces,
        selectedWorkspace,
        members,
        loading,
        error,
        fetchWorkspaces,
        createNewWorkspace,
        fetchWorkspace,
        refreshWorkspace,
        updateCurrentWorkspace,
        deleteCurrentWorkspace,
        selectWorkspace,
        fetchMembers,
        addNewMember,
        removeMemberFromOrg,
        updateRole,
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export default WorkspaceProvider;
