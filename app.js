const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const defaultWorks = [
  { id: 1, name: 'Лабораторна №4 — Алгоритми Краскала і Прима', subject: 'Дискретна математика', type: 'Лабораторна', date: '2026-10-10', time: '23:59', status: 'В процесі', statusLabel: 'Післязавтра', priority: 'Високий', score: '', maxScore: '', notes: '' },
  { id: 2, name: 'Практична №7 — Нормалізація БД', subject: 'Бази даних', type: 'Практична', date: '2026-10-12', time: '18:00', status: 'В процесі', statusLabel: 'Через 4 дні', priority: 'Середній', score: '', maxScore: '', notes: '' },
  { id: 3, name: 'Лабораторна №3 — Багатопоточність', subject: 'Операційні системи', type: 'Лабораторна', date: '2026-10-07', time: '23:59', status: 'Прострочено', statusLabel: 'Прострочено на 1 день', priority: 'Високий', score: '', maxScore: '', notes: '' },
  { id: 4, name: 'Практична №5 — Невизначені інтеграли', subject: 'Вища математика', type: 'Практична', date: '2026-10-15', time: '23:59', status: 'В процесі', statusLabel: 'Через 7 днів', priority: 'Низький', score: '', maxScore: '', notes: '' },
  { id: 5, name: 'Лабораторна №2 — Робота з Git', subject: 'Основи програмування', type: 'Лабораторна', date: '2026-10-05', time: '23:59', status: 'Виконано', statusLabel: 'Виконано', priority: 'Середній', score: '', maxScore: '', notes: '' },
  { id: 6, name: 'Практична №4 — Обхід графів', subject: 'Дискретна математика', type: 'Практична', date: '2026-10-03', time: '18:00', status: 'Виконано', statusLabel: 'Виконано', priority: 'Низький', score: '', maxScore: '', notes: '' }
];

let works = JSON.parse(localStorage.getItem('workTrackerWorksV2')) || defaultWorks;
let currentFilter = 'all';
let selectedType = 'Лабораторна';
let selectedPriority = 'Середній';
let selectedStatus = 'В процесі';

const dateText = (value) => {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short' }).format(date).replace('.', '');
};

function isoToDot(value) {
  const [year, month, day] = value.split('-');
  return `${day}.${month}.${year}`;
}

function dotToIso(value) {
  const match = String(value).trim().match(/^([0-3]?\d)\.([0-1]?\d)\.((?:19|20)\d{2})$/);
  if (!match) return '';
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function saveWorks() {
  localStorage.setItem('workTrackerWorksV2', JSON.stringify(works));
}

function statusClass(work) {
  if (work.status === 'Виконано') return 'status-done';
  if (work.status === 'Прострочено') return 'status-late';
  if (work.statusLabel === 'Післязавтра') return 'status-soon';
  return 'status-future';
}

function statusLabel(work) {
  return work.statusLabel || work.status;
}

function render() {
  const search = $('#search').value.trim().toLowerCase();
  let filtered = works.filter(work => {
    const matchesSearch = !search || `${work.name} ${work.subject}`.toLowerCase().includes(search);
    const matchesFilter = currentFilter === 'all' ||
      (currentFilter === 'done' ? work.status === 'Виконано' :
      currentFilter === 'active' ? work.status !== 'Виконано' :
      currentFilter === 'overdue' ? work.status === 'Прострочено' :
      currentFilter === 'today' ? work.date === '2026-10-08' :
      currentFilter === 'week' ? work.date >= '2026-10-08' && work.date <= '2026-10-14' :
      work.type === currentFilter);
    return matchesSearch && matchesFilter;
  });

  const sort = $('#sort').value;
  filtered.sort((a, b) => {
    if (sort === 'date-desc') return b.date.localeCompare(a.date);
    if (sort === 'name') return a.name.localeCompare(b.name, 'uk');
    if (sort === 'priority') return ['Високий','Середній','Низький'].indexOf(a.priority) - ['Високий','Середній','Низький'].indexOf(b.priority);
    return a.id - b.id;
  });

  $('#work-list').innerHTML = filtered.map(work => `
    <tr class="${work.status === 'Виконано' ? 'completed' : ''}" data-id="${work.id}">
      <td><input class="work-check" type="checkbox" aria-label="Позначити виконаною" ${work.status === 'Виконано' ? 'checked' : ''}></td>
      <td><div class="work-title">${escapeHtml(work.name)}</div><div class="work-subtitle">${escapeHtml(work.subject)} · ${escapeHtml(work.type)}</div></td>
      <td><div>${dateText(work.date)}</div></td>
      <td><span class="status-pill ${statusClass(work)}">${statusLabel(work)}</span></td>
      <td class="priority">${work.priority}</td>
      <td>${work.score ? `<button class="grade-btn">${work.score}/${work.maxScore}</button>` : '<span>—</span>'}</td>
      <td><button class="edit-btn" aria-label="Редагувати роботу">✎</button></td>
    </tr>`).join('');

  $('#empty-state').hidden = filtered.length > 0;
  updateStats();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

function updateStats() {
  const total = works.length;
  const done = works.filter(w => w.status === 'Виконано').length;
  const overdue = works.filter(w => w.status === 'Прострочено').length;
  const progress = works.filter(w => w.status !== 'Виконано' && w.status !== 'Прострочено').length;
  $('#stat-total').textContent = total;
  $('#stat-progress').textContent = progress;
  $('#stat-done').textContent = done;
  $('#stat-overdue').textContent = overdue;
  $('#nav-all').textContent = total;
  $('#nav-done').textContent = done;
  $('#nav-overdue').textContent = overdue;
}

function chooseSegment(container, attribute, value) {
  $$( `[${attribute}]`, $(container)).forEach(button => button.classList.toggle('chosen', button.getAttribute(attribute) === value));
}

function openModal(work = null) {
  $('#modal-title').textContent = work ? 'Редагувати роботу' : 'Нова робота';
  $('#work-id').value = work?.id || '';
  $('#work-name').value = work?.name || '';
  $('#work-subject').value = work?.subject || 'Дискретна математика';
  $('#reminder').value = 'За 2 дні';
  $('#work-date').value = work?.date ? isoToDot(work.date) : '10.10.2026';
  $('#work-time').value = work?.time || '23:59';
  $('#score').value = work?.score || '';
  $('#max-score').value = work?.maxScore || '';
  $('#notes').value = work?.notes || '';
  selectedType = work?.type || 'Лабораторна';
  selectedPriority = work?.priority || 'Середній';
  selectedStatus = work?.status === 'Прострочено' ? 'В процесі' : (work?.status || 'В процесі');
  chooseSegment('#type-options', 'data-type', selectedType);
  chooseSegment('#priority-options', 'data-priority', selectedPriority);
  chooseSegment('#status-options', 'data-status', selectedStatus);
  $('#modal-backdrop').hidden = false;
  setTimeout(() => $('#work-name').focus(), 0);
}

function closeModal() {
  $('#modal-backdrop').hidden = true;
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

$('#search').addEventListener('input', render);
$('#work-date').addEventListener('input', event => {
  let digits = event.target.value.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 4) event.target.value = `${digits.slice(0,2)}.${digits.slice(2,4)}.${digits.slice(4)}`;
  else if (digits.length > 2) event.target.value = `${digits.slice(0,2)}.${digits.slice(2)}`;
  else event.target.value = digits;
});
$('#sort').addEventListener('change', render);
$('#add-work').addEventListener('click', () => {
  if ($('h1').textContent === 'Мій профіль') {
    showProfile(false);
    $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.nav === 'all'));
  } else openModal();
});
$('#close-modal').addEventListener('click', closeModal);
$('#cancel-modal').addEventListener('click', closeModal);
$('#modal-backdrop').addEventListener('click', event => { if (event.target === event.currentTarget) closeModal(); });

document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });

$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  $$('.filter-chip').forEach(item => item.classList.remove('selected'));
  button.classList.add('selected');
  currentFilter = button.dataset.filter;
  render();
}));

$$('[data-type]').forEach(button => button.addEventListener('click', () => {
  selectedType = button.dataset.type;
  chooseSegment('#type-options', 'data-type', selectedType);
}));
$$('[data-priority]').forEach(button => button.addEventListener('click', () => {
  selectedPriority = button.dataset.priority;
  chooseSegment('#priority-options', 'data-priority', selectedPriority);
}));
$$('[data-status]').forEach(button => button.addEventListener('click', () => {
  selectedStatus = button.dataset.status;
  chooseSegment('#status-options', 'data-status', selectedStatus);
}));

$('#work-form').addEventListener('submit', event => {
  event.preventDefault();
  const isoDate = dotToIso($('#work-date').value);
  if (!isoDate) {
    $('#work-date').setCustomValidity('Введіть дату у форматі ДД.MM.RRRR');
    $('#work-date').reportValidity();
    return;
  }
  $('#work-date').setCustomValidity('');
  const id = $('#work-id').value;
  const work = {
    id: id ? Number(id) : Date.now(),
    name: $('#work-name').value.trim(),
    subject: $('#work-subject').value,
    type: selectedType,
    date: isoDate,
    time: $('#work-time').value,
    status: selectedStatus,
    priority: selectedPriority,
    score: $('#score').value,
    maxScore: $('#max-score').value,
    notes: $('#notes').value
  };
  if (id) works = works.map(item => item.id === Number(id) ? work : item);
  else works.push(work);
  saveWorks();
  closeModal();
  render();
  showToast(id ? 'Роботу оновлено' : 'Роботу додано');
});

$('#work-list').addEventListener('change', event => {
  if (!event.target.classList.contains('work-check')) return;
  const row = event.target.closest('tr');
  const work = works.find(item => item.id === Number(row.dataset.id));
  work.status = event.target.checked ? 'Виконано' : 'В процесі';
  saveWorks();
  render();
  showToast(event.target.checked ? 'Роботу позначено виконаною' : 'Роботу повернено в процес');
});

$('#work-list').addEventListener('click', event => {
  const editButton = event.target.closest('.edit-btn');
  if (!editButton) return;
  const row = editButton.closest('tr');
  const work = works.find(item => item.id === Number(row.dataset.id));
  openModal(work);
});

const profileView = document.createElement('section');
profileView.id = 'profile-view';
profileView.hidden = true;
profileView.className = 'profile-view';
profileView.innerHTML = `
<section class="profile-summary">
  <div class="profile-person">
    <div class="profile-avatar"><span class="profile-icon-mask user-icon" aria-hidden="true"></span></div>
    <div><h2>Ім’я не вказано</h2><p>Особисті дані ще не додано</p></div>
  </div>
  <div class="profile-metrics">
    <div><strong id="profile-total">6</strong><span>Усього робіт</span></div>
    <div><strong id="profile-progress">3</strong><span>В процесі</span></div>
    <div><strong id="profile-done">2</strong><span>Виконано</span></div>
    <div class="profile-overdue"><strong id="profile-overdue">1</strong><span>Прострочено</span></div>
  </div>
</section>

<section class="profile-kpis">
  <article class="profile-kpi"><h3>Загальна кількість отриманих балів <span class="profile-icon-mask grid-icon" aria-hidden="true"></span></h3><div class="profile-progress-line"><i></i></div><p id="profile-score-note">Оцінок ще немає — ще не нуль балів.</p></article>
  <article class="profile-kpi"><h3>Оцінено заданих робіт <span class="profile-icon-mask check-icon" aria-hidden="true"></span></h3><strong class="profile-big-number" id="profile-rated">0 із 2</strong><p>Бали ще не внесено до жодної роботи.</p></article>
  <article class="profile-kpi"><h3>Очікують внесення балів <span class="profile-icon-mask clock-icon" aria-hidden="true"></span></h3><strong class="profile-big-number" id="profile-unrated">2</strong><p>Додайте отримані та максимальні бали.</p></article>
</section>

<section class="profile-table-card">
  <header class="profile-card-heading"><h3>Здані роботи <span id="profile-graded-count">2</span></h3><p>2 роботи очікують внесення балів</p></header>
  <div class="profile-table-wrap"><table class="profile-table"><thead><tr><th>РОБОТА / ПРЕДМЕТ</th><th>ДАТА</th><th>СТАТУС</th><th>ОТРИМАНО / МАКС.</th><th>ДІЯ</th></tr></thead><tbody>
    <tr><td><strong>Лабораторна №2 — Робота з Git</strong><small>Основи програмування</small></td><td>5 жовтня</td><td><span class="status-pill status-done">Виконано</span></td><td><b>— / —</b><small>Бали не внесено</small></td><td><button class="profile-grade-btn">Внести бали</button></td></tr>
    <tr><td><strong>Практична №4 — Обхід графів</strong><small>Дискретна математика</small></td><td>3 жовтня</td><td><span class="status-pill status-done">Виконано</span></td><td><b>— / —</b><small>Бали не внесено</small></td><td><button class="profile-grade-btn">Внести бали</button></td></tr>
  </tbody></table></div>
  <footer class="profile-card-footer">Внести отримані та максимальні бали. Після збереження оцінку можна редагувати.</footer>
</section>

<section class="subject-grades">
  <header><h3>Бали за предметами</h3><p>Лише предмети із зданими роботами</p></header>
  <div class="subject-grade-grid">
    <article><h4>Основи програмування</h4><div><strong>—</strong><span>1 здана робота · 0 оцінених</span></div><p>Ще немає балів</p></article>
    <article><h4>Дискретна математика</h4><div><strong>—</strong><span>1 здана робота · 0 оцінених</span></div><p>Ще немає балів</p></article>
  </div>
  <p class="subject-grades-footer">Підсумок зміниться після внесення першої оцінки. Роботи без балів не враховуються у сумі.</p>
</section>`;
$('.main-content').appendChild(profileView);

function showProfile(show) {
  ['.stats-grid','.toolbar','.table-wrap','.mobile-note'].forEach(selector => $(selector).hidden = show);
  profileView.hidden = !show;
  $('.subtitle').textContent = show ? 'Отримані бали та результати здач — в одному місці' : 'Четвер, 8 жовтня · найближчий дедлайн через 2 дні';
  $('.search-box').hidden = show;
  $('#add-work').textContent = show ? '← До списку робіт' : '＋ Нова робота';
  $('#add-work').classList.toggle('back-to-works', show);
  if (show) {
    $('h1').textContent = 'Мій профіль';
    $('#profile-done').textContent = works.filter(w => w.status === 'Виконано').length;
    $('#profile-progress').textContent = works.filter(w => w.status === 'В процесі').length;
    $('#profile-total').textContent = works.length;
    $('#profile-overdue').textContent = works.filter(w => w.status === 'Прострочено').length;
  } else {
    $('h1').textContent = 'Мої роботи';
  }
}

$$('.nav-item').forEach(button => button.addEventListener('click', () => {
  $$('.nav-item').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  const nav = button.dataset.nav;
  showProfile(nav === 'profile');
  if (nav !== 'profile') {
    currentFilter = ['done','today','week','overdue','active'].includes(nav) ? nav : 'all';
    $$('.filter-chip').forEach(item => item.classList.toggle('selected', item.dataset.filter === currentFilter));
    render();
  }
}));

$$('.subject').forEach(button => button.addEventListener('click', () => {
  $$('.nav-item').forEach(item => item.classList.remove('active'));
  showProfile(false);
  $('#search').value = button.dataset.subject;
  render();
}));

render();
