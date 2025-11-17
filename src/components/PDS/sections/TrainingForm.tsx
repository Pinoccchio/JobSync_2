'use client';
import React, { useEffect, useRef } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Training } from '@/types/pds.types';
import { trainingSchema } from '@/lib/pds/validation';
import { FormField } from '../FormField';
import { ArrayFieldSection } from '../ArrayFieldSection';
import { z } from 'zod';

interface TrainingFormProps {
  data?: Training[];
  onChange: (data: Training[]) => void;
}

const arraySchema = z.array(trainingSchema);

export const TrainingForm: React.FC<TrainingFormProps> = ({
  data,
  onChange,
}) => {
  const {
    control,
    watch,
    formState: { errors },
  } = useForm<{ items: Training[] }>({
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
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Section VII: Learning and Development (L&D)</h3>
        <p className="text-sm text-gray-600">Include all training programs, seminars, workshops, and learning interventions you have attended.</p>
      </div>

      <ArrayFieldSection
        title="Training Programs & Seminars Attended"
        description="Add all professional development and training programs"
        items={fields}
        onAdd={() =>
          append({
            title: '',
            periodOfAttendance: { from: '', to: '' },
            numberOfHours: 0,
            typeOfLD: '',
            conductedSponsoredBy: '',
          })
        }
        onRemove={remove}
        addButtonLabel="Add Training"
        maxItems={20}
        emptyMessage="No training programs added yet. Click 'Add Training' to get started."
        renderItem={(field, index) => (
          <div className="space-y-4">
            {/* Training Title */}
            <Controller
              name={`items.${index}.title`}
              control={control}
              render={({ field }) => (
                <FormField
                  label="Title of Learning & Development Intervention/Training Program"
                  name={`items.${index}.title`}
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.items?.[index]?.title?.message}
                  placeholder="e.g., Leadership Development Program"
                  required
                />
              )}
            />

            {/* Period of Attendance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name={`items.${index}.periodOfAttendance.from`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="From"
                    name={`items.${index}.periodOfAttendance.from`}
                    type="date"
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.periodOfAttendance?.from?.message}
                    required
                  />
                )}
              />
              <Controller
                name={`items.${index}.periodOfAttendance.to`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="To"
                    name={`items.${index}.periodOfAttendance.to`}
                    type="date"
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.periodOfAttendance?.to?.message}
                    required
                  />
                )}
              />
            </div>

            {/* Hours & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.numberOfHours?.message}
                    placeholder="e.g., 40"
                    min={1}
                    required
                  />
                )}
              />
              <Controller
                name={`items.${index}.typeOfLD`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Type of L&D"
                    name={`items.${index}.typeOfLD`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.typeOfLD?.message}
                    placeholder="e.g., Managerial, Technical, Supervisory"
                    required
                  />
                )}
              />
            </div>

            {/* Conducted/Sponsored By */}
            <Controller
              name={`items.${index}.conductedSponsoredBy`}
              control={control}
              render={({ field }) => (
                <FormField
                  label="Conducted / Sponsored By"
                  name={`items.${index}.conductedSponsoredBy`}
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.items?.[index]?.conductedSponsoredBy?.message}
                  placeholder="e.g., Department of Budget and Management"
                  required
                />
              )}
            />
          </div>
        )}
      />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Tip:</strong> Include seminars, workshops, conferences, and training programs relevant to your profession.
          This demonstrates your commitment to continuous learning.
        </p>
      </div>
    </div>
  );
};
