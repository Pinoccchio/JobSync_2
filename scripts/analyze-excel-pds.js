const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '..', '..', 'Excel', 'ANNEX H-1 - CS Form No. 212 Revised 2025 - Personal Data Sheet.xlsx');

console.log('Reading Excel file:', excelPath);

try {
  const workbook = XLSX.readFile(excelPath);

  console.log('\n=== WORKBOOK INFORMATION ===');
  console.log('Sheet Names:', workbook.SheetNames);
  console.log('Number of Sheets:', workbook.SheetNames.length);

  // Analyze each sheet
  workbook.SheetNames.forEach((sheetName, index) => {
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    console.log(`\n=== SHEET ${index + 1}: ${sheetName} ===`);
    console.log(`Range: ${worksheet['!ref']}`);
    console.log(`Rows: ${range.e.r - range.s.r + 1}`);
    console.log(`Columns: ${range.e.c - range.s.c + 1}`);

    // Check for merged cells
    if (worksheet['!merges']) {
      console.log(`Merged Cells: ${worksheet['!merges'].length}`);
    }

    // Sample first 20 rows
    console.log('\n--- First 20 rows sample ---');
    for (let row = range.s.r; row <= Math.min(range.s.r + 19, range.e.r); row++) {
      const rowData = [];
      for (let col = range.s.c; col <= Math.min(range.s.c + 10, range.e.c); col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        rowData.push(cell ? (cell.v || '') : '');
      }
      if (rowData.some(v => v !== '')) {
        console.log(`Row ${row + 1}:`, rowData.slice(0, 5).join(' | '));
      }
    }
  });

  console.log('\n✅ Analysis complete');
} catch (error) {
  console.error('❌ Error reading Excel file:', error.message);
  process.exit(1);
}
