"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const terrainMatrix_1 = __importDefault(require("../src/terrainMatrix"));
suite('TerrainMatrix tests', () => {
    test('Setting and getting values', async () => {
        // Define matrix
        const matrix = new terrainMatrix_1.default();
        matrix.set(0, 1, 'wall');
        matrix.set(0, 1, 'swamp');
        matrix.set(0, 2, 'wall');
        // Test it
        assert.strictEqual(matrix.get(0, 0), 'plain');
        assert.strictEqual(matrix.get(0, 1), 'swamp');
        assert.strictEqual(matrix.get(0, 2), 'wall');
        assert.strictEqual(matrix.get(0, 3), 'plain');
    });
    test('Serializing and unserializing', async () => {
        // Define matrix
        let matrix = new terrainMatrix_1.default();
        matrix.set(1, 0, 'swamp');
        matrix.set(2, 0, 'wall');
        // Test serialization
        const terrain = Array(50 * 50).fill(0);
        terrain[1] = 2;
        terrain[2] = 1;
        const serial = terrain.join('');
        assert.strictEqual(matrix.serialize(), serial);
        // Test unserialization
        matrix = terrainMatrix_1.default.unserialize(serial);
        assert.strictEqual(matrix.get(0, 0), 'plain');
        assert.strictEqual(matrix.get(1, 0), 'swamp');
        assert.strictEqual(matrix.get(2, 0), 'wall');
        assert.strictEqual(matrix.get(3, 0), 'plain');
    });
});
