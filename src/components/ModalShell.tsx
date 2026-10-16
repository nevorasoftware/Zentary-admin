import React, { useRef } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';

interface ModalShellProps {
  onClose: () => void;
  labelledBy: string;
  className: string;
  children: React.ReactNode;
}

// Fondo del modal con semántica y teclado accesibles (ver useModalA11y).
export const ModalShell: React.FC<ModalShellProps> = ({ onClose, labelledBy, className, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  useModalA11y(ref, onClose);
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1} className={`${className} focus:outline-none`}>
      {children}
    </div>
  );
};

export default ModalShell;
