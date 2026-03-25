import Lottie from "lottie-react";
import animationData from "./loader.json";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-[9999]">
      <div style={{ width: 250 }}>
        <Lottie animationData={animationData} loop={false} />
      </div>
    </div>
  );
}