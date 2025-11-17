'use client';
import React, { useEffect, useRef } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EducationalBackground } from '@/types/pds.types';
import { educationalBackgroundSchema } from '@/lib/pds/validation';
import { FormField } from '../FormField';
import { ArrayFieldSection } from '../ArrayFieldSection';
import { z } from 'zod';

interface EducationalBackgroundFormProps {
  data?: EducationalBackground[];
  onChange: (data: EducationalBackground[]) => void;
}

const arraySchema = z.array(educationalBackgroundSchema).min(1, 'At least one educational background entry is required');

export const EducationalBackgroundForm: React.FC<EducationalBackgroundFormProps> = ({
  data,
  onChange,
}) => {
  const {
    control,
    watch,
    formState: { errors },
  } = useForm<{ items: EducationalBackground[] }>({
    resolver: zodResolver(z.object({ items: arraySchema })),
    defaultValues: {
      items: data && data.length > 0 ? data : [
        {
          level: 'Elementary',
          nameOfSchool: '',
          basicEducationDegreeCourse: '',
          periodOfAttendance: { from: '', to: '' },
        },
      ],
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
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Section III: Educational Background</h3>
        <p className="text-sm text-gray-600">Please provide your educational history, starting from elementary to the highest level attained.</p>
      </div>

      <ArrayFieldSection
        title="Educational Background"
        description="Add all educational levels you have completed or attended"
        items={fields}
        onAdd={() =>
          append({
            level: 'Elementary',
            nameOfSchool: '',
            basicEducationDegreeCourse: '',
            periodOfAttendance: { from: '', to: '' },
          })
        }
        onRemove={remove}
        addButtonLabel="Add Education"
        minItems={1}
        maxItems={10}
        emptyMessage="At least one educational background entry is required."
        renderItem={(field, index) => (
          <div className="space-y-4">
            {/* Level */}
            <Controller
              name={`items.${index}.level`}
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22A555] focus:border-transparent"
                  >
                    <option value="Elementary">Elementary</option>
                    <option value="Secondary">Secondary</option>
                    <option value="Vocational/Trade Course">Vocational/Trade Course</option>
                    <option value="College">College</option>
                    <option value="Graduate Studies">Graduate Studies</option>
                  </select>
                  {errors.items?.[index]?.level && (
                    <p className="text-xs text-red-600">{errors.items[index]?.level?.message}</p>
                  )}
                </div>
              )}
            />

            {/* School Name & Course */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name={`items.${index}.nameOfSchool`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Name of School"
                    name={`items.${index}.nameOfSchool`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.nameOfSchool?.message}
                    placeholder="e.g., University of the Philippines"
                    required
                  />
                )}
              />
              <Controller
                name={`items.${index}.basicEducationDegreeCourse`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Basic Education/Degree/Course"
                    name={`items.${index}.basicEducationDegreeCourse`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.basicEducationDegreeCourse?.message}
                    placeholder="e.g., BS Computer Science"
                    required
                  />
                )}
              />
            </div>

            {/* Period of Attendance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name={`items.${index}.periodOfAttendance.from`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="From (Year)"
                    name={`items.${index}.periodOfAttendance.from`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.periodOfAttendance?.from?.message}
                    placeholder="e.g., 2015"
                    required
                  />
                )}
              />
              <Controller
                name={`items.${index}.periodOfAttendance.to`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="To (Year)"
                    name={`items.${index}.periodOfAttendance.to`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.periodOfAttendance?.to?.message}
                    placeholder="e.g., 2019 or Present"
                    required
                  />
                )}
              />
            </div>

            {/* Units Earned, Year Graduated, Honors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Controller
                name={`items.${index}.highestLevelUnitsEarned`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Highest Level/Units Earned"
                    name={`items.${index}.highestLevelUnitsEarned`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="If not graduated (Optional)"
                  />
                )}
              />
              <Controller
                name={`items.${index}.yearGraduated`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Year Graduated"
                    name={`items.${index}.yearGraduated`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="e.g., 2019 (Optional)"
                  />
                )}
              />
              <Controller
                name={`items.${index}.scholarshipAcademicHonors`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Scholarship/Academic Honors"
                    name={`items.${index}.scholarshipAcademicHonors`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="e.g., Cum Laude (Optional)"
                  />
                )}
              />
            </div>
          </div>
        )}
      />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Tip:</strong> Start with Elementary and add entries in chronological order.
          At least one educational background entry is required.
        </p>
      </div>
    </div>
  );
};
