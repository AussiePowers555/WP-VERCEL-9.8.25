import React from 'react';

interface SharkIconProps {
  className?: string;
  size?: number;
}

export const SharkIcon: React.FC<SharkIconProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Great White Shark Silhouette - Optimized and Professional */}
      <path
        d="M8,50 
           C8,48 10,42 18,38
           C22,36 28,34 35,33
           C42,32 48,31 54,30
           C62,28 68,25 74,22
           C78,19 82,15 85,11
           C87,8 88,5 87,3
           C86,1 84,0 82,1
           C80,2 78,4 76,7
           C74,10 72,13 69,16
           L65,20
           C60,25 54,30 48,35
           L45,38
           C42,41 40,45 39,48
           C38,49 37,50 38,51
           C39,52 40,54 42,57
           L45,62
           C48,65 52,70 58,75
           C62,78 66,80 70,82
           C74,84 78,85 82,86
           C84,87 86,88 87,90
           C88,92 87,95 85,96
           C82,98 78,96 74,94
           C68,91 62,87 54,84
           C48,82 42,80 35,78
           C28,76 22,74 18,72
           C10,68 8,62 8,50 Z
           
           M28,44 
           C30,42 32,42 34,44
           C32,46 30,46 28,44 Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      
      {/* Dorsal fin */}
      <path
        d="M45,25
           C48,18 52,15 55,18
           C58,21 56,28 52,33
           C50,30 47,28 45,25 Z"
        fill="currentColor"
      />
      
      {/* Pectoral fin */}
      <path
        d="M35,45
           C32,48 28,50 25,48
           C22,46 24,42 28,40
           C30,41 33,43 35,45 Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default SharkIcon;