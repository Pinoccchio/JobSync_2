/**
 * Training Certificate PDF Generator
 *
 * Generates professional PDF certificates for completed training programs
 * using jsPDF library
 */

import jsPDF from 'jspdf';
import { CertificateData, CertificateLayoutParams } from '@/types/certificate.types';

/**
 * Format date to readable string
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate unique certificate ID
 */
export function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const municipality = 'ASUNCION';
  const sequence = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${year}-${municipality}-${sequence}`;
}

/**
 * Load logo image as base64
 * Works in both browser and Node.js environments
 */
async function loadLogoBase64(): Promise<string | null> {
  try {
    // Check if we're in browser or Node.js environment
    if (typeof window !== 'undefined') {
      // Browser environment - use fetch
      const response = await fetch('/JS-logo.png');
      if (!response.ok) {
        console.warn('Logo file not found at /JS-logo.png');
        return null;
      }
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      // Node.js environment - use fs
      const fs = await import('fs');
      const path = await import('path');
      const logoPath = path.join(process.cwd(), 'public', 'JS-logo.png');

      if (!fs.existsSync(logoPath)) {
        console.warn(`Logo file not found at ${logoPath}`);
        return null;
      }

      const imageBuffer = fs.readFileSync(logoPath);
      const base64Image = imageBuffer.toString('base64');
      return `data:image/png;base64,${base64Image}`;
    }
  } catch (error) {
    console.error('Error loading logo:', error);
    return null;
  }
}

/**
 * Load signature image from Supabase Storage as base64
 * Uses service role to access private officer-signatures bucket
 */
async function loadSignatureBase64(signatureUrl: string): Promise<string | null> {
  try {
    // Certificate generation happens server-side (API route), so we use Node.js path
    if (typeof window !== 'undefined') {
      // Browser environment should not happen for certificate generation
      console.warn('Certificate generation should be server-side only');
      return null;
    } else {
      // Node.js environment - use Supabase service client to download from private bucket
      const { createClient } = await import('@supabase/supabase-js');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase credentials for signature loading');
        return null;
      }

      // Create service client (bypasses RLS policies)
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Download signature file from private bucket
      const { data, error } = await supabase.storage
        .from('officer-signatures')
        .download(signatureUrl);

      if (error || !data) {
        console.warn(`Signature file not found: ${signatureUrl}`, error);
        return null;
      }

      // Convert blob to base64
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');

      // Determine MIME type (default to PNG if not specified)
      const mimeType = data.type || 'image/png';

      // Return data URI for jsPDF
      return `data:${mimeType};base64,${base64}`;
    }
  } catch (error) {
    console.error('Error loading signature:', error);
    return null;
  }
}

/**
 * Default layout parameters for certificate generation
 * Using compact mode for optimal formatting
 */
const DEFAULT_LAYOUT: Required<CertificateLayoutParams> = {
  topMargin: 8,
  sectionSpacing: 6,
  titleFontSize: 26,
  nameFontSize: 18,
  bodyFontSize: 11,
  programFontSize: 14,
  signatureWidth: 35,
  signatureHeight: 10,
  signatureGap: 5,
};

/**
 * Generate PDF certificate from certificate data
 *
 * @param data - Certificate data including trainee, program, and completion info
 * @param layoutParams - Optional layout customization parameters
 * @returns PDF as Uint8Array that can be uploaded to storage
 */
export async function generateCertificatePDF(
  data: CertificateData,
  layoutParams?: CertificateLayoutParams
): Promise<Uint8Array> {
  // Merge provided params with defaults
  const layout: Required<CertificateLayoutParams> = {
    ...DEFAULT_LAYOUT,
    ...layoutParams,
  };
  // Load logo first
  const logoBase64 = await loadLogoBase64();

  // Load signature if provided
  let signatureBase64: string | null = null;
  if (data.certification.issued_by.signature_url) {
    signatureBase64 = await loadSignatureBase64(data.certification.issued_by.signature_url);
  }

  // Create PDF in landscape orientation (standard certificate size)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  // Calculate Y positions based on layout parameters
  const BASE_Y = layout.topMargin + 10; // Base position for all content
  const HEADER_Y = BASE_Y + 5;
  const HEADER_LINE_Y = HEADER_Y + 25;
  const TITLE_Y = HEADER_LINE_Y + layout.sectionSpacing + 7;
  const TITLE_LINE_Y = TITLE_Y + layout.sectionSpacing - 3;
  const BODY_START_Y = TITLE_LINE_Y + layout.sectionSpacing + 5;
  const NAME_Y = BODY_START_Y + 12;
  const NAME_UNDERLINE_Y = NAME_Y + 2;
  const COMPLETION_TEXT_Y = NAME_Y + 13;
  const PROGRAM_TITLE_Y = COMPLETION_TEXT_Y + 10;
  const DATE_RANGE_Y = PROGRAM_TITLE_Y + 10;
  const DURATION_Y = DATE_RANGE_Y + 6;
  const SKILLS_Y = DURATION_Y + layout.sectionSpacing + 4;
  const SKILLS_LIST_Y = SKILLS_Y + 6;
  const METRICS_Y = SKILLS_LIST_Y + layout.sectionSpacing + 6;
  const CERT_ID_LINE_Y = METRICS_Y + layout.sectionSpacing + 11;
  const CERT_ID_Y = CERT_ID_LINE_Y + 7;
  const ISSUE_DATE_Y = CERT_ID_LINE_Y + 12;
  const SIGNATURE_LINE_Y = ISSUE_DATE_Y + layout.sectionSpacing + 2;
  const SIGNATURE_Y = SIGNATURE_LINE_Y - layout.signatureGap - layout.signatureHeight;
  const OFFICER_NAME_Y = SIGNATURE_LINE_Y + 3;
  const OFFICER_TITLE_Y = SIGNATURE_LINE_Y + 7;

  // ===== DECORATIVE BORDERS =====
  // Outer border (green)
  doc.setLineWidth(1.5);
  doc.setDrawColor(34, 165, 85); // JobSync green (#22A555)
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');

  // Inner border
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24, 'S');

  // ===== LOGO (if available) =====
  if (logoBase64) {
    try {
      // Add logo on the left side of header
      const logoSize = 20; // 20mm x 20mm
      const logoX = 20; // 20mm from left edge
      const logoY = 18; // Positioned above header text
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
      // Continue without logo if there's an error
    }
  }

  // ===== HEADER =====
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('REPUBLIC OF THE PHILIPPINES', centerX, HEADER_Y, { align: 'center' });
  doc.text('PROVINCE OF ILOCOS NORTE', centerX, HEADER_Y + 5, { align: 'center' });
  doc.text('MUNICIPALITY OF ASUNCION', centerX, HEADER_Y + 10, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Public Employment Service Office (PESO)', centerX, HEADER_Y + 15, { align: 'center' });

  // Decorative line under header
  doc.setLineWidth(0.5);
  doc.setDrawColor(34, 165, 85);
  doc.line(60, HEADER_LINE_Y, pageWidth - 60, HEADER_LINE_Y);
  doc.line(60, HEADER_LINE_Y + 1, pageWidth - 60, HEADER_LINE_Y + 1);

  // ===== CERTIFICATE TITLE =====
  doc.setFontSize(layout.titleFontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 165, 85);
  doc.text('CERTIFICATE OF COMPLETION', centerX, TITLE_Y, { align: 'center' });

  // Decorative line under title
  doc.setLineWidth(0.5);
  doc.line(60, TITLE_LINE_Y, pageWidth - 60, TITLE_LINE_Y);
  doc.line(60, TITLE_LINE_Y + 1, pageWidth - 60, TITLE_LINE_Y + 1);

  // ===== CERTIFICATE BODY =====
  doc.setFontSize(layout.bodyFontSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('This is to certify that', centerX, BODY_START_Y, { align: 'center' });

  // Trainee name (highlighted and underlined)
  doc.setFontSize(layout.nameFontSize);
  doc.setFont('helvetica', 'bold');
  doc.text(data.trainee.full_name.toUpperCase(), centerX, NAME_Y, { align: 'center' });

  // Underline name
  const nameWidth = doc.getTextWidth(data.trainee.full_name.toUpperCase());
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(centerX - nameWidth / 2, NAME_UNDERLINE_Y, centerX + nameWidth / 2, NAME_UNDERLINE_Y);

  // Program completion text
  doc.setFontSize(layout.bodyFontSize);
  doc.setFont('helvetica', 'normal');
  doc.text('has successfully completed the training program in', centerX, COMPLETION_TEXT_Y, { align: 'center' });

  // Program title (highlighted)
  doc.setFontSize(layout.programFontSize);
  doc.setFont('helvetica', 'bold');
  doc.text(data.program.title, centerX, PROGRAM_TITLE_Y, { align: 'center' });

  // Date range and duration
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const startDate = formatDate(data.program.start_date);
  const endDate = formatDate(data.program.end_date);
  doc.text(`held from ${startDate} to ${endDate}`, centerX, DATE_RANGE_Y, { align: 'center' });
  doc.text(`with a duration of ${data.program.duration}`, centerX, DURATION_Y, { align: 'center' });

  // ===== SKILLS SECTION =====
  if (data.program.skills_covered && data.program.skills_covered.length > 0) {
    doc.text('covering the following skills:', centerX, SKILLS_Y, { align: 'center' });

    // Display up to 6 skills, TRUNCATED to prevent overflow
    const skills = data.program.skills_covered.slice(0, 6);
    let skillsText = skills.join('  •  ');

    // Truncate if too long (max 120 characters)
    if (skillsText.length > 120) {
      skillsText = skillsText.substring(0, 117) + '...';
    }

    doc.setFontSize(10);
    doc.text(`• ${skillsText}`, centerX, SKILLS_LIST_Y, { align: 'center' });
  }

  // ===== PERFORMANCE METRICS =====
  const hasMetrics =
    data.completion.assessment_score !== null ||
    data.completion.attendance_percentage !== null;

  if (hasMetrics) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    if (data.completion.assessment_score !== null) {
      doc.text(
        `Assessment Score: ${data.completion.assessment_score}%`,
        centerX,
        METRICS_Y,
        { align: 'center' }
      );
    }

    if (data.completion.attendance_percentage !== null) {
      const attendanceY = data.completion.assessment_score !== null ? METRICS_Y + 6 : METRICS_Y;
      doc.text(
        `Attendance Rate: ${data.completion.attendance_percentage}%`,
        centerX,
        attendanceY,
        { align: 'center' }
      );
    }
  }

  // ===== CERTIFICATE ID AND ISSUE DATE =====
  // Decorative line
  doc.setLineWidth(0.5);
  doc.setDrawColor(34, 165, 85);
  doc.line(60, CERT_ID_LINE_Y, pageWidth - 60, CERT_ID_LINE_Y);

  // Certificate details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Certificate ID: ${data.certification.certificate_id}`, centerX, CERT_ID_Y, {
    align: 'center',
  });

  doc.text(`Issued on: ${formatDate(data.certification.issued_at)}`, centerX, ISSUE_DATE_Y, {
    align: 'center',
  });

  // ===== SIGNATURE SECTION =====
  // PESO officer signature line
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  // Digital signature image (if available)
  if (signatureBase64) {
    try {
      // Add signature image above the signature line
      const sigWidth = layout.signatureWidth;
      const sigHeight = layout.signatureHeight;
      // Align signature with the center of the signature line (not page center)
      const signatureLineCenter = 87.5; // Center of the signature line (from 50mm to 125mm)
      const sigX = signatureLineCenter - sigWidth / 2;  // Center on signature line
      const sigY = SIGNATURE_Y;  // Position above line with gap
      doc.addImage(signatureBase64, 'PNG', sigX, sigY, sigWidth, sigHeight);
    } catch (error) {
      console.error('Error adding signature image to PDF:', error);
      // Continue without signature if there's an error
    }
  }

  // Signature line
  doc.line(50, SIGNATURE_LINE_Y, 125, SIGNATURE_LINE_Y);

  // PESO officer name
  doc.text(data.certification.issued_by.name, 87.5, OFFICER_NAME_Y, { align: 'center' });

  // Title
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text(data.certification.issued_by.title, 87.5, OFFICER_TITLE_Y, { align: 'center' });

  // Optional: QR Code placeholder
  // If QR code is provided, add it to the right side
  if (data.verification?.qr_code_url) {
    try {
      // QR code would be added here
      // doc.addImage(qr_code_url, 'PNG', pageWidth - 60, SIGNATURE_LINE_Y - 15, 30, 30);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text('Scan to verify', pageWidth - 45, SIGNATURE_LINE_Y + 20, { align: 'center' });
    } catch (error) {
      console.error('Error adding QR code:', error);
    }
  }

  // ===== FOOTER (FIXED POSITION) =====
  const FOOTER_Y = 195;  // Footer at 195mm (15mm safe margin from 210mm bottom edge)

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(
    'Generated by JobSync - Municipal Hall HR System',
    centerX,
    FOOTER_Y,
    { align: 'center' }
  );

  // ===== RETURN PDF AS UINT8ARRAY =====
  const pdfOutput = doc.output('arraybuffer');
  return new Uint8Array(pdfOutput);
}

/**
 * Generate PDF as Blob (for client-side preview)
 */
export async function generateCertificatePreview(
  data: CertificateData,
  layoutParams?: CertificateLayoutParams
): Promise<Blob> {
  const pdfBytes = await generateCertificatePDF(data, layoutParams);
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Generate PDF and trigger download (for client-side download)
 */
export async function downloadCertificatePDF(data: CertificateData, filename?: string): Promise<void> {
  const blob = await generateCertificatePreview(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `certificate-${data.certification.certificate_id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
