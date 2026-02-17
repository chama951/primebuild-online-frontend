import React, {useState, useEffect} from "react";
import {Cpu, Building, Package, Settings, Users, FileText, Menu, X,} from "lucide-react";

import ComponentManagement from "./ComponentManagement.jsx";
import ItemManagement from "./ItemManagement.jsx";
import ManufacturerManagement from "./ManufacturerManagement.jsx";
import BuildCart from "./BuildCart.jsx";

const Dashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activePage, setActivePage] = useState("dashboard");

    const [refetchFlags, setRefetchFlags] = useState({
        components: false,
        manufacturers: false,
        items: false,
        build: false,
    });

    useEffect(() => {
        const flagMap = {
            components: "components",
            manufacturers: "manufacturers",
            items: "items",
            build: "build",
        };

        const flag = flagMap[activePage];
        if (flag) {
            setRefetchFlags((prev) => {
                if (!prev[flag]) {
                    return {...prev, [flag]: true};
                }
                return prev;
            });
        }
    }, [activePage]);

    const navigation = [
        {id: "manufacturers", label: "Manufacturers", icon: Building},
        {id: "components", label: "Components", icon: Cpu},
        {id: "items", label: "Items", icon: Package},
        {id: "build", label: "Build", icon: Settings},
        {id: "users", label: "Users", icon: Users},
        {id: "docs", label: "Documentation", icon: FileText},
    ];

    const renderContent = () => {
        switch (activePage) {
            case "components":
                return (
                    <ComponentManagement
                        refetchFlag={refetchFlags.components}
                        resetFlag={() =>
                            setRefetchFlags((prev) => ({...prev, components: false}))
                        }
                    />
                );
            case "manufacturers":
                return (
                    <ManufacturerManagement
                        refetchFlag={refetchFlags.manufacturers}
                        resetFlag={() =>
                            setRefetchFlags((prev) => ({...prev, manufacturers: false}))
                        }
                    />
                );
            case "items":
                return (
                    <ItemManagement
                        refetchFlag={refetchFlags.items}
                        resetFlag={() =>
                            setRefetchFlags((prev) => ({...prev, items: false}))
                        }
                    />
                );
            case "build":
                return (
                    <BuildCart
                        refetchFlag={refetchFlags.build}
                        resetFlag={() =>
                            setRefetchFlags((prev) => ({...prev, build: false}))
                        }
                    />
                );
            default:
                return (
                    <div className="p-8">
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">
                            Welcome to Admin Dashboard
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Select an option from the sidebar to get started.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {navigation
                                .filter((nav) => nav.id !== "docs")
                                .map((nav) => (
                                    <div
                                        key={nav.id}
                                        className="bg-white p-6 rounded-lg shadow border"
                                    >
                                        <h3 className="font-semibold text-gray-800 mb-2">
                                            {nav.label}
                                        </h3>
                                        <p className="text-gray-600 text-sm">
                                            Manage {nav.label.toLowerCase()}
                                        </p>
                                        <button
                                            onClick={() => setActivePage(nav.id)}
                                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                            Go to {nav.label}
                                        </button>
                                    </div>
                                ))}
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
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div
                            className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                            <Cpu className="w-5 h-5 text-white"/>
                        </div>
                        <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1 hover:bg-gray-100 rounded"
                    >
                        <X className="w-5 h-5 text-gray-500"/>
                    </button>
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
                                {activePage === item.id && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </nav>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-30 lg:hidden z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Menu Button */}
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-blue-600 text-white rounded-lg shadow-lg"
                >
                    <Menu className="w-5 h-5"/>
                </button>
            )}

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
                <div className="p-4 md:p-6">{renderContent()}</div>
            </main>
        </div>
    );
};

export default Dashboard;
