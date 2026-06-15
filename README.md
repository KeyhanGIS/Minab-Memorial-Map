---

## 📊 Data Structure

### `data/martyrs.json`
```json
{
  "total": 156,
  "martyrs": [
    {
      "id": 1,
      "name_fa": "نام شهید",
      "name_en": "Martyr Name",
      "age": 12,
      "job_fa": "دانش‌آموز",
      "job_en": "Student"
    }
  ]
}
```

### `data/border.geojson`
```json
{
  "type": "FeatureCollection",
  "features": [...]
}
```

---

## 🚀 Run Locally

```bash
git clone https://github.com/YOUR_USERNAME/minab-memorial-map.git
cd minab-memorial-map
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

> ⚠️ Do not open `index.html` directly — use an HTTP server so JSON files load correctly.

---

## 🌍 Deploy on GitHub Pages

1. Push your code to GitHub
2. Go to **Settings → Pages**
3. Select branch `main` → Save
4. Your map will be live at `https://YOUR_USERNAME.github.io/minab-memorial-map/`

---

## 🤝 Contributing

This project is open to contributions. You can:

- Improve the UI or animations
- Add more languages
- Adapt the structure for another memorial
- Fix bugs or improve performance

```bash
git checkout -b feature/your-idea
git commit -m 'Add your idea'
git push origin feature/your-idea
```

Then open a Pull Request.

---

## 📜 License

MIT License — free to use, modify, and distribute.

---

## 🙏 In Memory

> *They are not statistics — they had names.*

🕯️ This map is dedicated to the 156 souls of Minab School.
May their memory never fade.

---

<div align="center">
  <sub>Built with ❤️ using WebGIS | Open Source | Contributions Welcome</sub>
</div>