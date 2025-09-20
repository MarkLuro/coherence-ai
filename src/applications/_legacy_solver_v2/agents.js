/**
 * @file src/applications/ontological_solver/agents.js
 * @description Agentes de IA v4.0 - Inteligencia Heurística.
 *              Generator implementa una extensión oportunista.
 *              Dissolver implementa una optimización 2-opt.
 */

export class GeneratorAI {
    constructor(universe) { this.universe = universe; }

    act() {
        const { adjacency_matrix, num_cities } = this.universe;
        const tour = this.universe.get_current_tour();

        if (tour && tour.length === num_cities) return; // Ya hay un tour completo

        const degrees = this.getDegrees();
        const availableNodes = [];
        for (let i = 0; i < num_cities; ++i)
            if (degrees[i] < 2) availableNodes.push(i);

        if (availableNodes.length < 2) return;

        // Estrategia: "Extensión del Fragmento más Prometedor"
        const fragments = this.findSubTours();
        if (fragments.length > 0) {
            const longestFragment = fragments.sort((a, b) => b.length - a.length)[0];
            const startNode = longestFragment[0];
            const endNode = longestFragment[longestFragment.length - 1];

            let bestExtension = { from: -1, to: -1, tension: Infinity };

            [startNode, endNode].forEach(node => {
                if (degrees[node] < 2) {
                    for (const neighbor of availableNodes) {
                        if (node !== neighbor &&
                            !longestFragment.includes(neighbor) &&
                            this.universe.tension_matrix[node][neighbor] < bestExtension.tension) {
                            bestExtension = {
                                from: node,
                                to: neighbor,
                                tension: this.universe.tension_matrix[node][neighbor]
                            };
                        }
                    }
                }
            });

            if (bestExtension.from !== -1) {
                adjacency_matrix[bestExtension.from][bestExtension.to] = 1;
                adjacency_matrix[bestExtension.to][bestExtension.from] = 1;
            }
        } else {
            this.addShortestPossibleEdge();
        }
    }

    addShortestPossibleEdge() {
        const { adjacency_matrix, tension_matrix, num_cities } = this.universe;
        const degrees = this.getDegrees();

        let bestEdge = { from: -1, to: -1, tension: Infinity };

        for (let i = 0; i < num_cities; i++) {
            if (degrees[i] >= 2) continue;
            for (let j = i + 1; j < num_cities; j++) {
                if (degrees[j] >= 2 || adjacency_matrix[i][j] === 1) continue;
                const t = tension_matrix[i][j];
                if (t < bestEdge.tension) {
                    bestEdge = { from: i, to: j, tension: t };
                }
            }
        }

        if (bestEdge.from !== -1) {
            adjacency_matrix[bestEdge.from][bestEdge.to] = 1;
            adjacency_matrix[bestEdge.to][bestEdge.from] = 1;
        }
    }

    getDegrees() {
        const { adjacency_matrix, num_cities } = this.universe;
        const degrees = new Array(num_cities).fill(0);
        for (let i = 0; i < num_cities; i++) {
            for (let j = 0; j < num_cities; j++) {
                if (adjacency_matrix[i][j] === 1) degrees[i]++;
            }
        }
        return degrees;
    }

    findSubTours() {
        const { adjacency_matrix, num_cities } = this.universe;
        const visited = new Array(num_cities).fill(false);
        const tours = [];

        for (let i = 0; i < num_cities; i++) {
            if (!visited[i]) {
                const stack = [i];
                const fragment = [];

                while (stack.length > 0) {
                    const node = stack.pop();
                    if (visited[node]) continue;
                    visited[node] = true;
                    fragment.push(node);

                    for (let j = 0; j < num_cities; j++) {
                        if (adjacency_matrix[node][j] === 1 && !visited[j]) {
                            stack.push(j);
                        }
                    }
                }

                tours.push(fragment);
            }
        }

        return tours;
    }
}

export class DissolverAI {
    constructor(universe) { this.universe = universe; }

    act() {
        const tour = this.universe.get_current_tour();
        if (!tour || tour.length < 4) {
            this.breakLongestEdge();
            return;
        }

        // Estrategia 2-opt
        for (let i = 0; i < tour.length - 1; i++) {
            for (let j = i + 1; j < tour.length; j++) {
                const a = tour[i];
                const b = tour[(i + 1) % tour.length];
                const c = tour[j];
                const d = tour[(j + 1) % tour.length];

                const originalTension = this.universe.tension_matrix[a][b] + this.universe.tension_matrix[c][d];
                const newTension = this.universe.tension_matrix[a][c] + this.universe.tension_matrix[b][d];

                if (newTension < originalTension) {
                    this.swapEdges(a, b, c, d);
                    return;
                }
            }
        }
    }

    swapEdges(a, b, c, d) {
        const { adjacency_matrix } = this.universe;

        adjacency_matrix[a][b] = 0; adjacency_matrix[b][a] = 0;
        adjacency_matrix[c][d] = 0; adjacency_matrix[d][c] = 0;

        adjacency_matrix[a][c] = 1; adjacency_matrix[c][a] = 1;
        adjacency_matrix[b][d] = 1; adjacency_matrix[d][b] = 1;
    }

    breakLongestEdge() {
        const { adjacency_matrix, tension_matrix, num_cities } = this.universe;
        let maxTension = -1;
        let edge = null;

        for (let i = 0; i < num_cities; i++) {
            for (let j = i + 1; j < num_cities; j++) {
                if (adjacency_matrix[i][j] === 1 && tension_matrix[i][j] > maxTension) {
                    maxTension = tension_matrix[i][j];
                    edge = { from: i, to: j };
                }
            }
        }

        if (edge) {
            adjacency_matrix[edge.from][edge.to] = 0;
            adjacency_matrix[edge.to][edge.from] = 0;
        }
    }
}
