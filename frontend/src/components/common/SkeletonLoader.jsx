import React from "react";

/**
 * AnimatedSkeleton - Enhanced skeleton loader with animation
 * More performant and accessible than simple spinners for loading states
 */
export const AnimatedSkeleton = ({
  className = "h-4 w-full",
  count = 1,
  circle = false,
  inline = false,
}) => {
  const skeletons = Array(count).fill(0);

  return (
    <div className={inline ? "flex gap-3" : "space-y-3"}>
      {skeletons.map((_, i) => (
        <div
          key={i}
          className={`
            bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200
            dark:from-gray-700 dark:via-gray-600 dark:to-gray-700
            animate-pulse
            ${circle ? "rounded-full" : "rounded-md"}
            ${className}
          `}
        />
      ))}
    </div>
  );
};

/**
 * SkeletonLoader - Predefined skeleton patterns for common layouts
 */
export const SkeletonLoader = ({ variant = "card" }) => {
  const variants = {
    card: (
      <div className="p-4 space-y-4">
        <AnimatedSkeleton className="h-8 w-48" />
        <AnimatedSkeleton className="h-4 w-full" count={3} />
      </div>
    ),
    list: (
      <div className="space-y-3">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <AnimatedSkeleton className="h-12 w-12" circle />
              <div className="flex-1 space-y-2">
                <AnimatedSkeleton className="h-4 w-32" />
                <AnimatedSkeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
      </div>
    ),
    table: (
      <div className="space-y-2">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4">
              <AnimatedSkeleton className="h-10 w-full" />
              <AnimatedSkeleton className="h-10 w-full" />
              <AnimatedSkeleton className="h-10 w-full" />
              <AnimatedSkeleton className="h-10 w-full" />
            </div>
          ))}
      </div>
    ),
    profile: (
      <div className="space-y-4">
        <div className="flex gap-4">
          <AnimatedSkeleton className="h-24 w-24" circle />
          <div className="flex-1 space-y-2">
            <AnimatedSkeleton className="h-6 w-40" />
            <AnimatedSkeleton className="h-4 w-48" />
          </div>
        </div>
        <AnimatedSkeleton className="h-4 w-full" count={3} />
      </div>
    ),
  };

  return (
    <div className="w-full animate-fade-in">
      {variants[variant] || variants.card}
    </div>
  );
};
