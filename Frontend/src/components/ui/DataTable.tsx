import React from "react";

interface DataTableProps {
  columns: Array<{
    header: string;
    accessor: string;
    sortable?: boolean;
    render?: (value: any, row: any) => React.ReactNode;
  }>;
  data: any[];
  onRowClick?: (row: any) => void;
  pagination?: {
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    currentPage: number;
  };
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  onRowClick,
  pagination,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-300">
            {columns.map((col) => (
              <th
                key={col.accessor}
                className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
              >
                {col.header}
                {col.sortable && <span className="ml-1">↕</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-6 text-center text-gray-600"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className="border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer"
              >
                {columns.map((col) => (
                  <td
                    key={col.accessor}
                    className="px-6 py-4 text-sm text-gray-900"
                  >
                    {col.render
                      ? col.render(row[col.accessor], row)
                      : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && (
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {pagination.currentPage * pagination.pageSize + 1} to{" "}
            {Math.min(
              (pagination.currentPage + 1) * pagination.pageSize,
              pagination.total,
            )}{" "}
            of {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={pagination.currentPage === 0}
              onClick={() =>
                pagination.onPageChange(pagination.currentPage - 1)
              }
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100"
            >
              Previous
            </button>
            <button
              disabled={
                (pagination.currentPage + 1) * pagination.pageSize >=
                pagination.total
              }
              onClick={() =>
                pagination.onPageChange(pagination.currentPage + 1)
              }
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
