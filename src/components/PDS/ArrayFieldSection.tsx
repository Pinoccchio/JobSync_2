'use client';
import React from 'react';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

interface ArrayFieldSectionProps {
  title: string;
  description?: string;
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  onAdd: () => void;
  onRemove: (index: number) => void;
  addButtonLabel?: string;
  minItems?: number;
  maxItems?: number;
  emptyMessage?: string;
}

export const ArrayFieldSection: React.FC<ArrayFieldSectionProps> = ({
  title,
  description,
  items,
  renderItem,
  onAdd,
  onRemove,
  addButtonLabel = 'Add Entry',
  minItems = 0,
  maxItems = 20,
  emptyMessage = 'No entries added yet. Click "Add Entry" to get started.',
}) => {
  const canRemove = items.length > minItems;
  const canAdd = items.length < maxItems;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {canAdd && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={onAdd}
          >
            {addButtonLabel}
          </Button>
        )}
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-sm">{emptyMessage}</p>
          {canAdd && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={onAdd}
              className="mt-4"
            >
              {addButtonLabel}
            </Button>
          )}
        </div>
      )}

      {/* Items List */}
      {items.length > 0 && (
        <div className="space-y-6">
          {items.map((item, index) => (
            <div
              key={item.id || index}
              className="bg-white border border-gray-200 rounded-lg p-6 relative"
            >
              {/* Remove Button */}
              {canRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove this entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {/* Item Number Badge */}
              <div className="absolute top-4 left-4 w-8 h-8 bg-[#22A555] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </div>

              {/* Item Content */}
              <div className="pl-12 pr-12">
                {renderItem(item, index)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Another Button (at bottom) */}
      {items.length > 0 && canAdd && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={Plus}
          onClick={onAdd}
          className="w-full"
        >
          Add Another Entry
        </Button>
      )}

      {/* Items Count */}
      {items.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          {items.length} {items.length === 1 ? 'entry' : 'entries'}
          {maxItems && maxItems < Infinity && ` • Maximum: ${maxItems}`}
        </p>
      )}
    </div>
  );
};
