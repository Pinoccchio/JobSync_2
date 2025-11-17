'use client';
import React, { useEffect, useRef } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { WorkExperience } from '@/types/pds.types';
import { workExperienceSchema } from '@/lib/pds/validation';
import { FormField } from '../FormField';
import { ArrayFieldSection } from '../ArrayFieldSection';
import { Input } from '@/components/ui/Input';
import { z } from 'zod';

interface WorkExperienceFormProps {
  data?: WorkExperience[];
  onChange: (data: WorkExperience[]) => void;
}

const arraySchema = z.array(workExperienceSchema);

export const WorkExperienceForm: React.FC<WorkExperienceFormProps> = ({
  data,
  onChange,
}) => {
  const {
    control,
    watch,
    formState: { errors },
  } = useForm<{ items: WorkExperience[] }>({
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
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Section V: Work Experience</h3>
        <p className="text-sm text-gray-600">Include all your work experience, starting from your most recent position.</p>
      </div>

      <ArrayFieldSection
        title="Work Experience"
        description="Add all your work history (government and private sector)"
        items={fields}
        onAdd={() =>
          append({
            positionTitle: '',
            departmentAgencyOfficeCompany: '',
            governmentService: false,
            periodOfService: { from: '', to: '' },
          })
        }
        onRemove={remove}
        addButtonLabel="Add Work Experience"
        maxItems={20}
        emptyMessage="No work experience added yet. Click 'Add Work Experience' to get started."
        renderItem={(field, index) => (
          <div className="space-y-4">
            {/* Position & Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name={`items.${index}.positionTitle`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Position Title"
                    name={`items.${index}.positionTitle`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.positionTitle?.message}
                    placeholder="e.g., Software Developer"
                    required
                  />
                )}
              />
              <Controller
                name={`items.${index}.departmentAgencyOfficeCompany`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Department/Agency/Office/Company"
                    name={`items.${index}.departmentAgencyOfficeCompany`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.departmentAgencyOfficeCompany?.message}
                    placeholder="e.g., ABC Corporation"
                    required
                  />
                )}
              />
            </div>

            {/* Salary & Salary Grade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name={`items.${index}.monthlySalary`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Monthly Salary"
                    name={`items.${index}.monthlySalary`}
                    type="number"
                    value={field.value || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      field.onChange(isNaN(val) ? undefined : val);
                    }}
                    placeholder="e.g., 25000"
                  />
                )}
              />
              <Controller
                name={`items.${index}.salaryGrade`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Salary Grade (if applicable)"
                    name={`items.${index}.salaryGrade`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="e.g., SG-15"
                  />
                )}
              />
            </div>

            {/* Status & Government Service */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name={`items.${index}.statusOfAppointment`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Status of Appointment"
                    name={`items.${index}.statusOfAppointment`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="e.g., Permanent, Contractual"
                  />
                )}
              />
              <Controller
                name={`items.${index}.governmentService`}
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Government Service
                    </label>
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-2">
                        <Input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="w-4 h-4 text-[#22A555] border-gray-300 rounded focus:ring-[#22A555]"
                        />
                        <span className="text-sm text-gray-700">
                          Yes, this was a government position
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Period of Service */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name={`items.${index}.periodOfService.from`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="From"
                    name={`items.${index}.periodOfService.from`}
                    type="date"
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.periodOfService?.from?.message}
                    required
                  />
                )}
              />
              <Controller
                name={`items.${index}.periodOfService.to`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="To"
                    name={`items.${index}.periodOfService.to`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.periodOfService?.to?.message}
                    placeholder="YYYY-MM-DD or 'Present'"
                    helpText="Enter date or type 'Present' for current job"
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
          <strong>Tip:</strong> Add your work history in reverse chronological order (most recent first).
          Work experience is crucial for AI ranking - be thorough!
        </p>
      </div>
    </div>
  );
};
