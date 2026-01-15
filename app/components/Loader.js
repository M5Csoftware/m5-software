"use client";

export default function LoaderAnimation({ show }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="loader"></div>
    </div>
  );
}
