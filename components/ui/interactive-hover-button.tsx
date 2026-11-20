import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  dotColor?: string;
  hoverColor?: string;
  href?: string;
}

const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text = "Button", className, dotColor = "bg-blue-600", hoverColor = "group-hover:bg-blue-600", href, onClick, ...props }, ref) => {
  const content = (
    <>
      <span className="inline-block translate-x-1 font-semibold transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
        {text}
      </span>
      <div className="absolute inset-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 font-semibold text-white opacity-0 transition-all duration-300 group-hover:-translate-x-0 group-hover:opacity-100">
        <span>{text}</span>
        <ArrowRight className="h-4 w-4 shrink-0" />
      </div>
      <div className={cn(
        "absolute left-[16%] top-[42%] h-2 w-2 scale-[1] rounded-full transition-all duration-300 group-hover:left-[0%] group-hover:top-[0%] group-hover:h-full group-hover:w-full group-hover:scale-[1.8]",
        dotColor,
        hoverColor
      )}></div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={cn(
          "group relative inline-flex w-32 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white p-2 text-center text-xs sm:text-sm font-semibold text-slate-800 shadow-xs transition-all duration-300 hover:border-blue-600 hover:shadow-md",
          className,
        )}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "group relative inline-flex w-32 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white p-2 text-center text-xs sm:text-sm font-semibold text-slate-800 shadow-xs transition-all duration-300 hover:border-blue-600 hover:shadow-md",
        className,
      )}
      {...props}
    >
      {content}
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };
