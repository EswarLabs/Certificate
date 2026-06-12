import { OrgContext } from "../context/OrgContext";
import { useContext } from "react";

function useOrg() {
    const context = useContext(OrgContext);
    if (!context) {
        throw new Error("useOrg must be used within an OrgProvider");
    }
    return context;
}
export default useOrg;  