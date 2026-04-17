import React from "react";
import { User } from "lucide-react";
import { cn } from "../../lib/utils";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  fallbackClassName?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = "md",
  className,
  fallbackClassName,
}) => {
  const [imageError, setImageError] = React.useState(false);

  const sizes = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
    "2xl": "w-24 h-24 text-3xl",
  };

  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
    "2xl": "w-12 h-12",
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const baseStyles =
    "relative inline-flex items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 text-white font-semibold flex-shrink-0";

  if (src && !imageError) {
    return (
      <div className={cn(baseStyles, sizes[size], className)}>
        <img
          src={src}
          alt={alt || name || "Avatar"}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  if (name) {
    return (
      <div
        className={cn(baseStyles, sizes[size], fallbackClassName, className)}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseStyles,
        sizes[size],
        "bg-gray-300 text-gray-600",
        fallbackClassName,
        className,
      )}
    >
      <User className={iconSizes[size]} />
    </div>
  );
};

Avatar.displayName = "Avatar";
