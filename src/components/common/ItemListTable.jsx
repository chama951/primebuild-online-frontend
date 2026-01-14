const ItemListTable = ({
  // Data props
  items = [],
  selectedItem,
  onSelectItem,
  onDeleteItemClick,
  isLoading = false,

  // Column configuration
  columns = [],

  // Empty state
  emptyMessage = "No items found",

  // Loading state
  loadingMessage = "Loading...",
}) => {
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        {loadingMessage && <span className="ml-3 text-gray-600">{loadingMessage}</span>}
      </div>
    );
  }

  // Render empty state
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-fixed min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key || index}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${
                    column.className || ""
                  }`}
                  style={column.style || {}}
                >
                  {column.header}
                </th>
              ))}
              {/* Actions column - always shown if there are actions */}
              {(onSelectItem || onDeleteItemClick) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => {
              const isSelected = selectedItem?.id === item.id;

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50 cursor-pointer ${isSelected ? "bg-blue-50" : ""}`}
                  onClick={() => onSelectItem && onSelectItem(item)}
                >
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-normal break-words">
                      {column.render ? (
                        column.render(item)
                      ) : (
                        <div className="text-sm text-gray-900 break-words">{item[column.key] || ""}</div>
                      )}
                    </td>
                  ))}

                  {/* Action buttons */}
                  {(onSelectItem || onDeleteItemClick) && (
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {onSelectItem && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectItem(item);
                            }}
                            className="px-3 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 whitespace-nowrap"
                          >
                            Edit
                          </button>
                        )}
                        {onDeleteItemClick && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteItemClick(item);
                            }}
                            className="px-3 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 whitespace-nowrap"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemListTable;
