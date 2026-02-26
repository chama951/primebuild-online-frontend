import { useEffect, useState } from "react";
import DataTable from "../common/DataTable.jsx";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import Unauthorized from "../common/Unauthorized.jsx";
import {
    useGetRolesQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDeleteRoleMutation,
} from "../../services/roleApi.js";

// Privileges enum matching your backend
const PRIVILEGES = [
    { value: "ADMIN", label: "Admin" },
    { value: "USER_MANAGEMENT", label: "User Management" },
    { value: "INVENTORY_MANAGEMENT", label: "Inventory Management" },
    { value: "BUILD_MANAGEMENT", label: "Build Management" },
    { value: "INVOICE_MANAGEMENT", label: "Invoice Management" },
    { value: "CUSTOMER", label: "Customer" },
];

const RoleManagement = ({ refetchFlag, resetFlag }) => {
    // State
    const [selectedRole, setSelectedRole] = useState(null);
    const [roleName, setRoleName] = useState("");
    const [selectedPrivileges, setSelectedPrivileges] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
        action: null,
    });

    // API hooks
    const { data: roles = [], error: rolesError, refetch: refetchRoles } = useGetRolesQuery();

    // Mutations
    const [createRole] = useCreateRoleMutation();
    const [updateRole] = useUpdateRoleMutation();
    const [deleteRole] = useDeleteRoleMutation();

    useEffect(() => {
        if (refetchFlag) {
            refetchRoles();
            resetFlag();
        }
    }, [refetchFlag, refetchRoles, resetFlag]);

    // Check unauthorized
    const isUnauthorized = () => {
        return rolesError?.isUnauthorized;
    };

    if (isUnauthorized()) {
        return <Unauthorized />;
    }

    // Transform API data to extract privileges from rolePrivilegeList
    const transformedRoles = roles.map(role => ({
        ...role,
        privilegesList: role.rolePrivilegeList?.map(rp => rp.privilege) || []
    }));

    // Filtered roles
    const filteredRoles = transformedRoles.filter((role) =>
        role?.roleName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Notification handler
    const showNotification = (type, message, action = null) => {
        setNotification({ show: true, type, message, action });
    };

    const handleConfirmAction = async () => {
        if (notification.action) {
            const { callback } = notification.action;
            setIsSubmitting(true);
            try {
                const result = await callback();
                const successMessage = result?.data?.message || notification.action.successMessage || "Action completed!";
                showNotification("success", successMessage);
            } catch (error) {
                console.error("Error:", error);
                const errorMessage = error.data?.message || notification.action.errorMessage || "Error performing action.";
                showNotification("error", errorMessage);
            } finally {
                setIsSubmitting(false);
                setNotification((prev) => ({ ...prev, action: null }));
            }
        }
    };

    // Toggle privilege selection
    const togglePrivilege = (privilege) => {
        setSelectedPrivileges(prev => {
            if (prev.includes(privilege)) {
                return prev.filter(p => p !== privilege);
            } else {
                return [...prev, privilege];
            }
        });
    };

    // Select all privileges
    const selectAllPrivileges = () => {
        setSelectedPrivileges(PRIVILEGES.map(p => p.value));
    };

    // Clear all privileges
    const clearAllPrivileges = () => {
        setSelectedPrivileges([]);
    };

    // Form handlers
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!roleName.trim()) {
            showNotification("error", "Please enter a role name");
            return;
        }

        if (selectedPrivileges.length === 0) {
            showNotification("error", "Please select at least one privilege");
            return;
        }

        setIsSubmitting(true);

        const roleData = {
            roleName: roleName.trim(),
            privilegesList: selectedPrivileges,
        };

        try {
            let response;
            if (selectedRole) {
                response = await updateRole({
                    id: selectedRole.id,
                    ...roleData,
                }).unwrap();
            } else {
                response = await createRole(roleData).unwrap();
            }

            showNotification("success", response.message || `Role ${selectedRole ? "updated" : "created"} successfully!`);
            handleResetForm();
            refetchRoles();
        } catch (error) {
            console.error("Error saving role:", error);
            showNotification("error", error.data?.message || "An error occurred while saving.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectRole = (role) => {
        setSelectedRole(role);
        setRoleName(role.roleName);
        // Extract privileges from rolePrivilegeList
        const privileges = role.rolePrivilegeList?.map(rp => rp.privilege) || [];
        setSelectedPrivileges(privileges);
    };

    const handleResetForm = () => {
        setSelectedRole(null);
        setRoleName("");
        setSelectedPrivileges([]);
    };

    const handleDeleteRole = (role) => {
        showNotification("error", `Are you sure you want to delete role "${role.roleName}"?`, {
            callback: async () => {
                try {
                    const response = await deleteRole(role.id).unwrap();
                    refetchRoles();
                    if (selectedRole?.id === role.id) {
                        handleResetForm();
                    }
                    return response;
                } catch (error) {
                    console.error("Error deleting role:", error);
                    throw error;
                }
            },
            successMessage: "Role deleted successfully!",
            errorMessage: "Error deleting role.",
        });
    };

    // DataTable columns
    const columns = [
        {
            key: "id",
            header: "ID",
            render: (item) => <div className="text-sm text-gray-500">#{item.id}</div>,
        },
        {
            key: "roleName",
            header: "Role Name",
            render: (item) => <div className="text-sm font-medium">{item.roleName}</div>,
        },
        {
            key: "privileges",
            header: "Privileges",
            render: (item) => (
                <div className="flex flex-col gap-1">
                    {item.rolePrivilegeList?.map((rp) => (
                        <div key={rp.id} className="flex items-center text-sm">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                            <span>{rp.privilege.replace(/_/g, ' ')}</span>
                        </div>
                    ))}
                </div>
            ),
        },
    ];

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Roles List */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Search */}
                    <div className="bg-white rounded-lg border p-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search roles..."
                                className="w-full pl-4 pr-10 py-2 border rounded"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-2.5 text-gray-400"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Roles DataTable */}
                    <DataTable
                        items={filteredRoles}
                        selectedItem={selectedRole}
                        onSelectItem={handleSelectRole}
                        onDeleteItemClick={handleDeleteRole}
                        isLoading={false}
                        columns={columns}
                        emptyMessage="No roles found"
                    />
                </div>

                {/* Right Column: Role Form */}
                <div className="space-y-4">
                    <div className="bg-white rounded-lg border p-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <h4 className="font-medium mb-2">
                                {selectedRole ? "Edit Role" : "Create New Role"}
                            </h4>

                            <input
                                type="text"
                                placeholder="Role Name *"
                                className="w-full p-2 border rounded"
                                value={roleName}
                                onChange={(e) => setRoleName(e.target.value)}
                                required
                            />

                            {/* Privileges Selection - List View */}
                            <div className="border rounded p-3">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="font-medium text-gray-700">Privileges *</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={selectAllPrivileges}
                                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearAllPrivileges}
                                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                {/* List View for Privileges - Removed checkmark symbol */}
                                <div className="space-y-1 max-h-60 overflow-y-auto border rounded">
                                    {PRIVILEGES.map((privilege) => (
                                        <label
                                            key={privilege.value}
                                            className={`flex items-center px-3 py-2 cursor-pointer transition-colors ${
                                                selectedPrivileges.includes(privilege.value)
                                                    ? "bg-blue-50"
                                                    : "hover:bg-gray-50"
                                            } ${privilege !== PRIVILEGES[PRIVILEGES.length - 1] ? 'border-b' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedPrivileges.includes(privilege.value)}
                                                onChange={() => togglePrivilege(privilege.value)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                                                disabled={isSubmitting}
                                            />
                                            <span className="text-sm flex-1">{privilege.label}</span>
                                            {/* Removed the checkmark symbol that was here */}
                                        </label>
                                    ))}
                                </div>

                                {selectedPrivileges.length > 0 && (
                                    <div className="mt-2 text-xs text-gray-500">
                                        {selectedPrivileges.length} privilege(s) selected
                                    </div>
                                )}
                            </div>

                            {/* Form Actions */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={
                                        isSubmitting ||
                                        !roleName.trim() ||
                                        selectedPrivileges.length === 0
                                    }
                                    className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? "..." : selectedRole ? "Update Role" : "Create Role"}
                                </button>
                                {(selectedRole || roleName.trim() || selectedPrivileges.length > 0) && (
                                    <button
                                        type="button"
                                        onClick={handleResetForm}
                                        className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Global Notification Dialog */}
            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() => setNotification({ show: false, type: "", message: "", action: null })}
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() => setNotification({ show: false, type: "", message: "", action: null })}
                errorMessage={notification.message}
                errorAction={notification.action}
                onErrorAction={handleConfirmAction}
                isActionLoading={isSubmitting}
            />
        </div>
    );
};

export default RoleManagement;