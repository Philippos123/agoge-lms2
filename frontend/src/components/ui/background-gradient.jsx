import { cn } from "../../lib/utils";
import React from "react";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  animate = true,
}) => {
  return (
    <div className={cn("relative p-[2px] group", containerClassName)}>
      <div
        className={cn(
          "absolute inset-0 rounded-xl overflow-hidden",
          "bg-[linear-gradient(to_right,var(--blue-500)_0%,var(--indigo-500)_50%,var(--blue-500)_100%)]",
          "opacity-20 group-hover:opacity-30 transition-opacity duration-500",
          animate ? "animate-[shimmer_2s_infinite]" : ""
        )}
        style={{
          backgroundSize: "200% 100%",
        }}
      />
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
};