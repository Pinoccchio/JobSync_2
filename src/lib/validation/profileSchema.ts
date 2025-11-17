import { z } from 'zod';

/**
 * Validation schema for updating user profile information
 * Used by: /api/profile PATCH endpoint
 */
export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-\.\']+$/, 'Name can only contain letters, spaces, hyphens, dots, and apostrophes')
    .optional(),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-\(\)]+$/, 'Invalid phone number format')
    .min(7, 'Phone number must be at least 7 characters')
    .max(20, 'Phone number must be less than 20 characters')
    .nullable()
    .optional(),
});

/**
 * Type inference for profile update data
 */
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;

/**
 * Validation schema for changing user password
 * Used by: /api/profile/password POST endpoint and settings form
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be less than 72 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

/**
 * Type inference for password change data
 */
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

/**
 * Validation schema for profile picture upload
 * Used for client-side file validation
 */
export const profilePictureSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 2 * 1024 * 1024, 'File size must be less than 2MB')
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
      'File must be a JPEG, PNG, or WebP image'
    ),
});

/**
 * Type inference for profile picture data
 */
export type ProfilePictureData = z.infer<typeof profilePictureSchema>;
