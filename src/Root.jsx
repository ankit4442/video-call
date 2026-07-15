import { useState } from "react";
import App from "./App";
import SplashScreen from "./SplashScreen";

export default function Root() {
  const [loading, setLoading] = useState(true);

  return loading ? (
    <SplashScreen onFinish={() => setLoading(false)} />
  ) : (
    <App />
  );
}