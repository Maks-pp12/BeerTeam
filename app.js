const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const defaultWorks = [
  { id: 1, name: 'Лабораторна №4 — Алгоритми Краскала і Прима', subject: 'Дискретна математика', type: 'Лабораторна', date: '2026-12-02', time: '23:59', status: 'В процесі', priority: 'Високий', score: '', maxScore: '', notes: '' },
  { id: 2, name: 'Практична №7 — Нормалізація БД', subject: 'Бази даних', type: 'Практична', date: '2026-12-05', time: '18:00', status: 'В процесі', priority: 'Середній', score: '', maxScore: '', notes: '' },
  { id: 3, name: 'Лабораторна №3 — Багатопоточність', subject: 'Операційні системи', type: 'Лабораторна', date: '2026-11-26', time: '23:59', status: 'В процесі', priority: 'Високий', score: '', maxScore: '', notes: '' },
  { id: 4, name: 'Практична №5 — Невизначені інтеграли', subject: 'Вища математика', type: 'Практична', date: '2026-12-10', time: '23:59', status: 'В процесі', priority: 'Низький', score: '', maxScore: '', notes: '' },
  { id: 5, name: 'Лабораторна №2 — Робота з Git', subject: 'Основи програмування', type: 'Лабораторна', date: '2026-12-01', time: '23:59', status: 'Виконано', priority: 'Середній', score: '', maxScore: '', notes: '' },
  { id: 6, name: 'Практична №4 — Обхід графів', subject: 'Дискретна математика', type: 'Практична', date: '2026-12-08', time: '18:00', status: 'Виконано', priority: 'Низький', score: '', maxScore: '', notes: '' }
];

let works = JSON.parse(localStorage.getItem('workTrackerWorksV3')) || defaultWorks;
let currentFilter = 'all';
let selectedType = 'Лабораторна';
let selectedPriority = 'Середній';
let selectedStatus = 'В процесі';

const dateText = (value) => {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short' }).format(date).replace('.', '');
};

function toIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function saveWorks() {
  localStorage.setItem('workTrackerWorksV3', JSON.stringify(works));
}

function pluralDays(days) {
  const mod10 = days % 10;
  const mod100 = days % 100;
  if (mod10 === 1 && mod100 !== 11) return `${days} день`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${days} дні`;
  return `${days} днів`;
}

function getWorkDeadlineInfo(work) {
  if (work.status === 'Виконано') {
    return { isOverdue: false, className: 'status-done', label: 'Виконано' };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = work.date.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const diffDays = Math.round((target - todayStart) / 86400000);

  if (diffDays < 0) {
    return {
      isOverdue: true,
      className: 'status-late',
      label: `Прострочено на ${pluralDays(Math.abs(diffDays))}`
    };
  }
  if (diffDays === 0) {
    return { isOverdue: false, className: 'status-soon', label: 'Сьогодні' };
  }
  if (diffDays === 1) {
    return { isOverdue: false, className: 'status-soon', label: 'Завтра' };
  }
  if (diffDays === 2) {
    return { isOverdue: false, className: 'status-soon', label: 'Післязавтра' };
  }
  return {
    isOverdue: false,
    className: 'status-future',
    label: `Через ${pluralDays(diffDays)}`
  };
}

function updateSubtitle() {
  if ($('h1').textContent === 'Мій профіль') {
    $('.subtitle').textContent = 'Отримані бали та результати здач — в одному місці';
    return;
  }

  const now = new Date();
  const formatted = new Intl.DateTimeFormat('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(now);
  const todayText = formatted.charAt(0).toUpperCase() + formatted.slice(1);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const upcomingDiffs = works
    .filter(w => w.status !== 'Виконано' && w.date)
    .map(w => {
      const [y, m, d] = w.date.split('-').map(Number);
      const target = new Date(y, m - 1, d);
      return Math.round((target - todayStart) / 86400000);
    })
    .filter(diff => diff >= 0)
    .sort((a, b) => a - b);

  let deadlineText = 'активних дедлайнів немає';
  if (upcomingDiffs.length > 0) {
    const nearest = upcomingDiffs[0];
    if (nearest === 0) deadlineText = 'найближчий дедлайн сьогодні';
    else if (nearest === 1) deadlineText = 'найближчий дедлайн завтра';
    else deadlineText = `найближчий дедлайн через ${pluralDays(nearest)}`;
  }

  $('.subtitle').textContent = `${todayText} · ${deadlineText}`;
}

function render() {
  const now = new Date();
  const todayIso = toIsoDate(now);
  const weekEndIso = toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6));

  const search = $('#search').value.trim().toLowerCase();
  let filtered = works.filter(work => {
    const matchesSearch = !search || `${work.name} ${work.subject}`.toLowerCase().includes(search);
    const matchesFilter = currentFilter === 'all' ||
      (currentFilter === 'done' ? work.status === 'Виконано' :
      currentFilter === 'active' ? work.status !== 'Виконано' :
      currentFilter === 'overdue' ? getWorkDeadlineInfo(work).isOverdue :
      currentFilter === 'today' ? work.date === todayIso :
      currentFilter === 'week' ? work.date >= todayIso && work.date <= weekEndIso :
      work.type === currentFilter);
    return matchesSearch && matchesFilter;
  });

  const sort = $('#sort').value;
  filtered.sort((a, b) => {
    if (sort === 'date') return `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`);
    if (sort === 'date-desc') return `${b.date} ${b.time || ''}`.localeCompare(`${a.date} ${a.time || ''}`);
    if (sort === 'name') return a.name.localeCompare(b.name, 'uk', { numeric: true });
    if (sort === 'priority') return ['Високий', 'Середній', 'Низький'].indexOf(a.priority) - ['Високий', 'Середній', 'Низький'].indexOf(b.priority);
    return a.id - b.id;
  });

  $('#work-list').innerHTML = filtered.map(work => {
    const info = getWorkDeadlineInfo(work);
    return `
    <tr class="${work.status === 'Виконано' ? 'completed' : ''}" data-id="${work.id}">
      <td><input class="work-check" type="checkbox" aria-label="Позначити виконаною" ${work.status === 'Виконано' ? 'checked' : ''}></td>
      <td><div class="work-title">${escapeHtml(work.name)}</div><div class="work-subtitle">${escapeHtml(work.subject)} · ${escapeHtml(work.type)}</div></td>
      <td><div>${dateText(work.date)}</div></td>
      <td><span class="status-pill ${info.className}">${info.label}</span></td>
      <td class="priority">${work.priority}</td>
      <td>${work.score ? `<button class="grade-btn">${work.score}/${work.maxScore}</button>` : '<span>—</span>'}</td>
      <td><button class="edit-btn" aria-label="Редагувати роботу">✎</button></td>
    </tr>`;
  }).join('');

  $('#empty-state').hidden = filtered.length > 0;
  updateStats();
  updateSubtitle();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

function updateStats() {
  const now = new Date();
  const todayIso = toIsoDate(now);
  const weekEndIso = toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6));

  const total = works.length;
  const done = works.filter(w => w.status === 'Виконано').length;
  const overdue = works.filter(w => getWorkDeadlineInfo(w).isOverdue).length;
  const progress = works.filter(w => w.status !== 'Виконано' && !getWorkDeadlineInfo(w).isOverdue).length;
  const todayCount = works.filter(w => w.date === todayIso).length;
  const weekCount = works.filter(w => w.date >= todayIso && w.date <= weekEndIso).length;

  $('#stat-total').textContent = total;
  $('#stat-progress').textContent = progress;
  $('#stat-done').textContent = done;
  $('#stat-overdue').textContent = overdue;
  $('#nav-all').textContent = total;
  $('#nav-today').textContent = todayCount;
  $('#nav-week').textContent = weekCount;
  $('#nav-done').textContent = done;
  $('#nav-overdue').textContent = overdue;
}

function chooseSegment(container, attribute, value) {
  $$(`[${attribute}]`, $(container)).forEach(button => button.classList.toggle('chosen', button.getAttribute(attribute) === value));
}

function openModal(work = null) {
  $('#modal-title').textContent = work ? 'Редагувати роботу' : 'Нова робота';
  $('#work-id').value = work?.id || '';
  $('#work-name').value = work?.name || '';
  $('#work-subject').value = work?.subject || 'Дискретна математика';
  $('#reminder').value = 'За 2 дні';
  $('#work-date').value = work?.date || toIsoDate(new Date());
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
  const isoDate = $('#work-date').value;
  if (!isoDate) return;

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
    <tr><td><strong>Лабораторна №2 — Робота з Git</strong><small>Основи програмування</small></td><td>1 грудня</td><td><span class="status-pill status-done">Виконано</span></td><td><b>— / —</b><small>Бали не внесено</small></td><td><button class="profile-grade-btn">Внести бали</button></td></tr>
    <tr><td><strong>Практична №4 — Обхід графів</strong><small>Дискретна математика</small></td><td>8 грудня</td><td><span class="status-pill status-done">Виконано</span></td><td><b>— / —</b><small>Бали не внесено</small></td><td><button class="profile-grade-btn">Внести бали</button></td></tr>
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
  $('.search-box').hidden = show;
  $('#add-work').textContent = show ? '← До списку робіт' : '＋ Нова робота';
  $('#add-work').classList.toggle('back-to-works', show);
  if (show) {
    $('h1').textContent = 'Мій профіль';
    $('#profile-done').textContent = works.filter(w => w.status === 'Виконано').length;
    $('#profile-progress').textContent = works.filter(w => w.status !== 'Виконано' && !getWorkDeadlineInfo(w).isOverdue).length;
    $('#profile-total').textContent = works.length;
    $('#profile-overdue').textContent = works.filter(w => getWorkDeadlineInfo(w).isOverdue).length;
  } else {
    $('h1').textContent = 'Мої роботи';
  }
  updateSubtitle();
}

$$('.nav-item').forEach(button => button.addEventListener('click', () => {
  $$('.nav-item').forEach(item => item.classList.remove('active'));
  $$('.subject').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  const nav = button.dataset.nav;
  showProfile(nav === 'profile');
  if (nav !== 'profile') {
    if (nav === 'all') $('#search').value = '';
    currentFilter = ['done','today','week','overdue','active'].includes(nav) ? nav : 'all';
    $$('.filter-chip').forEach(item => item.classList.toggle('selected', item.dataset.filter === currentFilter));
    render();
  }
}));

$$('.subject').forEach(button => button.addEventListener('click', () => {
  $$('.nav-item').forEach(item => item.classList.remove('active'));
  $$('.subject').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  showProfile(false);
  currentFilter = 'all';
  $$('.filter-chip').forEach(item => item.classList.toggle('selected', item.dataset.filter === 'all'));
  $('#search').value = button.dataset.subject;
  render();
}));

render();
