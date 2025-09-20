// FORGED: src/physics/protein_environment.js

/**
 * @file src/physics/protein_environment.js
 * @description El entorno físico para el problema de plegamiento de proteínas (HP Model en 2D).
 *              Define la "física" del universo molecular: una cadena de aminoácidos
 *              que busca la configuración de mínima energía (máxima coherencia).
 */

export class ProteinEnvironment {
    /**
     * @param {string} sequence - Secuencia de aminoácidos, ej. "HPHPPHHPHPPHPHHPPHPH"
     */
    constructor(sequence) {
        if (!sequence || !/^[HP]+$/.test(sequence)) {
            throw new Error("ProteinEnvironment requiere una secuencia válida de 'H' y 'P'.");
        }
        this.sequence = sequence;
        this.numAminoAcids = sequence.length;

        // --- PROTOCOLO "BIG BANG MOLECULAR" ---
        // El estado inicial es una simple línea recta, una configuración de baja coherencia.
        this.chain = Array.from({ length: this.numAminoAcids }, (_, i) => ({ x: i, y: 0 }));
        this.occupiedCoords = new Set(this.chain.map(c => `${c.x},${c.y}`));
    }

    /**
     * Evalúa la "energía libre" del plegado actual.
     * En el modelo HP, esto es -1 por cada enlace topológico H-H no adyacente.
     * Un valor más bajo (más negativo) es mejor. Es la medida de la Coherencia del sistema.
     * @returns {number}
     */
    evaluate() {
        let energy = 0;
        for (let i = 0; i < this.numAminoAcids; i++) {
            if (this.sequence[i] === 'H') {
                for (let j = i + 2; j < this.numAminoAcids; j++) {
                    if (this.sequence[j] === 'H') {
                        const distSq = (this.chain[i].x - this.chain[j].x)**2 + (this.chain[i].y - this.chain[j].y)**2;
                        if (distSq === 1) {
                            energy -= 1; // Enlace H-H coherente encontrado
                        }
                    }
                }
            }
        }
        return energy;
    }

    /**
     * Verifica si una nueva configuración de la cadena es válida (conectada y sin solapamientos).
     * @param {Array<{x: number, y: number}>} newChain
     * @returns {boolean}
     */
    isValid(newChain) {
        // 1. Verificar auto-solapamiento
        const coords = new Set();
        for (const pos of newChain) {
            const key = `${pos.x},${pos.y}`;
            if (coords.has(key)) return false; // Colisión
            coords.add(key);
        }

        // 2. Verificar conectividad (distancia entre vecinos es siempre 1)
        for (let i = 0; i < newChain.length - 1; i++) {
            const distSq = (newChain[i].x - newChain[i+1].x)**2 + (newChain[i].y - newChain[i+1].y)**2;
            if (distSq !== 1) return false; // Cadena rota
        }

        return true;
    }

    /**
     * Aplica una nueva configuración a la cadena si es válida.
     * @param {Array<{x: number, y: number}>} newChain
     * @returns {boolean} - True si la actualización fue exitosa.
     */
    updateChain(newChain) {
        if (this.isValid(newChain)) {
            this.chain = newChain;
            this.occupiedCoords = new Set(this.chain.map(c => `${c.x},${c.y}`));
            return true;
        }
        return false;
    }

    // Helper para visualizar el estado
    toString() {
        // Implementación simple para debugging en consola
        return `Energy: ${this.evaluate()}`;
    }
}