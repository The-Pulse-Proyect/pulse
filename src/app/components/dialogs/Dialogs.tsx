import MiniMusicPlayer from '@/app/mini-mode/mini-mode'
import VersionDialog from '@/components/ui/version-dialog'
import ErrorDialog from '@/components/ui/error-dialog'
import { useConfigStore } from '@/store/useConfig'
import SettingsDialog from '@/components/ui/settings-dialog'
import { Progress } from '@/components/ui/progress'
import { useLoadStore } from '@/store/useLoad'
import { useMemo } from 'react'

interface DialogsInterface {
    miniMode: boolean
}

export function Dialogs({ miniMode}: DialogsInterface){
    const { isLoad, SongsLoaded, totalSongs } = useLoadStore()
    const { setOpenVersionDialog, openVersionDialog, setOpenErrorDialog, openErrorDialog, errorMessage, errorSong , setOpenSettingsDialog, openSettingsDialog} = useConfigStore()

    const Percent = useMemo(() => {
        let value = 0
        if (!SongsLoaded || !totalSongs) return value
        value = (SongsLoaded / totalSongs) * 100
        return value
    }, [SongsLoaded, totalSongs])

    return (
    <>
        {miniMode &&
        <MiniMusicPlayer></MiniMusicPlayer>
        }
        <VersionDialog open={openVersionDialog} onClose={() => setOpenVersionDialog(false) }></VersionDialog>
        <SettingsDialog open={openSettingsDialog} onClose={() => setOpenSettingsDialog(false) }></SettingsDialog>
        <ErrorDialog open={openErrorDialog} onClose={() => setOpenErrorDialog(false) } message={errorMessage ?? undefined} song={errorSong ?? undefined} />
        
        {isLoad &&
        <div className='w-[300px] h-15 bg-slate-800 rounded-md absolute bottom-5 right-5  z-10000 flex flex-col gap-2 p-2'>
        <h4 className='font-bold'>Añadiendo Canciones: {SongsLoaded}/{totalSongs}</h4>
        <Progress value={Percent}/>
        </div>
        }
    </>
    )
}