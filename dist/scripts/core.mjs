/** Contact data and reversible spreadsheet conversion. No DOM or storage dependencies. */
export const HEADERS = ['姓名', '公司/组织', '电话（JSON数组）', '邮箱（JSON数组）', '社交账号（JSON数组）', '地址（JSON数组）', '收藏', '备注'];
export const MAX_CONTACTS = 10000;
export const MAX_IMPORT_ROWS = 1000;
const MULTI_FIELDS = ['phones', 'emails', 'socials', 'addresses'];

export function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `contact-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function boundedText(value, label, max = 500) {
  if (typeof value !== 'string') throw new Error(`${label}必须是文本`);
  const text = value.trim();
  if (text.length > max) throw new Error(`${label}最多 ${max} 个字符`);
  return text;
}

export function normalizeContact(input, now = new Date().toISOString()) {
  const name = boundedText(input.name, '姓名', 100);
  if (!name) throw new Error('请填写联系人姓名');
  const contact = {
    id: typeof input.id === 'string' && input.id ? input.id : newId(),
    name,
    company: boundedText(input.company ?? '', '公司/组织', 150),
    note: boundedText(input.note ?? '', '备注', 1000),
    favorite: input.favorite === true,
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : now,
    updatedAt: now,
  };
  for (const field of MULTI_FIELDS) {
    if (!Array.isArray(input[field])) throw new Error(`${field}必须是数组`);
    if (input[field].length > 30) throw new Error('每类联系方式最多 30 项');
    const values = input[field].map(value => boundedText(value, '联系方式')).filter(Boolean);
    contact[field] = [...new Set(values)];
  }
  for (const email of contact.emails) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`邮箱格式不正确：${email}`);
  }
  return contact;
}

export function toRows(contacts) {
  return [HEADERS.slice(), ...contacts.map(contact => [
    contact.name, contact.company,
    ...MULTI_FIELDS.map(field => JSON.stringify(contact[field])),
    contact.favorite ? '1' : '0', contact.note,
  ])];
}

export function fingerprint(contact) {
  return JSON.stringify([
    contact.name, contact.company, ...MULTI_FIELDS.map(field => [...contact[field]].sort()),
    contact.favorite, contact.note,
  ]);
}

export function importRows(rows, existing = []) {
  if (!Array.isArray(rows) || !Array.isArray(rows[0])) throw new Error('Excel 文件为空或没有表头');
  const header = rows[0].map(value => String(value ?? '').trim());
  if (header.length !== HEADERS.length || new Set(header).size !== HEADERS.length || HEADERS.some(name => !header.includes(name))) {
    throw new Error(`表头不正确。请下载导入模板，保留全部 ${HEADERS.length} 个列名。`);
  }
  const data = rows.slice(1).map((row, index) => ({ row, line: index + 2 }))
    .filter(({ row }) => row.some(value => String(value ?? '').trim() !== ''));
  if (!data.length) throw new Error('表格中没有联系人数据');
  if (data.length > MAX_IMPORT_ROWS) throw new Error(`单次最多导入 ${MAX_IMPORT_ROWS} 条联系人`);
  const indexOf = name => header.indexOf(name);
  const parsed = [];
  // Validate every row before exposing any result. A bad row never causes a partial write.
  for (const { row, line } of data) {
    try {
      if (row.length > header.length && row.slice(header.length).some(value => String(value ?? '').trim())) throw new Error('存在表头以外的多余列');
      const get = name => String(row[indexOf(name)] ?? '').trim();
      const flag = get('收藏');
      if (!['0', '1'].includes(flag)) throw new Error('收藏列只接受 0 或 1');
      const candidate = { name: get('姓名'), company: get('公司/组织'), note: get('备注'), favorite: flag === '1' };
      for (const [offset, field] of MULTI_FIELDS.entries()) {
        let values;
        try { values = JSON.parse(get(HEADERS[offset + 2])); }
        catch { throw new Error(`${HEADERS[offset + 2]}必须填写 JSON 字符串数组，例如 ["13800000000"]；无数据填 []`); }
        if (!Array.isArray(values) || values.some(value => typeof value !== 'string')) throw new Error(`${HEADERS[offset + 2]}必须是字符串数组`);
        candidate[field] = values;
      }
      parsed.push(normalizeContact(candidate));
    } catch (error) { throw new Error(`第 ${line} 行：${error.message}`); }
  }
  const known = new Set(existing.map(fingerprint));
  const added = [];
  let skipped = 0;
  for (const contact of parsed) {
    const key = fingerprint(contact);
    if (known.has(key)) skipped += 1;
    else { known.add(key); added.push(contact); }
  }
  if (existing.length + added.length > MAX_CONTACTS) throw new Error(`通讯录最多保存 ${MAX_CONTACTS} 条联系人`);
  return { added, skipped, total: parsed.length };
}

export function filterContacts(contacts, query = '', favoritesOnly = false) {
  const needle = query.trim().toLocaleLowerCase();
  return contacts.filter(contact => (!favoritesOnly || contact.favorite)
    && (!needle || [contact.name, contact.company, contact.note, ...MULTI_FIELDS.flatMap(field => contact[field])]
      .some(value => value.toLocaleLowerCase().includes(needle))))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
}

export function demoContacts() {
  const rows = [
    ['林知夏（示例）', '设计协作组', ['13800000001', '021-00000001'], ['lin.demo@example.com'], ['微信：lin_demo'], ['示例市 · 创意园'], true, '虚构演示联系人，用于展示多个联系方式。'],
    ['周予安（示例）', '项目开发组', ['13800000002'], ['zhou.demo@example.com', 'dev.demo@example.com'], ['GitHub：demo-user'], [], true, '虚构演示联系人。'],
    ['陈一诺（示例）', '产品研究组', ['13800000003'], ['chen.demo@example.com'], ['微信：chen_demo'], ['示例市 · 大学城'], false, '虚构演示联系人。'],
    ['许星河（示例）', '开源兴趣小组', [], ['xu.demo@example.com'], ['GitHub：sample-person'], [], false, '虚构演示联系人。'],
    ['沈听澜（示例）', '课程项目组', ['13800000005'], ['shen.demo@example.com'], [], [], true, '虚构演示联系人。'],
    ['顾明远（示例）', '学习伙伴', ['13800000006'], [], ['微信：gu_demo'], ['示例市 · 图书馆'], false, '虚构演示联系人。'],
  ];
  return rows.map(([name, company, phones, emails, socials, addresses, favorite, note]) => normalizeContact({ name, company, phones, emails, socials, addresses, favorite, note }));
}
