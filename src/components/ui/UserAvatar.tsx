import React from "react";

interface UserAvatarProps {
  name?: string | null;
  className?: string;
}

export function UserAvatar({ name, className = "" }: UserAvatarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  
  // simple hash to generate a background color based on name
  let hash = 0;
  if (name) {
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  const color = `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
  
  return (
    <div 
      className={`flex items-center justify-center font-bold text-white rounded-full ${className}`}
      style={{ backgroundColor: color }}
      title={name || "User"}
    >
      {initial}
    </div>
  );
}
