# إعداد Cloudflare Worker + بوت Telegram + كود التفعيل

هذا الدليل يربط النظام ببوت التليجرام ليتحكم في صفحة «حول» وينشئ أكواد التفعيل.

## 1. متطلبات Cloudflare

- حساب Cloudflare + Workers/KV.
- حزمة `wrangler` (كخيار) أو رفع الملف من اللوحة مباشرة.

## 2. رفع العامل

المسار: `cloudflare-worker/worker.js`

نفّذ من مجلد `cloudflare-worker`:

```bash
cd cloudflare-worker
npx wrangler deploy
```

أو الصق محتوى `worker.js` في Cloudflare Dashboard → Workers → Create → Edit Code.

أنشئ KV Namespace اسمه `APP_KV` واربطه بالعامل باسم `APP_KV`.

## 3. متغيرات البيئة (Secrets/Env Variables)

في `Settings → Variables and Secrets` أضف:

| الاسم | المطلوب | الوصف |
|---|---|---|
| `APP_KV` | 🟢 | ربط KV namespace (وليس نص) |
| `ADMIN_TELEGRAM_ID` | 🟢 | معرف تليجرام للمدير (الوحيد المسموح بالتحكم) |
| `TELEGRAM_BOT_TOKEN` | 🟢 | توكن البوت من @BotFather |
| `ADMIN_API_SECRET` | 🟡 | مفتاح لحماية `/api/set-about` (إن أردت الحماية) |
| `LICENSE_SECRET` | 🟢 | نفس المفتاح المستخدم في التطبيق `LICENSE_SECRET` |
| `ABOUT_INFO` | 🟡 | اختياري، يتم تخزينه تلقائياً في KV |

> **مهم** ضع `LICENSE_SECRET` نفس القيمة في متغير بيئة التطبيق عند تشغيله/تغليفه، وإلا لن تعمل أكواد التفعيل.

## 4. إنشاء بوت تيليجرام

1. افتح `@BotFather` في تليجرام.
2. ` /newbot` ثم اسم البوت واسم المستخدم.
3. انسخ التوكن إلى `TELEGRAM_BOT_TOKEN`.

## 5. ربط Webhook

ضع هذا في `cloudflare-worker` أو من تليجرام:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<YOUR_WORKER_URL>/telegram-webhook"
```

مثال:
```
https://your-worker.your-subdomain.workers.dev/telegram-webhook
```

## 6. تشغيل الأوامر من التليجرام (المدير فقط)

- `/start` : عرض الأوامر
- `/about` : عرض بيانات صفحة حول الحالية
- `/set_about <نص>` : تعديل الإعلان
- `/set_support <رابط>` : تعديل رابط الدعم
- `/set_version <إصدار>` : تعديل رقم الإصدار
- `/set_status <نص>` : تعديل رسالة الحالة
- `/generate_code <اسم العميل> <أيام> <device_id>` : توليد كود تفعيل

أمر توليد الكود:
```
/generate_code شركة_النور 365 abc1234567890
```
سيصلك كود Base64 يحمل `client` و `days` و `device_id` وتوقيع HMAC.

## 7. في التطبيق (Electron)

- صفحة `About.tsx` تستخدم `VITE_API_BASE`:
```env
VITE_API_BASE=https://your-worker.your-subdomain.workers.dev
```
- عند البناء يمكن تمريرها:
```bash
VITE_API_BASE=https://your-worker.your-subdomain.workers.dev npm run build
```
- يُقرأ كود التفعيل محلياً في `license.ts` بإزالة `LICENSE_SECRET`؛ عيّنه نفس قيمة الـ Worker:
```bash
LICENSE_SECRET=... npm run dev
```

## 8. فحص المنطق

- البوت يرسل الطلبات إلى `/telegram-webhook`.
- الصفحة `About.tsx` تجلب `/api/about` وتتحقق من رابط الدعم.
- إدخال الكود يتحقق محلياً من التوقيع ومعرّف الجهاز.
- `/api/set-about` محمي بـ `X-Admin-Key` عند ضبط `ADMIN_API_SECRET`.

> الافتراضي في `worker.js` يستخدم مفتاح ترخيص تجريبي. **لا تتركه هكذا في الإنتاج** — عيّن `LICENSE_SECRET` قوياً.
