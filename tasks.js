/**
 * Створює об'єкт навчального завдання, сумісний із localStorage (JSON).
 *
 * @param {string} title - Назва завдання
 * @param {string} subject - Навчальний предмет
 * @param {string} deadline - Дедлайн у форматі YYYY-MM-DD
 * @param {string} type - Тип роботи (наприклад: 'Лабораторна', 'Практична', 'Курсова', 'Тест')
 * @param {boolean} [completed=false] - Статус виконання
 * @returns {Object} Об'єкт завдання
 */
export function createTask(title, subject, deadline, type, completed = false) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(deadline)) {
    throw new Error('Дедлайн повинен бути у форматі YYYY-MM-DD');
  }

  return {
    id: generateUniqueId(),
    title: String(title),
    subject: String(subject),
    deadline: deadline,
    type: String(type),
    completed: Boolean(completed),
  };
}

/**
 * Генерує унікальний строковий ID.
 * @returns {string}
 */
function generateUniqueId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const initialTasks = [
  createTask(
    'Створити структуру даних',
    'Інженерія програмного забезпечення',
    '2026-11-25',
    'Лабораторна робота',
    false
  ),
];

const STORAGE_KEY = 'zday-vchasno-tasks';

/**
 * Завантажує завдання з localStorage.
 * @returns {Object[]} Масив завдань
 */
export function loadTasks() {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(savedTasks) ? savedTasks : [];
  } catch (error) {
    return [];
  }
}

/**
 * Зберігає всі завдання у localStorage.
 * @param {Object[]} tasks - Завдання для збереження
 */
export function saveTasks(tasks) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Видаляє завдання з localStorage за його ID.
 * @param {string} taskId - ID завдання
 */
export function deleteTask(taskId) {
  saveTasks(loadTasks().filter(task => task.id !== taskId));
}
