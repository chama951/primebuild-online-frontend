import React, {useState} from "react";
import {LayoutDashboard, Cpu, Building, Package, Tag, Settings, Users, FileText, LogOut, Menu, X} from "lucide-react";

import ComponentManagement from "./ComponentManagement.jsx";
import ManageItems from "./ItemManagement.jsx";

const Dashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activePage, setActivePage] = useState("dashboard");

    // Navigation items
    const navigation = [
        {id: "dashboard", label: "Dashboard", icon: LayoutDashboard},
        {id: "components", label: "Components", icon: Cpu},
        {id: "manufacturers", label: "Manufacturers", icon: Building},
        {id: "items", label: "Items", icon: Package},
        {id: "features", label: "Features", icon: Tag},
        {id: "build", label: "Build Process", icon: Settings},
        {id: "users", label: "Users", icon: Users},
        {id: "docs", label: "Documentation", icon: FileText},
    ];

    // Render different content based on active page
    const renderContent = () => {
        switch (activePage) {
            case "components":
                return <ComponentManagement/>;
            case "items":
                return <ManageItems/>;
            case "dashboard":
            default:
                return (
                    <div className="p-8">
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Admin Dashboard</h1>
                        <p className="text-gray-600 mb-6">Select an option from the sidebar to get started.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow border">
                                <h3 className="font-semibold text-gray-800 mb-2">Components</h3>
                                <p className="text-gray-600 text-sm">Manage all system components</p>
                                <button
                                    onClick={() => setActivePage("components")}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Go to Components
                                </button>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow border">
                                <h3 className="font-semibold text-gray-800 mb-2">Manufacturers</h3>
                                <p className="text-gray-600 text-sm">Manage product manufacturers</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow border">
                                <h3 className="font-semibold text-gray-800 mb-2">Items</h3>
                                <p className="text-gray-600 text-sm">Manage product items</p>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div
                className={`
        fixed inset-y-0 left-0 z-50
        transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0
        w-64 bg-white border-r border-gray-200
        flex flex-col
      `}
            >
                {/* Sidebar Header */}
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div
                                className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                                <Cpu className="w-5 h-5 text-white"/>
                            </div>
                            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
                        </div>
                        <button onClick={() => setSidebarOpen(false)}
                                className="lg:hidden p-1 hover:bg-gray-100 rounded">
                            <X className="w-5 h-5 text-gray-500"/>
                        </button>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-1">
                        {navigation.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActivePage(item.id)}
                                className={`
                  w-full flex items-center px-3 py-3 rounded-lg transition-all
                  ${
                                    activePage === item.id
                                        ? "bg-blue-50 text-blue-600 font-medium border border-blue-100"
                                        : "text-gray-700 hover:bg-gray-100"
                                }
                `}
                            >
                                <item.icon className="w-5 h-5 mr-3"/>
                                <span className="flex-1 text-left">{item.label}</span>
                                {activePage === item.id && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t">
                    <button className="w-full flex items-center px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                        <LogOut className="w-5 h-5 mr-3"/>
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Button */}
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden fixed top-4 left-4 z-40 p-3 bg-blue-600 text-white rounded-lg shadow-lg"
                >
                    <Menu className="w-5 h-5"/>
                </button>
            )}

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
                {/* Top Bar */}
                <header className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 capitalize">
                                {activePage === "components" ? "Manage Components" : activePage.replace("-", " ")}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {activePage === "components"
                                    ? "Create, edit, and delete components"
                                    : "Manage your application settings"}
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>
                </header>

                {/* Page Content - This is where ManageComponents will render */}
                <div className="p-4 md:p-6">{renderContent()}</div>
            </main>
        </div>
    );
};

export default Dashboard;
