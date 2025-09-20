/**
 * @file src/utils/visualizer.js
 * @description Módulo de utilidades para generar representaciones visuales de las soluciones.
 *              Traduce el estado final del Universo a un '1nfo' perceptible por humanos.
 */

import { createCanvas } from 'canvas';
import { promises as fs } from 'fs';

/**
 * Dibuja la solución de un problema TSP y la guarda como un archivo de imagen.
 * @param {number[][]} cities - Array de coordenadas de las ciudades.
 * @param {number[] | null} tour - Array con el orden de las ciudades en la ruta.
 * @param {number} distance - La distancia total de la ruta.
 * @param {string} outputPath - La ruta donde se guardará la imagen.
 * @returns {Promise<void>}
 */
export async function plotSolution(cities, tour, distance, outputPath) {
    const margin = 50;
    const width = 800;
    const height = 800;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fondo
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Encontrar límites para escalar
    const xCoords = cities.map(c => c[0]);
    const yCoords = cities.map(c => c[1]);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);

    const scaleX = (width - 2 * margin) / (maxX - minX);
    const scaleY = (height - 2 * margin) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);

    const transform = (x, y) => [
        margin + (x - minX) * scale,
        margin + (y - minY) * scale
    ];

    // Dibujar la mejor ruta
    if (tour && tour.length > 0) {
        ctx.strokeStyle = '#ff7f0e'; // Naranja
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const [startX, startY] = transform(cities[tour[0]][0], cities[tour[0]][1]);
        ctx.moveTo(startX, startY);
        for (let i = 1; i < tour.length; i++) {
            const [x, y] = transform(cities[tour[i]][0], cities[tour[i]][1]);
            ctx.lineTo(x, y);
        }
        ctx.closePath(); // Cierra el tour
        ctx.stroke();
    }

    // Dibujar las ciudades
    cities.forEach(([cityX, cityY]) => {
        const [x, y] = transform(cityX, cityY);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#1f77b4'; // Azul
        ctx.fill();
    });

    // Añadir texto
    ctx.fillStyle = 'white';
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText(`Mejor Distancia: ${distance.toFixed(2)}`, margin, margin - 20);

    // Guardar el archivo
    try {
        const buffer = canvas.toBuffer('image/png');
        await fs.writeFile(outputPath, buffer);
    } catch (error) {
        console.error(`[Visualizer] Error al guardar la imagen de la solución: ${error.message}`);
        throw error;
    }
}