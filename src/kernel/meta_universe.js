// src/kernel/meta_universe.js

import { StrategyCOC } from '../agents/strategy_coc.js';
import { TSPEnvironment } from '../physics/tsp_environment.js';

/**
 * Meta-Universe: ecosistema evolutivo de estrategias mínimas (COCs).
 */
export class MetaUniverse {
    /**
     * @param {object} config - Configuración inicial
     * @param {TSPEnvironment} tspEnv - Entorno físico del TSP
     * @param {StrategyCOC[]} initialPopulation - Población inicial de COCs
     */
    constructor(config, tspEnv, initialPopulation = []) {
        this.config = {
            maxPopulation: 50,
            mutationRate: 0.2,
            eliteSurvivalRate: 0.2,
            evolutionInterval: 10,
            ...config
        };

        this.tspEnv = tspEnv;
        this.population = initialPopulation;
        this.tickCount = 0;

        // --- Memoria del mejor tour ---
        this.bestTour = null;
        this.bestDistance = Infinity;
    }

    /**
     * Ejecuta un ciclo de vida completo del Meta-Universe.
     */
    tick() {
        if (this.population.length === 0) return;

        this.tickCount++;

        const initialScore = this.tspEnv.evaluate();

        const strategy = this.selectStrategy();
        const applied = strategy.apply(this.tspEnv);

        const finalScore = this.tspEnv.evaluate();
        const deltaScore = finalScore - initialScore;

        strategy.feedback(deltaScore);

        // --- Registro del mejor tour encontrado ---
        const currentTour = this.tspEnv.get_current_tour();
        if (currentTour) {
            let tourDistance = 0;
            for (let i = 0; i < currentTour.length; i++) {
                const from = currentTour[i];
                const to = currentTour[(i + 1) % currentTour.length];
                tourDistance += this.tspEnv.distanceMatrix[from][to];
            }

            if (tourDistance < this.bestDistance) {
                this.bestDistance = tourDistance;
                this.bestTour = currentTour;
                console.log(`✨ [MetaUniverse] Nuevo mejor tour: ${this.bestDistance.toFixed(2)}`);
            }
        }

        if (this.tickCount % this.config.evolutionInterval === 0) {
            this.evolvePopulation();
        }

        return {
            tick: this.tickCount,
            applied: applied,
            strategy: strategy.toString(),
            deltaScore: deltaScore.toFixed(2),
            score: finalScore.toFixed(2)
        };
    }

    /**
     * Selecciona una estrategia de la población, ponderado por coherencia.
     */
    selectStrategy() {
        const total = this.population.reduce((sum, coc) => sum + coc.coherence, 0);
        const r = Math.random() * total;

        let acc = 0;
        for (const coc of this.population) {
            acc += coc.coherence;
            if (r <= acc) return coc;
        }

        return this.population[Math.floor(Math.random() * this.population.length)];
    }

    /**
     * Ejecuta la evolución: selección, reproducción, mutación.
     */
    evolvePopulation() {
        this.population.sort((a, b) => b.coherence - a.coherence);

        const eliteCount = Math.floor(this.population.length * this.config.eliteSurvivalRate);
        const elites = this.population.slice(0, eliteCount);

        const newOffspring = [];

        for (let i = 0; i < this.population.length - eliteCount; i++) {
            const parent = this.tournamentSelect();
            let child = parent.cloneWithMutation();

            if (Math.random() < this.config.mutationRate) {
                child = child.cloneWithMutation();
            }

            newOffspring.push(child);
        }

        this.population = [...elites, ...newOffspring].slice(0, this.config.maxPopulation);
    }

    /**
     * Selección por torneo.
     */
    tournamentSelect(k = 3) {
        const competitors = [];
        for (let i = 0; i < k; i++) {
            const randIndex = Math.floor(Math.random() * this.population.length);
            competitors.push(this.population[randIndex]);
        }
        return competitors.reduce((best, curr) =>
            curr.coherence > best.coherence ? curr : best
        );
    }

    /**
     * Agrega una nueva estrategia a la población.
     */
    addStrategy(coc) {
        this.population.push(coc);
    }

    /**
     * Devuelve un resumen del estado del universo.
     */
    getStatus() {
        return {
            tick: this.tickCount,
            populationSize: this.population.length,
            topStrategies: this.population
                .sort((a, b) => b.coherence - a.coherence)
                .slice(0, 5)
                .map(c => c.toString())
        };
    }
}
