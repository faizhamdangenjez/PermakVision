import {
  getCategoryMeta,
  TOP_SLEEVE_OPTIONS,
  COLLAR_SHIRT_OPTIONS,
  NECKLINE_KNIT_OPTIONS,
  WAIST_OPTIONS,
  TOP_BOTTOM_OPTIONS,
  PANTS_CUT_OPTIONS,
  SKIRT_DRESS_CUT_OPTIONS,
  TOP_FITTING_OPTIONS,
  BOTTOM_FITTING_OPTIONS,
  TOP_DETAIL_OPTIONS,
  BOTTOM_DETAIL_OPTIONS,
  TWOTONE_TOP_PATTERNS,
  TWOTONE_BOTTOM_PATTERNS
} from '../data/defaults.js';

export const CostAndRuleEngine = {
  evaluateChanges(catId, initialCfg, currentCfg, jenisList) {
    const meta = getCategoryMeta(catId);
    const changes = [];
    const findJenis = (param) =>
      jenisList.find((j) => j.parameterDesain === param) || {
        id: 'custom',
        nama: 'Penyesuaian Desain',
        estimasiBiayaMinimum: 15000,
        estimasiBiayaMaksimum: 35000,
        tingkatKesulitan: 'Mudah'
      };

    if (meta.group.startsWith('top')) {
      if ((initialCfg.panjangPakaian || 0) !== (currentCfg.panjangPakaian || 0)) {
        const j = findJenis('panjang');
        const d = (currentCfg.panjangPakaian || 0) - (initialCfg.panjangPakaian || 0);
        changes.push({
          nama: j.nama,
          detail: d < 0 ? `Potong pendek (${d}%)` : `Tambah panjang (+${d}%)`,
          biayaMin: j.estimasiBiayaMinimum,
          biayaMax: j.estimasiBiayaMaksimum,
          kesulitan: d > 0 ? 'Sedang' : j.tingkatKesulitan
        });
      }
    } else if (initialCfg.panjangBawahan !== currentCfg.panjangBawahan) {
      const j = findJenis('panjang');
      changes.push({
        nama: j.nama,
        detail: `Ubah panjang menjadi ${(currentCfg.panjangBawahan || '').toUpperCase()}`,
        biayaMin: j.estimasiBiayaMinimum,
        biayaMax: j.estimasiBiayaMaksimum,
        kesulitan: j.tingkatKesulitan
      });
    }

    if (meta.group.startsWith('top') || meta.group === 'dress') {
      if (initialCfg.panjangLengan !== currentCfg.panjangLengan) {
        const j = findJenis('panjangLengan');
        const sObj = TOP_SLEEVE_OPTIONS.find((s) => s.id === currentCfg.panjangLengan);
        changes.push({
          nama: j.nama,
          detail: `Ubah ke ${sObj ? sObj.label : currentCfg.panjangLengan}`,
          biayaMin: j.estimasiBiayaMinimum,
          biayaMax: j.estimasiBiayaMaksimum,
          kesulitan: j.tingkatKesulitan
        });
      }
      if (initialCfg.kerah !== currentCfg.kerah) {
        const j = findJenis('kerah');
        const allCollars = [...COLLAR_SHIRT_OPTIONS, ...NECKLINE_KNIT_OPTIONS];
        const cObj = allCollars.find((c) => c.id === currentCfg.kerah);
        changes.push({
          nama: j.nama,
          detail: `Model ${cObj ? cObj.label : currentCfg.kerah}`,
          biayaMin: j.estimasiBiayaMinimum,
          biayaMax: j.estimasiBiayaMaksimum,
          kesulitan: j.tingkatKesulitan
        });
      }
    }

    if (meta.group.startsWith('bottom') && initialCfg.pinggang !== currentCfg.pinggang) {
      const j = findJenis('pinggang');
      const wObj = WAIST_OPTIONS.find((w) => w.id === currentCfg.pinggang);
      changes.push({
        nama: j.nama,
        detail: `Model ${wObj ? wObj.label : currentCfg.pinggang}`,
        biayaMin: j.estimasiBiayaMinimum,
        biayaMax: j.estimasiBiayaMaksimum,
        kesulitan: j.tingkatKesulitan
      });
    }

    const initCut = meta.group.startsWith('bottom') ? initialCfg.potonganKaki : initialCfg.modelBawah;
    const currCut = meta.group.startsWith('bottom') ? currentCfg.potonganKaki : currentCfg.modelBawah;
    if (initCut !== currCut) {
      const j = findJenis('modelBawah');
      const allCuts = [...TOP_BOTTOM_OPTIONS, ...PANTS_CUT_OPTIONS, ...SKIRT_DRESS_CUT_OPTIONS];
      const bObj = allCuts.find((b) => b.id === currCut);
      changes.push({
        nama: j.nama,
        detail: `Potongan ${bObj ? bObj.label : currCut}`,
        biayaMin: j.estimasiBiayaMinimum,
        biayaMax: j.estimasiBiayaMaksimum,
        kesulitan: j.tingkatKesulitan
      });
    }

    const initFit = meta.group.startsWith('bottom') ? initialCfg.fittingBawahan : initialCfg.fitting;
    const currFit = meta.group.startsWith('bottom') ? currentCfg.fittingBawahan : currentCfg.fitting;
    if (initFit !== currFit) {
      const j = findJenis('fitting');
      const allFits = [...TOP_FITTING_OPTIONS, ...BOTTOM_FITTING_OPTIONS];
      const fObj = allFits.find((f) => f.id === currFit);
      changes.push({
        nama: j.nama,
        detail: `Siluet ${fObj ? fObj.label : currFit}`,
        biayaMin: j.estimasiBiayaMinimum,
        biayaMax: j.estimasiBiayaMaksimum,
        kesulitan: j.tingkatKesulitan
      });
    }

    const initDet = [...((meta.group.startsWith('bottom') ? initialCfg.detailBawahan : initialCfg.detail) || [])].sort().join(',');
    const currDetList = (meta.group.startsWith('bottom') ? currentCfg.detailBawahan : currentCfg.detail) || [];
    const currDet = [...currDetList].sort().join(',');
    if (initDet !== currDet) {
      const j = findJenis('detail');
      const allDets = [...TOP_DETAIL_OPTIONS, ...BOTTOM_DETAIL_OPTIONS];
      const labels = currDetList.map((d) => (allDets.find((o) => o.id === d) || { label: d }).label);
      changes.push({
        nama: j.nama,
        detail: labels.length ? labels.join(', ') : 'Melepas detail',
        biayaMin: j.estimasiBiayaMinimum,
        biayaMax: j.estimasiBiayaMaksimum,
        kesulitan: j.tingkatKesulitan
      });
    }

    if (initialCfg.primaryColor !== currentCfg.primaryColor) {
      const j = findJenis('warna');
      changes.push({
        nama: j.nama,
        detail: `Warna utama diubah ke ${currentCfg.primaryColor}`,
        biayaMin: j.estimasiBiayaMinimum,
        biayaMax: j.estimasiBiayaMaksimum,
        kesulitan: j.tingkatKesulitan
      });
    }

    if (currentCfg.twoTone) {
      const j = findJenis('twoTone');
      const allPatterns = [...TWOTONE_TOP_PATTERNS, ...TWOTONE_BOTTOM_PATTERNS];
      const pObj = allPatterns.find((p) => p.id === currentCfg.twoTonePattern);
      changes.push({
        nama: j.nama,
        detail: `Pola: ${pObj ? pObj.label : currentCfg.twoTonePattern} (${currentCfg.primaryColor} + ${currentCfg.secondaryColor})`,
        biayaMin: j.estimasiBiayaMinimum,
        biayaMax: j.estimasiBiayaMaksimum,
        kesulitan: j.tingkatKesulitan
      });
    }

    const totalMin = changes.reduce((sum, item) => sum + item.biayaMin, 0);
    const totalMax = changes.reduce((sum, item) => sum + item.biayaMax, 0);

    let difficulty = 'Belum Ada Perubahan';
    if (changes.length > 0) {
      const hasSulit = changes.some((c) => c.kesulitan === 'Sulit');
      const hasSedang = changes.some((c) => c.kesulitan === 'Sedang');
      if (hasSulit || changes.length >= 4) difficulty = 'Sulit';
      else if (hasSedang || changes.length >= 2) difficulty = 'Sedang';
      else difficulty = 'Mudah';
    }

    return { changes, totalMin, totalMax, difficulty };
  },

  getRecommendations(catId) {
    const meta = getCategoryMeta(catId);
    if (meta.group === 'bottom_pants') {
      return [
        {
          id: 'rec_pants_1',
          title: '7/8 Ankle Tapered + Cuff Color-Block',
          desc: 'Kecilkan kaki celana & beri blok warna kontras di lipatan bawah.',
          patch: { panjangBawahan: 'ankle', potonganKaki: 'tapered', twoTone: true, twoTonePattern: 'bottom_block' }
        },
        {
          id: 'rec_pants_2',
          title: 'High-Waist Wide-Leg + Panel Samping',
          desc: 'Tambahkan garis panel samping kontras agar kaki terlihat jenjang.',
          patch: { pinggang: 'high_waist', potonganKaki: 'wide', detailBawahan: ['side_panel'], twoTone: true, twoTonePattern: 'side_waist' }
        }
      ];
    }
    if (meta.group === 'bottom_skirt') {
      return [
        {
          id: 'rec_skirt_1',
          title: 'Two-Tone A-Line Asymmetric Midi',
          desc: 'Belah warna kiri-kanan 50:50 dengan potongan bawah asimetris.',
          patch: { panjangBawahan: 'midi', potonganKaki: 'asymmetric', twoTone: true, twoTonePattern: 'left_right' }
        },
        {
          id: 'rec_skirt_2',
          title: 'High-Waist Pencil + Side Slit',
          desc: 'Beri belahan samping untuk mobilitas dan siluet modern.',
          patch: { pinggang: 'high_waist', potonganKaki: 'slit' }
        }
      ];
    }
    if (meta.group === 'dress') {
      return [
        {
          id: 'rec_dress_1',
          title: 'Yoke Color-Block + Cinched Waist',
          desc: 'Kombinasi dua warna di bagian dada & tali pinggang.',
          patch: { fitting: 'cinched', detail: ['tali'], twoTone: true, twoTonePattern: 'yoke_block' }
        }
      ];
    }
    if (meta.group === 'top_collar') {
      return [
        {
          id: 'rec_top_1',
          title: 'Cropped Boxy + Lengan & Kerah Kontras',
          desc: 'Potong panjang baju -20%, ubah kerah Mandarin, dan pakai lengan 3/4 dua warna.',
          patch: { panjangPakaian: -20, panjangLengan: '3/4', kerah: 'mandarin', fitting: 'oversized', twoTone: true, twoTonePattern: 'sleeves_collar' }
        },
        {
          id: 'rec_top_2',
          title: 'Vertical Split 50:50 Two-Tone',
          desc: 'Gabungkan dua kemeja berbeda warna secara simetris kiri-kanan.',
          patch: { twoTone: true, twoTonePattern: 'vertical_split', detail: ['saku', 'plaket'] }
        }
      ];
    }
    return [
      {
        id: 'rec_knit_1',
        title: 'Two-Tone Raglan / Sleeve Contrast',
        desc: 'Ganti lengan dengan warna alternatif & ubah garis leher V-neck.',
        patch: { kerah: 'vneck', twoTone: true, twoTonePattern: 'sleeves_collar' }
      },
      {
        id: 'rec_knit_2',
        title: 'Cropped Boxy + Side Slit',
        desc: 'Pendekkan panjang atasan -15% dengan belahan samping.',
        patch: { panjangPakaian: -15, modelBawah: 'slit', fitting: 'oversized' }
      }
    ];
  }
};
