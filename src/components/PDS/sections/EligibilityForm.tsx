'use client';
import React, { useEffect, useRef } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eligibility } from '@/types/pds.types';
import { eligibilitySchema } from '@/lib/pds/validation';
import { FormField } from '../FormField';
import { ArrayFieldSection } from '../ArrayFieldSection';
import { z } from 'zod';

interface EligibilityFormProps {
  data?: Eligibility[];
  onChange: (data: Eligibility[]) => void;
}

const arraySchema = z.array(eligibilitySchema);

export const EligibilityForm: React.FC<EligibilityFormProps> = ({
  data,
  onChange,
}) => {
  const {
    control,
    watch,
    formState: { errors },
  } = useForm<{ items: Eligibility[] }>({
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
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Section IV: Civil Service Eligibility</h3>
        <p className="text-sm text-gray-600">List all Career Service/RA 1080 eligibilities, board/bar examinations passed, and professional licenses.</p>
      </div>

      <ArrayFieldSection
        title="Eligibility & Certifications"
        description="Add all eligibilities, certifications, and licenses you have acquired"
        items={fields}
        onAdd={() =>
          append({
            careerService: '',
            dateOfExaminationConferment: '',
            placeOfExaminationConferment: '',
          })
        }
        onRemove={remove}
        addButtonLabel="Add Eligibility"
        maxItems={15}
        emptyMessage="No eligibilities added yet. If you have any certifications or licenses, click 'Add Eligibility' to get started."
        renderItem={(field, index) => (
          <div className="space-y-4">
            {/* Career Service & Rating */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name={`items.${index}.careerService`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Career Service / RA 1080 / Board/Bar"
                    name={`items.${index}.careerService`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.careerService?.message}
                    placeholder="e.g., Career Service Professional"
                    required
                  />
                )}
              />
              <Controller
                name={`items.${index}.rating`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Rating (if applicable)"
                    name={`items.${index}.rating`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="e.g., 85.50%"
                  />
                )}
              />
            </div>

            {/* Date & Place */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name={`items.${index}.dateOfExaminationConferment`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Date of Examination/Conferment"
                    name={`items.${index}.dateOfExaminationConferment`}
                    type="date"
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.dateOfExaminationConferment?.message}
                    required
                  />
                )}
              />
              <Controller
                name={`items.${index}.placeOfExaminationConferment`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Place of Examination/Conferment"
                    name={`items.${index}.placeOfExaminationConferment`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.items?.[index]?.placeOfExaminationConferment?.message}
                    placeholder="e.g., Manila"
                    required
                  />
                )}
              />
            </div>

            {/* License Number & Validity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name={`items.${index}.licenseNumber`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="License Number (if applicable)"
                    name={`items.${index}.licenseNumber`}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Optional"
                  />
                )}
              />
              <Controller
                name={`items.${index}.licenseValidity`}
                control={control}
                render={({ field }) => (
                  <FormField
                    label="License Validity Date"
                    name={`items.${index}.licenseValidity`}
                    type="date"
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Optional"
                  />
                )}
              />
            </div>
          </div>
        )}
      />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> This section is optional, but adding eligibilities and certifications can improve your application ranking.
        </p>
      </div>
    </div>
  );
};
