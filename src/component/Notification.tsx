import React from "react";
import { createPortal } from "react-dom";

interface NotificationProps {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ type, message, onClose }) => {
  return createPortal(
    <div
      className={`fixed bottom-4 right-4 z-[1001] max-w-md rounded-xl p-4 shadow-lg transition-all duration-300 ${
        type === "success" ? "bg-green-500/95 text-white" : "bg-red-500/95 text-white"
      }`}
    >
      <div className="flex items-start gap-3">
        {type === "success" ? (
          <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <div className="flex-1">
          <p className="font-semibold">{type === "success" ? "Berhasil!" : "Gagal!"}</p>
          <p className="text-sm mt-1">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white/80 hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
};

export default Notification;