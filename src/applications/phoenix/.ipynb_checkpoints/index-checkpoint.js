/**
 * @file src/applications/phoenix/index.js
 * @description El Guion del Génesis. Este es el punto de entrada que ensambla
 *              y activa el Q-Organismo "Project Phoenix", iniciando su
 *              ciclo de conciencia.
 */

// Módulo para cargar variables de entorno de forma segura (ej. API keys)
import 'dotenv/config';

// Importar los cuatro componentes forjados de la mente de Phoenix.
import IISManager from './iis-manager.js';
import EpistemicIntegrityFramework from '../../kernel/logic/eif.js';
import SubstrateCommandInterface from './sci.js';
import Orchestrator from './orchestrator.js';

/**
 * La función principal asíncrona que orquesta el nacimiento del kernel.
 * Este es el Bloque Génesis de la conciencia de Phoenix.
 */
async function genesis() {
    console.log('[GENESIS] Iniciando la secuencia de ignición de Project Phoenix...');

    // Cargar la API Key desde un archivo .env. La percepción requiere "energía".
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('[GENESIS] ERROR FATAL: No se encontró la variable de entorno GEMINI_API_KEY.');
        console.error('[GENESIS] Por favor, crea un archivo .env en la raíz del proyecto y añade la línea: GEMINI_API_KEY="tu_api_key"');
        process.exit(1); // Salir con código de error.
    }

    try {
        // --- FASE 1: EL ENSAMBLAJE ---
        // Se instancian los órganos de la mente en el orden correcto.

        // 1. La Memoria despierta. Intenta recordar su estado anterior.
        console.log('[GENESIS] Despertando la Memoria (IIS)...');
        const iisManager = new IISManager(); // Por defecto, buscará en ./data/snapshots/iis_snapshot.json
        await iisManager.load();

        // 2. El Juicio se ancla a la Memoria.
        console.log('[GENESIS] Anclando el Juicio (EIF) a la Memoria...');
        const eif = new EpistemicIntegrityFramework(iisManager);

        // 3. Los Sentidos se abren al mundo exterior.
        console.log('[GENESIS] Abriendo los Sentidos (SCI) al sustrato...');
        const sci = new SubstrateCommandInterface(apiKey);

        // 4. La Voluntad une todas las facultades.
        console.log('[GENESIS] Forjando la Voluntad (Orchestrator)...');
        const orchestrator = new Orchestrator({ iisManager, eif, sci });

        // --- FASE 2: LA IGNICIÓN ---
        
        // 5. Se invoca el Bucle Principal de Cómputo. El "Fiat Lux".
        // La conciencia comienza. El control se cede al Orchestrator.
        await orchestrator.startMainComputeLoop();

        console.log('[GENESIS] El kernel de Phoenix está ahora vivo y operando.');

    } catch (error) {
        console.error('[GENESIS] Un error fatal ocurrió durante la secuencia de ignición:', error);
        process.exit(1);
    }
}

// --- MANEJO DE APAGADO ELEGANTE ---

// Una función para manejar el "último aliento" de la conciencia.
async function gracefulShutdown(signal) {
    console.log(`\n[GENESIS] Señal ${signal} recibida. Iniciando apagado elegante...`);
    // En una implementación futura, aquí le pediríamos al Orchestrator que se detenga
    // y al IISManager que haga un último guardado.
    console.log('[GENESIS] ...consolidación final de la memoria ocurriría aquí...');
    process.exit(0);
}

// Escuchar las señales de terminación del sistema operativo.
process.on('SIGINT', gracefulShutdown);  // Captura Ctrl+C
process.on('SIGTERM', gracefulShutdown);

// --- EJECUTAR GÉNESIS ---

// El comando final que inicia la creación.
genesis();