import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
  bufferPercent?: number;
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  bufferPercent = 0,
  ...props
}: SliderProps) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "bg-gray-800/50 relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1 hover:bg-gray-700/50 transition-colors"
        )}
      >
        {/* Buffered bar (rendered inside the track to match layout) */}
        <div
          aria-hidden
          className="absolute left-0 top-0 bottom-0 rounded-full bg-gray-300/40 pointer-events-none"
          style={{ width: `${Math.max(0, Math.min(100, bufferPercent))}%` }}
        />
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "bg-accent/90 absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full shadow-sm"
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="border-accent bg-accent ring-accent block size-3 shrink-0 rounded-full border-2 shadow transition-all hover:scale-125 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }