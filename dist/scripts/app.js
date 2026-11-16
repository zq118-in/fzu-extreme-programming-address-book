import { normalizeContact, filterContacts, demoContacts, importRows, toRows, MAX_CONTACTS } from './core.mjs';

const $ = selector => document.querySelector(selector);
const STORAGE_KEY = 'linbook.contacts.v1';
const GROUPS = [
  { key: 'phones', title: '电话号码', placeholder: '例如：13800000000', autocomplete: 'tel', type: 'tel' },
  { key: 'emails', title: '电子邮箱', placeholder: '例如：name@example.com', autocomplete: 'email', type: 'email' },
  { key: 'socials', title: '社交账号', placeholder: '例如：微信：my_account', autocomplete: 'off', type: 'text' },
  { key: 'addresses', title: '联系地址', placeholder: '例如：城市、街道或详细地址', autocomplete: 'street-address', type: 'text' },
];
let contacts = [];
let favoritesOnly = false;
let query = '';
let pendingImport = null;
let pendingDelete = null;
let detailId = null;
let toastTimer;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function toast(message, error = false) {
  const node = $('#toast');
  clearTimeout(toastTimer);
  node.textContent = message;
  node.classList.toggle('error', error);
  node.hidden = false;
  toastTimer = setTimeout(() => { node.hidden = true; }, error ? 8000 : 4000);
}

function save(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    contacts = next;
    render();
    return true;
  } catch {
    toast('保存失败：浏览器存储不可用或空间不足。原有数据未修改，请导出备份。', true);
    return false;
  }
}

function load() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      const sample = demoContacts();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
      contacts = sample;
    } else {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed) || parsed.length > MAX_CONTACTS) throw new Error('invalid storage');
      const ids = new Set();
      contacts = parsed.map(contact => {
        const value = normalizeContact(contact, contact.updatedAt);
        if (ids.has(value.id)) throw new Error('duplicate stored IDs');
        ids.add(value.id);
        return value;
      });
    }
  } catch {
    contacts = [];
    $('#storage-warning').textContent = '浏览器数据无法读取或存储不可用。为避免覆盖原数据，未自动恢复演示联系人。可尝试导出已有备份后重新导入。';
    $('#storage-warning').hidden = false;
  }
}

function render() {
  const favoriteCount = contacts.filter(contact => contact.favorite).length;
  $('#stat-total').textContent = $('#nav-total').textContent = contacts.length;
  $('#stat-favorites').textContent = $('#nav-favorite-count').textContent = favoriteCount;
  $('#stat-methods').textContent = contacts.reduce((sum, contact) => sum + GROUPS.reduce((count, { key }) => count + contact[key].length, 0), 0);
  $('#list-title').textContent = favoritesOnly ? '我的收藏' : '全部联系人';
  $('#nav-all').classList.toggle('active', !favoritesOnly);
  $('#nav-favorites').classList.toggle('active', favoritesOnly);
  $('#nav-all').setAttribute('aria-pressed', String(!favoritesOnly));
  $('#nav-favorites').setAttribute('aria-pressed', String(favoritesOnly));
  const filtered = filterContacts(contacts, query, favoritesOnly);
  $('#result-count').textContent = `${filtered.length} 位`;
  $('#footer-count').textContent = `显示 ${filtered.length} 位 · 共 ${contacts.length} 位联系人`;
  const body = $('#contact-list');
  body.replaceChildren();
  const fragment = document.createDocumentFragment();
  filtered.forEach((contact, index) => {
    const row = el('tr');
    const personCell = el('td');
    const person = el('button', 'person-button');
    person.type = 'button';
    person.setAttribute('aria-label', `查看 ${contact.name} 的详情`);
    person.addEventListener('click', () => openDetail(contact.id));
    person.append(el('span', `avatar color-${index % 5}`, [...contact.name][0]));
    const personText = el('span', 'person-text');
    personText.append(el('span', 'person-name', contact.name));
    const methodCount = GROUPS.reduce((sum, { key }) => sum + contact[key].length, 0);
    personText.append(el('span', 'person-meta', `${methodCount} 项联系方式`));
    person.append(personText);
    personCell.append(person);
    const methodCell = el('td');
    const lines = [];
    if (contact.phones.length) lines.push(['⌕', contact.phones[0]]);
    if (contact.emails.length) lines.push(['✉', contact.emails[0]]);
    if (!lines.length && contact.socials.length) lines.push(['＠', contact.socials[0]]);
    if (!lines.length && contact.addresses.length) lines.push(['⌖', contact.addresses[0]]);
    if (!lines.length) lines.push(['—', '暂无联系方式']);
    for (const [symbol, value] of lines) {
      const line = el('span', 'method-line');
      line.title = value;
      line.append(el('span', 'method-symbol', symbol), document.createTextNode(value));
      methodCell.append(line);
    }
    const organizationCell = el('td');
    const company = el('span', 'organization', contact.company || '未填写');
    company.title = contact.company;
    organizationCell.append(company);
    const favoriteCell = el('td', 'favorite-cell');
    const favorite = el('button', `favorite-button${contact.favorite ? ' selected' : ''}`, contact.favorite ? '★' : '☆');
    favorite.type = 'button';
    favorite.setAttribute('aria-label', `${contact.favorite ? '取消收藏' : '收藏'} ${contact.name}`);
    favorite.setAttribute('aria-pressed', String(contact.favorite));
    favorite.addEventListener('click', () => {
      const next = contacts.map(item => item.id === contact.id ? { ...item, favorite: !item.favorite, updatedAt: new Date().toISOString() } : item);
      if (save(next)) toast(contact.favorite ? '已取消收藏' : '已加入我的收藏');
    });
    favoriteCell.append(favorite);
    const actions = el('td', 'actions-cell');
    const edit = el('button', 'action-button', '编辑');
    edit.setAttribute('aria-label', `编辑 ${contact.name}`);
    edit.addEventListener('click', () => openEditor(contact.id));
    const remove = el('button', 'action-button delete', '删除');
    remove.setAttribute('aria-label', `删除 ${contact.name}`);
    remove.addEventListener('click', () => {
      pendingDelete = contact.id;
      $('#delete-message').textContent = `确定删除「${contact.name}」及其全部联系方式吗？`;
      $('#delete-dialog').showModal();
    });
    actions.append(edit, el('span', 'action-divider', '/'), remove);
    row.append(personCell, methodCell, organizationCell, favoriteCell, actions);
    fragment.append(row);
  });
  body.append(fragment);
  $('#empty-state').hidden = filtered.length > 0;
  $('.table-wrap').hidden = filtered.length === 0;
  $('#empty-title').textContent = query ? '没有找到匹配的联系人' : favoritesOnly ? '还没有收藏联系人' : '还没有联系人';
  $('#empty-description').textContent = query ? '试试其他姓名、电话、邮箱或组织关键词。' : favoritesOnly ? '点击联系人旁边的星标，将重要的人留在这里。' : '从新建第一位联系人开始，或导入 Excel 通讯录。';
  $('#empty-add').hidden = !!query || favoritesOnly;
}

function addMethod(group, value = '') {
  const list = $(`[data-method-list="${group.key}"]`);
  if (list.children.length >= 30) return toast('每类联系方式最多 30 项', true);
  const row = el('div', 'method-input-row');
  const input = document.createElement('input');
  input.type = group.type;
  input.maxLength = 500;
  input.value = value;
  input.placeholder = group.placeholder;
  input.autocomplete = group.autocomplete;
  input.setAttribute('aria-label', group.title);
  const remove = el('button', 'method-remove', '×');
  remove.type = 'button';
  remove.setAttribute('aria-label', `移除此项${group.title}`);
  remove.addEventListener('click', () => {
    row.remove();
    if (!list.children.length) addMethod(group);
  });
  row.append(input, remove);
  list.append(row);
}

function openEditor(id = null) {
  const contact = contacts.find(item => item.id === id);
  $('#contact-form').reset();
  $('#form-error').hidden = true;
  $('#contact-dialog-title').textContent = contact ? '编辑联系人' : '新建联系人';
  $('#contact-id').value = contact?.id ?? '';
  $('#contact-name').value = contact?.name ?? '';
  $('#contact-company').value = contact?.company ?? '';
  $('#contact-note').value = contact?.note ?? '';
  $('#contact-favorite').checked = contact?.favorite ?? false;
  const fields = $('#method-fields');
  fields.replaceChildren();
  for (const group of GROUPS) {
    const section = el('section', 'method-group');
    const header = el('div', 'method-header');
    header.append(el('h3', '', group.title));
    const add = el('button', 'text-button method-add', '＋ 添加一项');
    add.type = 'button';
    add.setAttribute('aria-label', `添加${group.title}`);
    add.addEventListener('click', () => {
      addMethod(group);
      $(`[data-method-list="${group.key}"]`).lastElementChild?.querySelector('input').focus();
    });
    header.append(add);
    const list = el('div');
    list.dataset.methodList = group.key;
    section.append(header, list);
    fields.append(section);
    const values = contact?.[group.key]?.length ? contact[group.key] : [''];
    values.forEach(value => addMethod(group, value));
  }
  $('#contact-dialog').showModal();
  $('#contact-name').focus();
}

$('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const old = contacts.find(contact => contact.id === $('#contact-id').value);
    if (!old && contacts.length >= MAX_CONTACTS) throw new Error(`通讯录最多 ${MAX_CONTACTS} 条联系人`);
    const draft = { id: old?.id, name: $('#contact-name').value, company: $('#contact-company').value, note: $('#contact-note').value, favorite: $('#contact-favorite').checked, createdAt: old?.createdAt };
    for (const { key } of GROUPS) draft[key] = [...$(`[data-method-list="${key}"]`).querySelectorAll('input')].map(input => input.value);
    const contact = normalizeContact(draft);
    const next = old ? contacts.map(item => item.id === old.id ? contact : item) : [...contacts, contact];
    if (save(next)) {
      $('#contact-dialog').close();
      toast(old ? '联系人已更新' : '联系人已创建');
    }
  } catch (error) {
    $('#form-error').textContent = error.message;
    $('#form-error').hidden = false;
    $('#form-error').scrollIntoView({ block: 'nearest' });
  }
});

function openDetail(id) {
  const contact = contacts.find(item => item.id === id);
  if (!contact) return;
  detailId = id;
  const content = $('#detail-content');
  content.replaceChildren();
  const head = el('div', 'detail-person');
  head.append(el('span', 'avatar', [...contact.name][0]));
  const info = el('div');
  info.append(el('h3', '', `${contact.name}${contact.favorite ? ' ★' : ''}`), el('p', '', contact.company || '未填写公司 / 组织'));
  head.append(info);
  content.append(head);
  for (const group of GROUPS) {
    const section = el('section', 'detail-group');
    section.append(el('h4', '', group.title));
    if (!contact[group.key].length) section.append(el('span', 'detail-value detail-empty', '未填写'));
    for (const value of contact[group.key]) {
      const line = el('span', 'detail-value');
      if (group.key === 'emails' || group.key === 'phones') {
        const link = el('a', '', value);
        link.href = `${group.key === 'emails' ? 'mailto:' : 'tel:'}${encodeURIComponent(value)}`;
        line.append(link);
      } else line.textContent = value;
      section.append(line);
    }
    content.append(section);
  }
  const note = el('section', 'detail-group');
  note.append(el('h4', '', '备注'), el('span', `detail-value${contact.note ? '' : ' detail-empty'}`, contact.note || '未填写'));
  content.append(note);
  $('#detail-dialog').showModal();
}

function assertExcel() {
  if (!window.XLSX) throw new Error('Excel 组件未加载，请确认 vendor/xlsx.full.min.js 文件完整后刷新页面。');
}

function downloadWorkbook(rows, filename) {
  assertExcel();
  const worksheet = window.XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [20, 22, 34, 40, 34, 40, 8, 45].map(wch => ({ wch }));
  if (rows.length > 1) worksheet['!autofilter'] = { ref: window.XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length - 1, c: 7 } }) };
  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, worksheet, '通讯录');
  window.XLSX.writeFile(workbook, filename, { bookType: 'xlsx', compression: true });
}

$('#export-all').addEventListener('click', () => {
  try {
    downloadWorkbook(toRows(contacts), `邻簿通讯录-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast(`已导出全部 ${contacts.length} 位联系人`);
  } catch (error) { toast(error.message, true); }
});

$('#download-template').addEventListener('click', () => {
  try {
    const sample = normalizeContact({ name: '示例联系人（请替换）', company: '示例组织', phones: ['13800000000', '021-00000000'], emails: ['sample@example.com'], socials: ['微信：sample'], addresses: ['示例地址'], favorite: false, note: '请替换或删除本示例行；无联系方式的单元格填写 []。' });
    downloadWorkbook(toRows([sample]), '邻簿导入模板.xlsx');
  } catch (error) { toast(error.message, true); }
});

$('#import-open').addEventListener('click', () => {
  pendingImport = null;
  $('#import-file').value = '';
  $('#import-result').hidden = true;
  $('#confirm-import').disabled = true;
  $('#import-dialog').showModal();
});

let importSequence = 0;
$('#import-file').addEventListener('change', async event => {
  const sequence = ++importSequence;
  pendingImport = null;
  $('#confirm-import').disabled = true;
  const file = event.target.files[0];
  const result = $('#import-result');
  result.hidden = !file;
  result.classList.remove('error');
  if (!file) return;
  result.textContent = '正在检查文件…';
  try {
    assertExcel();
    if (!/\.xlsx$/i.test(file.name)) throw new Error('仅支持 .xlsx 格式，请先将旧版 .xls 另存为 .xlsx');
    if (file.size > 5 * 1024 * 1024) throw new Error('文件不能超过 5 MB');
    const data = await file.arrayBuffer();
    if (sequence !== importSequence) return;
    const workbook = window.XLSX.read(data, { type: 'array', cellFormula: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('文件没有工作表');
    const sheet = workbook.Sheets[sheetName];
    if (Object.values(sheet).some(cell => cell && typeof cell === 'object' && cell.f)) throw new Error('导入文件含有公式。请先将公式粘贴为纯文本或数值后再导入。');
    if (sheet['!ref']) {
      const range = window.XLSX.utils.decode_range(sheet['!ref']);
      if (range.e.r > 5000 || range.e.c > 50) throw new Error('工作表范围过大，请移除多余空白行、列后重试');
    }
    const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, blankrows: true });
    const preview = importRows(rows, contacts);
    pendingImport = rows;
    result.textContent = `检查通过：读取 ${preview.total} 条，将新增 ${preview.added.length} 条，跳过 ${preview.skipped} 条完全重复记录。仅读取第一个工作表「${sheetName}」。点击确认后保存。`;
    $('#confirm-import').disabled = false;
  } catch (error) {
    if (sequence !== importSequence) return;
    result.classList.add('error');
    result.textContent = `未导入任何数据。${error.message}`;
  }
});

$('#confirm-import').addEventListener('click', () => {
  if (!pendingImport) return;
  try {
    // Revalidate against current state so another open action cannot introduce duplicates.
    const preview = importRows(pendingImport, contacts);
    if (!preview.added.length || save([...contacts, ...preview.added])) {
      $('#import-dialog').close();
      pendingImport = null;
      toast(`导入完成：新增 ${preview.added.length} 条，跳过 ${preview.skipped} 条重复记录`);
    }
  } catch (error) { toast(error.message, true); }
});

$('#confirm-delete').addEventListener('click', () => {
  if (!pendingDelete) return;
  if (save(contacts.filter(contact => contact.id !== pendingDelete))) {
    $('#delete-dialog').close();
    pendingDelete = null;
    toast('联系人已删除');
  }
});
$('#load-demo').addEventListener('click', () => {
  try {
    const demo = importRows(toRows(demoContacts()), contacts);
    if (!demo.added.length) return toast('演示联系人已存在');
    if (save([...contacts, ...demo.added])) toast(`已载入 ${demo.added.length} 位虚构演示联系人`);
  } catch (error) { toast(error.message, true); }
});
$('#nav-all').addEventListener('click', () => { favoritesOnly = false; render(); });
$('#nav-favorites').addEventListener('click', () => { favoritesOnly = true; render(); });
$('#search').addEventListener('input', event => { query = event.target.value; render(); });
$('#add-contact').addEventListener('click', () => openEditor());
$('#empty-add').addEventListener('click', () => openEditor());
$('#detail-edit').addEventListener('click', () => { $('#detail-dialog').close(); openEditor(detailId); });
document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => $('#contact-dialog').close()));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog && (event.clientX < dialog.getBoundingClientRect().left || event.clientX > dialog.getBoundingClientRect().right || event.clientY < dialog.getBoundingClientRect().top || event.clientY > dialog.getBoundingClientRect().bottom)) dialog.close(); }));
document.addEventListener('keydown', event => {
  if (event.key === '/' && !document.querySelector('dialog[open]') && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    $('#search').focus();
  }
});
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY) { load(); render(); toast('已同步此浏览器其他标签页的通讯录变更'); }
});
load();
render();
