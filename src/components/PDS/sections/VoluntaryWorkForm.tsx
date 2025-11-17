'use client';
import React, { useEffect, useRef } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { VoluntaryWork } from '@/types/pds.types';
import { voluntaryWorkSchema } from '@/lib/pds/validation';
import { FormField } from '../FormField';
import { ArrayFieldSection } from '../ArrayFieldSection';
import { z } from 'zod';

interface VoluntaryWorkFormProps {
  data?: VoluntaryWork[];
  onChange: (data: VoluntaryWork[]) => void;
}

const arraySchema = z.array(voluntaryWorkSchema);

export const VoluntaryWorkForm: React.FC<VoluntaryWorkFormProps> = ({
  data,
  onChange,
}) => {
  const {
    control,
    watch,
    formState: { errors },
  } = useForm<{ items: VoluntaryWork[] }>({
    resolver: zodResolver(z.object({ items: arraySchema })),
    defaultValues: {
      items: data && data.length > 0 ? data : [],
    },
    mode: 'onBlur',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedData = watch('items');

  // Update parent component when form changes
  // Use useRef to prevent re-render on every keystroke while still detecting actual changes
  const previousDataRef = useRef<string>('');
  useEffect(() => {
    const currentData = JSON.stringify(watchedData);
    if (currentData !== previousDataRef.current) {
      previousDataRef.current = currentData;
      onChange(watchedData);
    }
  }, [watchedData, onChange]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Section VI: Voluntary Work or Involvement</h3>
        <p className="text-sm text-gray-600">Include voluntary work or involvement in civic/non-government/people/voluntary organizations.</p>
      </div>

      <ArrayFieldSection
        title="Voluntary Work & Community Involvement"
        description="Add all your voluntary work and community service activities"
        items={fields}
        onAdd={() =>
          append({
            organizationName: '',
            positionNatureOfWork: '',
            periodOfInvolvement: { from: '', to: '' },
          })
        }
        onRemove={remove}
        addButtonLabel="Add Voluntary Work"
        maxItems={15}
        emptyMessage="No voluntary work added yet. If you have community involvement, click 'Add Voluntary Work' to get started."
        renderItem={(field, index) => (
          <div className="space-y-4">
            {/* Organization & Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name={`items.${index}.organizationName`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Name of Organization"
                    name={`items.${index}.organizationName`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.organizationName?.message}
                    placeholder="e.g., Philippine Red Cross"
                    required
                  />
                )}
              />
              <Controller
                name={`items.${index}.organizationAddress`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Organization Address"
                    name={`items.${index}.organizationAddress`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Optional"
                  />
                )}
              />
            </div>

            {/* Position & Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name={`items.${index}.positionNatureOfWork`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Position / Nature of Work"
                    name={`items.${index}.positionNatureOfWork`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.positionNatureOfWork?.message}
                    placeholder="e.g., Volunteer Teacher"
                    required
                  />
                )}
              />
              <Controller
                name={`items.${index}.numberOfHours`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Number of Hours"
                    name={`items.${index}.numberOfHours`}
                    type="number"
                    value={field.value || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      field.onChange(isNaN(val) ? undefined : val);
                    }}
                    placeholder="Total hours (Optional)"
                  />
                )}
              />
            </div>

            {/* Period of Involvement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name={`items.${index}.periodOfInvolvement.from`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="From"
                    name={`items.${index}.periodOfInvolvement.from`}
                    type="date"
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.periodOfInvolvement?.from?.message}
                    required
                  />
                )}
              />
              <Controller
                name={`items.${index}.periodOfInvolvement.to`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="To"
                    name={`items.${index}.periodOfInvolvement.to`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.periodOfInvolvement?.to?.message}
                    placeholder="YYYY-MM-DD or 'Present'"
                    helpText="Enter date or type 'Present' if ongoing"
                    required
                  />
                )}
              />
            </div>
          </div>
        )}
      />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> This section is optional but demonstrates your community engagement and leadership skills.
        </p>
      </div>
    </div>
  );
};
