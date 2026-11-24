import { useEffect, useRef, type ReactNode } from 'react';
import { domainById, type DomainId } from '../content';
import { Icon } from './Icon';

export function DomainChip({ domain, short }: { domain: DomainId; short?: boolean }) {
  const d = domainById(domain);
  return (
    <span className="chip" data-domain={domain}>
      {short ? `D${domain}` : `Domain ${domain} · ${d.short}`}
    </span>
  );
}

export function Bar({ value, domain, large, label }: { value: number; domain?: DomainId; large?: boolean; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`bar${large ? ' lg' : ''}`} data-domain={domain} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)}>
      <i style={{ ['--w' as string]: `${v}%` }} />
    </div>
  );
}

export function Ring({ value, size = 84, label, sub, domain }: { value: number; size?: number; label?: string; sub?: string; domain?: DomainId }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="ring" style={{ ['--size' as string]: `${size}px` }} data-domain={domain} role="img" aria-label={`${sub ?? 'Progress'}: ${label ?? `${Math.round(v)}%`}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="track" cx="50" cy="50" r={r} />
        <circle className="val" cx="50" cy="50" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} />
      </svg>
      <div className="label" aria-hidden="true">
        <span>
          {label ?? `${Math.round(v)}%`}
          {sub && <small>{sub}</small>}
        </span>
      </div>
    </div>
  );
}

export function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="ext" href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <Icon name="ext" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Native <dialog> gives us focus trapping, Escape-to-close, and a backdrop for free. */
export function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = 'Cancel', danger, onConfirm, onCancel }: ConfirmProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" onCancel={(e) => { e.preventDefault(); onCancel(); }} aria-labelledby="dlg-title">
      <h3 id="dlg-title">{title}</h3>
      <div className="muted">{children}</div>
      <div className="btn-row">
        <button type="button" className="btn secondary" onClick={onCancel}>{cancelLabel}</button>
        <button type="button" className={`btn${danger ? ' danger' : ''}`} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}

export function Empty({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{children}</p>
      {action && <div className="btn-row" style={{ justifyContent: 'center', marginTop: 16 }}>{action}</div>}
    </div>
  );
}
