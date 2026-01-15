import { useEffect, useState, useRef } from "react";
import { X, AlertTriangle, Check, Undo2 } from "lucide-react";

const NotificationFlag = ({ type = "success", message, visible, setVisible, onRetry }) => {
  const [progress, setProgress] = useState(100);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const startedRef = useRef(false); // track if timer started

  useEffect(() => {
    if (visible && !startedRef.current) {
      startedRef.current = true;
      setProgress(100);

      intervalRef.current = setInterval(() => {
        setProgress((prev) => Math.max(prev - 2, 0));
      }, 100);

      timerRef.current = setTimeout(() => {
        setVisible(false);
        startedRef.current = false;
      }, 5000);

      return () => {}; // don't clear timers on re-render
    }

    if (!visible) {
      setProgress(100);
      startedRef.current = false;
      clearTimeout(timerRef.current);
      clearInterval(intervalRef.current);
    }
  }, [visible, setVisible]);

  if (!visible) return null;

  const isError = type === "error";

  return (
    <div className="fixed bottom-4 right-4"style={{ zIndex: 9999 }}>
      <div className={`relative shadow-md rounded-md p-4 flex items-center gap-2 ${isError ? "bg-[#FEE2E2]" : "bg-[#ECFDF5]"}`}>
        {isError ? <AlertTriangle className="text-red w-7 h-7 " /> : <Check className="text-green-600 w-7 h-7" />}
        <div className="flex-1 mr-3">
          <p className="font-medium text-eerie-black">{message}</p>
        </div>
        <div className="flex gap-2 items-end justify-center">
          {!isError && onRetry && (
            <button onClick={onRetry} className="hover:text-red">
              <Undo2 className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => setVisible(false)} className="text-gray-700 hover:text-red ">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
          <div
            className={`h-full origin-right transition-all ${isError ? "bg-red" : "bg-green-500"}`}
            style={{ transform: `scaleX(${progress / 100})` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default NotificationFlag;
