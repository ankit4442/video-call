import { useEffect, useState } from "react";
import logo from "/videologo.png";

export default function SplashScreen({ onFinish }) {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setHide(true), 2600);
    const timer2 = setTimeout(() => onFinish(), 3300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden bg-[#050816] transition-all duration-700 ${
        hide ? "opacity-0 scale-110" : "opacity-100 scale-100"
      }`}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2563eb30,transparent_45%),radial-gradient(circle_at_bottom_right,#7c3aed25,transparent_45%)]" />

      {/* Floating Glow */}
      <div className="absolute left-10 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-[120px] animate-pulse"></div>

      <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-purple-500/20 blur-[120px] animate-pulse"></div>

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:45px_45px]" />

      <div className="relative flex h-full flex-col items-center justify-center">

        {/* Ripple */}
        <div className="absolute h-52 w-52 rounded-full border border-cyan-400/20 animate-ping"></div>

        <div className="absolute h-64 w-64 rounded-full border border-blue-500/10 animate-pulse"></div>

        {/* Glass Card */}
        <div className="rounded-[40px] border border-white/10 bg-white/5 px-14 py-12 backdrop-blur-xl shadow-[0_0_80px_rgba(37,99,235,.25)]">

          <img
            src={logo}
            alt="logo"
            className="mx-auto h-36 w-36 animate-[pulse_2.5s_ease-in-out_infinite] drop-shadow-[0_0_35px_rgba(59,130,246,.8)]"
          />

          <h1 className="mt-8 text-center text-5xl font-black tracking-[8px] text-white">
            CONNECT
          </h1>

          <p className="mt-3 text-center text-gray-300 tracking-[4px]">
            HD VIDEO CALLING
          </p>

          <div className="mt-10 h-2 w-72 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full animate-[loading_3s_linear] rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"></div>
          </div>

          <p className="mt-4 text-center text-xs tracking-[5px] text-gray-400">
            CONNECTING...
          </p>
        </div>
      </div>

      <style>{`
        @keyframes loading{
          from{transform:translateX(-100%)}
          to{transform:translateX(100%)}
        }
      `}</style>
    </div>
  );
}
