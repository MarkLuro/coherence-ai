// FORGED: src/agents/strategy_coc.js

// [CORRECCIÓN DEFINITIVA] No debe haber NINGUNA importación de librerías de estrategias aquí.

export class StrategyCOC {
    constructor(id, actionFn, meta = {}) {
        this.id = id;
        this.action = actionFn;
        this.coherence = 1.0;
        this.uses = 0;
        this.successes = 0;
        this.failures = 0;
        this.meta = meta;
    }

    apply(env) {
        try {
            const result = this.action(env);
            this.uses += 1;
            return result;
        } catch (err) {
            console.warn(`[StrategyCOC:${this.id}] Falló durante apply():`, err.message);
            return false;
        }
    }

    feedback(deltaScore, temperature) {
        if (deltaScore < 0) {
            this.successes += 1;
            this.coherence *= 1.05;
        } else {
            const acceptanceProbability = Math.exp(-deltaScore / temperature);
            if (Math.random() < acceptanceProbability) {
                this.coherence *= 1.01;
            } else {
                this.failures += 1;
                this.coherence *= 0.95;
            }
        }

        this.coherence = Math.min(Math.max(this.coherence, 0.01), 10.0);
    }

    cloneWithMutation(availableActions = []) {
        const mutatedAction = this.mutateAction(this.action, availableActions);
        const childMeta = {
            parent: this.id,
            generation: (this.meta.generation || 0) + 1,
            lineage: 'asexual'
        };

        const newIdBase = mutatedAction.displayName || this.id.split('_')[0];
        const newId = `${newIdBase}_mut${Date.now() % 100000}`;
        const newStrategy = new StrategyCOC(newId, mutatedAction, childMeta);

        newStrategy.action.displayName = mutatedAction.displayName || this.action.displayName || this.id.split('_')[0];
        return newStrategy;
    }

    mutateAction(originalActionFn, availableActions) {
        if (Math.random() < 0.3 && availableActions && availableActions.length > 0) {
            const [secondName, secondActionFn] =
                availableActions[Math.floor(Math.random() * availableActions.length)];

            const compositeAction = (env) => {
                originalActionFn(env);
                return secondActionFn(env);
            };

            const originalName = originalActionFn.displayName || originalActionFn.name || 'base';
            compositeAction.displayName = `${originalName}+${secondName}`;

            console.log(`\n[MetaUniverse] ⚛️  GÉNESIS POR MUTACIÓN: Nació una estrategia compuesta -> ${compositeAction.displayName}`);
            return compositeAction;
        }

        return originalActionFn;
    }

    crossover(partner, availableActions = []) {
        const parentA_actions = this._getActionSequence(availableActions);
        const parentB_actions = partner._getActionSequence(availableActions);

        if (parentA_actions.length === 0 || parentB_actions.length === 0) {
            return this.cloneWithMutation(availableActions); // fallback
        }

        const crossoverPointA = Math.floor(Math.random() * parentA_actions.length);
        const crossoverPointB = Math.floor(Math.random() * parentB_actions.length);

        const child_actions = [
            ...parentA_actions.slice(0, crossoverPointA),
            ...parentB_actions.slice(crossoverPointB)
        ];

        if (child_actions.length === 0) {
            child_actions.push(...parentA_actions);
        }

        const childActionFn = (env) => {
            let result = false;
            for (const action of child_actions) {
                result = action.fn(env);
            }
            return result;
        };

        const parentAName = this.action.displayName || this.id.split('_')[0];
        const parentBName = partner.action.displayName || partner.id.split('_')[0];
        childActionFn.displayName = `x(${parentAName.substring(0,4)}|${parentBName.substring(0,4)})`;

        console.log(`\n[MetaUniverse] 🧬 GÉNESIS POR CROSSOVER: Nació un híbrido -> ${childActionFn.displayName}`);

        const childMeta = {
            parents: [this.id, partner.id],
            generation: Math.max(this.meta.generation || 0, partner.meta.generation || 0) + 1,
            lineage: 'sexual'
        };

        const newId = `${childActionFn.displayName}_x${Date.now() % 100000}`;
        const childCOC = new StrategyCOC(newId, childActionFn, childMeta);
        childCOC.action.displayName = childActionFn.displayName;
        return childCOC;
    }

    _getActionSequence(availableActions = []) {
        const name = this.action.displayName || this.id.split('_')[0];

        if (name.includes('+')) {
            const actionNames = name.split('+');
            const actionParts = actionNames.map(partName => {
                const foundAction = availableActions.find(([libName]) => libName === partName);
                return foundAction ? { name: foundAction[0], fn: foundAction[1] } : null;
            }).filter(Boolean);

            return actionParts;
        }

        const foundAction = availableActions.find(([libName]) => libName === name);
        return foundAction ? [{ name: foundAction[0], fn: foundAction[1] }] : [];
    }

    toString() {
        const baseId = this.action.displayName || this.id.split('_')[0];
        return `[COC:${baseId}] coh=${this.coherence.toFixed(2)} | uses=${this.uses} | meta=${JSON.stringify(this.meta)}`;
    }
}
