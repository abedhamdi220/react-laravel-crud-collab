# اختبار React ببيانات وهمية ثم ربط Laravel API

يوضح هذا الدليل كيف يبني فريق React واجهة المهام قبل اكتمال Laravel، من دون اختراع صيغة بيانات مختلفة. المبدأ هو أن **البيانات الوهمية تقلّد استجابات Laravel، لا تصميم الواجهة فقط**. لذلك تبقى أسماء الحقول ومسارات CRUD وبنية الأخطاء واحدة عند التحول من Mock API إلى API حقيقية.

هذا الدليل مكمل لملف [عقد API](API_CONTRACT.md). الصيغة المعتمدة للمهمة هي:

```ts
type Task = {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};
```

| عملية CRUD | المسار النهائي | الإدخال من React | استجابة Laravel وMock API |
|---|---|---|---|
| قراءة الكل | `GET /api/tasks` | لا شيء | مصفوفة من `Task` |
| قراءة واحدة | `GET /api/tasks/{id}` | لا شيء | كائن `Task` |
| إضافة | `POST /api/tasks` | `title` و`completed` اختياري | `Task` جديد مع `201` |
| تعديل | `PUT /api/tasks/{id}` | حقل أو أكثر من `title` و`completed` | `Task` بعد التعديل |
| حذف | `DELETE /api/tasks/{id}` | لا شيء | `204 No Content` |

> لا ينشئ React قيمة `id` أو `created_at` أو `updated_at` عند إرسال طلب الإضافة. هذه مسؤولية الخادم؛ لذلك ينشئها Mock API أيضًا كي يطابق ما سيحدث لاحقًا مع Laravel.

## 1. إعداد React

افترض أن مشروع Vite + React موجود داخل `frontend/`. أضف متغيرات البيئة التالية في `frontend/.env`:

```env
VITE_USE_MOCK_API=true
VITE_API_URL=http://localhost:8000/api
```

القيمة `true` تعني أن React تستخدم Mock API المحلية. بعد تشغيل Laravel واختبارها، غيّر القيمة إلى `false` ثم أعد تشغيل خادم Vite؛ متغيرات البيئة تُقرأ عند بدء خادم التطوير.

### ملف الوصول الموحد للمهام

أنشئ الملف `frontend/src/api/taskApi.js`. هذه الطبقة هي المكان الوحيد الذي تعرف فيه الواجهة إن كانت تستخدم Mock API أو Laravel. بقية مكوّنات React تستدعي الدوال نفسها في الحالتين.

```js
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

// هذه البيانات تمثل بدقة شكل Task الذي يعيده Laravel.
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
    return null; // يماثل 204 No Content.
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
```

### مكوّن React عملي

المكوّن التالي في `frontend/src/components/TaskPage.jsx` لا يعرف هل المصدر وهمي أو حقيقي. إنه يستهلك دوال `taskApi` فقط، ولذلك لا يحتاج إلى إعادة كتابة عند اكتمال الباك إند.

```jsx
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
      // يرسل فقط الحقول التي يسمح بها عقد POST.
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
```

### لماذا هذا Mock صحيح؟

| المعيار | Mock API | Laravel API |
|---|---|---|
| أسماء حقول المهمة | `id`, `title`, `completed`, `created_at`, `updated_at` | الحقول نفسها تمامًا |
| مدخلات الإضافة | `title`، و`completed` اختياري | القواعد نفسها في `store` |
| مدخلات التعديل | `title` و/أو `completed` | القواعد نفسها في `update` |
| خطأ التحقق | `status = 422` و`data.errors` | استجابة JSON بـ 422 و`errors` |
| غير موجود | `status = 404` | Model binding يعيد 404 |
| الحذف | يرجع `null` | `204 No Content` |

البيانات الوهمية ليست بديلًا لقاعدة البيانات؛ فهي تختفي عند تحديث المتصفح. لكنها كافية لبناء الواجهة وتثبيت سلوكها، ثم يقتصر التغيير عند الربط الحقيقي على `VITE_USE_MOCK_API=false`.

## 2. إعداد Laravel API

ضع مشروع Laravel داخل `backend/` وشغّل الأوامر التالية. يمكن لـ Artisan إنشاء الموديل مع migration وcontroller resource في خطوة واحدة. Laravel يجعل الـ migrations وسيلة قابلة للمشاركة لتعريف بنية قاعدة البيانات، ويستخدم Eloquent الموديلات للتعامل مع الصفوف في الجداول.[1] [2]

```bash
cd backend
php artisan make:model Task -m
php artisan make:controller Api/TaskController --api --model=Task
```

إذا كان مشروع Laravel لديك لا يحتوي أصلًا على `routes/api.php`، نفذ مرة واحدة:

```bash
php artisan install:api
```

### Migration: جدول `tasks`

عدّل ملف migration الذي أنشأه Artisan في `backend/database/migrations/<timestamp>_create_tasks_table.php` إلى الآتي. أنشأنا الحقول بالشكل نفسه الذي سيعاد للواجهة، وجعلنا `completed` افتراضيًا `false`.[1]

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->boolean('completed')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
```

نفذ migration:

```bash
php artisan migrate
```

### Model: `backend/app/Models/Task.php`

يجعل `$fillable` الحقول المعتمدة فقط قابلة للتعبئة الجماعية عند استخدام `Task::create()` و`$task->update()`. ويحوّل `casts()` قيمة `completed` إلى Boolean في JSON بدل أن تظهر كـ `0` أو `1`.[2]

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'title',
        'completed',
    ];

    protected function casts(): array
    {
        return [
            'completed' => 'boolean',
        ];
    }
}
```

### Controller: `backend/app/Http/Controllers/Api/TaskController.php`

هذا Controller يعيد JSON مطابقًا لعقد API. يستخدم `Task $task` في `show` و`update` و`destroy`؛ وإذا لم يجد Laravel المهمة من خلال هذا الربط، يعيد `404` تلقائيًا. كما تعيد `validate()` استجابة JSON من نوع `422` عند طلبات JavaScript غير الصحيحة.[3] [4]

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TaskController extends Controller
{
    public function index(): JsonResponse
    {
        $tasks = Task::query()
            ->orderByDesc('id')
            ->get();

        return response()->json($tasks);
    }

    public function show(Task $task): JsonResponse
    {
        return response()->json($task);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'min:3', 'max:255'],
            'completed' => ['sometimes', 'boolean'],
        ]);

        $task = Task::create($validated);

        return response()->json($task, 201);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'min:3', 'max:255'],
            'completed' => ['sometimes', 'boolean'],
        ]);

        $task->update($validated);

        return response()->json($task->fresh());
    }

    public function destroy(Task $task): Response
    {
        $task->delete();

        return response()->noContent();
    }
}
```

### Routes: `backend/routes/api.php`

يولّد `apiResource` مسارات API الضرورية ويتجنب مساري واجهات HTML (`create` و`edit`) غير المطلوبين في React API.[4]

```php
<?php

use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

Route::apiResource('tasks', TaskController::class);
```

يمكن التحقق من المسارات عبر:

```bash
php artisan route:list --path=api/tasks
```

ينبغي أن تظهر المسارات التالية:

| العملية | HTTP | URI | Method |
|---|---|---|---|
| القائمة | `GET` | `/api/tasks` | `index` |
| الإضافة | `POST` | `/api/tasks` | `store` |
| واحدة | `GET` | `/api/tasks/{task}` | `show` |
| التعديل | `PUT` أو `PATCH` | `/api/tasks/{task}` | `update` |
| الحذف | `DELETE` | `/api/tasks/{task}` | `destroy` |

## 3. اختبار Laravel قبل الربط

شغّل الخادم:

```bash
php artisan serve
```

ثم اختبر إضافة مهمة من طرفية أخرى:

```bash
curl -i -X POST http://localhost:8000/api/tasks \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{"title":"اختبار Laravel API","completed":false}'
```

النتيجة الناجحة يجب أن تكون `201` وكائنًا يحتوي الحقول الخمسة في عقد API. واختبر القراءة:

```bash
curl -H 'Accept: application/json' http://localhost:8000/api/tasks
```

## 4. لحظة الربط بين الفريقين

بعد نجاح أوامر `curl` وتطابقها مع ملف العقد، غيّر في `frontend/.env`:

```env
VITE_USE_MOCK_API=false
```

أعد تشغيل Vite، ثم نفذ عمليات الإضافة والتعديل والحذف من الواجهة. لا ينبغي أن يتغير `TaskPage.jsx`؛ ففصلنا مصدر البيانات داخل `taskApi.js`. إذا منع المتصفح الطلب بسبب CORS، أضف عنوان واجهة Vite المحلي مثل `http://localhost:5173` إلى إعدادات CORS في Laravel ثم أعد تشغيل خادم Laravel.

| علامة نجاح الدمج | النتيجة المتوقعة |
|---|---|
| تحميل الصفحة | React تعرض ما تعيده `GET /api/tasks` |
| إضافة مهمة | React ترسل JSON وتضيف الاستجابة التي أعادها Laravel |
| تبديل الإنجاز | `completed` يبقى Boolean وليس رقمًا أو نصًا |
| إدخال عنوان قصير | React تعرض رسالة `422` من Laravel |
| حذف مهمة | يختفي العنصر بعد استجابة `204` |

## المراجع

[1]: https://laravel.com/docs/13.x/migrations "Laravel 13.x — Database Migrations"
[2]: https://laravel.com/docs/13.x/eloquent "Laravel 13.x — Eloquent: Getting Started"
[3]: https://laravel.com/docs/13.x/validation "Laravel 13.x — Validation"
[4]: https://laravel.com/docs/13.x/controllers "Laravel 13.x — Controllers and API Resource Routes"
