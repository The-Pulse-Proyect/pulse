import logo from "../../assets/logo.png"
type Props = {
  open: boolean
  onClose: () => void
  version?: string
}

const Logo = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="64" height="64" rx="12" fill="#0D1B2A" />
    <path
      d="M10 32h6l3-8 4 16 4-24 5 32 3-12 2 4h7"
      stroke="#FF7F11"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);



export default function VersionDialog({ open, onClose, version }: Props) {
  if (!open) return null

  const appVersion = version ?? (import.meta.env.VITE_APP_VERSION as string) ?? '0.0.1 beta'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog">
      <div className="w-[360px] bg-slate-800 rounded-xl shadow-xl p-6 flex flex-col items-center relative">
        <button onClick={onClose} aria-label="Cerrar" className="absolute top-3 right-3 text-white/60 hover:text-white">✕</button>

        <img src={logo} alt="Pulse logo" className="w-20 h-20 object-contain mt-2" />

        <div className="mt-6 text-center">
          <div className="text-3xl font-semibold text-accent">{appVersion}</div>
        </div>
      </div>
    </div>
  )
}