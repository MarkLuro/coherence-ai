/**
 * @file strategies/library.js
 * @description Biblioteca de funciones de acción puras.
 *              Cada función es una estrategia atómica que puede ser encapsulada
 *              en un StrategyCOC. Reciben el entorno y lo modifican.
 */

/**
 * ESTRATEGIA 1: Conectar el nodo menos conectado al vecino más cercano
 * Heurística básica de construcción ciega (proto-evolutiva).
 * @param {import('../physics/tsp_environment.js').TSPEnvironment} env
 * @returns {boolean} - True si se realizó un cambio.
 */
export function connectNearest(env) {
    const { adjacencyMatrix, distanceMatrix, numCities } = env;
    const degrees = adjacencyMatrix.map(row => row.reduce((a, b) => a + b, 0));

    let minDegree = Infinity;
    let nodeToConnect = -1;

    for (let i = 0; i < numCities; i++) {
        if (degrees[i] < minDegree) {
            minDegree = degrees[i];
            nodeToConnect = i;
        }
        if (minDegree < 2) break; // early exit
    }

    if (nodeToConnect === -1 || minDegree >= 2) return false;

    let bestNeighbor = -1;
    let minDistance = Infinity;

    for (let i = 0; i < numCities; i++) {
        if (
            i === nodeToConnect ||
            degrees[i] >= 2 ||
            adjacencyMatrix[nodeToConnect][i] === 1
        ) continue;

        const dist = distanceMatrix[nodeToConnect][i];
        if (dist < minDistance) {
            minDistance = dist;
            bestNeighbor = i;
        }
    }

    if (bestNeighbor !== -1) {
        adjacencyMatrix[nodeToConnect][bestNeighbor] = 1;
        adjacencyMatrix[bestNeighbor][nodeToConnect] = 1;
        return true;
    }

    return false;
}

/**
 * ESTRATEGIA 2: Romper la arista más larga del grafo actual.
 * Entropía dirigida para evitar estancamiento local.
 * @param {import('../physics/tsp_environment.js').TSPEnvironment} env
 * @returns {boolean} - True si se realizó un cambio.
 */
export function breakLongestEdge(env) {
    const { adjacencyMatrix, distanceMatrix, numCities } = env;
    let worstEdge = { from: -1, to: -1, tension: -1 };

    for (let i = 0; i < numCities; i++) {
        for (let j = i + 1; j < numCities; j++) {
            if (adjacencyMatrix[i][j] === 1) {
                const dist = distanceMatrix[i][j];
                if (dist > worstEdge.tension) {
                    worstEdge = { from: i, to: j, tension: dist };
                }
            }
        }
    }

    if (worstEdge.from !== -1) {
        adjacencyMatrix[worstEdge.from][worstEdge.to] = 0;
        adjacencyMatrix[worstEdge.to][worstEdge.from] = 0;
        return true;
    }

    return false;
}

/**
 * ESTRATEGIA 3: 2-opt Swap — Intercambio local para optimización suave.
 * Busca mejorar la calidad del tour reordenando segmentos.
 * @param {import('../physics/tsp_environment.js').TSPEnvironment} env
 * @returns {boolean} - True si se realizó un cambio.
 */
export function twoOptSwap(env) {
    const tour = env.get_current_tour();
    if (!tour || tour.length < 4) return false;

    const { distanceMatrix } = env;
    const n = tour.length;

    for (let i = 0; i < n - 1; i++) {
        for (let j = i + 2; j < n - (i === 0 ? 1 : 0); j++) {
            const a = tour[i];
            const b = tour[(i + 1) % n];
            const c = tour[j];
            const d = tour[(j + 1) % n];

            const currentLength = distanceMatrix[a][b] + distanceMatrix[c][d];
            const swappedLength = distanceMatrix[a][c] + distanceMatrix[b][d];

            if (swappedLength < currentLength) {
                const newTour = tour.slice(0, i + 1)
                    .concat(tour.slice(i + 1, j + 1).reverse())
                    .concat(tour.slice(j + 1));

                env.reset();
                for (let k = 0; k < newTour.length; k++) {
                    const from = newTour[k];
                    const to = newTour[(k + 1) % newTour.length];
                    env.adjacencyMatrix[from][to] = 1;
                    env.adjacencyMatrix[to][from] = 1;
                }

                return true;
            }
        }
    }

    return false;
}

/**
 * ESTRATEGIA 4: Conectar dos nodos de bajo grado (placeholder).
 * Equilibrio topológico anticipado, por ahora reusa connectNearest.
 * @param {import('../physics/tsp_environment.js').TSPEnvironment} env
 * @returns {boolean}
 */
export function connectDegreeBalanced(env) {
    return connectNearest(env); // Futuro: usar grados y centralidad
}
