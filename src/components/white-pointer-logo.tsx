"use client";

interface WhitePointerLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function WhitePointerLogo({ className = "", size = "md" }: WhitePointerLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-12 h-12"
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Shark body */}
        <path
          d="M15 50C15 35 25 20 40 15C55 10 70 15 80 25C85 30 88 40 85 50C88 60 85 70 80 75C70 85 55 90 40 85C25 80 15 65 15 50Z"
          fill="currentColor"
          opacity="0.9"
        />
        
        {/* Shark fin */}
        <path
          d="M45 15C50 10 55 8 60 12C58 18 55 20 50 22L45 15Z"
          fill="currentColor"
        />
        
        {/* Tail fin */}
        <path
          d="M15 45C10 40 8 35 12 30C18 32 20 35 22 40L15 45Z"
          fill="currentColor"
        />
        
        {/* Bottom fin */}
        <path
          d="M40 80C35 85 30 87 25 83C27 77 30 75 35 73L40 80Z"
          fill="currentColor"
        />
        
        {/* Eye */}
        <circle
          cx="65"
          cy="40"
          r="3"
          fill="white"
        />
        <circle
          cx="66"
          cy="39"
          r="1.5"
          fill="currentColor"
        />
        
        {/* Teeth/mouth detail */}
        <path
          d="M75 48L82 50L75 52Z"
          fill="white"
          opacity="0.8"
        />
        <path
          d="M77 52L84 54L77 56Z"
          fill="white"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}