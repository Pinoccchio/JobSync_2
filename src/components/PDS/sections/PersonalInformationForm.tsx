'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PersonalInformation } from '@/types/pds.types';
import { personalInformationSchema } from '@/lib/pds/validation';
import { FormField } from '../FormField';
import { Input } from '@/components/ui/Input';
import { formatPhilippinePhone } from '@/lib/utils/phoneFormatter';

interface PersonalInformationFormProps {
  data?: PersonalInformation;
  onChange: (data: PersonalInformation) => void;
}

export const PersonalInformationForm: React.FC<PersonalInformationFormProps> = ({
  data,
  onChange,
}) => {
  const [sameAsResidential, setSameAsResidential] = useState(data?.permanentAddress?.sameAsResidential ?? false);

  const {
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PersonalInformation>({
    resolver: zodResolver(personalInformationSchema),
    defaultValues: data || {
      citizenship: 'Filipino',
      civilStatus: 'Single',
      sexAtBirth: 'Male',
      residentialAddress: {
        barangay: '',
        cityMunicipality: '',
        province: '',
        zipCode: '',
      },
      permanentAddress: {
        sameAsResidential: false,
      },
    },
    mode: 'onBlur',
  });

  const watchCivilStatus = watch('civilStatus');
  const watchCitizenship = watch('citizenship');
  const watchResidentialAddress = watch('residentialAddress');
  const watchedData = watch();

  // Use useRef to prevent re-render on every keystroke while still detecting actual changes
  const previousDataRef = useRef<string>('');
  
  // Auto-save when form changes
  useEffect(() => {
    const currentData = JSON.stringify(watchedData);
    if (currentData !== previousDataRef.current) {
      previousDataRef.current = currentData;
      onChange(watchedData);
    }
  }, [watchedData, onChange]);

  // Sync form fields with data prop changes
  useEffect(() => {
    if (data) {
      reset(data);
      setSameAsResidential(data.permanentAddress?.sameAsResidential ?? false);
    }
  }, [data, reset]);

  // Handle "Same as Residential" checkbox
  const handleSameAsResidentialChange = (checked: boolean) => {
    setSameAsResidential(checked);
    setValue('permanentAddress.sameAsResidential', checked);

    if (checked) {
      // Copy residential address to permanent address
      setValue('permanentAddress.houseBlockLotNo', watchResidentialAddress.houseBlockLotNo);
      setValue('permanentAddress.street', watchResidentialAddress.street);
      setValue('permanentAddress.subdivisionVillage', watchResidentialAddress.subdivisionVillage);
      setValue('permanentAddress.barangay', watchResidentialAddress.barangay);
      setValue('permanentAddress.cityMunicipality', watchResidentialAddress.cityMunicipality);
      setValue('permanentAddress.province', watchResidentialAddress.province);
      setValue('permanentAddress.zipCode', watchResidentialAddress.zipCode);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">Section I: Personal Information</h3>
          <p className="text-sm text-gray-600">Please provide your basic personal details as they appear on official documents.</p>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 text-lg border-b border-gray-200 pb-2">Full Name</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Controller
            name="surname"
            control={control}
            render={({ field }) => (
              <FormField
                label="Surname"
                name="surname"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.surname?.message}
                required
              />
            )}
          />
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <FormField
                label="First Name"
                name="firstName"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.firstName?.message}
                required
              />
            )}
          />
          <Controller
            name="middleName"
            control={control}
            render={({ field }) => (
              <FormField
                label="Middle Name"
                name="middleName"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.middleName?.message}
                required
              />
            )}
          />
          <Controller
            name="nameExtension"
            control={control}
            render={({ field }) => (
              <FormField
                label="Extension"
                name="nameExtension"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="JR, SR, III"
                helpText="Optional"
              />
            )}
          />
        </div>
      </div>

      {/* Birth Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 text-lg border-b border-gray-200 pb-2">Birth Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <FormField
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.dateOfBirth?.message}
                required
              />
            )}
          />
          <Controller
            name="placeOfBirth"
            control={control}
            render={({ field }) => (
              <FormField
                label="Place of Birth"
                name="placeOfBirth"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.placeOfBirth?.message}
                placeholder="City/Municipality"
                required
              />
            )}
          />
          <Controller
            name="sexAtBirth"
            control={control}
            render={({ field }) => (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Sex at Birth <span className="text-red-500">*</span>
                </label>
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22A555] focus:border-transparent"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.sexAtBirth && (
                  <p className="text-xs text-red-600">{errors.sexAtBirth.message}</p>
                )}
              </div>
            )}
          />
        </div>
      </div>

      {/* Civil Status & Physical Attributes */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 text-lg border-b border-gray-200 pb-2">Civil Status & Physical Attributes</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controller
            name="civilStatus"
            control={control}
            render={({ field }) => (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Civil Status <span className="text-red-500">*</span>
                </label>
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22A555] focus:border-transparent"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                  <option value="Annulled">Annulled</option>
                  <option value="Solo Parent">Solo Parent</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            )}
          />
          {watchCivilStatus === 'Others' && (
            <Controller
              name="civilStatusOthers"
              control={control}
              render={({ field }) => (
                <FormField
                  label="Please specify"
                  name="civilStatusOthers"
                  value={field.value || ''}
                  onChange={field.onChange}
                  required
                />
              )}
            />
          )}
          <Controller
            name="height"
            control={control}
            render={({ field }) => (
              <FormField
                label="Height (meters)"
                name="height"
                type="number"
                value={field.value || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  field.onChange(isNaN(val) ? undefined : val);
                }}
                onBlur={field.onBlur}
                error={errors.height?.message}
                placeholder="1.75"
                step={0.01}
                min={0.5}
                max={3}
                required
              />
            )}
          />
          <Controller
            name="weight"
            control={control}
            render={({ field }) => (
              <FormField
                label="Weight (kg)"
                name="weight"
                type="number"
                value={field.value || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  field.onChange(isNaN(val) ? undefined : val);
                }}
                onBlur={field.onBlur}
                error={errors.weight?.message}
                placeholder="70"
                min={20}
                max={500}
                required
              />
            )}
          />
          <Controller
            name="bloodType"
            control={control}
            render={({ field }) => (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Blood Type
                </label>
                <select
                  {...field}
                  value={field.value || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22A555] focus:border-transparent"
                >
                  <option value="">Select blood type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            )}
          />
        </div>
      </div>

      {/* Government IDs */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 text-lg border-b border-gray-200 pb-2">Government IDs</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controller
            name="umidNo"
            control={control}
            render={({ field }) => (
              <FormField
                label="UMID No."
                name="umidNo"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Optional"
              />
            )}
          />
          <Controller
            name="pagibigNo"
            control={control}
            render={({ field }) => (
              <FormField
                label="Pag-IBIG No."
                name="pagibigNo"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Optional"
              />
            )}
          />
          <Controller
            name="philhealthNo"
            control={control}
            render={({ field }) => (
              <FormField
                label="PhilHealth No."
                name="philhealthNo"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Optional"
              />
            )}
          />
          <Controller
            name="philsysNo"
            control={control}
            render={({ field }) => (
              <FormField
                label="PhilSys No. (PSN)"
                name="philsysNo"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Optional"
              />
            )}
          />
          <Controller
            name="tinNo"
            control={control}
            render={({ field }) => (
              <FormField
                label="TIN No."
                name="tinNo"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Optional"
              />
            )}
          />
          <Controller
            name="agencyEmployeeNo"
            control={control}
            render={({ field }) => (
              <FormField
                label="Agency Employee No."
                name="agencyEmployeeNo"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Optional"
              />
            )}
          />
        </div>
      </div>

      {/* Citizenship */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 text-lg border-b border-gray-200 pb-2">Citizenship</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controller
            name="citizenship"
            control={control}
            render={({ field }) => (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Citizenship <span className="text-red-500">*</span>
                </label>
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22A555] focus:border-transparent"
                >
                  <option value="Filipino">Filipino</option>
                  <option value="Dual Citizenship">Dual Citizenship</option>
                </select>
              </div>
            )}
          />
          {watchCitizenship === 'Dual Citizenship' && (
            <>
              <Controller
                name="dualCitizenshipType"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      {...field}
                      value={field.value || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22A555] focus:border-transparent"
                    >
                      <option value="">Select type</option>
                      <option value="by birth">By Birth</option>
                      <option value="by naturalization">By Naturalization</option>
                    </select>
                  </div>
                )}
              />
              <Controller
                name="dualCitizenshipCountry"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Country"
                    name="dualCitizenshipCountry"
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="e.g., United States"
                  />
                )}
              />
            </>
          )}
        </div>
      </div>

      {/* Residential Address */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 text-lg border-b border-gray-200 pb-2">Residential Address</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="residentialAddress.houseBlockLotNo"
            control={control}
            render={({ field }) => (
              <FormField
                label="House/Block/Lot No."
                name="residentialAddress.houseBlockLotNo"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Optional"
              />
            )}
          />
          <Controller
            name="residentialAddress.street"
            control={control}
            render={({ field }) => (
              <FormField
                label="Street"
                name="residentialAddress.street"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Optional"
              />
            )}
          />
          <Controller
            name="residentialAddress.subdivisionVillage"
            control={control}
            render={({ field }) => (
              <FormField
                label="Subdivision/Village"
                name="residentialAddress.subdivisionVillage"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Optional"
              />
            )}
          />
          <Controller
            name="residentialAddress.barangay"
            control={control}
            render={({ field }) => (
              <FormField
                label="Barangay"
                name="residentialAddress.barangay"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.residentialAddress?.barangay?.message}
                required
              />
            )}
          />
          <Controller
            name="residentialAddress.cityMunicipality"
            control={control}
            render={({ field }) => (
              <FormField
                label="City/Municipality"
                name="residentialAddress.cityMunicipality"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.residentialAddress?.cityMunicipality?.message}
                required
              />
            )}
          />
          <Controller
            name="residentialAddress.province"
            control={control}
            render={({ field }) => (
              <FormField
                label="Province"
                name="residentialAddress.province"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.residentialAddress?.province?.message}
                required
              />
            )}
          />
          <Controller
            name="residentialAddress.zipCode"
            control={control}
            render={({ field }) => (
              <FormField
                label="ZIP Code"
                name="residentialAddress.zipCode"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.residentialAddress?.zipCode?.message}
                required
              />
            )}
          />
        </div>
      </div>

      {/* Permanent Address */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 text-lg border-b border-gray-200 pb-2">Permanent Address</h4>

        {/* Same as Residential Checkbox */}
        <div className="flex items-center gap-2">
          <Input
            type="checkbox"
            id="sameAsResidential"
            checked={sameAsResidential}
            onChange={(e) => handleSameAsResidentialChange(e.target.checked)}
            className="w-4 h-4 text-[#22A555] border-gray-300 rounded focus:ring-[#22A555]"
          />
          <label htmlFor="sameAsResidential" className="text-sm font-medium text-gray-700">
            Same as Residential Address
          </label>
        </div>

        {!sameAsResidential && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="permanentAddress.houseBlockLotNo"
              control={control}
              render={({ field }) => (
                <FormField
                  label="House/Block/Lot No."
                  name="permanentAddress.houseBlockLotNo"
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Optional"
                />
              )}
            />
            <Controller
              name="permanentAddress.street"
              control={control}
              render={({ field }) => (
                <FormField
                  label="Street"
                  name="permanentAddress.street"
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Optional"
                />
              )}
            />
            <Controller
              name="permanentAddress.subdivisionVillage"
              control={control}
              render={({ field }) => (
                <FormField
                  label="Subdivision/Village"
                  name="permanentAddress.subdivisionVillage"
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Optional"
                />
              )}
            />
            <Controller
              name="permanentAddress.barangay"
              control={control}
              render={({ field }) => (
                <FormField
                  label="Barangay"
                  name="permanentAddress.barangay"
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="permanentAddress.cityMunicipality"
              control={control}
              render={({ field }) => (
                <FormField
                  label="City/Municipality"
                  name="permanentAddress.cityMunicipality"
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="permanentAddress.province"
              control={control}
              render={({ field }) => (
                <FormField
                  label="Province"
                  name="permanentAddress.province"
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="permanentAddress.zipCode"
              control={control}
              render={({ field }) => (
                <FormField
                  label="ZIP Code"
                  name="permanentAddress.zipCode"
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 text-lg border-b border-gray-200 pb-2">Contact Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controller
            name="telephoneNo"
            control={control}
            render={({ field }) => (
              <FormField
                label="Telephone No."
                name="telephoneNo"
                type="tel"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Optional"
              />
            )}
          />
          <Controller
            name="mobileNo"
            control={control}
            render={({ field }) => (
              <FormField
                label="Mobile No."
                name="mobileNo"
                type="tel"
                value={field.value || ''}
                onChange={(e) => {
                  const formatted = formatPhilippinePhone(e.target.value);
                  field.onChange(formatted);
                }}
                onBlur={field.onBlur}
                error={errors.mobileNo?.message}
                placeholder="+63 9XX XXX XXXX"
                required
              />
            )}
          />
          <Controller
            name="emailAddress"
            control={control}
            render={({ field }) => (
              <FormField
                label="Email Address"
                name="emailAddress"
                type="email"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.emailAddress?.message}
                placeholder="your.email@example.com"
                required
              />
            )}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Please ensure all information is accurate as it appears on your official government documents.
          Required fields are marked with an asterisk (*). Your changes are saved automatically.
        </p>
      </div>
    </div>
  );
};