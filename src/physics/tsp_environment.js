/**
 * @file src/physics/tsp_environment.js
 * @description Define el entorno físico para el Problema del Viajante.
 *              Versión Definitiva: Incluye todos los métodos necesarios para la
 *              interacción con el Meta-Universo y el Streamer.
 */

function calculateDistanceMatrix(cities) {
    const n = cities.length;
    const matrix = Array(n).fill(0).map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
            const dist = Math.sqrt(
                (cities[i].x - cities[j].x) ** 2 +
                (cities[i].y - cities[j].y) ** 2
            );
            matrix[i][j] = dist;
            matrix[j][i] = dist;
        }
    }
    return matrix;
}

export class TSPEnvironment {
    constructor(cities) {
        if (!cities || cities.length < 2) {
            throw new Error("TSPEnvironment requiere al menos 2 ciudades.");
        }
        
        this.cities = cities;
        this.numCities = cities.length;
        this.distanceMatrix = calculateDistanceMatrix(cities);
        this.adjacencyMatrix = Array(this.numCities).fill(0).map(() => Array(this.numCities).fill(0));
    }

    evaluate() {
        let totalDistance = 0;
        for (let i = 0; i < this.numCities; i++) {
            for (let j = i + 1; j < this.numCities; j++) {
                if (this.adjacencyMatrix[i][j] === 1) {
                    totalDistance += this.distanceMatrix[i][j];
                }
            }
        }
        return totalDistance;
    }

    reset() {
        this.adjacencyMatrix = Array(this.numCities).fill(0).map(() => Array(this.numCities).fill(0));
    }

    /**
     * ¡MÉTODO AÑADIDO!
     * Intenta encontrar un ciclo hamiltoniano (un tour válido) en la matriz de adyacencia.
     * @returns {number[] | null}
     */
    get_current_tour() {
        const degrees = this.adjacencyMatrix.map(row => row.reduce((a, b) => a + b, 0));
        if (degrees.some(d => d !== 2) || degrees.length === 0) {
            return null;
        }

        let tour = [0];
        let visited = new Set([0]);
        let currentNode = 0;

        while (tour.length < this.numCities) {
            let nextNode = -1;
            for (let neighbor = 0; neighbor < this.numCities; neighbor++) {
                if (this.adjacencyMatrix[currentNode][neighbor] === 1 && !visited.has(neighbor)) {
                    nextNode = neighbor;
                    break;
                }
            }
            if (nextNode === -1) return null; // Camino roto
            
            visited.add(nextNode);
            tour.push(nextNode);
            currentNode = nextNode;
        }

        // Verificar cierre de ciclo
        if (this.adjacencyMatrix[currentNode][tour[0]] !== 1) return null;
        return tour;
    }

    /**
     * ¡MÉTODO AÑADIDO!
     * Extrae todas las aristas activas del grafo actual.
     * @returns {Array<[number, number]>}
     */
    extractEdges() {
        const edges = [];
        for (let i = 0; i < this.numCities; i++) {
            for (let j = i + 1; j < this.numCities; j++) {
                if (this.adjacencyMatrix[i][j] === 1) {
                    edges.push([i, j]);
                }
            }
        }
        return edges;
    }
}