const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

let mockTasks = [
  {
    id: 1,
    title: 'إنشاء واجهة قائمة المهام',
    completed: false,
    created_at: '2026-08-20T09:00:00.000000Z',
    updated_at: '2026-08-20T09:00:00.000000Z',
  },
  {
    id: 2,
    title: 'إنهاء Laravel Task API',
    completed: true,
    created_at: '2026-08-20T10:00:00.000000Z',
    updated_at: '2026-08-20T10:15:00.000000Z',
  },
];

const copy = (value) => structuredClone(value);

function validationError(errors) {
  const error = new Error('The given data was invalid.');
  error.status = 422;
  error.data = {
    message: 'The given data was invalid.',
    errors,
  };
  return error;
}

function validateTaskPayload(payload, { partial = false } = {}) {
  const errors = {};

  if (!partial || Object.hasOwn(payload, 'title')) {
    if (typeof payload.title !== 'string' || payload.title.trim().length < 3) {
      errors.title = ['The title field must be at least 3 characters.'];
    }
    if (typeof payload.title === 'string' && payload.title.length > 255) {
      errors.title = ['The title field must not be greater than 255 characters.'];
    }
  }

  if (Object.hasOwn(payload, 'completed') && typeof payload.completed !== 'boolean') {
    errors.completed = ['The completed field must be true or false.'];
  }

  if (Object.keys(errors).length > 0) throw validationError(errors);
}

async function parseResponse(response) {
  if (response.status === 204) return null;

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message ?? 'Request failed.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function realRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...options,
  });

  return parseResponse(response);
}

const mockApi = {
  async getAll() {
    await wait();
    return copy([...mockTasks].sort((a, b) => b.id - a.id));
  },

  async create(payload) {
    await wait();
    validateTaskPayload(payload);

    const now = new Date().toISOString();
    const task = {
      id: Math.max(0, ...mockTasks.map((item) => item.id)) + 1,
      title: payload.title.trim(),
      completed: payload.completed ?? false,
      created_at: now,
      updated_at: now,
    };

    mockTasks = [task, ...mockTasks];
    return copy(task);
  },

  async update(id, payload) {
    await wait();
    validateTaskPayload(payload, { partial: true });

    const index = mockTasks.findIndex((task) => task.id === Number(id));
    if (index === -1) {
      const error = new Error('Task not found.');
      error.status = 404;
      throw error;
    }

    const updated = {
      ...mockTasks[index],
      ...payload,
      ...(Object.hasOwn(payload, 'title') ? { title: payload.title.trim() } : {}),
      updated_at: new Date().toISOString(),
    };

    mockTasks[index] = updated;
    return copy(updated);
  },

  async remove(id) {
    await wait();
    const exists = mockTasks.some((task) => task.id === Number(id));
    if (!exists) {
      const error = new Error('Task not found.');
      error.status = 404;
      throw error;
    }

    mockTasks = mockTasks.filter((task) => task.id !== Number(id));
    return null;
  },
};

export const taskApi = USE_MOCK_API
  ? mockApi
  : {
      getAll: () => realRequest('/tasks'),
      create: (payload) =>
        realRequest('/tasks', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      update: (id, payload) =>
        realRequest(`/tasks/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        }),
      remove: (id) => realRequest(`/tasks/${id}`, { method: 'DELETE' }),
    };