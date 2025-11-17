/**
 * Excel Template Injection Utilities using xlsx-populate
 * Modern, reliable Excel template population that preserves formatting
 */

import XlsxPopulate from 'xlsx-populate';
import {
  SHEET_C1_MAPPING,
  SHEET_C2_MAPPING,
  SHEET_C3_MAPPING,
  SHEET_C4_MAPPING,
  CHECKBOX,
  firstCell,
  firstColumn,
} from './excelMapper';
import type { PDSData } from '@/types/pds.types';

const TEMPLATE_PATH = './public/templates/PDS_2025_Template.xlsx';

type CellValue = string | number | boolean | Date | null | undefined;

// Type definitions for xlsx-populate
interface XlsxCell {
  value(value?: any): XlsxCell;
}

interface XlsxSheet {
  cell(ref: string): XlsxCell;
  name(): string;
}

interface XlsxWorkbook {
  sheet(name: string): XlsxSheet;
  sheet(index: number): XlsxSheet;
  sheets(): XlsxSheet[];
  outputAsync(): Promise<Buffer>; // ✅ FIXED: xlsx-populate uses outputAsync()
}

/**
 * Load the official PDS 2025 template using xlsx-populate
 */
export async function loadPDSTemplate(): Promise<XlsxWorkbook> {
  try {
    console.log('📂 Loading PDS template with xlsx-populate...');
    const workbook = await XlsxPopulate.fromFileAsync(TEMPLATE_PATH);
    console.log('✅ PDS template loaded successfully');
    console.log(`   Sheets found: ${workbook.sheets().map((s: XlsxSheet) => s.name()).join(', ')}`);
    return workbook as unknown as XlsxWorkbook;
  } catch (error) {
    console.error('❌ Failed to load template:', error);
    throw new Error(
      `Template loading failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Set cell value - xlsx-populate automatically handles merged cells!
 */
export function setCellValue(
  sheet: XlsxSheet,
  cellRef: string,
  value: CellValue
): void {
  if (!cellRef) return;
  
  const targetCell = firstCell(cellRef);
  
  try {
    sheet.cell(targetCell).value(value ?? '');
  } catch (error) {
    console.warn(`⚠️ Could not set cell ${targetCell}:`, error);
  }
}

/**
 * Set checkbox value
 */
export function setCheckbox(
  sheet: XlsxSheet,
  cellRef: string,
  isChecked: boolean
): void {
  setCellValue(sheet, cellRef, isChecked ? CHECKBOX.CHECKED : CHECKBOX.UNCHECKED);
}

/**
 * Set yes/no checkboxes
 */
export function setYesNoCheckbox(
  sheet: XlsxSheet,
  yesCellRef: string,
  noCellRef: string,
  value: boolean | undefined | null
): void {
  if (value === true) {
    setCheckbox(sheet, yesCellRef, true);
    setCheckbox(sheet, noCellRef, false);
  } else if (value === false) {
    setCheckbox(sheet, yesCellRef, false);
    setCheckbox(sheet, noCellRef, true);
  } else {
    // Leave both unchecked if undefined/null
    setCheckbox(sheet, yesCellRef, false);
    setCheckbox(sheet, noCellRef, false);
  }
}

/**
 * Insert array data into worksheet
 */
export function insertArrayData<T extends Record<string, any>>(
  sheet: XlsxSheet,
  startRow: number,
  columnMapping: Record<string, string>,
  dataArray: T[],
  maxRows: number
): void {
  const itemsToInsert = dataArray.slice(0, maxRows);

  itemsToInsert.forEach((item, index) => {
    const currentRow = startRow + index + 1; // +1 for 1-based Excel rows

    Object.entries(columnMapping).forEach(([fieldName, columnLetter]) => {
      const cellRef = `${columnLetter}${currentRow}`;
      const value = item[fieldName];
      setCellValue(sheet, cellRef, value);
    });
  });

  // Clear remaining rows
  for (let i = itemsToInsert.length; i < maxRows; i++) {
    const currentRow = startRow + i + 1;
    
    Object.values(columnMapping).forEach((columnLetter) => {
      const cellRef = `${columnLetter}${currentRow}`;
      setCellValue(sheet, cellRef, '');
    });
  }
}

/**
 * Insert text array into single column
 */
export function insertTextArray(
  sheet: XlsxSheet,
  startRow: number,
  column: string,
  textArray: string[],
  maxRows: number,
  separator: string = ', '
): void {
  if (!textArray || textArray.length === 0) {
    // Clear all rows
    for (let i = 0; i < maxRows; i++) {
      const cellRef = `${column}${startRow + i + 1}`;
      setCellValue(sheet, cellRef, '');
    }
    return;
  }

  const columnLetter = firstColumn(column);

  if (textArray.length <= maxRows) {
    // Each item gets its own row
    textArray.forEach((text, index) => {
      const cellRef = `${columnLetter}${startRow + index + 1}`;
      setCellValue(sheet, cellRef, text);
    });

    // Clear remaining rows
    for (let i = textArray.length; i < maxRows; i++) {
      const cellRef = `${columnLetter}${startRow + i + 1}`;
      setCellValue(sheet, cellRef, '');
    }
  } else {
    // Overflow: combine items
    const itemsPerRow = Math.ceil(textArray.length / maxRows);

    for (let row = 0; row < maxRows; row++) {
      const startIndex = row * itemsPerRow;
      const endIndex = Math.min(startIndex + itemsPerRow, textArray.length);
      const items = textArray.slice(startIndex, endIndex);
      const cellRef = `${columnLetter}${startRow + row + 1}`;

      setCellValue(sheet, cellRef, items.join(separator));
    }
  }
}

/**
 * Set civil status checkbox
 */
export function setCivilStatusCheckbox(
  sheet: XlsxSheet,
  status: string | undefined | null,
  cellMapping: {
    single: string;
    married: string;
    widowed: string;
    separated: string;
    others: string;
  },
  othersText?: string
): void {
  // Clear all first
  Object.values(cellMapping).forEach(cellRef => {
    setCheckbox(sheet, cellRef, false);
  });

  if (!status) return;

  const statusLower = status.toLowerCase();

  if (statusLower.includes('single')) {
    setCheckbox(sheet, cellMapping.single, true);
  } else if (statusLower.includes('married')) {
    setCheckbox(sheet, cellMapping.married, true);
  } else if (statusLower.includes('widowed')) {
    setCheckbox(sheet, cellMapping.widowed, true);
  } else if (statusLower.includes('separated') || statusLower.includes('annulled')) {
    setCheckbox(sheet, cellMapping.separated, true);
  } else {
    setCheckbox(sheet, cellMapping.others, true);
    if (othersText) {
      // Handle others text if needed
    }
  }
}

/**
 * Set sex checkbox
 */
export function setSexCheckbox(
  sheet: XlsxSheet,
  sex: string | undefined | null,
  maleCell: string,
  femaleCell: string
): void {
  if (!sex) {
    setCheckbox(sheet, maleCell, false);
    setCheckbox(sheet, femaleCell, false);
    return;
  }

  const sexLower = sex.toLowerCase();

  if (sexLower === 'male') {
    setCheckbox(sheet, maleCell, true);
    setCheckbox(sheet, femaleCell, false);
  } else if (sexLower === 'female') {
    setCheckbox(sheet, maleCell, false);
    setCheckbox(sheet, femaleCell, true);
  } else {
    setCheckbox(sheet, maleCell, false);
    setCheckbox(sheet, femaleCell, false);
  }
}

/**
 * Set citizenship checkbox
 */
export function setCitizenshipCheckbox(
  sheet: XlsxSheet,
  citizenship: string | undefined | null,
  filipinoCell: string,
  dualByBirthCell: string,
  dualByNaturalizationCell: string,
  countryCell?: string,
  dualType?: string,
  country?: string
): void {
  // Clear all
  setCheckbox(sheet, filipinoCell, false);
  setCheckbox(sheet, dualByBirthCell, false);
  setCheckbox(sheet, dualByNaturalizationCell, false);

  if (!citizenship) return;

  const citizenshipLower = citizenship.toLowerCase();

  if (citizenshipLower === 'filipino') {
    setCheckbox(sheet, filipinoCell, true);
  } else if (citizenshipLower.includes('dual')) {
    if (dualType?.toLowerCase() === 'by birth') {
      setCheckbox(sheet, dualByBirthCell, true);
    } else if (dualType?.toLowerCase() === 'by naturalization') {
      setCheckbox(sheet, dualByNaturalizationCell, true);
    }

    if (countryCell && country) {
      setCellValue(sheet, countryCell, country);
    }
  }
}

/**
 * Format address components
 */
export function formatAddress(address: {
  houseBlockLotNo?: string;
  street?: string;
  subdivisionVillage?: string;
  barangay?: string;
  cityMunicipality?: string;
  province?: string;
  zipCode?: string;
}): string {
  const parts = [
    address.houseBlockLotNo,
    address.street,
    address.subdivisionVillage,
    address.barangay,
    address.cityMunicipality,
    address.province,
    address.zipCode,
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Get worksheet by name
 */
export function getWorksheet(workbook: XlsxWorkbook, sheetName: string): XlsxSheet {
  const sheet = workbook.sheet(sheetName);
  
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found. Available: ${workbook.sheets().map((s: XlsxSheet) => s.name()).join(', ')}`);
  }
  
  return sheet;
}

/**
 * Write workbook to buffer - FIXED for xlsx-populate
 */
export async function writeWorkbookToBuffer(workbook: XlsxWorkbook): Promise<Buffer> {
  return await workbook.outputAsync(); // ✅ FIXED: Use outputAsync() and await it
}