/**
 * Status History Utility
 * Manages status change tracking for applications
 */

export interface StatusHistoryEntry {
  from: string | null;
  to: string;
  changed_at: string;
  changed_by?: string;
}

/**
 * Appends a new status change entry to the history array
 * @param currentHistory - Existing status history array
 * @param fromStatus - Previous status (null for initial status)
 * @param toStatus - New status
 * @param userId - ID of user making the change (optional)
 * @returns Updated history array
 */
export function appendStatusHistory(
  currentHistory: StatusHistoryEntry[],
  fromStatus: string | null,
  toStatus: string,
  userId?: string
): StatusHistoryEntry[] {
  const newEntry: StatusHistoryEntry = {
    from: fromStatus,
    to: toStatus,
    changed_at: new Date().toISOString(),
    ...(userId && { changed_by: userId }),
  };

  return [...currentHistory, newEntry];
}

/**
 * Creates initial status history entry for existing applications
 * @param currentStatus - Current status of the application
 * @param createdAt - When the application was created
 * @param createdBy - Who created the application (optional)
 * @returns Initial history entry
 */
export function createInitialStatusHistory(
  currentStatus: string,
  createdAt: string,
  createdBy?: string
): StatusHistoryEntry[] {
  return [
    {
      from: null,
      to: currentStatus,
      changed_at: createdAt,
      ...(createdBy && { changed_by: createdBy }),
    },
  ];
}

/**
 * Validates status history structure
 * @param history - History array to validate
 * @returns True if valid
 */
export function isValidStatusHistory(history: any): history is StatusHistoryEntry[] {
  if (!Array.isArray(history)) return false;

  return history.every((entry) => {
    return (
      typeof entry === 'object' &&
      entry !== null &&
      (entry.from === null || typeof entry.from === 'string') &&
      typeof entry.to === 'string' &&
      typeof entry.changed_at === 'string'
    );
  });
}
