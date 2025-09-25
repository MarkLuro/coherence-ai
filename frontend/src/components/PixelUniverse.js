import React, { useState, useEffect, useRef, useCallback } from 'react';
import useWebSocket from '../hooks/useWebSocket';

const PixelUniverse = () => {
  const [singularities, setSingularities] = useState([]);
  const [time, setTime] = useState(0);
  const [params, setParams] = useState({
    genesisRate: 0.1,
    decayRate: 0.05,
    dynamicsEnabled: true,
  });
  const [dragging, setDragging] = useState(null);
  const canvasRef = useRef(null);

  const { sendMessage, lastMessage } = useWebSocket('ws://localhost:8080');

  // ✅ Solo actualizar estado si los datos realmente cambian
  useEffect(() => {
    if (lastMessage?.type === 'universe_state') {
      const newSingularities = lastMessage.singularities;
      const newTime = lastMessage.time;

      setSingularities((prev) => {
        if (prev.length !== newSingularities.length) return newSingularities;
        for (let i = 0; i < prev.length; i++) {
          const a = prev[i];
          const b = newSingularities[i];
          if (a.id !== b.id || a.x !== b.x || a.y !== b.y) return newSingularities;
        }
        return prev; // No cambio
      });

      setTime((prevTime) => (prevTime !== newTime ? newTime : prevTime));
    }
  }, [lastMessage]);

  // 🎨 Campo potencial (canvas)
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    let frameId;

    const render = () => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % width;
        const y = Math.floor((i / 4) / width);
        let influence = 0;

        for (const s of singularities) {
          const dx = x - s.x;
          const dy = y - s.y;
          const rotX = dx * Math.cos(time) - dy * Math.sin(time);
          const rotY = dx * Math.sin(time) + dy * Math.cos(time);
          influence += 4000 / (rotX * rotX + rotY * rotY + 1);
        }

        const color = 255 * (1 - Math.min(1.0, influence));
        data[i] = data[i + 1] = data[i + 2] = color;
        data[i + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [singularities, time]);

  // ⚙️ Parámetros físicos
  const handleParamChange = useCallback(
    (key, value) => {
      setParams((prevParams) => {
        const newParams = { ...prevParams, [key]: value };
        sendMessage({ type: 'set_parameters', parameters: newParams });
        return newParams;
      });
    },
    [sendMessage]
  );

  // 🖱️ Interacción con singularidades
  const handleMouseDown = (e, singularity) => {
    setDragging({
      id: singularity.id,
      offset: { x: e.clientX - singularity.x, y: e.clientY - singularity.y },
    });
  };

  const handleMouseUp = () => {
    if (dragging) {
      const s = singularities.find((s) => s.id === dragging.id);
      if (s) {
        sendMessage({ type: 'move_singularity', id: s.id, x: s.x, y: s.y });
      }
      setDragging(null);
    }
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      setSingularities((prev) =>
        prev.map((s) =>
          s.id === dragging.id
            ? {
                ...s,
                x: e.clientX - dragging.offset.x,
                y: e.clientY - dragging.offset.y,
              }
            : s
        )
      );
    }
  };

  const handleRemove = (e, id) => {
    e.preventDefault();
    sendMessage({ type: 'remove_singularity', id });
  };

  const handleAdd = (e) => {
    if (e.target.id !== 'universe-canvas-container') return;
    sendMessage({ type: 'add_singularity', x: e.clientX, y: e.clientY });
  };

  // 🧠 Render
  return (
    <div className="pixel-universe" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <div className="control-panel">
        <h2>Panel del Demiurgo</h2>

        <label>
          Génesis:
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={params.genesisRate}
            onChange={(e) => handleParamChange('genesisRate', parseFloat(e.target.value))}
          />{' '}
          {params.genesisRate.toFixed(2)}
        </label>

        <label>
          Entropía:
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={params.decayRate}
            onChange={(e) => handleParamChange('decayRate', parseFloat(e.target.value))}
          />{' '}
          {params.decayRate.toFixed(2)}
        </label>

        <label>
          Dinámica:
          <input
            type="checkbox"
            checked={params.dynamicsEnabled}
            onChange={(e) => handleParamChange('dynamicsEnabled', e.target.checked)}
          />
        </label>
      </div>

      <div
        id="universe-canvas-container"
        className="universe-view"
        onMouseDown={handleAdd}
        style={{ position: 'relative', userSelect: 'none' }}
      >
        <canvas ref={canvasRef} width={1360} height={768} />
        {singularities.map((s) => (
          <div
            key={s.id}
            className="singularity"
            style={{
              position: 'absolute',
              left: s.x,
              top: s.y,
              width: 10,
              height: 10,
              backgroundColor: 'red',
              borderRadius: '50%',
              cursor: 'grab',
            }}
            onMouseDown={(e) => handleMouseDown(e, s)}
            onContextMenu={(e) => handleRemove(e, s.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default PixelUniverse;
