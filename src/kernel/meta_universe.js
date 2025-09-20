export class MetaUniverse {
    /**
     * Meta-Universe: ecosistema evolutivo de estrategias mínimas (COCs).
     * @param {object} config - Configuración evolutiva
     * @param {object} environment - Entorno (e.g., TSP)
     * @param {Array} initialPopulation - COCs iniciales
     * @param {object} strategyLibrary - Módulo con funciones de estrategia exportadas (genoma)
     */
    constructor(config, environment, initialPopulation = [], strategyLibrary = {}) {
        this.config = {
            maxPopulation: 100,
            crossoverRate: 0.7,
            mutationRate: 0.3,
            eliteSurvivalRate: 0.1,
            evolutionInterval: 20,
            initialTemperature: 100.0,
            coolingRate: 0.999,
            explorationRate: 0.05,
            ...config
        };

        this.environment = environment;
        this.population = initialPopulation;

        // Genoma disponible para mutaciones y recombinaciones
        this.strategyLibrary = Object.entries(strategyLibrary || {});

        this.tickCount = 0;
        this.temperature = this.config.initialTemperature;
        this.bestTour = null;
        this.bestDistance = Infinity;
    }

    /**
     * Ejecuta un ciclo de vida del universo.
     */
    tick() {
        if (this.population.length === 0) return;

        // Ratchet: reinicia el entorno al mejor tour conocido
        if (typeof this.environment.setTour === 'function' && this.bestTour) {
            this.environment.setTour(this.bestTour);
        }

        this.tickCount++;

        const initialScore = this.environment.evaluate();
        const strategy = this.selectStrategy();
        const applied = strategy.apply(this.environment);
        const finalScore = this.environment.evaluate();
        const deltaScore = finalScore - initialScore;

        strategy.feedback(deltaScore, this.temperature);

        // Registrar nuevo mejor tour
        if (finalScore < this.bestDistance) {
            this.bestDistance = finalScore;
            if (typeof this.environment.get_current_tour === 'function') {
                this.bestTour = this.environment.get_current_tour();
            }
            console.log(`\n✨ [MetaUniverse] Nuevo mejor score: ${this.bestDistance.toFixed(2)}`);
        }

        // Evolución periódica
        if (this.tickCount % this.config.evolutionInterval === 0) {
            this.evolvePopulation();
        }

        // Enfriamiento gradual
        this.temperature *= this.config.coolingRate;

        return {
            tick: this.tickCount,
            applied: applied,
            strategy: strategy.toString(),
            deltaScore: deltaScore,
            score: finalScore,
            temperature: this.temperature.toFixed(3)
        };
    }

    /**
     * Selección de estrategia (epsilon-greedy).
     */
    selectStrategy() {
        if (Math.random() < this.config.explorationRate) {
            const randomIndex = Math.floor(Math.random() * this.population.length);
            return this.population[randomIndex];
        }

        const totalCoherence = this.population.reduce((sum, coc) => sum + coc.coherence, 0);
        if (totalCoherence === 0) {
            const randomIndex = Math.floor(Math.random() * this.population.length);
            return this.population[randomIndex];
        }

        const r = Math.random() * totalCoherence;
        let acc = 0;
        for (const coc of this.population) {
            acc += coc.coherence;
            if (r <= acc) return coc;
        }

        return this.population[this.population.length - 1]; // fallback
    }

    /**
     * Evoluciona la población mediante crossover y mutación.
     */
    evolvePopulation() {
        if (this.population.length < 2) return;

        this.population.sort((a, b) => b.coherence - a.coherence);
        const eliteCount = Math.floor(this.population.length * this.config.eliteSurvivalRate);
        const elites = this.population.slice(0, eliteCount);
        const newPopulation = [...elites];

        while (newPopulation.length < this.config.maxPopulation) {
            const useCrossover = Math.random() < this.config.crossoverRate;

            if (useCrossover) {
                const parentA = this.tournamentSelect();
                const parentB = this.tournamentSelect();
                if (parentA && parentB && parentA.id !== parentB.id) {
                    const child = parentA.crossover(parentB, this.strategyLibrary); // CORRECTO: sin asignación errónea
                    newPopulation.push(child);
                } else if (parentA) {
                    newPopulation.push(parentA.cloneWithMutation(this.strategyLibrary));
                }
            } else {
                const parent = this.tournamentSelect();
                if (parent) {
                    const child = parent.cloneWithMutation(this.strategyLibrary);
                    newPopulation.push(child);
                }
            }
        }

        this.population = newPopulation.slice(0, this.config.maxPopulation);
    }

    /**
     * Selección por torneo (el mejor entre k aleatorios).
     */
    tournamentSelect(k = 3) {
        let best = null;
        for (let i = 0; i < k; i++) {
            const randIndex = Math.floor(Math.random() * this.population.length);
            const candidate = this.population[randIndex];
            if (!best || candidate.coherence > best.coherence) {
                best = candidate;
            }
        }
        return best;
    }

    /**
     * Agrega un nuevo COC manualmente a la población.
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
                .slice()
                .sort((a, b) => b.coherence - a.coherence)
                .slice(0, 5)
                .map(c => c.toString()),
            temperature: this.temperature.toFixed(3),
            bestScore: this.bestDistance
        };
    }
}
