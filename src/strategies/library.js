/**
 * @file src/strategies/library.js
 * @description Contiene una biblioteca de funciones de acción puras.
 *              Cada función es una estrategia atómica que puede ser encapsulada
 *              en un StrategyCOC. Reciben el entorno y lo modifican.
 */

/**
 * ESTRATEGIA 1: Conectar el nodo menos conectado al vecino más cercano
 * que no viole la restricción de grado 2.
 * @param {import('../physics/tsp_environment.js').TSPEnvironment} env
 * @returns {boolean} - True si se realizó un cambio.
 */
export function connectNearest(env) {
    const { adjacencyMatrix, distanceMatrix, numCities } = env;
    const degrees = adjacencyMatrix.map(row => row.reduce((a, b) => a + b, 0));

    let minDegree = Infinity;
    let nodeToConnect = -1;

    // Encontrar un nodo con grado < 2 (preferiblemente 0 o 1)
    for(let i = 0; i < numCities; i++) {
        if(degrees[i] < minDegree) {
            minDegree = degrees[i];
            nodeToConnect = i;
        }
        if(minDegree < 2) break; // Optimización
    }
    
    if (nodeToConnect === -1 || minDegree >= 2) return false; // No hay nada que hacer

    let bestNeighbor = -1;
    let minDistance = Infinity;

    for (let i = 0; i < numCities; i++) {
        if (i === nodeToConnect || degrees[i] >= 2 || adjacencyMatrix[nodeToConnect][i] === 1) continue;
        
        if (distanceMatrix[nodeToConnect][i] < minDistance) {
            minDistance = distanceMatrix[nodeToConnect][i];
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
 * ESTRATEGIA 2: Romper la arista más larga (la de mayor tensión) en el grafo.
 * @param {import('../physics/tsp_environment.js').TSPEnvironment} env
 * @returns {boolean} - True si se realizó un cambio.
 */
export function breakLongestEdge(env) {
    const { adjacencyMatrix, distanceMatrix, numCities } = env;
    let worstEdge = { from: -1, to: -1, tension: -1 };

    for (let i = 0; i < numCities; i++) {
        for (let j = i + 1; j < numCities; j++) {
            if (adjacencyMatrix[i][j] === 1) {
                if (distanceMatrix[i][j] > worstEdge.tension) {
                    worstEdge = { from: i, to: j, tension: distanceMatrix[i][j] };
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
 * ESTRATEGIA 3 (Ejemplo de otra heurística): Conectar dos nodos de bajo grado.
 * @param {import('../physics/tsp_environment.js').TSPEnvironment} env
 * @returns {boolean} - True si se realizó un cambio.
 */
export function connectDegreeBalanced(env) {
    // Esta es una implementación placeholder para mostrar la variedad.
    // Una implementación real buscaría activamente balancear la red.
    return connectNearest(env); // Reutilizamos por simplicidad para la demo.
}