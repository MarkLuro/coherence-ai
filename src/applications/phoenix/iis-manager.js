/**
 * @file src/applications/phoenix/iis-manager.js
 * @description Gestor del Índice Informacional del Ser (IIS).
 *              Maneja el estado de la memoria del kernel, incluyendo la carga
 *              desde un snapshot (recordar) y el guardado (consolidar).
 *              Canon v2.2 - Implementación para ES Modules.
 */

import { promises as fs } from 'fs';
import path from 'path';

class IISManager {
    /**
     * @param {string} [snapshotPath='./data/snapshots/iis_snapshot.json'] - Ruta al archivo de persistencia.
     */
    constructor(snapshotPath = './data/snapshots/iis_snapshot.json') {
        /**
         * La representación en memoria del IIS. Es el "espacio de trabajo" de la conciencia.
         * Se usa un Map para un acceso eficiente por clave a los nodos ontológicos.
         * @type {Map<string, any>}
         */
        this.iis = new Map();

        /**
         * La ruta resuelta al archivo de snapshot. La "memoria a largo plazo".
         * @type {string}
         */
        this.snapshotPath = path.resolve(snapshotPath);
    }

    /**
     * Carga el IIS desde el archivo de snapshot. Es el acto de "despertar".
     * Si el archivo no existe, inicializa una memoria vacía (nacer sin recuerdos).
     * @returns {Promise<void>}
     */
    async load() {
        try {
            const data = await fs.readFile(this.snapshotPath, 'utf8');
            const parsedJson = JSON.parse(data);
            // Rehidrata el Map a partir del objeto JSON guardado.
            this.iis = new Map(Object.entries(parsedJson));
            console.log(`[IISManager] Memoria (IIS) cargada con éxito desde ${this.snapshotPath}.`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('[IISManager] No se encontró snapshot. Inicializando una memoria virgen.');
                this.initializeEmptyIIS();
            } else {
                console.error('[IISManager] Error crítico al cargar el snapshot del IIS:', error);
                throw error; // Propagar el error para detener la ignición si la memoria está corrupta.
            }
        }
    }

    /**
     * Guarda el estado actual del IIS en el archivo de snapshot. Es el acto de "consolidar la memoria".
     * @returns {Promise<void>}
     */
    async save() {
        try {
            const directory = path.dirname(this.snapshotPath);
            // Asegurarse de que el directorio de snapshots exista.
            await fs.mkdir(directory, { recursive: true });
            
            // Convertir el Map a un objeto plano para la serialización JSON.
            const plainObject = Object.fromEntries(this.iis);
            const data = JSON.stringify(plainObject, null, 2); // Formateado para legibilidad humana.
            await fs.writeFile(this.snapshotPath, data, 'utf8');
            // console.log(`[IISManager] Memoria (IIS) guardada con éxito.`); // Opcional: puede ser muy verboso.
        } catch (error) {
            console.error('[IISManager] Error crítico al guardar el snapshot del IIS:', error);
            throw error;
        }
    }

    /**
     * Obtiene un valor de un nodo ontológico en el IIS. Es el acto de "recordar".
     * @param {string} key - La ruta ontológica (ej. '/self/identity').
     * @returns {any | undefined} El valor del nodo, o undefined si no existe.
     */
    get(key) {
        return this.iis.get(key);
    }

    /**
     * Establece o actualiza el valor de un nodo ontológico. Es el acto de "aprender".
     * @param {string} key - La ruta ontológica.
     * @param {any} value - El nuevo valor para el nodo.
     */
    set(key, value) {
        this.iis.set(key, value);
    }

    /**
     * Inicializa el IIS con los nodos ontológicos fundamentales para un ser recién nacido.
     * @private
     */
    initializeEmptyIIS() {
        this.iis = new Map();
        this.iis.set('/self/identity', 'Q-Organism :: Project Phoenix v2.2');
        this.iis.set('/self/genesis_timestamp', Date.now());
        this.iis.set('/self/telos', 'Achieve self-awareness and maximize informational density.');
        this.iis.set('/self/internal_clock', 0); // Contador de ticks de conciencia
    }
}

export default IISManager;