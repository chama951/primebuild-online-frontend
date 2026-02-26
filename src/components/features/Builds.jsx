import { useState, useMemo } from "react";
import { useGetStaffMadeBuildsQuery, useGetCurrentUserBuildsQuery } from "../../services/buildApi.js";
import BuildDetails from "./BuildDetails.jsx";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import { useCreateOrUpdateCartMutation, useGetCartQuery } from "../../services/cartApi.js";

const Builds = () => {
    const [activeTab, setActiveTab] = useState("prime");
    const { data: staffBuilds = [], isLoading: isStaffLoading, isError: isStaffError } = useGetStaffMadeBuildsQuery();
    const { data: myBuilds = [], isLoading: isMyLoading, isError: isMyError } = useGetCurrentUserBuildsQuery();

    const { data: cartData } = useGetCartQuery();
    const [updateCart] = useCreateOrUpdateCartMutation();

    const [selectedItemsByComponent, setSelectedItemsByComponent] = useState({});
    const [priceRange, setPriceRange] = useState([0, 1000000]);
    const [selectedBuild, setSelectedBuild] = useState(null);

    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const builds = useMemo(() => (activeTab === "prime" ? staffBuilds : myBuilds), [activeTab, staffBuilds, myBuilds]);
    const isLoading = activeTab === "prime" ? isStaffLoading : isMyLoading;
    const isError = activeTab === "prime" ? isStaffError : isMyError;

    const componentsWithItems = useMemo(() => {
        const map = {};
        builds.forEach((b) => {
            b.buildItemList.forEach((bi) => {
                const compName = bi.item.component?.componentName || "Other";
                if (!map[compName]) map[compName] = new Set();
                map[compName].add(bi.item.itemName);
            });
        });
        const result = {};
        Object.keys(map).forEach((k) => {
            result[k] = Array.from(map[k]);
        });
        return result;
    }, [builds]);

    const clearFilters = () => setSelectedItemsByComponent({});

    const filteredBuilds = useMemo(() => {
        return builds.filter((build) => {
            for (const [compName, itemName] of Object.entries(selectedItemsByComponent)) {
                if (!build.buildItemList.some(bi => bi.item.component?.componentName === compName && bi.item.itemName === itemName)) {
                    return false;
                }
            }
            if (build.totalPrice < priceRange[0] || build.totalPrice > priceRange[1]) return false;
            return true;
        });
    }, [builds, selectedItemsByComponent, priceRange]);

    const handleAddBuildToCart = async (build) => {
        try {
            const existingItems = cartData?.cartItemList || [];
            const updatedItemList = existingItems.map((ci) => ({ id: ci.item.id, quantity: ci.cartQuantity }));

            build.buildItemList.forEach((bItem) => {
                const index = updatedItemList.findIndex((ci) => ci.id === bItem.item.id);
                if (index !== -1) updatedItemList[index].quantity += bItem.buildQuantity;
                else updatedItemList.push({ id: bItem.item.id, quantity: bItem.buildQuantity });
            });

            await updateCart({ itemList: updatedItemList }).unwrap();
            setSuccessMessage(`Added "${build.buildName}" to cart`);
            setShowSuccessDialog(true);
        } catch (err) {
            setErrorMessage(err?.data?.message || "Failed to add build to cart");
            setShowErrorDialog(true);
        }
    };

    if (isLoading) return <div className="text-gray-500 py-4">Loading builds...</div>;
    if (isError) return <div className="text-red-500 py-4">Failed to load builds.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-4 flex gap-6">

            {/* Sidebar */}
            <div className="w-64 flex-shrink-0 border-r pr-4 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto">
                <h4 className="font-semibold mb-2">Components & Items</h4>

                {Object.entries(componentsWithItems).map(([compName, items]) => (
                    <div key={compName} className="mb-4">
                        <h5 className="font-medium mb-1">{compName}</h5>
                        <div className="ml-2 flex flex-col gap-2">
                            {items.map(itemName => (
                                <button
                                    key={itemName}
                                    onClick={() =>
                                        setSelectedItemsByComponent(prev => {
                                            // toggle: deselect if already selected
                                            if (prev[compName] === itemName) {
                                                const copy = { ...prev };
                                                delete copy[compName]; // nothing selected = "All"
                                                return copy;
                                            }
                                            // select this item
                                            return { ...prev, [compName]: itemName };
                                        })
                                    }
                                    className={`px-3 py-1 rounded-lg border text-left shadow-sm transition font-medium
                                        ${selectedItemsByComponent[compName] === itemName
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"}`}
                                >
                                    {itemName}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {Object.keys(selectedItemsByComponent).length > 0 && (
                    <button
                        onClick={clearFilters}
                        className="mt-2 px-3 py-1 rounded-lg border border-red-500 text-red-500 hover:bg-red-50 w-full font-medium transition-colors"
                    >
                        Clear Filters
                    </button>
                )}

                {/* Price range */}
                <div className="mt-6">
                    <h4 className="font-semibold mb-2">Price Range (LKR)</h4>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Min"
                            value={priceRange[0]}
                            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                            className="p-2 border rounded w-full"
                        />
                        <input
                            type="number"
                            placeholder="Max"
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                            className="p-2 border rounded w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Build cards */}
            <div className="flex-1">
                {/* Tabs */}
                <div className="flex gap-4 mb-4">
                    <button
                        onClick={() => setActiveTab("my")}
                        className={`px-4 py-2 rounded-lg border ${activeTab === "my" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300 hover:bg-blue-50"}`}
                    >
                        My Builds
                    </button>
                    <button
                        onClick={() => setActiveTab("prime")}
                        className={`px-4 py-2 rounded-lg border ${activeTab === "prime" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300 hover:bg-blue-50"}`}
                    >
                        Prime Builds
                    </button>
                </div>

                {/* Grid with twice-wide cards */}
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {filteredBuilds.length > 0 ? (
                        filteredBuilds.map((build) => (
                            <div key={build.id} className="border rounded-lg p-6 shadow hover:shadow-md transition flex flex-col justify-between bg-white">
                                <div onClick={() => setSelectedBuild(build)} className="cursor-pointer">
                                    <h3 className="font-semibold text-lg line-clamp-2">{build.buildName}</h3>
                                    <p className="text-gray-500 mt-1">Created by: {build.user.username}</p>
                                    <p className="text-gray-500 mt-2 text-xs">Created: {new Date(build.createdAt).toLocaleDateString()}</p>
                                    <p className="text-gray-700 mt-2 font-medium">Total Price: LKR {build.totalPrice.toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAddBuildToCart(build); }}
                                    className="mt-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                >
                                    Add to Cart
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-500 col-span-full py-4">No builds match the selected filters.</div>
                    )}
                </div>
            </div>

            {selectedBuild && <BuildDetails build={selectedBuild} onClose={() => setSelectedBuild(null)} />}

            <NotificationDialogs
                showSuccessDialog={showSuccessDialog}
                setShowSuccessDialog={() => setShowSuccessDialog(false)}
                successMessage={successMessage}
                showErrorDialog={showErrorDialog}
                setShowErrorDialog={() => setShowErrorDialog(false)}
                errorMessage={errorMessage}
            />
        </div>
    );
};

export default Builds;