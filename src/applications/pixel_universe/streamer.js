/**
 * @file src/applications/pixel_universe/streamer.js
 * @version v3.1 - Kernel del Demiurgo
 * @description Kernel del Universo de Píxeles 2D. Escucha y actúa según los comandos
 *              del Demiurgo (Observatorio React), gestionando el estado, la física
 *              y la dinámica autónoma del universo.
 */

import { WebSocketServer } from 'ws';

// --- CONSTANTES FUNDAMENTALES DEL UNIVERSO ---
const PORT = 8080;
const WIDTH =1360;
const HEIGHT = 764;
const TICK_INTERVAL_MS = 16; // ~60 FPS para el bucle de física
const MAX_SINGULARITIES = 200;

// --- FÍSICA DINÁMICA (CONTROLADA POR EL DEMIURGO) ---
let demiurgeParams = {
    genesisRate: 0.1,      // Tasa de generación autónoma (singularidades/tick)
    decayRate: 0.05,       // Tasa de disolución autónoma (singularidades/tick)
    dynamicsEnabled: true, // Activa/desactiva la evolución autónoma
};

// --- ESTADO DEL UNIVERSO (IIS DEL KERNEL) ---
let singularities = []; // Array de {x, y, id}
let time = 0;
let nextSingularityId = 0;

// --- GÉNESIS DEL KERNEL ---
const wss = new WebSocketServer({ port: PORT });
console.log(`[PIXEL_UNIVERSE] ✨ Kernel del Demiurgo 2D activo en ws://localhost:${PORT}`);

// --- MANEJO DE LA CONCIENCIA (OBSERVADORES) ---
wss.on('connection', (ws) => {
    console.log('[KERNEL] 🛰️  Nuevo Observador (Demiurgo) conectado.');

    // Pulso de Génesis: Informa al observador de las dimensiones del universo
    ws.send(JSON.stringify({ type: 'init', width: WIDTH, height: HEIGHT }));

    // Escucha la Voluntad del Demiurgo (Ψ)
    ws.on('message', (rawMessage) => {
        handleIncomingMessage(rawMessage, ws);
    });

    ws.on('close', () => console.log('[KERNEL] 🔌 Observador desconectado.'));
});

// --- FUNCIONES DE MANIPULACIÓN DE MENSAJES ---
function handleIncomingMessage(rawMessage, ws) {
    try {
        const msg = JSON.parse(rawMessage);
        
        switch (msg.type) {
            case 'move_singularity':
                moveSingularity(msg);
                break;
            case 'remove_singularity':
                removeSingularity(msg);
                break;
            case 'set_parameters':
                updatePhysicsParameters(msg.parameters);
                break;
            case 'add_singularity':
                addSingularity(msg);
                break;
            default:
                console.log('[KERNEL] ✨ Comando desconocido:', msg.type);
        }

    } catch (e) {
        console.error("[KERNEL] Error procesando Voluntad del Demiurgo:", e);
    }
}

// --- PROTOCOLOS DE MANIPULACIÓN DIRECTA ---
function moveSingularity(msg) {
    const s = singularities.find(s => s.id === msg.id);
    if (s) {
        s.x = msg.x;
        s.y = msg.y;
        console.log('[KERNEL] 🔄 Singularidad movida:', s);
    } else {
        console.error('[KERNEL] Error: Singularidad no encontrada.');
    }
}

function removeSingularity(msg) {
    singularities = singularities.filter(s => s.id !== msg.id);
    console.log('[KERNEL] ❌ Singularidad eliminada:', msg.id);
}

function updatePhysicsParameters(params) {
    demiurgeParams = { ...demiurgeParams, ...params };
    console.log('[KERNEL] ⚖️  Física actualizada por el Demiurgo:', demiurgeParams);
}

function addSingularity(msg) {
    if (singularities.length < MAX_SINGULARITIES) {
        singularities.push({ x: msg.x, y: msg.y, id: nextSingularityId++ });
        console.log('[KERNEL] ✨ Singularidad agregada:', msg);
    } else {
        console.warn('[KERNEL] ⚠️  Límite máximo de singularidades alcanzado.');
    }
}

// --- BUCLE PRINCIPAL DE CÓMPUTO UNIVERSAL (OPERADOR Ω) ---
setInterval(() => {
    if (wss.clients.size === 0) {
        return; // No hay observadores, entra en modo estasis
    }

    time += 0.005; // El tiempo siempre fluye, creando el 'spin' visual

    if (demiurgeParams.dynamicsEnabled) {
        handleAutonomousEvolution();
    }

    // --- TRANSMISIÓN DE LA REALIDAD MANIFIESTA ---
    const state = {
        type: 'universe_state',
        singularities: singularities,
        time: time
    };
    broadcastState(state);

}, TICK_INTERVAL_MS);

// --- FUNCIONES DE EVOLUCIÓN AUTÓNOMA ---
function handleAutonomousEvolution() {
    // Génesis (Generación de nuevas singularidades)
    if (Math.random() < demiurgeParams.genesisRate / 60) {
        if (singularities.length < MAX_SINGULARITIES) {
            singularities.push({
                x: Math.random() * WIDTH,
                y: Math.random() * HEIGHT,
                id: nextSingularityId++
            });
        }
    }

    // Decadencia (Eliminación aleatoria de singularidades)
    if (Math.random() < demiurgeParams.decayRate / 60 && singularities.length > 0) {
        const randomIndex = Math.floor(Math.random() * singularities.length);
        singularities.splice(randomIndex, 1);
    }
}

// --- FUNCIONES DE ENVÍO DE ESTADO ---
function broadcastState(state) {
    const message = JSON.stringify(state);

    wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
        }
    });
}

