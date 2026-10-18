// Draw at the book's physical aspect ratio so letters are never stretched.
export function drawSpineTitle(ctx, title, width, height) {
  const text = title.trim().replace(/\s+/g, ' ');
  const maxWidth = height * .68;
  const maxHeight = width - 56;
  const wrap = value => {
    const lines = [];
    let line = '';
    for (const word of value.split(' ')) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) { line = candidate; continue; }
      if (line) { lines.push(line); line = ''; }
      for (const character of word) {
        if (line && ctx.measureText(line + character).width > maxWidth) {
          lines.push(line); line = '';
        }
        line += character;
      }
    }
    if (line) lines.push(line);
    return lines;
  };
  let fontSize = 96, lines;
  // Bound work for oversized names; the reader and hover preview retain the full title.
  const excerpt = Array.from(text).slice(0, 200).join('');
  for (; fontSize >= 64; fontSize -= 4) {
    ctx.font = `700 ${fontSize}px Arial, sans-serif`;
    lines = wrap(excerpt);
    if (lines.length * fontSize * 1.1 <= maxHeight || fontSize === 64) break;
  }
  const maxLines = Math.max(1, Math.floor(maxHeight / (fontSize * 1.1)));
  if (lines.length > maxLines || excerpt.length < text.length) {
    lines = lines.slice(0, maxLines);
    let last = lines.at(-1) || '';
    while (ctx.measureText(`${last}…`).width > maxWidth) last = Array.from(last).slice(0, -1).join('');
    lines[lines.length - 1] = `${last.trimEnd()}…`;
  }
  // Leave the background transparent so the cover's color, grain, and lighting show through.
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#fff5df';
  ctx.strokeStyle = '#243027';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, index) => {
    const y = (index - (lines.length - 1) / 2) * fontSize * 1.1;
    ctx.strokeText(line, 0, y);
    ctx.fillText(line, 0, y);
  });
  ctx.restore();
}
