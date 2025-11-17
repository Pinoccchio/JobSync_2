import React from 'react';

export interface AvatarProps {
  /** URL of the profile image */
  imageUrl?: string | null;
  /** Full name of the user (used for initials fallback) */
  userName: string;
  /** Size of the avatar */
  size?: 'sm' | 'md' | 'lg';
  /** Show online status indicator */
  showStatus?: boolean;
  /** Whether user is online (only shown if showStatus is true) */
  isOnline?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler for avatar */
  onClick?: () => void;
  /** Whether the avatar is clickable (adds hover effects) */
  clickable?: boolean;
}

/**
 * Avatar Component
 *
 * Displays a user's profile picture with fallback to initials.
 * Supports three sizes: small (24px), medium (40px), large (80px).
 *
 * @example
 * ```tsx
 * <Avatar
 *   imageUrl={user.profile_image_url}
 *   userName="Juan Dela Cruz"
 *   size="md"
 * />
 * ```
 */
export const Avatar: React.FC<AvatarProps> = ({
  imageUrl,
  userName,
  size = 'md',
  showStatus = false,
  isOnline = false,
  className = '',
  onClick,
  clickable = false,
}) => {
  // Extract initials from name (max 2 characters)
  const getInitials = (name: string): string => {
    if (!name || name.trim() === '') return '?';

    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    // First letter of first name + first letter of last name
    const firstInitial = parts[0].charAt(0).toUpperCase();
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return firstInitial + lastInitial;
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-20 h-20 text-2xl',
  };

  // Status indicator size
  const statusSizeClasses = {
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-3 h-3 bottom-0 right-0',
    lg: 'w-4 h-4 bottom-1 right-1',
  };

  const initials = getInitials(userName);

  // Generate consistent background color based on name
  const getBackgroundColor = (name: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-red-500',
    ];

    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const isClickable = clickable || onClick;

  return (
    <div
      className={`relative inline-block ${className} ${
        isClickable && imageUrl ? 'cursor-pointer' : ''
      }`}
      onClick={() => {
        if (onClick && imageUrl) {
          onClick();
        }
      }}
      onKeyDown={(e) => {
        if (onClick && imageUrl && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      role={isClickable && imageUrl ? 'button' : undefined}
      tabIndex={isClickable && imageUrl ? 0 : undefined}
      aria-label={isClickable && imageUrl ? `Click to preview ${userName}'s profile picture` : undefined}
    >
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full
          overflow-hidden
          flex items-center justify-center
          font-semibold
          text-white
          flex-shrink-0
          ${!imageUrl ? getBackgroundColor(userName) : 'bg-gray-200'}
          ring-2 ring-white
          shadow-sm
          transition-all duration-200
          ${isClickable && imageUrl ? 'hover:shadow-lg hover:scale-105 hover:ring-4 hover:ring-blue-400/50' : ''}
        `}
        title={userName}
        aria-label={`${userName}'s avatar`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${userName}'s profile picture`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.nextSibling) {
                (target.nextSibling as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : (
          <span className="select-none">{initials}</span>
        )}

        {/* Hidden initials fallback (shown if image fails) */}
        {imageUrl && (
          <span className={`hidden items-center justify-center w-full h-full ${getBackgroundColor(userName)}`}>
            {initials}
          </span>
        )}
      </div>

      {/* Online status indicator */}
      {showStatus && (
        <span
          className={`
            absolute
            ${statusSizeClasses[size]}
            rounded-full
            border-2 border-white
            ${isOnline ? 'bg-green-500' : 'bg-gray-400'}
          `}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
