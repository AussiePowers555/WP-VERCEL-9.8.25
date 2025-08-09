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
        viewBox="0 0 120 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Great White Shark Silhouette - Side Profile */}
        <path
          d="M5 40
             C5 35 8 30 12 28
             L20 25
             C25 23 30 22 35 22
             L50 20
             C60 18 70 20 80 25
             C90 30 95 35 98 40
             C100 42 102 44 103 46
             L105 48
             C106 49 106 51 105 52
             L100 55
             C95 58 90 60 85 61
             L75 62
             C70 63 65 64 60 65
             L50 66
             C45 67 40 67 35 66
             L25 64
             C20 62 15 58 12 54
             C8 50 5 45 5 40Z"
          fill="currentColor"
        />
        
        {/* Dorsal Fin - Large and menacing */}
        <path
          d="M65 20
             C68 15 72 12 76 15
             C78 17 79 20 78 23
             L75 28
             C73 30 70 32 67 33
             L65 34
             C63 32 62 28 63 24
             L65 20Z"
          fill="currentColor"
        />
        
        {/* Tail Fin - Powerful crescent shape */}
        <path
          d="M5 40
             L2 35
             C1 32 2 28 5 27
             C8 26 11 28 12 31
             L15 37
             C16 39 15 42 13 43
             L8 44
             C6 43 5 42 5 40Z
             
             M8 44
             C6 46 4 48 3 51
             C2 54 4 57 7 57
             C10 57 12 55 13 52
             L14 48
             C14 46 13 45 12 44
             L8 44Z"
          fill="currentColor"
        />
        
        {/* Pectoral Fins */}
        <path
          d="M45 50
             C42 55 40 60 41 63
             C42 65 45 66 47 65
             L52 62
             C54 60 55 57 54 54
             L52 50
             C50 48 47 48 45 50Z"
          fill="currentColor"
        />
        
        {/* Bottom/Anal Fin */}
        <path
          d="M70 62
             C67 65 66 68 68 70
             C70 71 73 70 75 68
             L78 65
             C79 63 78 61 76 60
             L70 62Z"
          fill="currentColor"
        />
        
        {/* Eye - Small and menacing */}
        <circle
          cx="85"
          cy="35"
          r="2"
          fill="rgba(255,255,255,0.3)"
        />
        
        {/* Gills - Menacing detail lines */}
        <path
          d="M75 45 L77 50 M79 44 L81 49 M83 43 L85 48"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="0.5"
          fill="none"
        />
        
        {/* Mouth/Jaw line - Subtle but menacing */}
        <path
          d="M95 45
             C97 46 99 47 100 48
             C99 49 97 50 95 49
             C93 48 92 47 93 46
             L95 45Z"
          fill="rgba(0,0,0,0.15)"
        />
      </svg>
    </div>
  );
}