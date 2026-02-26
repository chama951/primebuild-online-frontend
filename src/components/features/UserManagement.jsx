import {useEffect, useState} from "react";
import DataTable from "../common/DataTable.jsx";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import Unauthorized from "../common/Unauthorized.jsx";
import { useGetUsersQuery, useUpdateUserMutation, useDeleteUserMutation } from "../../services/userApi.js";
import { useGetRolesQuery } from "../../services/roleApi.js";

const UserManagement = ({refetchFlag, resetFlag}) => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [roleId, setRoleId] = useState("");
    const [signUpMethod, setSignUpMethod] = useState("");
    const [userType, setUserType] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState({ show: false, type: "", message: "", action: null });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const { data: users = [], error: usersError, refetch: refetchUsers, isLoading: usersLoading } = useGetUsersQuery(filterType ? {type: filterType} : {});
    const { data: roles = [], error: rolesError } = useGetRolesQuery();
    const [updateUser] = useUpdateUserMutation();
    const [deleteUser] = useDeleteUserMutation();

    useEffect(() => { if (refetchFlag) { refetchUsers(); resetFlag(); } }, [refetchFlag, refetchUsers, resetFlag]);
    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterType]);

    const isUnauthorized = () => [usersError, rolesError].some(err => err?.isUnauthorized);
    if (isUnauthorized()) return <Unauthorized/>;

    const filteredUsers = users.filter(user =>
        user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.role?.roleName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const transformedUsers = filteredUsers.map(user => ({
        ...user,
        roleName: user.role?.roleName || 'N/A',
        roleId: user.role?.id,
        userType: user.role?.roleName?.toLowerCase().includes('admin') || user.role?.roleName?.toLowerCase().includes('staff') ? 'staff' : 'customer'
    }));

    const totalPages = Math.ceil(transformedUsers.length / itemsPerPage);
    const paginatedUsers = transformedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const showNotification = (type, message, action = null) => setNotification({show: true, type, message, action});

    const handleConfirmAction = async () => {
        if (!notification.action) return;
        const {callback} = notification.action;
        setIsSubmitting(true);
        try {
            const result = await callback();
            showNotification("success", result?.data?.message || notification.action.successMessage || "Action completed!");
        } catch (error) {
            showNotification("error", error.data?.message || notification.action.errorMessage || "Error performing action.");
        } finally {
            setIsSubmitting(false);
            setNotification(prev => ({...prev, action: null}));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return showNotification("error", "Please enter a username");
        if (!email.trim()) return showNotification("error", "Please enter an email");
        if (!roleId) return showNotification("error", "Please select a role");

        setIsSubmitting(true);
        try {
            const response = await updateUser({
                id: selectedUser.userId,
                username: username.trim(),
                email: email.trim(),
                signUpMethod: signUpMethod,
                roleId: parseInt(roleId),
            }).unwrap();
            showNotification("success", response?.message || "User updated successfully!");
            handleResetForm();
            refetchUsers();
        } catch (error) {
            showNotification("error", error.data?.message || "An error occurred while updating.");
        } finally { setIsSubmitting(false); }
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setUsername(user.username);
        setEmail(user.email);
        setRoleId(user.role?.id?.toString() || "");
        setSignUpMethod(user.signUpMethod || "");
        setUserType(user.role?.roleName?.toLowerCase().includes('admin') || user.role?.roleName?.toLowerCase().includes('staff') ? 'staff' : 'customer');
    };

    const handleResetForm = () => {
        setSelectedUser(null);
        setUsername(""); setEmail(""); setRoleId(""); setSignUpMethod(""); setUserType("");
    };

    const handleDeleteUser = (user) => {
        showNotification("error", `Are you sure you want to delete user "${user.username}"?`, {
            callback: async () => {
                try {
                    const response = await deleteUser(user.userId).unwrap();
                    refetchUsers();
                    if (selectedUser?.userId === user.userId) handleResetForm();
                    return response;
                } catch (error) { throw error; }
            },
            successMessage: "User deleted successfully!",
            errorMessage: "Error deleting user.",
        });
    };

    const columns = [
        { key: "userId", header: "ID", render: (item) => <div className="text-sm text-gray-500">#{item.userId}</div> },
        { key: "username", header: "Username", render: (item) => (
                <div className="text-sm font-medium">
                    {item.username}
                    {!item.enabled && <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">Disabled</span>}
                </div>
            )},
        { key: "role", header: "Role", render: (item) => (
                <div><span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{item.role?.roleName || 'N/A'}</span></div>
            )},
    ];

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <input type="text" placeholder="Search users..." className="w-full pl-4 pr-10 py-2 border rounded"
                                       value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-3 top-2.5 text-gray-400">✕</button>}
                            </div>
                            <select className="w-40 p-2 border rounded text-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <option value="">All Types</option>
                                <option value="staff">Staff</option>
                                <option value="customer">Customer</option>
                            </select>
                        </div>
                    </div>
                    <DataTable items={paginatedUsers} selectedItem={selectedUser} onSelectItem={handleSelectUser}
                               onDeleteItemClick={handleDeleteUser} isLoading={usersLoading} columns={columns} emptyMessage="No users found" />
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-4">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Prev
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 border rounded ${currentPage === page ? "bg-blue-600 text-white" : ""}`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-white rounded-lg border p-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" placeholder="Username *" className="w-full p-2 border rounded"
                                   value={username} onChange={(e) => setUsername(e.target.value)}
                                   disabled={!selectedUser || isSubmitting} required />
                            <input type="email" placeholder="Email *" className="w-full p-2 border rounded"
                                   value={email} onChange={(e) => setEmail(e.target.value)}
                                   disabled={!selectedUser || isSubmitting} required />
                            <input type="hidden" name="signUpMethod" value={signUpMethod} />
                            <select className="w-full p-2 border rounded" value={roleId} onChange={(e) => setRoleId(e.target.value)}
                                    disabled={!selectedUser || isSubmitting} required>
                                <option value="">Select Role *</option>
                                {roles.map(role => <option key={role.id} value={role.id}>{role.roleName}</option>)}
                            </select>
                            {selectedUser && (
                                <div className="border rounded p-3 space-y-2 bg-gray-50">
                                    <div className="flex justify-between text-sm"><span className="text-gray-600">User ID:</span><span className="font-medium">#{selectedUser.userId}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-600">Email:</span><span className="font-medium">{selectedUser.email}</span></div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Status:</span>
                                        <span className={`font-medium ${selectedUser.enabled ? 'text-green-600' : 'text-red-600'}`}>
                                            {selectedUser.enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-600">Type:</span><span className="font-medium">{userType}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-600">Sign Up:</span><span className="font-medium">{selectedUser.signUpMethod}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-600">Created:</span><span className="font-medium">{selectedUser.createdDate}</span></div>
                                </div>
                            )}
                            {selectedUser && (
                                <div className="flex gap-2 pt-2">
                                    <button type="submit" disabled={isSubmitting || !username.trim() || !email.trim() || !roleId}
                                            className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                                        {isSubmitting ? "..." : "Update User"}
                                    </button>
                                    <button type="button" onClick={handleResetForm} className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50">
                                        Clear
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                    <div className="bg-white rounded-lg border p-4">
                        <h4 className="font-medium mb-2">User Statistics</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm"><span className="text-gray-600">Total Users:</span><span className="font-medium">{users.length}</span></div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Staff:</span>
                                <span className="font-medium">{users.filter(u => u.role?.roleName?.toLowerCase().includes('admin') || u.role?.roleName?.toLowerCase().includes('staff')).length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Customers:</span>
                                <span className="font-medium">{users.filter(u => !u.role?.roleName?.toLowerCase().includes('admin') && !u.role?.roleName?.toLowerCase().includes('staff')).length}</span>
                            </div>
                            <div className="flex justify-between text-sm"><span className="text-gray-600">Enabled:</span><span className="font-medium text-green-600">{users.filter(u => u.enabled).length}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-600">Disabled:</span><span className="font-medium text-red-600">{users.filter(u => !u.enabled).length}</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() => setNotification({show: false, type: "", message: "", action: null})}
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() => setNotification({show: false, type: "", message: "", action: null})}
                errorMessage={notification.message} errorAction={notification.action}
                onErrorAction={handleConfirmAction} isActionLoading={isSubmitting}
            />
        </div>
    );
};

export default UserManagement;