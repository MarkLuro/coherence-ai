// src/applications/meta_solver/cli.js

import { MetaUniverse } from '../../kernel/meta_universe.js';
import { TSPEnvironment } from '../../physics/tsp_environment.js';
import { StrategyCOC } from '../../agents/strategy_coc.js';
import { connectNearest, breakLongestEdge, connectDegreeBalanced } from '../../strategies/library.js';

// 1. Definir el entorno físico (10 ciudades aleatorias para demo)
const cities = Array.from({ length: 10 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100
}));
const tsp = new TSPEnvironment(cities);

// 2. Crear estrategias iniciales (semillas)
const seedPopulation = [
    new StrategyCOC("connectNearest", connectNearest, { origin: "seed", generation: 0 }),
    new StrategyCOC("breakLongestEdge", breakLongestEdge, { origin: "seed", generation: 0 }),
    new StrategyCOC("connectDegreeBalanced", connectDegreeBalanced, { origin: "seed", generation: 0 })
];

// 3. Instanciar el Meta-Universe con estas estrategias
const meta = new MetaUniverse({}, tsp, seedPopulation);

// 4. Ejecutar la simulación
const totalTicks = 100;
console.log(`🔁 Starting Meta-Universe simulation for ${totalTicks} ticks...\n`);

for (let i = 0; i < totalTicks; i++) {
    const log = meta.tick();

    console.log(`🌀 Tick ${log.tick}`);
    console.log(`   ➤ Strategy: ${log.strategy}`);
    console.log(`   ➤ ΔScore: ${log.deltaScore}`);
    console.log(`   ➤ Current Score: ${log.score}\n`);
}

// 5. Mostrar top estrategias
console.log("\n🌟 Top Strategies:");
console.log(meta.getStatus().topStrategies.join("\n"));
