'use client';
import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Download } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

interface TableColumn {
  header: string;
  accessor: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface EnhancedTableProps {
  columns: TableColumn[];
  data: any[];
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  paginated?: boolean;
  pageSize?: number;
  onExport?: () => void;
  exportLabel?: string;
  getRowClassName?: (row: any) => string;
  getRowColor?: (row: any) => string; // NEW: For event severity-based row coloring
}

export const EnhancedTable: React.FC<EnhancedTableProps> = ({
  columns,
  data,
  className = '',
  searchable = false,
  searchPlaceholder = 'Search...',
  paginated = false,
  pageSize = 10,
  onExport,
  exportLabel = 'Export',
  getRowClassName,
  getRowColor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    return data.filter(row =>
      columns.some(column => {
        const value = row[column.accessor];
        return value?.toString().toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
  }, [data, searchQuery, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, paginated]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';

    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }

    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }

    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-[#22A555]" />
    ) : (
      <ChevronDown className="w-4 h-4 text-[#22A555]" />
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Export Bar */}
      {(searchable || onExport) && (
        <div className="flex items-center gap-4 justify-between">
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="pl-10"
              />
            </div>
          )}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={onExport}
            >
              {exportLabel}
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#D4F4DD]">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={cn(
                    'px-6 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-300',
                    column.sortable && 'cursor-pointer hover:bg-[#C4E4CD] transition-colors select-none'
                  )}
                  onClick={() => column.sortable && handleSort(column.accessor)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable && getSortIcon(column.accessor)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => {
                const customClassName = getRowClassName ? getRowClassName(row) : '';
                const rowColor = getRowColor ? getRowColor(row) : '';
                return (
                  <tr
                    key={rowIndex}
                    className={cn(
                      "border-b border-gray-200 transition-all duration-150",
                      rowColor || "hover:bg-gray-50",
                      customClassName
                    )}
                  >
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 text-sm text-gray-700">
                        {column.render
                          ? column.render(row[column.accessor], row)
                          : row[column.accessor]}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-12 h-12 text-gray-300" />
                    <p className="font-medium">No results found</p>
                    {searchQuery && (
                      <p className="text-sm">
                        Try adjusting your search to find what you're looking for.
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing{' '}
            <span className="font-medium">
              {(currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </span>{' '}
            of <span className="font-medium">{sortedData.length}</span> results
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'px-3 py-1 text-sm rounded-md transition-colors',
                        page === currentPage
                          ? 'bg-[#22A555] text-white font-medium'
                          : 'hover:bg-gray-100 text-gray-700'
                      )}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return (
                    <span key={page} className="px-2 text-gray-500">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
