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
const assert_1 = __importDefault(require("assert"));
const fs = __importStar(require("fs-extra-promise"));
const _ = __importStar(require("lodash"));
const path = __importStar(require("path"));
const screepsServer_1 = __importDefault(require("../src/screepsServer"));
const stdHooks = require('../utils/stdhooks');
// Dirty hack to prevent driver from flooding error messages
stdHooks.hookWrite();
suite('User tests', function () {
    this.timeout(30 * 1000);
    this.slow(5 * 1000);
    // Server variable used for the tests
    let server = null;
    test('Getting basic user attributes and statistics', async () => {
        // Server initialization
        server = new screepsServer_1.default();
        await server.start();
        // User / bot initialization
        const modules = {
            main: `module.exports.loop = function() {
                Memory.foo = { bar: 'baz' }
            }`,
        };
        const user = await server.world.addBot({ username: 'bot', room: 'W0N0', x: 25, y: 25, modules });
        // Run one tick
        await server.tick();
        (await user.newNotifications).forEach(({ message }) => console.log('[notification]', message));
        // Assert if attributes are correct
        (0, assert_1.default)(_.isString(user.id) && user.id.length > 0, 'invalid user id');
        assert_1.default.strictEqual(user.username, 'bot');
        assert_1.default.strictEqual(await user.cpu, 100);
        assert_1.default.strictEqual(await user.cpuAvailable, 10000);
        (0, assert_1.default)(_.isNumber(await user.lastUsedCpu), 'user.lastUsedCpu is not a number');
        assert_1.default.strictEqual(await user.gcl, 1);
        assert_1.default.deepStrictEqual(await user.rooms, ['W0N0']);
        // Assert if memory is correctly set and retrieved
        const memory = JSON.parse(await user.memory);
        const reference = { foo: { bar: 'baz' } };
        assert_1.default.deepStrictEqual(memory, reference);
        // Stop server (don't stop it before we get all info)
        server.stop();
    });
    test('Getting segments contents', async () => {
        // Server initialization
        server = new screepsServer_1.default();
        await server.world.stubWorld();
        // Code declaration
        const modules = {
            main: `module.exports.loop = function() {
                RawMemory.setActiveSegments([0, 1]);
                if (_.size(RawMemory.segments) > 0) {
                    RawMemory.segments[0] = '{"foo":"bar"}';
                    RawMemory.segments[1] = 'azerty';
                }
            }`,
        };
        // User / bot initialization
        const user = await server.world.addBot({ username: 'bot', room: 'W0N0', x: 25, y: 25, modules });
        // Run a few ticks
        await server.start();
        for (let i = 0; i < 3; i += 1) {
            await server.tick();
        }
        // Verify active segments in database
        assert_1.default.deepStrictEqual(await user.activeSegments, [0, 1]);
        // Verify segments contents
        const segments = await user.getSegments([0, 1]);
        assert_1.default.strictEqual(segments[0], '{"foo":"bar"}');
        assert_1.default.strictEqual(segments[1], 'azerty');
        // Stop server (don't stop it before we get segments)
        server.stop();
    });
    test('Sending console commands and getting console logs', async () => {
        // Server initialization
        server = new screepsServer_1.default();
        await server.world.stubWorld();
        // Code declaration
        const modules = {
            main: `module.exports.loop = function() {
               console.log('tick')
            }`,
        };
        const logs = [];
        const user = await server.world.addBot({ username: 'bot', room: 'W0N0', x: 25, y: 25, modules });
        user.on('console', (log, results, userid, username) => {
            logs.push({ log, results, userid, username });
        });
        // Run a few ticks
        await server.start();
        for (let i = 0; i < 5; i += 1) {
            await user.console('_.sample(Game.spawns).owner.username');
            await server.tick();
        }
        server.stop();
        // Assert if code was correctly executed
        _.each(logs, ({ log, results, userid, username }) => {
            assert_1.default.strictEqual(userid, user.id);
            assert_1.default.strictEqual(username, 'bot');
            assert_1.default.deepStrictEqual(log, ['tick']);
            assert_1.default.deepStrictEqual(results, ['bot']);
        });
    });
    test('Getting notifications and errors', async () => {
        // Server initialization
        server = new screepsServer_1.default();
        await server.world.stubWorld();
        // Code declaration
        const modules = {
            main: `module.exports.loop = function() {
                throw new Error('something broke!')
            }`,
        };
        // User / bot initialization
        const user = await server.world.addBot({ username: 'bot', room: 'W0N0', x: 25, y: 25, modules });
        // Run a few ticks
        await server.start();
        for (let i = 0; i < 3; i += 1) {
            await server.tick();
        }
        // Assert if code was correctly executed
        _.each(await user.notifications, ({ message, type }) => {
            assert_1.default.strictEqual(type, 'error');
            (0, assert_1.default)(message.includes('something broke!'), 'message doesn\'t cointain "something broke!"');
            (0, assert_1.default)(message.includes('main:2'), 'message doesn\'t cointain error line');
        });
        // Stop server (don't stop it before we get all notifications)
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
    });
});
