# React + Laravel CRUD Lab

هذا مستودع تدريبي صغير لبناء تطبيق **إدارة مهام** باستخدام React للواجهة وLaravel كواجهة API. الغرض منه هو فهم انتقال البيانات بين الواجهة الأمامية والباك إند وتنظيم العمل بالتوازي بين فريقين.

## هيكل المستودع

| المسار | المسؤول | الاستخدام |
|---|---|---|
| `frontend/` | فريق React | واجهة المستخدم، المكوّنات، وإدارة الحالة وطلبات API |
| `backend/` | فريق Laravel | Model وMigration وController وAPI وقاعدة البيانات |
| `docs/` | الفريقان | عقد API وقرارات الربط والتوثيق المختصر |

> لا يعدّل فريق React ملفات `backend/`، ولا يعدّل فريق Laravel ملفات `frontend/`، إلا باتفاق واضح في طلب دمج مستقل. الملف المشترك الأهم هو `docs/API_CONTRACT.md`.

## توزيع العمل المقترح

| الفريق | المهمة الأولى | فرع العمل |
|---|---|---|
| Laravel | إنشاء مشروع Laravel و`Task` model وmigration وCRUD API | `feature/backend-api` |
| React | إنشاء مشروع React وواجهة عرض/إضافة/تعديل/حذف المهام | `feature/frontend-ui` |
| التكامل | ربط `fetch` أو `axios` مع API الحقيقية، وفحص الأخطاء | `feature/integration` |

## قواعد العمل

يجب أن تبقى `main` مستقرة وقابلة للتشغيل. لا تدفع التغييرات مباشرةً إلى `main`؛ أنشئ فرعًا لكل مهمة، ثم افتح Pull Request لمراجعته ودمجه. قبل أن يبدأ أي فريق، يجب الاتفاق على الحقول والمسارات المكتوبة في ملف عقد API.

## أول إعداد لكل عضو

```bash
git clone https://github.com/abedhamdi220/react-laravel-crud-collab.git
cd react-laravel-crud-collab
git switch main
git pull origin main
```

اضبط اسمك وبريدك مرة واحدة إن لم تكن ضبطتهما من قبل:

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

## بدء مهمة جديدة

ابدأ دائمًا بسحب آخر تغييرات الفرع الرئيسي ثم أنشئ فرعًا واضح الاسم.

```bash
git switch main
git pull origin main
git switch -c feature/frontend-task-list
```

أمثلة أسماء مناسبة للفروع:

| نوع العمل | مثال اسم الفرع |
|---|---|
| واجهة React | `feature/frontend-task-form` |
| Laravel API | `feature/backend-task-crud` |
| إصلاح خطأ | `fix/api-validation-error` |
| توثيق | `docs/update-api-contract` |

## حفظ التغييرات ورفعها

بعد تنفيذ جزء صغير وواضح من المهمة، افحص ما تغيّر ثم احفظه برسالة مختصرة تصف النتيجة.

```bash
git status
git add frontend/
git commit -m "feat(frontend): add task form"
git push -u origin feature/frontend-task-list
```

لفريق Laravel يكون المسار مثلًا:

```bash
git add backend/
git commit -m "feat(api): add task CRUD endpoints"
git push -u origin feature/backend-task-crud
```

لا تستخدم `git add .` إلا بعد مراجعة `git status` والتأكد من عدم وجود ملفات بيئة أو مفاتيح أو مجلدات توليد كبيرة مثل `node_modules`.

## فتح طلب دمج ومراجعته

بعد رفع الفرع، افتح Pull Request من صفحة GitHub، أو استخدم الأمر التالي من داخل مجلد المستودع:

```bash
gh pr create --base main --head feature/frontend-task-list --title "feat(frontend): add task list" --body "Builds the initial task-list UI and uses the agreed Task shape."
```

ينبغي أن يراجع عضو آخر التغييرات، مع التركيز على عدم تغيير عقد API دون تحديث الوثائق وإبلاغ الفريق الآخر. بعد الموافقة، يمكن الدمج من واجهة GitHub أو بالأمر التالي:

```bash
gh pr merge --merge --delete-branch
```

## تحديث الفرع قبل الدمج

إذا أُضيفت تغييرات جديدة إلى `main` بينما تعمل على فرعك، حدّث الفرع قبل فتح طلب الدمج أو قبل دمجه.

```bash
git fetch origin
git switch feature/frontend-task-list
git merge origin/main
git push origin feature/frontend-task-list
```

إذا ظهر تعارض، أصلح الملفات التي يحددها Git، ثم نفّذ:

```bash
git add <file-path>
git commit -m "chore: resolve merge conflict"
git push
```

## دورة التعاون اليومية المختصرة

| الترتيب | الأمر أو الإجراء | الهدف |
|---|---|---|
| 1 | `git switch main && git pull origin main` | الحصول على آخر نسخة مستقرة |
| 2 | `git switch -c feature/...` | عزل المهمة في فرع مستقل |
| 3 | تعديل واختبار الجزء المسؤول عنه | تجنب كسر عمل الفريق الآخر |
| 4 | `git add` ثم `git commit` ثم `git push` | حفظ ومشاركة التقدم |
| 5 | فتح Pull Request | مراجعة التغييرات قبل الدمج |
| 6 | تحديث `main` بعد الدمج | البدء من أساس موحد في المهمة التالية |

## الخطوة التالية

ينشئ فريق Laravel مشروعه داخل `backend/`، وينشئ فريق React مشروعه داخل `frontend/`. قبل الربط الحقيقي، يستخدم فريق React بيانات وهمية مطابقة تمامًا لما في `docs/API_CONTRACT.md`، ثم يستبدلها بطلبات API عند جاهزية الباك إند.

للبدء بالتوازي، راجع ملف [عقد API](docs/API_CONTRACT.md).

## المراجع

[1]: https://docs.github.com/en/pull-requests "GitHub Docs — Pull requests"
[2]: https://git-scm.com/docs "Git Documentation"
[3]: https://cli.github.com/manual/ "GitHub CLI Manual"

تستند أوامر الفروع وطلبات الدمج إلى توثيق Git وGitHub الرسمي.[1] [2] [3]
