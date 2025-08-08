import ElectronNavbar from './app/components/navbar/navbar'
import './App.css'
import { MediaPlayerBar } from './app/components/player-controls/player-controls'

function App() {

  return (
    <div className=' text-white p-0'>
      <ElectronNavbar /> 
      <MediaPlayerBar />
      {/* Aquí puedes agregar más componentes o contenido de tu aplicación */}
    </div>
  )
}

export default App
