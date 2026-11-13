import type { SavedBean } from './types';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawEspressoBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const bgGrad = ctx.createRadialGradient(width / 2, 0, 50, width / 2, height / 2, width);
  bgGrad.addColorStop(0, '#2a1d18');
  bgGrad.addColorStop(0.55, '#1a110e');
  bgGrad.addColorStop(1, '#0f0a08');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle border frame
  ctx.strokeStyle = '#3E2C22';
  ctx.lineWidth = 6;
  drawRoundedRect(ctx, 28, 28, width - 56, height - 56, 36);
  ctx.stroke();

  // Warm copper glow accent
  const glow = ctx.createRadialGradient(width * 0.85, height * 0.15, 10, width * 0.85, height * 0.15, 320);
  glow.addColorStop(0, 'rgba(198, 124, 78, 0.22)');
  glow.addColorStop(1, 'rgba(198, 124, 78, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

function canvasToPngFile(canvas: HTMLCanvasElement, filename: string): Promise<File | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null);
        return;
      }
      resolve(new File([blob], filename, { type: 'image/png' }));
    }, 'image/png');
  });
}

export async function generatePassportShareImage(params: {
  userName?: string | null;
  totalBeans: number;
  uniqueRoasters: number;
}): Promise<File | null> {
  if (typeof document === 'undefined') return null;

  const width = 1080;
  const height = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  drawEspressoBackground(ctx, width, height);

  ctx.textAlign = 'center';
  ctx.direction = 'rtl';

  // Brand pill
  ctx.fillStyle = 'rgba(198, 124, 78, 0.16)';
  drawRoundedRect(ctx, width / 2 - 170, 96, 340, 60, 30);
  ctx.fill();
  ctx.strokeStyle = 'rgba(198, 124, 78, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#E6D2B5';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('☕ Barista Mate', width / 2, 136);

  // Title
  ctx.fillStyle = '#E6D2B5';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('מדד הקפאין שלי', width / 2, 260);

  ctx.fillStyle = '#C67C4E';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(params.userName || 'בריסטה ביתי', width / 2, 325);

  // Two stat cards
  const cardW = 410;
  const cardH = 290;
  const gap = 44;
  const startX = (width - (cardW * 2 + gap)) / 2;
  const cardY = 420;

  const stats = [
    { label: 'פולים באוסף', value: String(params.totalBeans) },
    { label: 'בתי קלייה', value: String(params.uniqueRoasters) },
  ];

  stats.forEach((stat, idx) => {
    const x = startX + idx * (cardW + gap);
    ctx.fillStyle = '#1F1712';
    drawRoundedRect(ctx, x, cardY, cardW, cardH, 28);
    ctx.fill();
    ctx.strokeStyle = '#3E2C22';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#C67C4E';
    ctx.font = 'bold 104px sans-serif';
    ctx.fillText(stat.value, x + cardW / 2, cardY + 150);

    ctx.fillStyle = '#EAE0D5';
    ctx.font = '600 32px sans-serif';
    ctx.fillText(stat.label, x + cardW / 2, cardY + 230);
  });

  // Footer CTA
  ctx.fillStyle = 'rgba(234, 224, 213, 0.65)';
  ctx.font = '500 28px sans-serif';
  ctx.fillText('בואו לנהל את אוסף הקפה והכיול שלכם', width / 2, 870);

  ctx.fillStyle = '#C67C4E';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('barista-mate.vercel.app', width / 2, 925);

  return canvasToPngFile(canvas, 'barista-mate-passport.png');
}

export async function generateBeanShareImage(bean: SavedBean): Promise<File | null> {
  if (typeof document === 'undefined') return null;

  const width = 1080;
  const height = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  drawEspressoBackground(ctx, width, height);

  ctx.textAlign = 'center';
  ctx.direction = 'rtl';

  ctx.fillStyle = 'rgba(198, 124, 78, 0.16)';
  drawRoundedRect(ctx, width / 2 - 190, 90, 380, 58, 29);
  ctx.fill();
  ctx.strokeStyle = 'rgba(198, 124, 78, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#E6D2B5';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('☕ המלצת קפה · Barista Mate', width / 2, 128);

  // Roaster & Bean
  ctx.fillStyle = '#C67C4E';
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText(bean.roasterName || '', width / 2, 245);

  ctx.fillStyle = '#E6D2B5';
  ctx.font = 'bold 62px sans-serif';
  ctx.fillText(bean.beanName || '', width / 2, 330);

  // Info Card
  ctx.fillStyle = '#1F1712';
  drawRoundedRect(ctx, 110, 410, width - 220, 360, 32);
  ctx.fill();
  ctx.strokeStyle = '#3E2C22';
  ctx.lineWidth = 3;
  ctx.stroke();

  let currentY = 500;
  if (bean.grindSetting) {
    ctx.fillStyle = '#EAE0D5';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText(`דרגת טחינה: ${bean.grindSetting}`, width / 2, currentY);
    currentY += 76;
  }

  if (bean.roastLevel) {
    const levelDots = '●'.repeat(bean.roastLevel) + '○'.repeat(Math.max(0, 5 - bean.roastLevel));
    ctx.fillStyle = '#C67C4E';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(`דרגת קלייה: ${levelDots} (${bean.roastLevel}/5)`, width / 2, currentY);
    currentY += 76;
  }

  if (bean.flavorTags && bean.flavorTags.length > 0) {
    ctx.fillStyle = '#E6D2B5';
    ctx.font = '500 30px sans-serif';
    ctx.fillText(`טעמים: ${bean.flavorTags.slice(0, 5).join(' · ')}`, width / 2, currentY);
  }

  ctx.fillStyle = 'rgba(234, 224, 213, 0.65)';
  ctx.font = '500 28px sans-serif';
  ctx.fillText('סרוק או פתח את הקישור להוספה לספרייה שלך', width / 2, 875);

  ctx.fillStyle = '#C67C4E';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('barista-mate.vercel.app', width / 2, 930);

  return canvasToPngFile(canvas, 'barista-mate-bean.png');
}

export function buildBeanShareUrl(bean: Pick<SavedBean, 'roasterName' | 'beanName' | 'roastLevel' | 'grindSetting' | 'flavorTags'>): string {
  const params = new URLSearchParams();
  if (bean.roasterName) params.set('roaster', bean.roasterName);
  if (bean.beanName) params.set('bean', bean.beanName);
  if (bean.roastLevel) params.set('roast', String(bean.roastLevel));
  if (bean.grindSetting) params.set('grind', bean.grindSetting);
  if (bean.flavorTags && bean.flavorTags.length > 0) {
    params.set('flavors', bean.flavorTags.join(','));
  }
  return `https://barista-mate.vercel.app/share?${params.toString()}`;
}

export async function shareImageOrDownload(
  file: File | null,
  fallbackText: string,
  title: string,
  url?: string
): Promise<'shared' | 'downloaded' | 'copied'> {
  if (file && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title,
      text: fallbackText,
      url,
      files: [file],
    });
    return 'shared';
  }

  if (file && typeof document !== 'undefined') {
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
    return 'downloaded';
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(fallbackText);
  }
  return 'copied';
}
