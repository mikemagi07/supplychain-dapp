import { useEffect } from "react";

type ErrorModalProps = {
  message: string;
  onClose: () => void;
  type?: "error" | "success" | "info";
};

export default function ErrorModal({ message, onClose, type = "error" }: ErrorModalProps) {
  useEffect(() => {
    // Auto-close after 5 seconds for success messages
    if (type === "success") {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  const bgColor = type === "error" ? "bg-red-600" : type === "success" ? "bg-green-600" : "bg-blue-600";
  const borderColor = type === "error" ? "border-red-500" : type === "success" ? "border-green-500" : "border-blue-500";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-gray-800 ${borderColor} border-2 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`${bgColor} rounded-full p-2`}>
              {type === "error" && (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {type === "success" && (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {type === "info" && (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h3 className={`text-lg font-semibold ${
              type === "error" ? "text-red-200" : type === "success" ? "text-green-200" : "text-blue-200"
            }`}>
              {type === "error" ? "Error" : type === "success" ? "Success" : "Information"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-gray-200 text-sm mb-4 whitespace-pre-wrap">{message}</p>
        <button
          onClick={onClose}
          className={`w-full ${bgColor} hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg transition-opacity`}
        >
          OK
        </button>
      </div>
    </div>
  );
}

