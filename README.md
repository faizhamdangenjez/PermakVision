# PermakVision — Interactive Clothing Alteration & Visualization Studio

Aplikasi web interaktif berbasis **Vite + Vanilla JavaScript (ES Modules) + HTML5 + CSS3** untuk memvisualisasikan pola permak pakaian, mengeksplorasi kombinasi dua warna (*two-tone / color-block*), menghitung simulasi estimasi biaya, dan mencetak **Design Brief** siap pakai untuk penjahit.

## Struktur Proyek

```text
permakvision-studio/
├── index.html                  # Semantic HTML5 shell & modal containers
├── package.json                # Konfigurasi Vite & scripts
├── vite.config.js              # Konfigurasi bundler Vite
├── public/
│   └── favicon.svg             # Ikon vektor PermakVision
└── src/
    ├── main.js                 # Entry point, Hash Router & global event delegation
    ├── data/
    │   └── defaults.js         # Kategori pakaian, opsi adaptif, palet warna & data awal
    ├── services/
    │   ├── storageService.js   # Manajemen LocalStorage & Export/Import JSON Backup
    │   ├── svgEngine.js        # Mesin rendering SVG fashion-flat parametrik multi-layer
    │   └── costRuleEngine.js   # Kalkulator biaya simulasi & rekomendasi berbasis aturan
    ├── state/
    │   └── store.js            # Centralized state management + Undo stack
    ├── utils/
    │   └── dom.js              # XSS sanitization (escapeHTML), formatter, modal & toast
    ├── views/
    │   ├── landingView.js      # Halaman utama & demo interaktif Before/After
    │   ├── studioView.js       # Editor permak adaptif, Two-Tone & PointerEvent Split Slider
    │   ├── catalogView.js      # Katalog template dengan filter & pencarian real-time
    │   ├── myDesignsView.js    # Koleksi desain tersimpan + backup JSON
    │   ├── briefView.js        # Lembar spesifikasi penjahit siap cetak PDF
    │   └── adminView.js        # Dashboard CRUD template & aturan tarif simulasi
    └── styles/
        ├── tokens.css          # Design tokens (warna, tipografi, border, shadow)
        ├── base.css            # CSS reset, aksesibilitas fokus & background
        ├── components.css      # Navbar, tombol, stiker, kartu, modal & toast
        ├── views.css           # Layout responsif seluruh halaman
        └── print.css           # Aturan @media print untuk ekspor PDF Design Brief
```

## Cara Menjalankan

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Jalankan server pengembangan (Development):**
   ```bash
   npm run dev
   ```
3. **Build untuk produksi (Production Bundle):**
   ```bash
   npm run build
   npm run preview
   ```
