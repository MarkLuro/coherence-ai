/**
 * @file src/applications/ontological_solver/problems/tsp_universe.js
 * @description Implementación de un Universo especializado para el Problema del Viajante (TSP).
 *              Versión Definitiva: Protocolo de `getState()` 100% alineado con el frontend.
 */

function calculateTensionMatrix(cities) {
    const numCities = cities.length;
    const matrix = Array(numCities).fill(0).map(() => Array(numCities).fill(0));
    for (let i = 0; i < numCities; i++) {
        for (let j = i; j < numCities; j++) {
            const dist = Math.sqrt(
                (cities[i][0] - cities[j][0]) ** 2 +
                (cities[i][1] - cities[j][1]) ** 2
            );
            matrix[i][j] = dist;
            matrix[j][i] = dist;
        }
    }
    return matrix;
}

export class TSP_Universe {
    constructor(cities) {
        if (!cities || cities.length < 2) {
            throw new Error("Se requieren al menos 2 ciudades para un problema de TSP.");
        }
        
        this.cities = cities;
        this.num_cities = cities.length;
        this.tension_matrix = calculateTensionMatrix(cities);
        this.adjacency_matrix = Array(this.num_cities).fill(0).map(() => Array(this.num_cities).fill(0));
        this.best_distance = Infinity;
        this.best_tour = null;
        this.tick_count = 0;
    }

    tick() {
        this.update_best_solution();
        this.tick_count++;
    }

    get_current_tour() {
        const degrees = this.adjacency_matrix.map(row => row.reduce((a, b) => a + b, 0));
        if (degrees.some(d => d !== 2)) return null;

        let tour = [0];
        let visited = new Set([0]);
        let currentNode = 0;

        while (tour.length < this.num_cities) {
            let nextNode = -1;
            for (let neighbor = 0; neighbor < this.num_cities; neighbor++) {
                if (this.adjacency_matrix[currentNode][neighbor] === 1 && !visited.has(neighbor)) {
                    nextNode = neighbor;
                    break;
                }
            }
            if (nextNode === -1) return null;
            
            visited.add(nextNode);
            tour.push(nextNode);
            currentNode = nextNode;
        }

        if (this.adjacency_matrix[currentNode][tour[0]] !== 1) return null;
        return tour;
    }

    calculate_distance(tour) {
        if (!tour) return Infinity;
        let distance = 0;
        for (let i = 0; i < tour.length; i++) {
            const from = tour[i];
            const to = tour[(i + 1) % tour.length];
            distance += this.tension_matrix[from][to];
        }
        return distance;
    }
    
    update_best_solution() {
        const tour = this.get_current_tour();
        if (tour) {
            const distance = this.calculate_distance(tour);
            if (distance < this.best_distance) {
                this.best_distance = distance;
                this.best_tour = tour;
            }
        }
    }

    /**
     * Devuelve el estado actual del universo TSP.
     * Se utiliza para enviar actualizaciones al cliente.
     * ¡VERSIÓN CORREGIDA Y CANÓNICA!
     */
    getState() {
        return {
            type: 'universe_state',
            tick: this.tick_count,
            best_distance: this.best_distance,
            tour: this.best_tour,   // <-- CLAVE CORREGIDA
            cities: this.cities,
            edges: this.extractEdges()
        };
    }

    /**
     * Extrae todas las aristas activas del grafo actual.
     * @returns {Array<[number, number]>}
     */
    extractEdges() {
        const edges = [];
        for (let i = 0; i < this.num_cities; i++) {
            for (let j = i + 1; j < this.num_cities; j++) {
                if (this.adjacency_matrix[i][j] === 1) {
                    edges.push([i, j]);
                }
            }
        }
        return edges;
    }
}