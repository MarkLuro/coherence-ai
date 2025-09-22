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
        } else {
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


/**
 * ESTRATEGIA 3: Movimiento de Tracción (Pull Move) - Implementación Robusta.
 * Este movimiento es una operación fundamental y compleja para explorar el espacio conformacional.
 * 1. Elige un aminoácido 'i'.
 * 2. Elige uno de sus vecinos, 'j' (sea i-1 o i+1).
 * 3. Mueve 'i' a una nueva posición vacía 'p_new' que sea adyacente a 'j'.
 * 4. El resto de la cadena (desde la antigua posición de 'i' hasta el extremo) se desplaza,
 *    siguiendo la antigua ruta de la cadena para mantener la conectividad.
 * 5. Se valida que la nueva configuración completa no tenga colisiones.
 * @param {import('../physics/protein_environment.js').ProteinEnvironment} env
 * @returns {boolean}
 */
export function pullMove(env) {
    if (env.numAminoAcids < 3) return false;

    // 1. Elige un residuo 'i' al azar para mover
    const i = Math.floor(Math.random() * env.numAminoAcids);
    const pos_i = env.chain[i];

    // 2. Elige un vecino 'j' como pivote (i-1 o i+1)
    const neighbors = [];
    if (i > 0) neighbors.push(i - 1);
    if (i < env.numAminoAcids - 1) neighbors.push(i + 1);
    if (neighbors.length === 0) return false;

    const j = neighbors[Math.floor(Math.random() * neighbors.length)];
    const pos_j = env.chain[j];

    // 3. Encuentra las posiciones de destino candidatas para 'i'
    //    (deben estar vacías y adyacentes al pivote 'j')
    const candidates = [
        { x: pos_j.x + 1, y: pos_j.y },
        { x: pos_j.x - 1, y: pos_j.y },
        { x: pos_j.x, y: pos_j.y + 1 },
        { x: pos_j.x, y: pos_j.y - 1 },
    ];

    const validTargets = candidates.filter(p => !env.occupiedCoords.has(`${p.x},${p.y}`));
    if (validTargets.length === 0) return false;

    const newPos_i = validTargets[Math.floor(Math.random() * validTargets.length)];

    // 4. Construye la nueva cadena
    const newChain = new Array(env.numAminoAcids);
    newChain[i] = newPos_i;
    newChain[j] = pos_j;

    if (j === i - 1) {
        // 'i' se movió, pivoteando sobre 'i-1'. El resto de la cadena (0..i-2) lo sigue.
        for (let k = j - 1; k >= 0; k--) {
            newChain[k] = env.chain[k + 1];
        }
        // El otro lado (i+1...) permanece igual
        for (let k = i + 1; k < env.numAminoAcids; k++) {
            newChain[k] = env.chain[k];
        }
    } else {
        // 'i' se movió, pivoteando sobre 'i+1'. El resto de la cadena (i+2...) lo sigue.
        for (let k = j + 1; k < env.numAminoAcids; k++) {
            newChain[k] = env.chain[k - 1];
        }
        // El otro lado (0..i-1) permanece igual
        for (let k = 0; k < i; k++) {
            newChain[k] = env.chain[k];
        }
    }

    // 5. Validar la cadena completa y actualizar el entorno
    return env.updateChain(newChain);
}
