import ElectronNavbar from './app/components/navbar/navbar'
import './App.css'
import {MediaPlayerBar} from './app/components/player-controls/player-controls'
import {useState} from "react";

function App() {
  const [filePath, setFilePath] = useState<string[]>([]);

  const handleOpenFile = async () => {
    const files = await window.electronAPI.openFile();
    console.log('Frontend recibió:', files);
    if (files) {
      setFilePath(files);
    }
  }

  return (
    <div className=' text-white p-0'>
      <ElectronNavbar/>
      <div>
        <h1>Mi Reproductor de Pulso</h1>
        <button onClick={handleOpenFile}>Cargar Música</button>
        <h3>Playlist:</h3>
        <ul>
          {filePath.map((path) => (
            <li key={path}>{path}</li>
          ))}
        </ul>
      </div>
      <MediaPlayerBar/>
      {/* Aquí puedes agregar más componentes o contenido de tu aplicación */}
    </div>
  )
}

export default App
