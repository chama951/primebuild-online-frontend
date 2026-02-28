import React from "react";

const NotificationDialogs = ({
                                 showSuccessDialog,
                                 setShowSuccessDialog,
                                 successMessage,
                                 showErrorDialog,
                                 setShowErrorDialog,
                                 errorMessage,
                                 errorAction = false,      // show confirm button
                                 onErrorAction = null,     // callback for confirm
                                 isActionLoading = false,  // loading state for confirm
                             }) => {
    return (
        <>
            {/* Success Dialog */}
            {showSuccessDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3 text-green-700 font-bold">
                                ✓
                            </div>
                            <h3 className="text-lg font-medium">Success</h3>
                        </div>
                        <p className="text-gray-600 mb-6">{successMessage}</p>
                        <button
                            onClick={() => setShowSuccessDialog(false)}
                            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Error / Confirmation Dialog */}
            {showErrorDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3 text-red-700 font-bold">
                                ⚠
                            </div>
                            <h3 className="text-lg font-medium">
                                {errorAction ? "Confirm Action" : "Error"}
                            </h3>
                        </div>
                        <p className="text-gray-600 mb-6">{errorMessage}</p>
                        <div className="flex gap-2">
                            {errorAction ? (
                                <>
                                    <button
                                        onClick={onErrorAction}
                                        disabled={isActionLoading}
                                        className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {isActionLoading ? "Processing..." : "Confirm"}
                                    </button>
                                    <button
                                        onClick={() => setShowErrorDialog(false)}
                                        disabled={isActionLoading}
                                        className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setShowErrorDialog(false)}
                                    className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    OK
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NotificationDialogs;