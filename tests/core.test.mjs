import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { normalizeContact, demoContacts, toRows, importRows, filterContacts, HEADERS, MAX_IMPORT_ROWS } from '../dist/scripts/core.mjs';

const make = overrides => normalizeContact({ name: '测试用户', company: '项目组', phones: ['13800000000', '021-00000000'], emails: ['test@example.com'], socials: ['微信：test'], addresses: ['示例地址'], note: '一条备注', favorite: true, ...overrides });

test('normalization trims, deduplicates multiple methods and preserves explicit favorite', () => {
  const contact = make({ name: ' 测试 ', phones: [' 13800000000 ', '', '13800000000'], favorite: false });
  assert.equal(contact.name, '测试');
  assert.deepEqual(contact.phones, ['13800000000']);
  assert.equal(contact.favorite, false);
  assert.throws(() => make({ name: '' }), /姓名/);
  assert.throws(() => make({ emails: ['bad-email'] }), /邮箱格式/);
});

test('spreadsheet roundtrip preserves all public contact fields, unicode and punctuation', () => {
  const source = make({ phones: ['+86 13800000000', '021-00000000'], socials: ['微信：hello,world', '引号"与换行\n符号'], note: '=SUM(A1:A3)' });
  const result = importRows(toRows([source]));
  assert.equal(result.added.length, 1);
  for (const key of ['name', 'company', 'note', 'favorite', 'phones', 'emails', 'socials', 'addresses']) assert.deepEqual(result.added[0][key], source[key]);
});

test('import accepts reordered exact headers and rejects missing/duplicate/wrong headers', () => {
  const rows = toRows([make()]).map(row => row.slice().reverse());
  assert.equal(importRows(rows).added[0].name, '测试用户');
  assert.throws(() => importRows([[...HEADERS.slice(1)], ...rows.slice(1)]), /表头/);
  assert.throws(() => importRows([[...HEADERS.slice(0, -1), HEADERS[0]], ...rows.slice(1)]), /表头/);
});

test('one invalid later row aborts entire import without mutating existing records', () => {
  const existing = [make({ name: '已有联系人' })];
  const before = JSON.stringify(existing);
  const rows = toRows([make(), make({ name: '第二行' })]);
  rows[2][3] = '[123]';
  assert.throws(() => importRows(rows, existing), /第 3 行/);
  assert.equal(JSON.stringify(existing), before);
  rows[2][3] = 'not JSON';
  assert.throws(() => importRows(rows), /JSON/);
});

test('duplicate imports skip exact records, tolerate method order, preserve changed same-name records', () => {
  const existing = make();
  const result = importRows(toRows([existing, make({ phones: existing.phones.slice().reverse() }), make({ note: '更新备注' })]), [existing]);
  assert.equal(result.total, 3);
  assert.equal(result.skipped, 2);
  assert.equal(result.added.length, 1);
  assert.equal(result.added[0].note, '更新备注');
});

test('validation rejects invalid favorite, oversized arrays and non-string contact methods', () => {
  const rows = toRows([make()]);
  rows[1][6] = 'yes';
  assert.throws(() => importRows(rows), /收藏列/);
  assert.throws(() => make({ phones: Array.from({ length: 31 }, (_, i) => String(i)) }), /最多 30/);
  assert.throws(() => make({ phones: [123] }), /文本/);
});

test('row limit and empty workbook guard against accidental bulk import', () => {
  assert.throws(() => importRows([]), /空/);
  assert.throws(() => importRows([HEADERS]), /没有联系人/);
  const row = toRows([make()])[1];
  assert.throws(() => importRows([HEADERS, ...Array(MAX_IMPORT_ROWS + 1).fill(row)]), /最多导入/);
});

test('search includes every method and notes, favorite filter intersects search', () => {
  const a = make({ name: '甲', favorite: true, socials: ['wechat: UNIQUE'], note: '特殊备注' });
  const b = make({ name: '乙', favorite: false });
  assert.equal(filterContacts([a, b], 'unique').length, 1);
  assert.equal(filterContacts([a, b], '特殊备注')[0].name, '甲');
  assert.equal(filterContacts([a, b], 'test@example.com', true).length, 1);
  assert.equal(filterContacts([a, b], '不存在').length, 0);
});

test('demo data is explicitly fictional and exports into separate rows', () => {
  const demos = demoContacts();
  assert.equal(demos.length, 6);
  assert.ok(demos.every(contact => contact.name.includes('示例') && contact.note.includes('虚构')));
  assert.equal(toRows(demos).length, 7);
  assert.ok(demos.some(contact => contact.phones.length > 1 && contact.emails.length > 0));
});

test('bundled SheetJS produces genuine XLSX and preserves literal strings and leading zeroes', () => {
  const sandbox = { Uint8Array, ArrayBuffer, TextDecoder, TextEncoder, console };
  runInNewContext(readFileSync(new URL('../dist/vendor/xlsx.full.min.js', import.meta.url), 'utf8'), sandbox);
  const XLSX = sandbox.XLSX;
  assert.ok(XLSX?.utils, 'bundled spreadsheet library should load without a CDN');
  const source = make({ name: '真实格式回环测试', phones: ['00123456789', '+86 13800000000'], note: '=SUM(A1:A3)' });
  const sheet = XLSX.utils.aoa_to_sheet(toRows([source]));
  assert.equal(sheet.H2.t, 's');
  assert.equal(sheet.H2.f, undefined, 'formula-like user input must remain literal text');
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, '通讯录');
  const binary = XLSX.write(book, { type: 'array', bookType: 'xlsx', compression: true });
  assert.equal(new Uint8Array(binary)[0], 0x50, 'XLSX is a ZIP container');
  const reopened = XLSX.read(binary, { type: 'array' });
  const rows = XLSX.utils.sheet_to_json(reopened.Sheets[reopened.SheetNames[0]], { header: 1, raw: false, defval: '', blankrows: true });
  const result = importRows(rows).added[0];
  assert.deepEqual(result.phones, source.phones);
  assert.equal(result.note, '=SUM(A1:A3)');
  assert.equal(result.name, source.name);
});
