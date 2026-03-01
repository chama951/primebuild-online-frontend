import React, {useState, useEffect} from "react";
import {
    Cpu,
    Factory,
    Package,
    Settings,
    Users,
    FileText,
    Menu,
    ChevronLeft,
    ChevronRight,
    UserCog,
    CreditCard,
    UserCircle,
    TrendingUp,
    DollarSign,
    ChartSpline,
    ChartPie,
    ShoppingCart,
} from "lucide-react";

import ComponentManagement from "./ComponentManagement.jsx";
import ItemManagement from "./ItemManagement.jsx";
import ManufacturerManagement from "./ManufacturerManagement.jsx";
import BuildCart from "./BuildCart.jsx";
import RoleManagement from "./RoleManagement.jsx";
import UserManagement from "./UserManagement.jsx";
import MyAccount from "./MyAccount.jsx";
import InvoiceManagement from "./InvoiceManagement.jsx";
import PaymentManagement from "./PaymentManagement.jsx";
// import Reports from "./Reports.jsx";
import ExchangeRate from "./ExchangeRate.jsx";
import ItemData from "./ItemData.jsx";
import ItemAnalytics from "./ItemAnalytics.jsx";
import Cart from "./Cart.jsx";

const Dashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarMinimized, setSidebarMinimized] = useState(false);
    const [activePage, setActivePage] = useState("dashboard");

    const [refetchFlags, setRefetchFlags] = useState({
        components: false,
        manufacturers: false,
        items: false,
        build: false,
        roles: false,
        users: false,
        myAccount: false,
        invoices: false,
        payments: false,
        reports: false,
        exchangeRate: false,
        itemData: false,
        itemAnalytics: false,
        cart: false,
    });

    useEffect(() => {
        const flagMap = {
            components: "components",
            manufacturers: "manufacturers",
            items: "items",
            build: "build",
            roles: "roles",
            users: "users",
            myAccount: "myAccount",
            invoices: "invoices",
            payments: "payments",
            // reports: "reports",
            exchangeRate: "exchangeRate",
            itemData: "itemData",
            itemAnalytics: "itemAnalytics",
            cart: "cart",
        };
        const flag = flagMap[activePage];
        if (flag) {
            setRefetchFlags(prev => ({...prev, [flag]: true}));
        }
    }, [activePage]);

    const navigation = [
        {id: "roles", label: "Roles", icon: UserCog},
        {id: "users", label: "Users", icon: Users},
        {id: "manufacturers", label: "Manufacturers", icon: Factory},
        {id: "components", label: "Components", icon: Cpu},
        {id: "items", label: "Items", icon: Package},
        {id: "build", label: "Build", icon: Settings},
        {id: "cart", label: "Cart", icon: ShoppingCart},
        {id: "invoices", label: "Invoices", icon: FileText},
        {id: "payments", label: "Payments", icon: CreditCard},
        // {id: "reports", label: "Reports", icon: TrendingUp},
        {id: "itemAnalytics", label: "item Analytics", icon: ChartPie},
        {id: "exchangeRate", label: "Exchange Rate", icon: DollarSign},
        {id: "itemData", label: "item Data", icon: ChartSpline},
        {id: "myAccount", label: "My Account", icon: UserCircle},

    ];

    const renderContent = () => {
        switch (activePage) {
            case "components":
                return <ComponentManagement refetchFlag={refetchFlags.components}
                                            resetFlag={() => setRefetchFlags(prev => ({...prev, components: false}))}/>;
            case "manufacturers":
                return <ManufacturerManagement refetchFlag={refetchFlags.manufacturers}
                                               resetFlag={() => setRefetchFlags(prev => ({
                                                   ...prev,
                                                   manufacturers: false
                                               }))}/>;
            case "items":
                return <ItemManagement refetchFlag={refetchFlags.items}
                                       resetFlag={() => setRefetchFlags(prev => ({...prev, items: false}))}/>;
            case "build":
                return <BuildCart refetchFlag={refetchFlags.build}
                                  resetFlag={() => setRefetchFlags(prev => ({...prev, build: false}))}/>;
            case "roles":
                return <RoleManagement refetchFlag={refetchFlags.roles}
                                       resetFlag={() => setRefetchFlags(prev => ({...prev, roles: false}))}/>;
            case "users":
                return <UserManagement refetchFlag={refetchFlags.users}
                                       resetFlag={() => setRefetchFlags(prev => ({...prev, users: false}))}/>;
            case "myAccount":
                return <MyAccount refetchFlag={refetchFlags.myAccount}
                                  resetFlag={() => setRefetchFlags(prev => ({...prev, myAccount: false}))}/>;
            case "invoices":
                return <InvoiceManagement refetchFlag={refetchFlags.invoices}
                                          resetFlag={() => setRefetchFlags(prev => ({...prev, invoices: false}))}/>;
            case "payments":
                return <PaymentManagement refetchFlag={refetchFlags.payments}
                                          resetFlag={() => setRefetchFlags(prev => ({...prev, payments: false}))}/>;
            // case "reports":
            //     return <Reports refetchFlag={refetchFlags.reports}
            //                     resetFlag={() => setRefetchFlags(prev => ({...prev, reports: false}))}/>;
            case "exchangeRate":
                return (
                    <ExchangeRate
                        refetchFlag={refetchFlags.exchangeRate}
                        resetFlag={() =>
                            setRefetchFlags(prev => ({...prev, exchangeRate: false}))
                        }
                    />
                );
            case "itemAnalytics":
                return (
                    <ItemAnalytics
                        refetchFlag={refetchFlags.itemAnalytics}
                        resetFlag={() => setRefetchFlags(prev => ({...prev, itemAnalytics: false}))}
                    />
                );
            case "itemData":
                return (
                    <ItemData
                        refetchFlag={refetchFlags.itemData}
                        resetFlag={() =>
                            setRefetchFlags(prev => ({...prev, itemData: false}))
                        }
                    />
                );
            case "cart":
                return (
                    <Cart
                        refetchFlag={refetchFlags.cart}
                        resetFlag={() =>
                            setRefetchFlags(prev => ({...prev, cart: false}))
                        }
                    />
                );
            default:
                return (
                    <div className="p-6">
                        <p className="text-gray-600 mb-6">Select an option from the sidebar to get started.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {navigation.map(nav => (
                                <div key={nav.id} className="bg-white p-6 rounded-lg shadow border">
                                    <h3 className="font-semibold text-gray-800 mb-2">{nav.label}</h3>
                                    <p className="text-gray-600 text-sm">Manage {nav.label.toLowerCase()}</p>
                                    <button onClick={() => setActivePage(nav.id)}
                                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
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

            <div className={`flex flex-col transition-all duration-100 ${
                sidebarOpen
                    ? sidebarMinimized
                        ? "w-20"
                        : "w-60"
                    : "-translate-x-full"
            } bg-white border-r border-gray-200`}>

                <div className="flex items-center justify-between px-5 py-4 border-b bg-white shadow-sm">

                    <div className="flex items-center space-x-3">
                        {!sidebarMinimized && (
                            <h1 className="text-lg font-semibold text-gray-800 tracking-tight transition-all duration-300">
                                Dashboard
                            </h1>
                        )}
                    </div>

                    <button
                        onClick={() => setSidebarMinimized(!sidebarMinimized)}
                        className="p-2 rounded-xl bg-gray-50 hover:bg-blue-50 hover:scale-105 active:scale-95
                   transition-all duration-200 ease-in-out shadow-sm hover:shadow"
                        title={sidebarMinimized ? "Expand sidebar" : "Minimize sidebar"}
                    >
                        {sidebarMinimized ? (
                            <ChevronRight
                                className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors"/>
                        ) : (
                            <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors"/>
                        )}
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {navigation.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActivePage(item.id)}
                            className={`flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-gray-100 transition-all ${
                                activePage === item.id
                                    ? "bg-blue-50 text-blue-600 font-medium border border-blue-100"
                                    : "text-gray-700 hover:text-gray-900"
                            }`}
                            title={sidebarMinimized ? item.label : ""}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0"/>
                            {!sidebarMinimized && (
                                <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="fixed top-4 left-4 lg:hidden z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50"
                >
                    <Menu className="w-5 h-5 text-gray-600"/>
                </button>
            )}

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-30 lg:hidden z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <main className="flex-1 overflow-auto">
                {renderContent()}
            </main>
        </div>
    );
};

export default Dashboard;