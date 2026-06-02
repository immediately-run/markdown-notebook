/* Renders an inline SVG icon from the shared Lucide-style path set. Kept tiny and
   dependency-free; the same path data backs icons inside markdown-rendered HTML. */
import type { CSSProperties } from 'react';
import { ICON_PATHS } from '../lib/icons';

interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

export default function Icon({ name, size = 16, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <span className={'ic' + (className ? ' ' + className : '')} style={{ display: 'inline-flex', ...style }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] || '' }}
      />
    </span>
  );
}
