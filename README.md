<div align="center">

# ◌ StudyOS

### **Your study space. Simplified.**

A minimal, privacy-first productivity dashboard built for students.

<br>

[![Status](https://img.shields.io/badge/status-active-111111?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-open--source-111111?style=for-the-badge)](#license)
[![Made with](https://img.shields.io/badge/made%20with-HTML%20%2B%20CSS%20%2B%20JS-111111?style=for-the-badge)](#)
[![Privacy](https://img.shields.io/badge/data-local--only-111111?style=for-the-badge)](#-privacy)

<br>

**Tasks · Exams · Flashcards · Notes · Focus**

</div>

---

## ✦ What is StudyOS?

**StudyOS** is a lightweight student productivity workspace designed to keep your everyday study workflow in one calm interface.

No account.

No database.

No unnecessary tracking.

Just your browser, your study data, and a workspace built to help you focus.

> **Built for studying — not for collecting data.**

---

## ✨ Highlights

| Feature             | Description                                     |
| ------------------- | ----------------------------------------------- |
| ◻️ **Tasks**        | Organize homework, assignments and daily work   |
| ◷ **Exams**         | Keep upcoming exams and important dates visible |
| ⌁ **Flashcards**    | Create and review your own study cards          |
| ◫ **Notes**         | Quickly access useful study resources           |
| ◉ **Focus**         | Designed around a distraction-free workflow     |
| ♧ **Notifications** | Optional browser reminders                      |
| ♪ **Audio**         | Lightweight study chime using Web Audio         |
| ◌ **Responsive**    | Designed for phones, tablets and desktops       |
| 🔒 **Local-first**  | Your StudyOS data stays in your browser         |

---

## 🧠 The idea

Most productivity apps start with:

> **"Create an account."**

StudyOS starts with:

> **"Start studying."**

Everything you create is stored locally in your browser using `localStorage`.

That means there is no StudyOS account system and no StudyOS database required for your personal study data.

---

## 🔐 Privacy

StudyOS follows a **local-first** approach.

### Your data stays local

Tasks, exams, flashcards and preferences are stored in your browser's:

```text
localStorage
```

StudyOS does not intentionally collect personal information.

### Reset everything

Want a completely fresh workspace?

Go to:

```text
Settings → Reset all StudyOS data
```

⚠️ Resetting StudyOS or clearing browser storage can permanently delete locally stored data.

---

## ⚡ Performance

StudyOS is intentionally lightweight.

The project avoids unnecessary frameworks and heavy dependencies where possible.

### Built around

```text
HTML
CSS
JavaScript
      ↓
Browser APIs
      ↓
LocalStorage
Notifications
Web Audio
```

The goal is simple:

**Fast startup → smooth interaction → minimal overhead.**

---

## 🎨 Design philosophy

StudyOS isn't designed to look like a complicated enterprise dashboard.

The interface follows a few principles:

```text
Calm
  ↓
Clear
  ↓
Fast
  ↓
Useful
```

### Design goals

* Minimal visual noise
* Clear information hierarchy
* Comfortable spacing
* Responsive layouts
* Accessible interactions
* Mobile-first considerations
* Lightweight animations
* No unnecessary UI clutter

---

## 🛠️ Tech Stack

<div align="center">

| Technology                | Purpose                       |
| ------------------------- | ----------------------------- |
| **HTML**                  | Application structure         |
| **CSS**                   | Interface & responsive design |
| **JavaScript**            | Application logic             |
| **LocalStorage**          | Local data persistence        |
| **Web Notifications API** | Optional reminders            |
| **Web Audio API**         | Study audio                   |
| **SVG**                   | Crisp icons                   |

</div>

No backend is required.

No database is required.

No authentication is required.

---

## 🚀 Run locally

Clone the repository:

```bash
git clone <your-repository-url>
cd studyos
```

Start a local server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

---

## ▲ Deploy

StudyOS works as a static site and can be deployed to services such as Vercel.

```bash
cd studyos
vercel --prod
```

A `vercel.json` file is **not required**.

If you want explicit configuration:

```json
{
  "cleanUrls": true
}
```

---

## 📁 Structure

```text
studyos/
│
├── assets/
│   └── icons/
│
├── index.html
├── vercel.json
├── LICENSE
└── README.md
```

Keep the `assets/icons/` directory intact when moving or deploying the project.

---

## 🤝 Contributing

StudyOS is open source, and contributions are welcome.

You can help with:

```text
🐛 Bug fixes
✨ New features
🎨 UI improvements
⚡ Performance
♿ Accessibility
📱 Mobile experience
🧹 Code quality
📖 Documentation
```

### Contribution flow

```bash
git clone <your-repository-url>

cd studyos

git checkout -b feature/my-improvement
```

Make your changes, test them, then:

```bash
git add .
git commit -m "Improve StudyOS"
git push
```

Open a Pull Request and describe what you changed.

Small improvements are welcome too. ❤️

---

## 🌐 Browser support

StudyOS is designed for modern browsers.

### Notifications

Notifications require browser permission.

If permission is denied, the rest of StudyOS continues to work normally.

### Audio

The audio chime uses the **Web Audio API**.

If unsupported, the audio feature fails silently.

### Icons

StudyOS uses SVG icons for crisp rendering across different resolutions.

PNG alternatives can be added where a specific platform requires raster artwork.

---

## 🔗 Notes

The Notes section may link to **NW Notes**, an external website.

External websites may have their own:

* Privacy policies
* Terms
* Data practices
* Availability

StudyOS does not control those external services.

---

## 🗺️ Roadmap

The project is intentionally evolving.

Potential future improvements include:

* [ ] Better keyboard navigation
* [ ] More accessibility improvements
* [ ] Improved mobile interactions
* [ ] Additional study tools
* [ ] More customization
* [ ] Offline/PWA improvements
* [ ] Better import/export options
* [ ] Community-driven features

> Roadmap items are ideas, not promises.

---

## 📜 License

StudyOS is open source.

See [`LICENSE`](LICENSE) for the full license and usage terms.

---

<div align="center">

### ◌ StudyOS

**Study smarter. Stay organized. Keep your data yours.**

<br>

Made with ☕ + code for students.

<br>

`local-first` · `lightweight` · `open-source`

</div>
