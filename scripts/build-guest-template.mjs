import writeXlsxFile from 'write-excel-file/node'

// A stable download URL avoids stale lazy-loaded JS after a deployment.
const rows = [
  ['Guest Name', 'Gift Procession', 'Group'],
  ['Example Guest — replace this row', 'No', 'Unassigned'],
  ['លោក និងលោកស្រី សុខា', 'Yes', 'Victor'],
]
await writeXlsxFile(rows.map(row => row.map(value => ({ type: String, value }))), {
  columns: [{ width: 42 }, { width: 22 }, { width: 22 }],
}).toFile('public/assets/guest-import-template.xlsx')
