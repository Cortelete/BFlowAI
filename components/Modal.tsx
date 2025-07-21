import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  maxWidth?: string;
}

/**
 * A reusable Modal component with a consistent style.
 * It provides an overlay and a consistent layout for modal content.
 * @param isOpen - Controls if the modal is visible.
 * @param onClose - Function to call when the modal should be closed.
 * @param children - The content to be rendered inside the modal.
 * @param title - The title displayed in the modal's header.
 * @param maxWidth - Optional Tailwind CSS class for max-width (e.g., 'max-w-lg').
 */
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm" 
        onClick={onClose} 
        aria-modal="true" 
        role="dialog"
    >
      <div 
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full ${maxWidth} m-4 p-6 transform transition-all duration-300 scale-100`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
            <h3 className="text-2xl font-serif font-bold text-gray-800 dark:text-white" id="modal-title">{title}</h3>
            <button 
                onClick={onClose} 
                className="text-gray-500 hover:text-gray-800 dark:hover:text-white text-3xl leading-none" 
                aria-label="Fechar"
            >&times;</button>
        </div>
        <div aria-describedby="modal-title">
            {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;