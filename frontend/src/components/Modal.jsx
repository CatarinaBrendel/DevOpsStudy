import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function Modal({ isOpen, onClose, children, closeOnOverlayClick = true }) {
  const dialogRef = useRef(null);

  // Focus + body scroll lock: only when isOpen flips to true
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // focus only if no child is focused
    if (dialogRef.current && !dialogRef.current.contains(document.activeElement)) {
      // optional: focus first focusable element instead of container
      dialogRef.current.focus();
    }

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Esc handler: can depend on onClose without refocusing
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) onClose?.();
  };

  return createPortal(
    <div className="dd-modalOverlay" onClick={handleOverlayClick} aria-hidden="true">
      <div
        className="dd-modal"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
