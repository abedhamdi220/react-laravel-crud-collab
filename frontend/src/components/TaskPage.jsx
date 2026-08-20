import { useEffect, useState } from 'react';
import { taskApi } from '../api/taskApi';

export default function TaskPage() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    taskApi.getAll()
      .then(setTasks)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    setError('');

    try {
      const createdTask = await taskApi.create({ title, completed: false });
      setTasks((current) => [createdTask, ...current]);
      setTitle('');
    } catch (requestError) {
      setError(requestError.data?.errors?.title?.[0] ?? requestError.message);
    }
  }

  async function handleToggle(task) {
    setError('');

    try {
      const updatedTask = await taskApi.update(task.id, {
        completed: !task.completed,
      });
      setTasks((current) =>
        current.map((item) => (item.id === updatedTask.id ? updatedTask : item)),
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleDelete(id) {
    setError('');

    try {
      await taskApi.remove(id);
      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (loading) return <p>جارٍ تحميل المهام...</p>;

  return (
    <main>
      <h1>مهامي</h1>

      <form onSubmit={handleCreate}>
        <label htmlFor="title">عنوان المهمة</label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          minLength="3"
          maxLength="255"
          required
        />
        <button type="submit">إضافة</button>
      </form>

      {error && <p role="alert">{error}</p>}

      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <label>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggle(task)}
              />
              {task.title}
            </label>
            <button type="button" onClick={() => handleDelete(task.id)}>
              حذف
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
