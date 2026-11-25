import { getCategoryMeta } from '../data/defaults.js';

let uidCounter = 0;

function renderTopOrDressSVG(uid, catId, group, cfg, initialCfg, showGuides, c1, c2, isTwoTone, pattern) {
  const stroke = '#20212A';
  const cx = 140;
  const isDress = group === 'dress';
  const isOuter = catId === 'jacket' || catId === 'outerwear';

  let baseHemY = isDress ? 245 : isOuter ? 210 : 202;
  if (isDress) {
    if (cfg.panjangBawahan === 'mini') baseHemY = 205;
    else if (cfg.panjangBawahan === 'midi') baseHemY = 248;
    else if (cfg.panjangBawahan === 'maxi') baseHemY = 296;
  } else {
    baseHemY += (cfg.panjangPakaian || 0) * 1.9;
  }
  const hemY = Math.max(132, Math.min(302, baseHemY));

  let initHemY = hemY;
  if (initialCfg) {
    if (isDress) {
      initHemY = initialCfg.panjangBawahan === 'mini' ? 205 : initialCfg.panjangBawahan === 'maxi' ? 296 : 248;
    } else {
      initHemY = Math.max(132, Math.min(302, (isOuter ? 210 : 202) + (initialCfg.panjangPakaian || 0) * 1.9));
    }
  }

  let shoulderHalf = 56;
  let waistHalf = 52;
  let hemHalf = isDress ? 72 : 55;
  if (cfg.fitting === 'slim') {
    shoulderHalf = 52;
    waistHalf = 41;
    hemHalf = isDress ? 62 : 48;
  } else if (cfg.fitting === 'oversized') {
    shoulderHalf = 66;
    waistHalf = 65;
    hemHalf = isDress ? 82 : 67;
  } else if (cfg.fitting === 'cinched') {
    shoulderHalf = 56;
    waistHalf = 38;
    hemHalf = isDress ? 78 : 57;
  }

  if (cfg.modelBawah === 'aline') hemHalf += 22;

  let leftHemY = hemY;
  let rightHemY = hemY;
  let bottomCurve = `L ${cx + hemHalf} ${rightHemY}`;
  if (cfg.modelBawah === 'asymmetric') {
    leftHemY = hemY - 22;
    rightHemY = hemY + 14;
    bottomCurve = `L ${cx + hemHalf} ${rightHemY}`;
  } else if (cfg.modelBawah === 'shirttail') {
    bottomCurve = `Q ${cx} ${hemY + 22}, ${cx + hemHalf} ${rightHemY}`;
  }

  const neckHalf = cfg.kerah === 'sabrini' ? 36 : 23;
  const shoulderY = 52;
  const armholeBottomY = 98;
  const waistY = 138;

  const bodyD = `
    M ${cx - neckHalf} 42
    L ${cx - shoulderHalf} ${shoulderY}
    L ${cx - shoulderHalf} ${armholeBottomY}
    Q ${cx - waistHalf} ${waistY}, ${cx - hemHalf} ${leftHemY}
    ${bottomCurve}
    Q ${cx + waistHalf} ${waistY}, ${cx + shoulderHalf} ${armholeBottomY}
    L ${cx + shoulderHalf} ${shoulderY}
    L ${cx + neckHalf} 42
    Z
  `;

  let leftSleeveD = '';
  let rightSleeveD = '';
  let leftCuffD = '';
  let rightCuffD = '';
  if (cfg.panjangLengan !== 'tanpa') {
    let sx = 24;
    let sy = 176;
    let cuffW = 16;
    if (cfg.panjangLengan === 'pendek') {
      sx = 46;
      sy = 112;
      cuffW = 19;
    } else if (cfg.panjangLengan === '3/4') {
      sx = 33;
      sy = 148;
      cuffW = 17;
    }
    leftSleeveD = `M ${cx - shoulderHalf} ${shoulderY} L ${sx} ${sy} L ${sx + cuffW} ${sy + 9} L ${cx - shoulderHalf} ${armholeBottomY} Z`;
    rightSleeveD = `M ${cx + shoulderHalf} ${shoulderY} L ${280 - sx} ${sy} L ${280 - sx - cuffW} ${sy + 9} L ${cx + shoulderHalf} ${armholeBottomY} Z`;

    if (cfg.panjangLengan === 'panjang' || cfg.panjangLengan === '3/4') {
      leftCuffD = `M ${sx + 3} ${sy - 11} L ${sx} ${sy} L ${sx + cuffW} ${sy + 9} L ${sx + cuffW + 3} ${sy - 2} Z`;
      rightCuffD = `M ${280 - sx - 3} ${sy - 11} L ${280 - sx} ${sy} L ${280 - sx - cuffW} ${sy + 9} L ${280 - sx - cuffW - 3} ${sy - 2} Z`;
    }
  }

  let sleeveFill = c1;
  let placketFill = c1;
  let cuffFill = c1;
  let hemTrimFill = null;

  if (isTwoTone) {
    if (pattern === 'sleeves_collar') {
      sleeveFill = c2;
      cuffFill = c2;
    } else if (pattern === 'trim_accent') {
      placketFill = c2;
      cuffFill = c2;
      hemTrimFill = c2;
    }
  }

  const details = cfg.detail || [];
  if (details.includes('manset')) cuffFill = isTwoTone ? c2 : '#FFE45E';
  if (details.includes('plaket')) placketFill = isTwoTone ? c2 : '#FFE45E';

  const defs = `
    <defs>
      <clipPath id="bodyClip_${uid}"><path d="${bodyD}"/></clipPath>
      <clipPath id="yokeClip_${uid}"><rect x="0" y="0" width="280" height="106"/></clipPath>
    </defs>
  `;

  let layers = '';

  if (leftSleeveD) {
    layers += `<path d="${leftSleeveD}" fill="${sleeveFill}" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"/>`;
    layers += `<path d="${rightSleeveD}" fill="${isTwoTone && pattern === 'vertical_split' ? c2 : sleeveFill}" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"/>`;

    if (isTwoTone && pattern === 'yoke_block') {
      layers += `<g clip-path="url(#yokeClip_${uid})">
        <path d="${leftSleeveD}" fill="${c2}" stroke="${stroke}" stroke-width="2.2"/>
        <path d="${rightSleeveD}" fill="${c2}" stroke="${stroke}" stroke-width="2.2"/>
      </g>`;
    }

    if (leftCuffD) {
      const rCuffColor = isTwoTone && pattern === 'vertical_split' ? c2 : cuffFill;
      layers += `<path d="${leftCuffD}" fill="${cuffFill}" stroke="${stroke}" stroke-width="1.8"/>`;
      layers += `<path d="${rightCuffD}" fill="${rCuffColor}" stroke="${stroke}" stroke-width="1.8"/>`;
    }
  }

  layers += `<path d="${bodyD}" fill="${c1}" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"/>`;

  if (isTwoTone) {
    if (pattern === 'vertical_split') {
      layers += `<g clip-path="url(#bodyClip_${uid})">
        <rect x="${cx}" y="0" width="140" height="340" fill="${c2}"/>
        <line x1="${cx}" y1="40" x2="${cx}" y2="${hemY + 20}" stroke="${stroke}" stroke-width="1.6" stroke-dasharray="4 3"/>
      </g>`;
    } else if (pattern === 'yoke_block') {
      layers += `<g clip-path="url(#bodyClip_${uid})">
        <rect x="0" y="0" width="280" height="106" fill="${c2}"/>
        <line x1="40" y1="106" x2="240" y2="106" stroke="${stroke}" stroke-width="2"/>
        <line x1="40" y1="102" x2="240" y2="102" stroke="${stroke}" stroke-width="1" stroke-dasharray="3 2.5"/>
      </g>`;
    } else if (pattern === 'trim_accent' && hemTrimFill) {
      layers += `<g clip-path="url(#bodyClip_${uid})">
        <rect x="0" y="${hemY - 16}" width="280" height="45" fill="${hemTrimFill}"/>
        <line x1="40" y1="${hemY - 16}" x2="240" y2="${hemY - 16}" stroke="${stroke}" stroke-width="1.8"/>
      </g>`;
    }
  }

  layers += `<g clip-path="url(#bodyClip_${uid})">
    <line x1="40" y1="${hemY - 7}" x2="240" y2="${hemY - 7}" stroke="${stroke}" stroke-width="1.1" stroke-dasharray="3 3" opacity="0.65"/>
    <path d="M ${cx - shoulderHalf + 6} ${armholeBottomY + 4} Q ${cx - waistHalf + 8} ${waistY - 8}, ${cx - waistHalf + 12} ${waistY + 12}" fill="none" stroke="${stroke}" stroke-width="1.1" opacity="0.35"/>
    <path d="M ${cx + shoulderHalf - 6} ${armholeBottomY + 4} Q ${cx + waistHalf - 8} ${waistY - 8}, ${cx + waistHalf - 12} ${waistY + 12}" fill="none" stroke="${stroke}" stroke-width="1.1" opacity="0.35"/>
  </g>`;

  if (details.includes('plaket') || group === 'top_collar') {
    const pFill = details.includes('plaket') ? placketFill : isTwoTone && pattern === 'vertical_split' ? c2 : c1;
    layers += `<rect x="${cx - 7}" y="54" width="14" height="${Math.max(40, hemY - 54)}" fill="${pFill}" stroke="${stroke}" stroke-width="1.6"/>`;
    for (let y = 72; y < hemY - 10; y += 26) {
      layers += `<circle cx="${cx}" cy="${y}" r="2.7" fill="#FFE45E" stroke="${stroke}" stroke-width="1.3"/>`;
    }
  }

  const activeCollarFill = isTwoTone && (pattern === 'sleeves_collar' || pattern === 'trim_accent' || pattern === 'yoke_block') ? c2 : c1;
  if (cfg.kerah === 'classic') {
    layers += `
      <path d="M ${cx - 23} 42 Q ${cx} 54 ${cx + 23} 42 L ${cx + 20} 32 Q ${cx} 41 ${cx - 20} 32 Z" fill="${activeCollarFill}" stroke="${stroke}" stroke-width="1.8"/>
      <path d="M ${cx - 23} 42 L ${cx - 31} 64 L ${cx - 6} 55 L ${cx} 47 Z" fill="${activeCollarFill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M ${cx + 23} 42 L ${cx + 31} 64 L ${cx + 6} 55 L ${cx} 47 Z" fill="${isTwoTone && pattern === 'vertical_split' ? c2 : activeCollarFill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
    `;
  } else if (cfg.kerah === 'mandarin') {
    layers += `
      <path d="M ${cx - 22} 44 Q ${cx} 53 ${cx + 22} 44 L ${cx + 19} 32 Q ${cx} 40 ${cx - 19} 32 Z" fill="${activeCollarFill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
      <line x1="${cx}" y1="36" x2="${cx}" y2="49" stroke="${stroke}" stroke-width="1.8"/>
    `;
  } else if (cfg.kerah === 'camp') {
    layers += `
      <path d="M ${cx - 23} 42 L ${cx} 74 L ${cx + 23} 42" fill="#F3F4F8" stroke="${stroke}" stroke-width="2"/>
      <path d="M ${cx - 23} 42 L ${cx - 34} 58 L ${cx - 16} 66 L ${cx} 74 Z" fill="${activeCollarFill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M ${cx + 23} 42 L ${cx + 34} 58 L ${cx + 16} 66 L ${cx} 74 Z" fill="${isTwoTone && pattern === 'vertical_split' ? c2 : activeCollarFill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
    `;
  } else if (cfg.kerah === 'vneck') {
    layers += `<path d="M ${cx - 23} 42 L ${cx} 82 L ${cx + 23} 42" fill="#F3F4F8" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"/>`;
  } else if (cfg.kerah === 'sabrini') {
    layers += `<path d="M ${cx - 36} 42 Q ${cx} 62 ${cx + 36} 42 Z" fill="#F3F4F8" stroke="${stroke}" stroke-width="2.2"/>`;
  } else if (cfg.kerah === 'square') {
    layers += `<path d="M ${cx - 22} 42 L ${cx - 22} 68 L ${cx + 22} 68 L ${cx + 22} 42" fill="#F3F4F8" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"/>`;
  } else {
    layers += `<path d="M ${cx - 23} 42 Q ${cx} 60 ${cx + 23} 42" fill="#F3F4F8" stroke="${stroke}" stroke-width="2.2"/>`;
  }

  if (details.includes('saku')) {
    const pckCol = isTwoTone ? c2 : '#C7F464';
    layers += `
      <path d="M ${cx + 16} 88 L ${cx + 38} 88 L ${cx + 38} 112 L ${cx + 27} 118 L ${cx + 16} 112 Z" fill="${pckCol}" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round"/>
      <line x1="${cx + 16}" y1="94" x2="${cx + 38}" y2="94" stroke="${stroke}" stroke-width="1.3"/>
    `;
  }

  if (details.includes('tali')) {
    const tieCol = isTwoTone ? c2 : '#FF8A35';
    layers += `
      <rect x="${cx - waistHalf - 1}" y="${waistY - 5}" width="${(waistHalf + 1) * 2}" height="10" rx="3" fill="${tieCol}" stroke="${stroke}" stroke-width="1.8"/>
      <path d="M ${cx} ${waistY + 5} L ${cx - 10} ${waistY + 26} M ${cx} ${waistY + 5} L ${cx + 10} ${waistY + 26}" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>
    `;
  }

  if (cfg.modelBawah === 'slit') {
    layers += `
      <line x1="${cx - hemHalf + 7}" y1="${hemY - 30}" x2="${cx - hemHalf + 7}" y2="${hemY}" stroke="#FF4FA3" stroke-width="2.8"/>
      <line x1="${cx + hemHalf - 7}" y1="${hemY - 30}" x2="${cx + hemHalf - 7}" y2="${hemY}" stroke="#FF4FA3" stroke-width="2.8"/>
    `;
  }

  if (showGuides) {
    layers += `<line x1="${cx - hemHalf - 12}" y1="${hemY - 4}" x2="${cx + hemHalf + 12}" y2="${hemY - 4}" stroke="#FF4FA3" stroke-width="2" stroke-dasharray="6 4"/>`;
    if (Math.abs(hemY - initHemY) > 6) {
      const tag = hemY < initHemY ? 'CROP LINE' : 'EXTEND';
      layers += `
        <rect x="${cx + hemHalf - 34}" y="${hemY - 19}" width="54" height="14" rx="4" fill="#FFE45E" stroke="${stroke}" stroke-width="1.3"/>
        <text x="${cx + hemHalf - 7}" y="${hemY - 9}" text-anchor="middle" font-family="monospace" font-size="8" font-weight="700" fill="${stroke}">${tag}</text>
      `;
    }
  }

  return `<svg viewBox="0 0 280 330" role="img" aria-label="Ilustrasi Pola Pakaian" xmlns="http://www.w3.org/2000/svg">${defs}${layers}</svg>`;
}

function renderPantsSVG(uid, catId, cfg, initialCfg, showGuides, c1, c2, isTwoTone, pattern) {
  const stroke = '#20212A';
  const cx = 140;
  const isJeans = catId === 'jeans';

  const lenMap = { shorts: 158, bermuda: 204, ankle: 256, full: 294 };
  const hemY = lenMap[cfg.panjangBawahan] || 294;
  const initHemY = initialCfg ? lenMap[initialCfg.panjangBawahan] || 294 : hemY;

  const waistTopY = cfg.pinggang === 'high_waist' || cfg.pinggang === 'paperbag' ? 32 : 44;
  const waistBandH = cfg.pinggang === 'high_waist' || cfg.pinggang === 'paperbag' ? 22 : 14;
  const crotchY = 122;

  let waistHalf = 48;
  let hipHalf = 56;
  if (cfg.fittingBawahan === 'slim') {
    waistHalf = 43;
    hipHalf = 49;
  } else if (cfg.fittingBawahan === 'baggy') {
    waistHalf = 54;
    hipHalf = 66;
  }

  let ankleOuterHalf = hipHalf - 6;
  let innerGap = 8;
  if (cfg.potonganKaki === 'tapered') {
    ankleOuterHalf = hipHalf - 19;
    innerGap = 10;
  } else if (cfg.potonganKaki === 'wide') {
    ankleOuterHalf = hipHalf + 12;
    innerGap = 6;
  } else if (cfg.potonganKaki === 'flare') {
    ankleOuterHalf = hipHalf + 14;
    innerGap = 7;
  }

  const kneeY = 195;
  const fullPantsD = cfg.potonganKaki === 'flare' && hemY > kneeY
    ? `
      M ${cx - waistHalf} ${waistTopY}
      L ${cx - hipHalf} 112
      L ${cx - hipHalf + 8} ${kneeY}
      L ${cx - ankleOuterHalf} ${hemY}
      L ${cx - innerGap} ${hemY}
      L ${cx} ${crotchY}
      L ${cx + innerGap} ${hemY}
      L ${cx + ankleOuterHalf} ${hemY}
      L ${cx + hipHalf - 8} ${kneeY}
      L ${cx + hipHalf} 112
      L ${cx + waistHalf} ${waistTopY}
      Z
    `
    : `
      M ${cx - waistHalf} ${waistTopY}
      L ${cx - hipHalf} 112
      L ${cx - ankleOuterHalf} ${hemY}
      L ${cx - innerGap} ${hemY}
      L ${cx} ${crotchY}
      L ${cx + innerGap} ${hemY}
      L ${cx + ankleOuterHalf} ${hemY}
      L ${cx + hipHalf} 112
      L ${cx + waistHalf} ${waistTopY}
      Z
    `;

  const lowerBlockY = Math.max(crotchY + 25, hemY - 48);
  const defs = `<defs><clipPath id="pantsClip_${uid}"><path d="${fullPantsD}"/></clipPath></defs>`;
  let layers = `<path d="${fullPantsD}" fill="${c1}" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"/>`;

  if (isTwoTone) {
    if (pattern === 'left_right') {
      layers += `<g clip-path="url(#pantsClip_${uid})">
        <rect x="${cx}" y="0" width="140" height="340" fill="${c2}"/>
        <line x1="${cx}" y1="${waistTopY}" x2="${cx}" y2="${crotchY}" stroke="${stroke}" stroke-width="1.8"/>
      </g>`;
    } else if (pattern === 'side_waist') {
      layers += `<g clip-path="url(#pantsClip_${uid})">
        <rect x="0" y="0" width="280" height="${waistTopY + waistBandH}" fill="${c2}"/>
        <rect x="0" y="${waistTopY}" width="${cx - hipHalf + 15}" height="340" fill="${c2}"/>
        <rect x="${cx + hipHalf - 15}" y="${waistTopY}" width="100" height="340" fill="${c2}"/>
        <line x1="${cx - hipHalf + 15}" y1="${waistTopY + waistBandH}" x2="${cx - ankleOuterHalf + 12}" y2="${hemY}" stroke="${stroke}" stroke-width="1.5"/>
        <line x1="${cx + hipHalf - 15}" y1="${waistTopY + waistBandH}" x2="${cx + ankleOuterHalf - 12}" y2="${hemY}" stroke="${stroke}" stroke-width="1.5"/>
      </g>`;
    } else if (pattern === 'bottom_block') {
      layers += `<g clip-path="url(#pantsClip_${uid})">
        <rect x="0" y="${lowerBlockY}" width="280" height="150" fill="${c2}"/>
        <line x1="30" y1="${lowerBlockY}" x2="250" y2="${lowerBlockY}" stroke="${stroke}" stroke-width="2"/>
        <line x1="30" y1="${lowerBlockY - 4}" x2="250" y2="${lowerBlockY - 4}" stroke="${stroke}" stroke-width="1" stroke-dasharray="3 2.5"/>
      </g>`;
    } else if (pattern === 'front_patch') {
      layers += `<g clip-path="url(#pantsClip_${uid})">
        <rect x="${cx - hipHalf + 12}" y="135" width="32" height="62" rx="4" fill="${c2}" stroke="${stroke}" stroke-width="1.7"/>
        <rect x="${cx + hipHalf - 44}" y="135" width="32" height="62" rx="4" fill="${c2}" stroke="${stroke}" stroke-width="1.7"/>
      </g>`;
    }
  }

  const wbFill = isTwoTone && (pattern === 'side_waist' || pattern === 'front_patch') ? c2 : c1;
  layers += `<rect x="${cx - waistHalf}" y="${waistTopY}" width="${waistHalf * 2}" height="${waistBandH}" fill="${wbFill}" stroke="${stroke}" stroke-width="2"/>`;
  if (isTwoTone && pattern === 'left_right') {
    layers += `<rect x="${cx}" y="${waistTopY}" width="${waistHalf}" height="${waistBandH}" fill="${c2}" stroke="${stroke}" stroke-width="2"/>`;
  }

  if (cfg.pinggang === 'paperbag') {
    layers += `
      <path d="M ${cx - waistHalf} ${waistTopY} Q ${cx - 24} ${waistTopY - 8}, ${cx} ${waistTopY} Q ${cx + 24} ${waistTopY - 8}, ${cx + waistHalf} ${waistTopY}" fill="none" stroke="${stroke}" stroke-width="2"/>
      <rect x="${cx - waistHalf - 2}" y="${waistTopY + 12}" width="${waistHalf * 2 + 4}" height="8" rx="3" fill="#FF8A35" stroke="${stroke}" stroke-width="1.6"/>
    `;
  } else if (cfg.pinggang === 'elastic') {
    for (let x = cx - waistHalf + 8; x < cx + waistHalf; x += 8) {
      layers += `<line x1="${x}" y1="${waistTopY + 2}" x2="${x}" y2="${waistTopY + waistBandH - 2}" stroke="${stroke}" stroke-width="1.1"/>`;
    }
    layers += `<path d="M ${cx - 3} ${waistTopY + waistBandH} L ${cx - 9} ${waistTopY + waistBandH + 22} M ${cx + 3} ${waistTopY + waistBandH} L ${cx + 9} ${waistTopY + waistBandH + 22}" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`;
  } else {
    [-waistHalf + 10, -16, 16, waistHalf - 10].forEach((off) => {
      layers += `<rect x="${cx + off - 2.5}" y="${waistTopY - 1}" width="5" height="${waistBandH + 2}" fill="${wbFill}" stroke="${stroke}" stroke-width="1.3"/>`;
    });
    layers += `<circle cx="${cx}" cy="${waistTopY + waistBandH / 2}" r="3.2" fill="#FFE45E" stroke="${stroke}" stroke-width="1.4"/>`;
  }

  layers += `
    <path d="M ${cx} ${waistTopY + waistBandH} L ${cx} ${crotchY - 14} Q ${cx + 12} ${crotchY - 14}, ${cx + 12} ${crotchY - 28} L ${cx + 12} ${waistTopY + waistBandH}" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="${isJeans ? '3 2' : 'none'}"/>
    <path d="M ${cx - waistHalf} ${waistTopY + waistBandH + 22} Q ${cx - waistHalf + 20} ${waistTopY + waistBandH + 20}, ${cx - waistHalf + 22} ${waistTopY + waistBandH}" fill="none" stroke="${stroke}" stroke-width="1.7"/>
    <path d="M ${cx + waistHalf} ${waistTopY + waistBandH + 22} Q ${cx + waistHalf - 20} ${waistTopY + waistBandH + 20}, ${cx + waistHalf - 22} ${waistTopY + waistBandH}" fill="none" stroke="${stroke}" stroke-width="1.7"/>
  `;

  const details = cfg.detailBawahan || [];
  if (details.includes('cargo') && hemY > 185) {
    const pCol = isTwoTone ? c2 : '#C7F464';
    layers += `
      <rect x="${cx - hipHalf + 4}" y="148" width="18" height="32" rx="3" fill="${pCol}" stroke="${stroke}" stroke-width="1.7"/>
      <line x1="${cx - hipHalf + 4}" y1="156" x2="${cx - hipHalf + 22}" y2="156" stroke="${stroke}" stroke-width="1.4"/>
      <rect x="${cx + hipHalf - 22}" y="148" width="18" height="32" rx="3" fill="${pCol}" stroke="${stroke}" stroke-width="1.7"/>
      <line x1="${cx + hipHalf - 22}" y1="156" x2="${cx + hipHalf - 4}" y2="156" stroke="${stroke}" stroke-width="1.4"/>
    `;
  }

  if (details.includes('pleats')) {
    layers += `
      <line x1="${cx - 22}" y1="${waistTopY + waistBandH + 4}" x2="${cx - 24}" y2="112" stroke="${stroke}" stroke-width="1.8"/>
      <line x1="${cx + 22}" y1="${waistTopY + waistBandH + 4}" x2="${cx + 24}" y2="112" stroke="${stroke}" stroke-width="1.8"/>
    `;
  }

  if (details.includes('exposed_btn')) {
    for (let y = waistTopY + waistBandH + 10; y < crotchY - 12; y += 14) {
      layers += `<circle cx="${cx + 5}" cy="${y}" r="2.5" fill="#FF4FA3" stroke="${stroke}" stroke-width="1.2"/>`;
    }
  }

  if (cfg.potonganKaki === 'cuffed') {
    const cuffCol = isTwoTone ? c2 : '#FFE45E';
    layers += `
      <rect x="${cx - ankleOuterHalf - 2}" y="${hemY - 16}" width="${ankleOuterHalf - innerGap + 4}" height="16" rx="2" fill="${cuffCol}" stroke="${stroke}" stroke-width="1.8"/>
      <rect x="${cx + innerGap - 2}" y="${hemY - 16}" width="${ankleOuterHalf - innerGap + 4}" height="16" rx="2" fill="${cuffCol}" stroke="${stroke}" stroke-width="1.8"/>
    `;
  } else if (cfg.potonganKaki === 'split_hem') {
    layers += `
      <line x1="${cx - innerGap - 5}" y1="${hemY - 28}" x2="${cx - innerGap - 5}" y2="${hemY}" stroke="#FF4FA3" stroke-width="2.8"/>
      <line x1="${cx + innerGap + 5}" y1="${hemY - 28}" x2="${cx + innerGap + 5}" y2="${hemY}" stroke="#FF4FA3" stroke-width="2.8"/>
    `;
  } else {
    layers += `
      <line x1="${cx - ankleOuterHalf + 3}" y1="${hemY - 6}" x2="${cx - innerGap - 3}" y2="${hemY - 6}" stroke="${stroke}" stroke-width="1.2" stroke-dasharray="3 2.5"/>
      <line x1="${cx + innerGap + 3}" y1="${hemY - 6}" x2="${cx + ankleOuterHalf - 3}" y2="${hemY - 6}" stroke="${stroke}" stroke-width="1.2" stroke-dasharray="3 2.5"/>
    `;
  }

  if (showGuides) {
    layers += `<line x1="${cx - ankleOuterHalf - 10}" y1="${hemY - 3}" x2="${cx + ankleOuterHalf + 10}" y2="${hemY - 3}" stroke="#FF4FA3" stroke-width="2" stroke-dasharray="6 4"/>`;
    if (Math.abs(hemY - initHemY) > 6) {
      layers += `
        <rect x="${cx + ankleOuterHalf - 32}" y="${hemY - 18}" width="56" height="14" rx="4" fill="#FFE45E" stroke="${stroke}" stroke-width="1.3"/>
        <text x="${cx + ankleOuterHalf - 4}" y="${hemY - 8}" text-anchor="middle" font-family="monospace" font-size="8" font-weight="700" fill="${stroke}">HEM CUT</text>
      `;
    }
  }

  return `<svg viewBox="0 0 280 330" role="img" aria-label="Ilustrasi Pola Celana" xmlns="http://www.w3.org/2000/svg">${defs}${layers}</svg>`;
}

function renderSkirtSVG(uid, cfg, showGuides, c1, c2, isTwoTone, pattern) {
  const stroke = '#20212A';
  const cx = 140;
  const lenMap = { mini: 168, midi: 232, maxi: 288 };
  const hemY = lenMap[cfg.panjangBawahan] || 232;

  const waistTopY = cfg.pinggang === 'high_waist' || cfg.pinggang === 'paperbag' ? 36 : 48;
  const waistBandH = cfg.pinggang === 'high_waist' || cfg.pinggang === 'paperbag' ? 22 : 14;

  let waistHalf = 46;
  if (cfg.fittingBawahan === 'slim') waistHalf = 40;
  else if (cfg.fittingBawahan === 'baggy') waistHalf = 54;

  let hemHalf = waistHalf + 12;
  if (cfg.potonganKaki === 'aline') hemHalf = waistHalf + 38;
  else if (cfg.potonganKaki === 'pencil') hemHalf = waistHalf + 4;

  const leftHemY = cfg.potonganKaki === 'asymmetric' ? hemY - 24 : hemY;
  const rightHemY = cfg.potonganKaki === 'asymmetric' ? hemY + 14 : hemY;

  const skirtD = `
    M ${cx - waistHalf} ${waistTopY}
    L ${cx - hemHalf} ${leftHemY}
    L ${cx + hemHalf} ${rightHemY}
    L ${cx + waistHalf} ${waistTopY}
    Z
  `;

  const lowerBlockY = Math.max(waistTopY + 50, hemY - 44);
  const defs = `<defs><clipPath id="skirtClip_${uid}"><path d="${skirtD}"/></clipPath></defs>`;
  let layers = `<path d="${skirtD}" fill="${c1}" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"/>`;

  if (isTwoTone) {
    if (pattern === 'left_right') {
      layers += `<g clip-path="url(#skirtClip_${uid})">
        <rect x="${cx}" y="0" width="140" height="340" fill="${c2}"/>
        <line x1="${cx}" y1="${waistTopY}" x2="${cx}" y2="${hemY + 20}" stroke="${stroke}" stroke-width="1.6"/>
      </g>`;
    } else if (pattern === 'side_waist') {
      layers += `<g clip-path="url(#skirtClip_${uid})">
        <rect x="0" y="0" width="280" height="${waistTopY + waistBandH}" fill="${c2}"/>
        <rect x="0" y="${waistTopY}" width="${cx - waistHalf + 14}" height="340" fill="${c2}"/>
        <rect x="${cx + waistHalf - 14}" y="${waistTopY}" width="100" height="340" fill="${c2}"/>
      </g>`;
    } else if (pattern === 'bottom_block') {
      layers += `<g clip-path="url(#skirtClip_${uid})">
        <rect x="0" y="${lowerBlockY}" width="280" height="140" fill="${c2}"/>
        <line x1="20" y1="${lowerBlockY}" x2="260" y2="${lowerBlockY}" stroke="${stroke}" stroke-width="2"/>
      </g>`;
    } else if (pattern === 'front_patch') {
      layers += `<g clip-path="url(#skirtClip_${uid})">
        <rect x="${cx - 26}" y="${waistTopY + waistBandH + 14}" width="52" height="75" rx="4" fill="${c2}" stroke="${stroke}" stroke-width="1.8"/>
      </g>`;
    }
  }

  const wbFill = isTwoTone && pattern === 'side_waist' ? c2 : c1;
  layers += `<rect x="${cx - waistHalf}" y="${waistTopY}" width="${waistHalf * 2}" height="${waistBandH}" fill="${wbFill}" stroke="${stroke}" stroke-width="2"/>`;

  if (cfg.pinggang === 'paperbag') {
    layers += `<rect x="${cx - waistHalf - 2}" y="${waistTopY + 12}" width="${waistHalf * 2 + 4}" height="8" rx="3" fill="#FF8A35" stroke="${stroke}" stroke-width="1.6"/>`;
  }

  const details = cfg.detailBawahan || [];
  if (details.includes('pleats')) {
    [-22, -11, 0, 11, 22].forEach((off) => {
      layers += `<line x1="${cx + off}" y1="${waistTopY + waistBandH}" x2="${cx + off * 1.35}" y2="${hemY - 4}" stroke="${stroke}" stroke-width="1.4" stroke-dasharray="3 2"/>`;
    });
  }
  if (details.includes('exposed_btn')) {
    for (let y = waistTopY + waistBandH + 12; y < hemY - 10; y += 22) {
      layers += `<circle cx="${cx}" cy="${y}" r="2.8" fill="#FFE45E" stroke="${stroke}" stroke-width="1.3"/>`;
    }
  }
  if (details.includes('cargo')) {
    const pCol = isTwoTone ? c2 : '#C7F464';
    layers += `<rect x="${cx + 14}" y="${waistTopY + waistBandH + 22}" width="22" height="26" rx="3" fill="${pCol}" stroke="${stroke}" stroke-width="1.7"/>`;
  }

  if (cfg.potonganKaki === 'slit') {
    layers += `<line x1="${cx + hemHalf - 16}" y1="${hemY - 42}" x2="${cx + hemHalf - 16}" y2="${hemY}" stroke="#FF4FA3" stroke-width="3"/>`;
  }

  if (showGuides) {
    layers += `<line x1="${cx - hemHalf - 10}" y1="${hemY - 4}" x2="${cx + hemHalf + 10}" y2="${hemY - 4}" stroke="#FF4FA3" stroke-width="2" stroke-dasharray="6 4"/>`;
  }

  return `<svg viewBox="0 0 280 330" role="img" aria-label="Ilustrasi Pola Rok" xmlns="http://www.w3.org/2000/svg">${defs}${layers}</svg>`;
}

export const GarmentSVGEngine = {
  renderSVG(catId, cfg, initialCfg = null, showGuides = true) {
    const uid = ++uidCounter;
    const meta = getCategoryMeta(catId);
    const c1 = cfg.primaryColor || '#FFFFFF';
    const c2 = cfg.twoTone && cfg.secondaryColor ? cfg.secondaryColor : c1;
    const isTwoTone = Boolean(cfg.twoTone);
    const pattern = cfg.twoTonePattern || (meta.group.startsWith('bottom') ? 'left_right' : 'sleeves_collar');

    if (meta.group === 'bottom_pants') {
      return renderPantsSVG(uid, catId, cfg, initialCfg, showGuides, c1, c2, isTwoTone, pattern);
    }
    if (meta.group === 'bottom_skirt') {
      return renderSkirtSVG(uid, cfg, showGuides, c1, c2, isTwoTone, pattern);
    }
    return renderTopOrDressSVG(uid, catId, meta.group, cfg, initialCfg, showGuides, c1, c2, isTwoTone, pattern);
  }
};
