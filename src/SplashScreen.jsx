import { useEffect, useState } from "react";
import logo from "./assets/videologo.png"; // apni image

export default function SplashScreen({ onFinish }) {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setHide(true);
    }, 2200);

    const timer2 = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900 via-red  -900 to-black transition-opacity duration-700 ${
        hide ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center">
        <img
          src={logo}
          alt="Logo"
          className="h-36 w-36 animate-bounce drop-shadow-2xl"
        />

        <h1 className="mt-6 text-3xl font-bold text-white tracking-widest animate-pulse">
          Video Call
        </h1>

        <div className="mt-8 h-2 w-52 overflow-hidden rounded-full bg-white/20">
          <div className="h-full w-full animate-[loading_2.5s_linear] rounded-full bg-blue-500"></div>
        </div>
      </div>
    </div>
  );
}