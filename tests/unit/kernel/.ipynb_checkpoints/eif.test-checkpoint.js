import { expect } from 'chai';
import EpistemicIntegrityFramework, { VERDICTS } from '../../../src/kernel/logic/eif.js';

describe('EpistemicIntegrityFramework', () => {
    it('should return COHERENT for new, non-conflicting data', () => {
        const mockIIS = { get: (key) => undefined };
        const eif = new EpistemicIntegrityFramework(mockIIS);
        const delta = { key: '/test', value: 123 };
        const result = eif.verifyCoherence(delta);
        expect(result.verdict).to.equal(VERDICTS.COHERENT);
    });
});
