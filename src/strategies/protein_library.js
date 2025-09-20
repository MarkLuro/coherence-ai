// FORGED: src/strategies/protein_library.js

/**
 * @file src/strategies/protein_library.js
 * @description Biblioteca de acciones atómicas para el plegamiento de proteínas.
 *              Estas son las operaciones fundamentales (mutaciones conformacionales)
 *              que el Meta-Universo puede combinar y evolucionar.
 */

/**
 * ESTRATEGIA 1: Rotar un segmento de la cadena 90 grados alrededor de un pivote.
 * Esta es una acción fundamental de exploración en modelos de lattice.
 * @param {import('../physics/protein_environment.js').ProteinEnvironment} env
 * @param {'cw' | 'ccw'} direction - 'cw' para clockwise, 'ccw' para counter-clockwise.
 * @returns {boolean} - True si la rotación fue válida y se aplicó.
 */
function rotateSegment(env, direction) {
    if (env.numAminoAcids < 3) return false;

    const pivotIndex = Math.floor(Math.random() * (env.numAminoAcids - 2)) + 1; // No rotar sobre los extremos
    const pivotPoint = env.chain[pivotIndex];

    const newChain = [...env.chain]; // Copia para no mutar el estado original

    for (let i = pivotIndex + 1; i < env.numAminoAcids; i++) {
        const point = newChain[i];
        const relativeX = point.x - pivotPoint.x;
        const relativeY = point.y - pivotPoint.y;

        if (direction === 'cw') {
            newChain[i] = { x: pivotPoint.x + relativeY, y: pivotPoint.y - relativeX };
        } else { // ccw
            newChain[i] = { x: pivotPoint.x - relativeY, y: pivotPoint.y + relativeX };
        }
    }

    return env.updateChain(newChain);
}

/**
 * Exporta una acción de rotación en sentido horario.
 */
export function rotate_bond_clockwise(env) {
    return rotateSegment(env, 'cw');
}

/**
 * Exporta una acción de rotación en sentido anti-horario.
 */
export function rotate_bond_counter_clockwise(env) {
    return rotateSegment(env, 'ccw');
}


/**
 * ESTRATEGIA 2: Colapso hidrofóbico simple.
 * Intenta mover un aminoácido 'H' hacia el centro de masa de otros 'H'.
 * Una forma de 'Gravitación Informacional' dirigida.
 * @param {import('../physics/protein_environment.js').ProteinEnvironment} env
 * @returns {boolean}
 */
export function hydrophobic_collapse(env) {
    const h_indices = env.sequence
        .split('')
        .map((aa, i) => (aa === 'H' ? i : -1))
        .filter(i => i !== -1);

    if (h_indices.length < 2) return false;

    // Calcular centro de masa de los H
    let centerX = 0, centerY = 0;
    h_indices.forEach(i => {
        centerX += env.chain[i].x;
        centerY += env.chain[i].y;
    });
    centerX /= h_indices.length;
    centerY /= h_indices.length;

    // Tomar un H al azar y tratar de moverlo una casilla hacia el centro
    const randomIndex = h_indices[Math.floor(Math.random() * h_indices.length)];
    const currentPos = env.chain[randomIndex];

    const dx = centerX - currentPos.x;
    const dy = centerY - currentPos.y;

    let moveX = 0, moveY = 0;
    if (Math.abs(dx) > Math.abs(dy)) {
        moveX = Math.sign(dx);
    } else {
        moveY = Math.sign(dy);
    }

    if (moveX === 0 && moveY === 0) return false;

    // Esta es una simplificación. Una implementación real requeriría movimientos
    // más complejos para mantener la conectividad. Por ahora, reutilizamos una rotación.
    return rotateSegment(env, Math.random() < 0.5 ? 'cw' : 'ccw');
}