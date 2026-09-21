export function paintFrameBox(g, W, H, frame){
  if(!frame) return;
  const drawRect = (cfg) => {
    if(!cfg) return;
    g.strokeStyle = cfg.color || 'rgba(212,170,90,.75)';
    g.lineWidth   = cfg.width || 3;
    const i = cfg.inset != null ? cfg.inset : 58;
    g.strokeRect(i, i, W - i*2, H - i*2);
  };
  drawRect(frame.outer);
  drawRect(frame.inner);
  if(frame.corners && frame.corners.enabled !== false){
    const c       = frame.corners;
    const color   = c.color || 'rgba(224,183,105,.85)';
    const width   = c.width || 3;
    const size    = c.size  || 78;
    const inset   = (frame.outer && frame.outer.inset) || 58;
    const positions = [
      [inset,     inset,      1,  1],
      [W - inset, inset,     -1,  1],
      [inset,     H - inset,  1, -1],
      [W - inset, H - inset, -1, -1]
    ];
    g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round';
    positions.forEach(([x, y, sx, sy]) => {
      g.save(); g.translate(x, y); g.scale(sx, sy);
      g.beginPath(); g.moveTo(0, size); g.quadraticCurveTo(0, 0, size, 0); g.stroke();
      g.beginPath();
      g.moveTo(size*0.154, size*0.692);
      g.quadraticCurveTo(size*0.179, size*0.308, size*0.692, size*0.154);
      g.stroke();
      g.beginPath(); g.arc(size*0.385, size*0.385, size*0.064, 0, 7); g.stroke();
      g.restore();
    });
  }
}