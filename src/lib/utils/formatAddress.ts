/**
 * Address formatting utilities for PDS data
 * Handles inconsistent field naming between database and type definitions
 */

/**
 * Formats an address into a readable string
 * Handles both:
 * - Plain text addresses from OCR-processed PDFs
 * - Structured address objects from web-based PDS forms
 *
 * @param address - Address as string or object with structured fields
 * @returns Formatted address string or 'N/A' if no valid address
 */
export function formatAddress(address: any): string {
  if (!address) {
    return 'N/A';
  }

  // If address is already a string (OCR-processed data), return as-is
  if (typeof address === 'string') {
    return address.trim() || 'N/A';
  }

  // If address is an object (web-based PDS), format with structured fields
  if (typeof address === 'object') {
    // Handle both naming conventions by checking both possible field names
    const parts = [
      address.houseNo || address.houseBlockLotNo,
      address.street,
      address.subdivision || address.subdivisionVillage,
      address.barangay,
      address.city || address.cityMunicipality,
      address.province,
      address.zipCode,
    ];

    const formatted = parts.filter(Boolean).join(', ');
    return formatted || 'N/A';
  }

  return 'N/A';
}

/**
 * Formats permanent address with special handling for "same as residential"
 * Handles both:
 * - Plain text addresses from OCR-processed PDFs
 * - Structured address objects from web-based PDS forms
 *
 * @param permanentAddress - Permanent address as string or object
 * @param residentialAddress - Residential address (for reference)
 * @returns Formatted permanent address string or special message
 */
export function formatPermanentAddress(
  permanentAddress: any,
  residentialAddress: any
): string {
  if (!permanentAddress) {
    return 'N/A';
  }

  // If permanent address is a string (OCR-processed data), return as-is
  if (typeof permanentAddress === 'string') {
    return permanentAddress.trim() || 'N/A';
  }

  // If permanent address is an object (web-based PDS), check for special cases
  if (typeof permanentAddress === 'object') {
    // Check if permanent address is same as residential
    if (permanentAddress.sameAsResidential) {
      return 'Same as Residential Address';
    }

    return formatAddress(permanentAddress);
  }

  return 'N/A';
}
