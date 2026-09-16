function escapeCsvCell(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/**
 * columns: [{ key, header }] — `key` may be a dotted path ("medicine.name").
 * rows: array of plain objects.
 */
export function exportCsv(filename, columns, rows) {
  const getValue = (row, key) => key.split('.').reduce((v, k) => (v == null ? v : v[k]), row);

  const lines = [
    columns.map((c) => escapeCsvCell(c.header)).join(','),
    ...rows.map((row) => columns.map((c) => escapeCsvCell(getValue(row, c.key))).join(',')),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
