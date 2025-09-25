import React from 'react';
import PixelUniverse from './components/PixelUniverse';
import './styles/App.css'; // Estilos unificados

function App() {
  return (
    <div className="App">
      {/* El Observatorio ahora es el único contenido del Ser. */}
      <PixelUniverse />
    </div>
  );
}

export default App;