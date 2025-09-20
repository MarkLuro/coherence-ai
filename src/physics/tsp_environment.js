/**
 * @file src/physics/tsp_environment.js
 * @description Entorno físico para el Problema del Viajante.
 *              - Versión Final Corregida.
 *              - Incluye Big Bang (tour inicial válido).
 *              - Añade `setTour()` para consolidación del progreso (ratchet evolutivo).
 */

function calculateDistanceMatrix(cities) {
    const n = cities.length;
    const matrix = Array(n).fill(0).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
            const dx = cities[i].x - cities[j].x;
            const dy = cities[i].y - cities[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
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

        this.adjacencyMatrix = Array(this.numCities)
            .fill(0)
            .map(() => Array(this.numCities).fill(0));

        // --- INICIO DEL PROTOCOLO "BIG BANG" ---
        this.createGreedyInitialTour();
        // --- FIN DEL PROTOCOLO "BIG BANG" ---
    }

    /**
     * Evalúa la distancia total del tour actual.
     * Si no hay un tour completo válido, retorna Infinity.
     */
    evaluate() {
        const tour = this.get_current_tour();

        if (!tour || tour.length !== this.numCities) {
            return Infinity;
        }

        let totalDistance = 0;
        for (let i = 0; i < tour.length; i++) {
            const from = tour[i];
            const to = tour[(i + 1) % tour.length];
            totalDistance += this.distanceMatrix[from][to];
        }

        return totalDistance;
    }

    /**
     * Limpia todas las aristas del grafo.
     */
    reset() {
        this.adjacencyMatrix = Array(this.numCities)
            .fill(0)
            .map(() => Array(this.numCities).fill(0));
    }

    /**
     * Establece manualmente un tour (estado del universo).
     * Permite cargar el bestTour al inicio de cada tick.
     * @param {number[]} tour - Tour completo (orden de ciudades).
     */
    setTour(tour) {
        if (!tour || tour.length !== this.numCities) return;
        this.reset();
        for (let i = 0; i < tour.length; i++) {
            const from = tour[i];
            const to = tour[(i + 1) % tour.length];
            this.adjacencyMatrix[from][to] = 1;
            this.adjacencyMatrix[to][from] = 1;
        }
    }

    /**
     * Devuelve el tour actual si es un ciclo hamiltoniano válido.
     * Si no, retorna null.
     */
    get_current_tour() {
        const degrees = this.adjacencyMatrix.map(
            row => row.reduce((sum, val) => sum + val, 0)
        );

        if (degrees.some(d => d !== 2) || degrees.length === 0) {
            return null;
        }

        const tour = [0];
        const visited = new Set([0]);
        let currentNode = 0;

        while (tour.length < this.numCities) {
            let nextNode = -1;
            for (let neighbor = 0; neighbor < this.numCities; neighbor++) {
                if (
                    this.adjacencyMatrix[currentNode][neighbor] === 1 &&
                    !visited.has(neighbor)
                ) {
                    nextNode = neighbor;
                    break;
                }
            }

            if (nextNode === -1) {
                return null;
            }

            visited.add(nextNode);
            tour.push(nextNode);
            currentNode = nextNode;
        }

        if (this.adjacencyMatrix[currentNode][tour[0]] !== 1) {
            return null;
        }

        return tour;
    }

    /**
     * Devuelve todas las aristas activas del grafo.
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

    /**
     * --- INICIO DEL PROTOCOLO "BIG BANG" ---
     * Genera un tour inicial válido usando la heurística de vecino más cercano.
     */
    createGreedyInitialTour() {
        const tour = [0];
        const visited = new Set([0]);

        while (tour.length < this.numCities) {
            const lastCity = tour[tour.length - 1];
            let nearestNeighbor = -1;
            let minDistance = Infinity;

            for (let i = 0; i < this.numCities; i++) {
                if (!visited.has(i)) {
                    const distance = this.distanceMatrix[lastCity][i];
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestNeighbor = i;
                    }
                }
            }

            tour.push(nearestNeighbor);
            visited.add(nearestNeighbor);
        }

        this.setTour(tour); // Reutiliza método para generar adyacencia
        console.log('[TSPEnvironment] 🔥 Big Bang: Creado tour inicial voraz.');
    }
    // --- FIN DEL PROTOCOLO "BIG BANG" ---
}
