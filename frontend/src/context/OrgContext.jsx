import { createContext, useState, useEffect } from "react";
import { createOrg, getOrg, listOrg, updateOrg, deleteOrg } from "../services/orgServices";

export const OrgContext = createContext();


const OrgProvider = ({ children }) => {
    const [org, setOrg] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const createOrganization = async (orgName) => {
        setLoading(true);
        setError(null);
        try {
            // orgName may be a string or an object { name: "..." } from the UI
            const name = typeof orgName === 'object' ? orgName.name : orgName;
            const res = await createOrg(name);
            if (res.success) {
                // Backend returns: { success, organization: { organization, workspace, membership } }
                setSelectedOrg(res.organization?.organization || null);
                // save org in local storage
                localStorage.setItem("org", JSON.stringify(res.organization?.organization));
                // Workspace is auto-created with org — persist it
                if (res.organization?.workspace) {
                    localStorage.setItem("workspace", JSON.stringify(res.organization.workspace));
                }
                // Refresh organization list after creation
                await listOrganization(1, 10);
            } else {
                setError(res.message || "Organization creation failed");
            }
        } catch (err) {
            setError(err.message || "Organization creation failed");
        } finally {
            setLoading(false);
        }
    }

    const updateOrganization = async (orgId, orgname, orgLogoUrl) => {
        setLoading(true);
        setError(null);
        try {
            const res = await updateOrg(orgId, orgname, orgLogoUrl);
            if (res.success) {
                // Backend returns: { success, organization: { id, name, ... } }
                setSelectedOrg(res.organization || null);
                // save org in local storage
                localStorage.setItem("org", JSON.stringify(res.organization));
                // Refresh organization list after update
                await listOrganization(1, 10);
            } else {
                setError(res.message || "Organization update failed");
            }
        } catch (err) {
            setError(err.message || "Organization update failed");
        } finally {
            setLoading(false);
        }
    }

    const deleteOrganization = async (orgId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await deleteOrg(orgId);
            if (res.success) {
                setSelectedOrg(null);
                localStorage.removeItem("org");
                await listOrganization(1, 10);
                return res;
            } else {
                const msg = res.message || "Organization deletion failed";
                setError(msg);
                throw new Error(msg);
            }
        } catch (err) {
            setError(err.message || "Organization deletion failed");
            throw err;
        } finally {
            setLoading(false);
        }
    }

    const listOrganization = async (page, limit) => {
        setLoading(true);
        setError(null);
        try {
            const res = await listOrg(page, limit);
            if (res.success) {
                // Backend returns: { success, organizations: { organizations: [...] } }
                const orgList = res.organizations?.organizations || [];
                setOrg(orgList);
            } else {
                setError(res.message || "Organization fetch failed");
            }
        } catch (err) {
            setError(err.message || "Organization fetch failed");
        } finally {
            setLoading(false);
        }
    }

    const refreshOrg = async () => {
        if (!selectedOrg?.id) return;
        setLoading(true);
        try {
            const res = await getOrg(selectedOrg.id);
            if (res.success && res.organization) {
                setSelectedOrg(res.organization);
                localStorage.setItem("org", JSON.stringify(res.organization));
            }
        } catch (err) {
            console.error("Failed to refresh org", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch organizations on provider mount
        // get org from local storage
        const savedOrg = localStorage.getItem("org");
        if (savedOrg) {
            setSelectedOrg(JSON.parse(savedOrg));
        }
        listOrganization(1, 10);
    }, []);


    const selectOrganization = (org) => {
        setSelectedOrg(org)
        // save org in local storage
        localStorage.setItem("org", JSON.stringify(org));
    };

    const value = {
        org,
        selectedOrg,
        loading,
        error,
        createOrganization,
        updateOrganization,
        deleteOrganization,
        listOrganization,
        selectOrganization,
        refreshOrg,
    }
    return (
        <OrgContext.Provider value={value}>
            {children}
        </OrgContext.Provider>
    )
}
export default OrgProvider;