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
const fs = __importStar(require("fs-extra-promise"));
const _ = __importStar(require("lodash"));
const path = __importStar(require("path"));
const screepsServer_1 = __importDefault(require("../src/screepsServer"));
// eslint-disable-next-line import/no-unresolved
const stdHooks = require('../utils/stdhooks');
// Dirty hack to prevent driver from flooding error messages
stdHooks.hookWrite();
suite('Basics tests', function () {
    this.timeout(30 * 1000);
    this.slow(5 * 1000);
    // Server variable used for the tests
    let server = null;
    test('Starting server and running a few ticks without error', async () => {
        server = new screepsServer_1.default();
        await server.start();
        for (let i = 0; i < 5; i += 1) {
            await server.tick();
        }
        server.stop();
    });
    test('Setting options in server constructor', async () => {
        // Setup options and server
        const opts = {
            path: 'another_dir',
            logdir: 'another_logdir',
            port: 9999,
        };
        server = new screepsServer_1.default(opts);
        // Assert if options are correctly registered
        const serverOpts = server.getOpts();
        assert.strictEqual(serverOpts.path, opts.path);
        assert.strictEqual(serverOpts.logdir, opts.logdir);
        assert.strictEqual(serverOpts.port, opts.port);
        // Start, then stop server
        await server.start();
        await server.tick();
        server.stop();
        // Assert if files where actually created in the good directory
        fs.accessSync(path.resolve(opts.path));
        fs.accessSync(path.resolve(opts.logdir));
    });
    test('Running user code', async () => {
        // Server initialization
        server = new screepsServer_1.default();
        await server.world.stubWorld();
        // Code declaration
        const modules = {
            main: `module.exports.loop = function() {
               console.log('tick', Game.time);
            }`,
        };
        // User / bot initialization
        let logs = [];
        const user = await server.world.addBot({ username: 'bot', room: 'W0N0', x: 25, y: 25, modules });
        user.on('console', (log) => {
            logs = logs.concat(log);
        });
        // Run a few ticks
        await server.start();
        for (let i = 0; i < 5; i += 1) {
            await server.tick();
        }
        server.stop();
        // Assert if code was correctly executed
        assert.deepStrictEqual(logs, ['tick 1', 'tick 2', 'tick 3', 'tick 4', 'tick 5']);
    });
    test('Getting current tick', async () => {
        // Server initialization
        server = new screepsServer_1.default();
        await server.world.reset();
        assert.strictEqual(await server.world.gameTime, 1);
        // Run a few ticks and assert if tick is correct
        await server.start();
        for (let time = 2; time <= 5; time += 1) {
            await server.tick();
            assert.strictEqual(await server.world.gameTime, time);
        }
        // Stop server
        server.stop();
    });
    teardown(async () => {
        // Make sure that server is stopped in case something went wrong
        if (server && _.isFunction(server.stop)) {
            server.stop();
            server = null;
        }
        // Delete server files
        await fs.removeAsync(path.resolve('server')).catch(console.error);
        await fs.removeAsync(path.resolve('another_dir')).catch(console.error);
        await fs.removeAsync(path.resolve('another_logdir')).catch(console.error);
    });
});
