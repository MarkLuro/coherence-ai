/**
 * @file src/utils/data_parser.js
 * @description Módulo de utilidades para parsear formatos de archivo de problemas estándar.
 *              Actúa como un "órgano sensorial" que traduce datos del mundo
 *              exterior al formato interno del Universo.
 */

import { promises as fs } from 'fs';

/**
 * Carga un problema de TSP desde un archivo en formato TSPLIB.
 * Extrae las coordenadas de los nodos.
 * @param {string} filepath - La ruta al archivo .tsp.
 * @returns {Promise<number[][]>} Una promesa que se resuelve a un array de coordenadas [[x1, y1], [x2, y2], ...].
 */
export async function loadTsplibProblem(filepath) {
    try {
        const data = await fs.readFile(filepath, 'utf8');
        const lines = data.split('\n');
        
        const cities = [];
        let readingNodes = false;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === 'NODE_COORD_SECTION') {
                readingNodes = true;
                continue;
            }
            if (trimmedLine === 'EOF' || !readingNodes) {
                continue;
            }

            // Formato esperado: "index x_coord y_coord"
            const parts = trimmedLine.split(/\s+/);
            if (parts.length === 3) {
                const x = parseFloat(parts[1]);
                const y = parseFloat(parts[2]);
                cities.push([x, y]);
            }
        }
        
        if (cities.length === 0) {
            throw new Error(`No se encontraron coordenadas de nodos en el archivo: ${filepath}`);
        }

        console.log(`[DataParser] Se cargaron ${cities.length} ciudades.`);
        return cities;

    } catch (error) {
        console.error(`[DataParser] Error al leer o parsear el archivo del problema: ${error.message}`);
        throw error; // Propagar el error para que el CLI se detenga.
    }
}