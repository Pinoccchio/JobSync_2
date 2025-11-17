'use client';
import React, { useEffect, useRef } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FamilyBackground } from '@/types/pds.types';
import { familyBackgroundSchema } from '@/lib/pds/validation';
import { FormField } from '../FormField';
import { ArrayFieldSection } from '../ArrayFieldSection';
import { formatPhilippinePhone } from '@/lib/utils/phoneFormatter';

interface FamilyBackgroundFormProps {
  data?: FamilyBackground;
  onChange: (data: FamilyBackground) => void;
}

export const FamilyBackgroundForm: React.FC<FamilyBackgroundFormProps> = ({
  data,
  onChange,
}) => {
  const {
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FamilyBackground>({
    resolver: zodResolver(familyBackgroundSchema),
    defaultValues: data || {
      children: [],
      father: {
        surname: '',
        firstName: '',
        middleName: '',
      },
      mother: {
        surname: '',
        firstName: '',
        middleName: '',
      },
    },
    mode: 'onBlur',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'children',
  });

  const watchedData = watch();

  // Sync form fields with data prop changes (e.g., when loading test data)
  useEffect(() => {
    if (data) {
      reset(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]); // Removed 'reset' from dependencies to prevent re-render loop

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
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Section II: Family Background</h3>
        <p className="text-sm text-gray-600">Please provide information about your family members.</p>
      </div>

      {/* Spouse Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 text-lg border-b border-gray-200 pb-2">Spouse Information</h4>
        <p className="text-sm text-gray-600 mb-4">Fill out if married, widowed, or separated</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="spouse.surname"
            control={control}
            render={({ field }) => (
              <FormField
                label="Surname"
                name="spouse.surname"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.spouse?.surname?.message}
              />
            )}
          />
          <Controller
            name="spouse.firstName"
            control={control}
            render={({ field }) => (
              <FormField
                label="First Name"
                name="spouse.firstName"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.spouse?.firstName?.message}
              />
            )}
          />
          <Controller
            name="spouse.middleName"
            control={control}
            render={({ field }) => (
              <FormField
                label="Middle Name"
                name="spouse.middleName"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.spouse?.middleName?.message}
              />
            )}
          />
          <Controller
            name="spouse.occupation"
            control={control}
            render={({ field }) => (
              <FormField
                label="Occupation"
                name="spouse.occupation"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Optional"
              />
            )}
          />
          <Controller
            name="spouse.employerBusinessName"
            control={control}
            render={({ field }) => (
              <FormField
                label="Employer/Business Name"
                name="spouse.employerBusinessName"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Optional"
              />
            )}
          />
          <Controller
            name="spouse.businessAddress"
            control={control}
            render={({ field }) => (
              <FormField
                label="Business Address"
                name="spouse.businessAddress"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Optional"
              />
            )}
          />
          <Controller
            name="spouse.telephoneNo"
            control={control}
            render={({ field }) => (
              <FormField
                label="Telephone No."
                name="spouse.telephoneNo"
                type="tel"
                value={field.value || ''}
                onChange={(e) => {
                  const formatted = formatPhilippinePhone(e.target.value);
                  field.onChange(formatted);
                }}
                placeholder="+63 9XX XXX XXXX"
              />
            )}
          />
        </div>
      </div>

      {/* Children */}
      <ArrayFieldSection
        title="Children"
        description="List all your children (including adopted and step-children)"
        items={fields}
        onAdd={() => append({ fullName: '', dateOfBirth: '' })}
        onRemove={remove}
        addButtonLabel="Add Child"
        maxItems={15}
        emptyMessage="No children added yet. If you have children, click 'Add Child' to get started."
        renderItem={(field, index) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name={`children.${index}.fullName`}
              control={control}
              render={({ field }) => (
                <FormField
                  label="Full Name"
                  name={`children.${index}.fullName`}
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.children?.[index]?.fullName?.message}
                  required
                />
              )}
            />
            <Controller
              name={`children.${index}.dateOfBirth`}
              control={control}
              render={({ field }) => (
                <FormField
                  label="Date of Birth"
                  name={`children.${index}.dateOfBirth`}
                  type="date"
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.children?.[index]?.dateOfBirth?.message}
                  required
                />
              )}
            />
          </div>
        )}
      />

      {/* Father's Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 text-lg border-b border-gray-200 pb-2">Father's Information</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="father.surname"
            control={control}
            render={({ field }) => (
              <FormField
                label="Surname"
                name="father.surname"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.father?.surname?.message}
                required
              />
            )}
          />
          <Controller
            name="father.firstName"
            control={control}
            render={({ field }) => (
              <FormField
                label="First Name"
                name="father.firstName"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.father?.firstName?.message}
                required
              />
            )}
          />
          <Controller
            name="father.middleName"
            control={control}
            render={({ field }) => (
              <FormField
                label="Middle Name"
                name="father.middleName"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.father?.middleName?.message}
                required
              />
            )}
          />
        </div>
      </div>

      {/* Mother's Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 text-lg border-b border-gray-200 pb-2">Mother's Maiden Name</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controller
            name="mother.surname"
            control={control}
            render={({ field }) => (
              <FormField
                label="Surname"
                name="mother.surname"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.mother?.surname?.message}
                required
              />
            )}
          />
          <Controller
            name="mother.firstName"
            control={control}
            render={({ field }) => (
              <FormField
                label="First Name"
                name="mother.firstName"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.mother?.firstName?.message}
                required
              />
            )}
          />
          <Controller
            name="mother.middleName"
            control={control}
            render={({ field }) => (
              <FormField
                label="Middle Name"
                name="mother.middleName"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.mother?.middleName?.message}
                required
              />
            )}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Father's and Mother's information are required fields.
          Spouse information should be filled out if you are married, widowed, or separated.
        </p>
      </div>
    </div>
  );
};
