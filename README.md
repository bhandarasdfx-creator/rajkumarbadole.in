# 'राजकुमार बडोले' डिजिटल न्यूज रूम व डेटा फीडर (Rajkumar Badole Newsroom CMS)

हे ॲप्लिकेशन **rajkumarbadole.in** साठी एक आधुनिक, बहु-वापरकर्ता (Multi-user) आणि सुरक्षित ऑनलाइन न्यूज रूम व डेटा फीडिंग टूल आहे. हे टूल **वार्ता Newsroom** (`wartaa-six.vercel.app`) च्या धर्तीवर तयार करण्यात आले आहे.

---

## 🌟 प्रमुख वैशिष्ट्ये (Key Features)

1. **मल्टी-युझर ॲडमिन पॅनेल (User Management & RBAC)**:
   - **Super Admin** (`bhandara.sdfx@gmail.com`): नवीन वापरकर्ते तयार करणे, रोल बदलणे (Admin, Editor, Reporter), खाती सक्रिय/निष्क्रिय करणे आणि संपूर्ण सिस्टम नियंत्रण.
   - **Editor (उप-संपादक)**: बातम्या व विकासकामांची माहिती तपासणे, संपादित करणे व प्रकाशित करणे.
   - **Reporter / Operator (डेटा ऑपरेटर)**: मतदारसंघातील विकासकामे, ताज्या बातम्या, कार्यक्रम, फोटो व व्हिडिओ त्वरित अपलोड करणे.

2. **rajkumarbadole.in साठी ७ डेटा फीडिंग मॉड्यूल्स**:
   - 📰 **बातम्या व प्रेस नोट**: मुख्य पृष्ठावरील 'ताज्या घडामोडी' साठी.
   - 🏗️ **माझे काम (विकासकामे)**: ८ विविध विभाग (पायाभूत सुविधा, शिक्षण, आरोग्य, शेतकरी, महिला, युवक, सामाजिक कार्य, संस्कृती).
   - 🎯 **विशेष उपक्रम**: जनसंवाद, युवा संवाद, महिला उपक्रम इत्यादींचे कार्ड्स.
   - 📅 **कार्यक्रम व दौरे**: सभा, दौरे, उद्घाटन व बैठकांचे कॅलेंडर.
   - 🎥 **व्हिडिओ व्यवस्थापन**: YouTube लिंक्स व ऑटोमॅटिक व्हिडिओ एम्बेड.
   - 🖼️ **फोटो गॅलरी**: उच्च दर्जाचे कार्यक्रम फोटो व अल्बम.
   - 📢 **जनतेचा आवाज**: वेबसाइटवरील फॉर्मद्वारे आलेल्या नागरिकांच्या तक्रारी व निवेदने.

3. **थेट डेटा फीड व सिंक प्रणाली**:
   - **लाइव्ह REST API Feed**: `/api/feed`, `/api/news`, `/api/works` – कोणतीही वेबसाइट सेकंदात डेटा फेच करू शकते.
   - **WordPress REST API थेट सिंक**: एका क्लिकवर मजकूर थेट `https://rajkumarbadole.in` वर प्रकाशित करा.

---

## 🚀 स्थानिक विकास (Local Development)

```bash
# 1. पॅकेजेस इन्स्टॉल करा
npm install

# 2. स्थानिक सर्व्हर सुरू करा
npm run dev
```

ब्राउझरमध्ये उघडा: [http://localhost:3000](http://localhost:3000)

---

## 🔐 चाचणी लॉगिन खाती (Test Logins)

लॉगिन पेजवर एका क्लिकवर खालील खाती निवडता येतात:
- **मुख्य ॲडमिन**: `bhandara.sdfx@gmail.com` (पासवर्ड: `admin123`)
- **संपादक**: `editor@rajkumarbadole.in` (पासवर्ड: `admin123`)
- **डेटा ऑपरेटर**: `operator@rajkumarbadole.in` (पासवर्ड: `admin123`)

---

## 🗄️ Supabase डेटाबेस सेटअप (Project: hkucqrhyxolwdewirtrl)

1. [Supabase Dashboard SQL Editor](https://supabase.com/dashboard/project/hkucqrhyxolwdewirtrl/sql) उघडा.
2. या रिपॉझिटरीमधील `supabase/schema.sql` फाइलमधील संपूर्ण कोड कॉपी करून Run करा.
3. सर्व टेबल्स (`profiles`, `news_posts`, `development_works`, `events`, इ.) आणि सुरक्षित Row Level Security (RLS) आपोआप तयार होईल.

---

## ☁️ Vercel व GitHub वर ऑनलाइन डिप्लॉयमेंट

1. **GitHub Push**:
   ```bash
   git add .
   git commit -m "feat: complete Rajkumar Badole multi-user newsroom tool"
   git push -u origin main
   ```
2. **Vercel**:
   - [vercel.com/the-rajkumar-badole](https://vercel.com/the-rajkumar-badole) वर जा.
   - GitHub रिपॉझिटरी `bhandarasdfx-creator/rajkumarbadole.in` Import करा.
   - खालील Environment Variables जोडा:
     - `NEXT_PUBLIC_SUPABASE_URL=https://hkucqrhyxolwdewirtrl.supabase.co`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<तुमचा_anon_key>`
     - `NEXT_PUBLIC_WORDPRESS_URL=https://rajkumarbadole.in`
   - **Deploy** बटणावर क्लिक करा!
