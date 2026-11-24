import { ZOOMS } from '../../data/lab.js';

const TONE = { bad: 'var(--dot-red)', good: 'var(--dot-green)', warn: 'var(--dot-yellow)', info: 'var(--accent)', plain: 'rgba(255,255,255,.9)' };

/**
 * Overhead camera frame with detection boxes.
 * overlays: [{ box, tone, label, place: 'top'|'bottom'|'right', dashed, fill }]
 */
export function CameraView({ src, alt, overlays = [], live = true, time, flash }) {
  return (
    <figure className={`camera${flash ? ' camera-flash' : ''}`} key={flash}>
      <img src={src} alt={alt} />
      {overlays.map(({ box, tone = 'plain', label, place = 'top', dashed, fill }, i) => {
        const color = TONE[tone];
        const pos = place === 'right'
          ? { left: `calc(${box.left + box.width}% + 6px)`, top: `calc(${box.top + box.height / 2}% - 10px)` }
          : place === 'bottom'
            ? { left: `${box.left}%`, top: `calc(${box.top + box.height}% + 4px)` }
            : box.top < 12
              ? { left: `calc(${box.left}% + 4px)`, top: `calc(${box.top}% + 4px)` } // no room above: tuck inside
              : { left: `${box.left}%`, top: `calc(${box.top}% - 24px)` };
        return (
          <span key={i}>
            <span className="cam-box" style={{ left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%`, borderColor: color, borderStyle: dashed ? 'dashed' : 'solid', background: fill }} />
            {label && <span className="cam-label" style={pos}><span className="tag-dot" style={{ background: color }} />{label}</span>}
          </span>
        );
      })}
      {live && <span className="cam-live"><span />Live{time ? ` · ${time}` : ''}</span>}
    </figure>
  );
}

/** A zoomed crop of a camera frame, used as evidence inside chat cards. */
export function ZoomTile({ zoom, label, value, tone = 'neutral' }) {
  const { src, x, y, zoom: s, aspect = 2.5 } = ZOOMS[zoom];
  const left = 50 - x * s;
  const top = 50 - y * s * aspect * 0.6;
  return (
    <figure className={`zoom zoom-${tone}`}>
      <div className="zoom-frame" style={{ aspectRatio: `${aspect} / 1` }}>
        <img src={src} alt="" style={{ left: `${left}%`, top: `${top}%`, width: `${s * 100}%` }} />
      </div>
      {label && <figcaption><span>{label}</span><strong>{value}</strong></figcaption>}
    </figure>
  );
}
