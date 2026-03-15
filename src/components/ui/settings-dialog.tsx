import { useEffect, useState } from 'react'
import { useConfigStore } from '@/store/useConfig';
import { Droplet, Speaker, Keyboard, Settings as Gear } from 'lucide-react';
import ErrorDialog from './error-dialog'

type Props = {
  open: boolean
  onClose: () => void
  onApplyTheme?: (themeId: string) => Promise<void> | void
}


export default function SettingsDialog({ open, onClose }: Props) {
  const [section, setSection] = useState<'colors' | 'audio' | 'shortcuts' | 'advanced'>('colors')

  const { appConfig, loadConfig, saveConfig, setAccentColor, updateAppConfig } = useConfigStore();
  const [tmpAccent, setTmpAccent] = useState<string | null>(appConfig?.accentColor || '#ff8a00')
  useEffect(() => { loadConfig(); }, [])
  useEffect(() => {
    if (appConfig?.accentColor) setTmpAccent(appConfig.accentColor || '#ff8a00');
  }, [appConfig?.theme, appConfig?.accentColor]);
  const [error, setError] = useState<string | null>(null)
  const [errorThemeId, setErrorThemeId] = useState<string | null>(null)

  if (!open) return null



  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-[850px] h-[520px] bg-slate-800 rounded-xl shadow-xl overflow-hidden flex">
          {/* Sidebar */}
          <nav className="w-48 bg-slate-900/70 p-4 flex flex-col gap-2">
            <button onClick={() => setSection('colors')} className={`text-left px-3 py-2 rounded flex items-center gap-2 ${section==='colors' ? 'bg-accent text-white' : 'text-white/70 hover:bg-slate-800'}`} style={section==='colors' ? { backgroundColor: 'var(--color-accent)' } : undefined}><Droplet className="w-4 h-4" /> <span>Colores</span></button>
            <button onClick={() => setSection('audio')} className={`text-left px-3 py-2 rounded flex items-center gap-2 ${section==='audio' ? 'bg-accent text-white' : 'text-white/70 hover:bg-slate-800'}`} style={section==='audio' ? { backgroundColor: 'var(--color-accent)' } : undefined}><Speaker className="w-4 h-4" /> <span>Audio</span></button>
            <button onClick={() => setSection('shortcuts')} className={`text-left px-3 py-2 rounded flex items-center gap-2 ${section==='shortcuts' ? 'bg-accent text-white' : 'text-white/70 hover:bg-slate-800'}`} style={section==='shortcuts' ? { backgroundColor: 'var(--color-accent)' } : undefined}><Keyboard className="w-4 h-4" /> <span>Atajos</span></button>
            <button onClick={() => setSection('advanced')} className={`text-left px-3 py-2 rounded flex items-center gap-2 ${section==='advanced' ? 'bg-accent text-white' : 'text-white/70 hover:bg-slate-800'}`} style={section==='advanced' ? { backgroundColor: 'var(--color-accent)' } : undefined}><Gear className="w-4 h-4" /> <span>Avanzado</span></button>
            <div className="mt-auto text-xs text-white/60 px-3">Ajustes</div>
          </nav>

          {/* Content area */}
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Configuración</h3>
              <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
            </div>

            <div className="mt-6 h-[420px] overflow-auto">


              {section === 'colors' && (
                <section>
                  <h4 className="text-white/90 font-medium">Colores</h4>
                  <p className="text-sm text-white/70 mt-2">Personaliza el color acento de la aplicación.</p>
                  <div className="mt-4 grid grid-cols-6 gap-2">
                    {['#ff8a00', '#ff0047', '#00c2ff', '#5bff7a', '#9333ea', '#ffba00', '#10b981', '#ef4444'].map(c => (
                      <button key={c} className={`h-10 rounded-lg ${tmpAccent === c ? 'ring-2 ring-white/40' : ''}`} style={{ background: c }} onClick={() => setTmpAccent(c)} />
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <input type="color" value={tmpAccent || '#ff8a00'} onChange={(e) => setTmpAccent(e.target.value)} className="h-10 w-10 p-0 rounded" />
                    <div className="text-white/80">Color seleccionado: <span className="ml-2 font-medium">{tmpAccent}</span></div>
                  </div>
                  <div className="mt-6 flex gap-3 items-start">
                    <button onClick={() => { setAccentColor(tmpAccent || '#ff8a00'); saveConfig(); }} className="px-4 py-2 rounded text-white" style={{ backgroundColor: 'var(--color-accent)' }}>Aplicar color</button>
                    <button onClick={() => { setTmpAccent(appConfig?.accentColor || '#ff8a00') }} className="px-4 py-2 rounded bg-slate-700 text-white/80">Cancelar</button>
                    <div className="ml-6 p-3 rounded-md bg-slate-800 shadow-sm w-72">
                      <div className="text-sm text-white/80">Vista previa</div>
                      <div className="mt-3 p-2 rounded-md bg-accent text-white flex items-center justify-between" style={{ backgroundColor: 'var(--color-accent)' }}>
                        <div>
                          <div className="text-sm font-medium">Botón</div>
                          <div className="text-xs">Texto de ejemplo</div>
                        </div>
                        <div className="text-xs">🔊</div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {section === 'audio' && (
                <section>
                  <h4 className="text-white/90 font-medium">Audio</h4>
                  <p className="text-sm text-white/70 mt-2">Opciones de reproducción y salida de audio (placeholder).</p>
                </section>
              )}

              {section === 'shortcuts' && (
                <section>
                  <h4 className="text-white/90 font-medium">Atajos</h4>
                  <p className="text-sm text-white/70 mt-2">Configura atajos de teclado (placeholder).</p>
                </section>
              )}

              {section === 'advanced' && (
                <section>
                  <h4 className="text-white/90 font-medium">Avanzado</h4>
                  <p className="text-sm text-white/70 mt-2">Opciones avanzadas y de configuración.</p>
                  <div className="mt-4 flex flex-col gap-3">
                    <label className="flex items-center gap-2 text-white/80">
                      <input type="checkbox" checked={appConfig?.autoPlay} onChange={(e) => updateAppConfig({ autoPlay: e.target.checked })} />
                      <span>Reproducir automáticamente al iniciar</span>
                    </label>
                    <label className="flex items-center gap-2 text-white/80">
                      <input type="checkbox" checked={appConfig?.hardwareAcceleration} onChange={(e) => updateAppConfig({ hardwareAcceleration: e.target.checked })} />
                      <span>Habilitar aceleración por hardware</span>
                    </label>
                    <label className="flex items-center gap-2 text-white/80">
                      <input type="checkbox" checked={appConfig?.autoUpdate} onChange={(e) => updateAppConfig({ autoUpdate: e.target.checked })} />
                      <span>Buscar actualizaciones automáticamente</span>
                    </label>
                    <label className="flex flex-col gap-1 text-white/80">
                      <span>Mensaje de bienvenida</span>
                      <input value={appConfig?.welcomeMessage || ''} onChange={(e) => updateAppConfig({ welcomeMessage: e.target.value })} className="px-3 py-2 rounded bg-slate-700 text-white/80" />
                    </label>
                    <div className="flex gap-2 items-center">
                      <button onClick={() => window.tauriAPI.openConfigFolder()} className="px-3 py-2 rounded bg-slate-700 text-white/80">Abrir carpeta de configuración</button>
                      <button onClick={() => saveConfig()} className="px-3 py-2 rounded text-white" style={{ backgroundColor: 'var(--color-accent)' }}>Guardar</button>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error dialog when theme not found or other errors */}
      <ErrorDialog open={!!error} onClose={() => { setError(null); setErrorThemeId(null) }} message={error ?? ''} themeId={errorThemeId ?? undefined} />
    </>
  )
}