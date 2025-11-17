/**
 * Certificate Data Types
 *
 * TypeScript interfaces for training certificate generation and management
 */

export interface CertificateTraineeData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  highest_education: string;
}

export interface CertificateProgramData {
  title: string;
  description: string;
  duration: string;
  start_date: string;
  end_date: string | null;
  skills_covered: string[] | null;
  location: string | null;
}

export interface CertificateCompletionData {
  completed_at: string;
  assessment_score: number | null;
  attendance_percentage: number | null;
}

export interface CertificateIssuerData {
  name: string;
  title: string;
  signature_url?: string;
}

export interface CertificationMetadata {
  certificate_id: string;
  issued_at: string;
  issued_by: CertificateIssuerData;
}

export interface CertificateVerificationData {
  qr_code_url?: string;
  verification_url?: string;
}

/**
 * Complete certificate data structure
 */
export interface CertificateData {
  trainee: CertificateTraineeData;
  program: CertificateProgramData;
  completion: CertificateCompletionData;
  certification: CertificationMetadata;
  verification?: CertificateVerificationData;
  notes?: string;
}

/**
 * Certificate layout parameters for customization
 */
export interface CertificateLayoutParams {
  topMargin?: number;        // Top margin in mm (default: 10, range: 5-20)
  sectionSpacing?: number;   // Spacing between sections in mm (default: 8, range: 5-15)
  titleFontSize?: number;    // Title font size in pt (default: 28, range: 20-36)
  nameFontSize?: number;     // Trainee name font size in pt (default: 20, range: 16-28)
  bodyFontSize?: number;     // Body text font size in pt (default: 12, range: 10-16)
  programFontSize?: number;  // Program title font size in pt (default: 16, range: 12-20)
  signatureWidth?: number;   // Signature width in mm (default: 35, range: 25-50)
  signatureHeight?: number;  // Signature height in mm (default: 10, range: 5-20)
  signatureGap?: number;     // Gap above signature line in mm (default: 5, range: 2-10)
}

/**
 * API Request for certificate generation
 */
export interface GenerateCertificateRequest {
  application_id: string;
  notes?: string;
  include_qr_code?: boolean;
  include_signature?: boolean;
  layoutParams?: CertificateLayoutParams;
}

/**
 * API Response for certificate generation
 */
export interface GenerateCertificateResponse {
  success: boolean;
  certificate_id: string;
  certificate_url: string;
  message?: string;
  error?: string;
}
