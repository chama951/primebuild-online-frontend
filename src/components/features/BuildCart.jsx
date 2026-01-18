import React, {useState} from 'react';
import {useGetBuildComponentsQuery} from '../../features/components/componentApi.js';
import ComponentItemsTable from "../common/ComponentItemsTable.jsx";


const BuildCart = () => {
    const isBuild = true;
    const {data: buildComponents, isLoading, error} = useGetBuildComponentsQuery(isBuild);
    const [isComponentItemsTableOpen, setIsComponentItemsTableOpen] = useState()
    const [selectedComponent, setSelectedComponent] = useState()

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading build components...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-600 mt-1">{error.message}</p>
            </div>
        );
    }

    if (buildComponents.length === 0) {
        return (
            <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-700">No Build Components Available</h3>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Build Your PC</h2>

            <div className="space-y-4">
                {buildComponents.map((component) => (
                    <div
                        key={component.id}
                        className="bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors p-6 text-center"
                    >
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">
                            {component.componentName}
                        </h3>

                        <p className="text-sm text-gray-500 mb-4">
                            Click the plus button to add a {component.componentName.toLowerCase()}
                        </p>

                        <button
                            onClick={() => {
                                console.log(`Add ${component.componentName}`);
                                setSelectedComponent(component); // Set the component
                                setIsComponentItemsTableOpen(true); // Open the table modal
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                        </button>

                        {isComponentItemsTableOpen && selectedComponent && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-bold">
                                            Select Item for {selectedComponent.componentName}
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setIsComponentItemsTableOpen(false);
                                                setSelectedComponent(null);
                                            }}
                                            className="p-2 hover:bg-gray-100 rounded"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <ComponentItemsTable
                                        component={selectedComponent}
                                        onClose={() => {
                                            setIsComponentItemsTableOpen(false);
                                            setSelectedComponent(null);
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BuildCart;