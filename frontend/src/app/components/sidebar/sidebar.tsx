import { useState } from 'react';
import { ChevronRight, ListMusic } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        "flex relative",
        "bg-gray-900/95 border-r border-gray-800",
        "transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-8"
      )}
    >
      {/* Botón de expandir */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "absolute -right-3 top-8",
          "w-6 h-6 bg-orange-500/90 text-slate-900",
          "flex items-center justify-center",
          "hover:bg-orange-400 transition-all",
          "border border-orange-400/20",
          "rounded-full shadow-lg shadow-orange-500/20",
          "hover:scale-105 hover:-translate-x-0.5 active:scale-95",
          "backdrop-blur-sm"
        )}
      >
        <ChevronRight
          className={cn(
            "w-4 h-4 transition-transform duration-300",
            isExpanded ? "rotate-180" : "",
            "stroke-[3]"
          )}
        />
      </button>

      {/* Contenido del sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Encabezado */}
        <div
          className={cn(
            "flex items-center gap-3 p-4 border-b border-gray-800/50",
            "transition-all duration-300"
          )}
        >
          <ListMusic className="w-5 h-5 text-orange-500" />
          <span
            className={cn(
              "text-sm font-semibold text-orange-500 whitespace-nowrap",
              "transition-all duration-300",
              isExpanded ? "opacity-100" : "opacity-0"
            )}
          >
            Playlists
          </span>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col gap-1 p-2">
          {/* Mensaje de "en desarrollo" */}
          <div
            className={cn(
              "flex-1 flex items-center justify-center",
              "text-gray-500 transition-all duration-300",
              isExpanded ? "opacity-100" : "opacity-0"
            )}
          >
            <p className="text-sm font-medium">
              En Desarrollo...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
