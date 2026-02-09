"use strict";
/**
 * CryptoResonate Module
 *
 * Cryptographic extensions for Resonate SDK:
 * - Input/output hashing
 * - Cryptographic commitments
 * - Merkle tree generation
 * - Proof verification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineHashes = exports.canonicalJSON = exports.verify = exports.sign = exports.hashObject = exports.PromiseMerkleTree = exports.CryptoResonate = void 0;
var CryptoResonate_1 = require("./CryptoResonate");
Object.defineProperty(exports, "CryptoResonate", { enumerable: true, get: function () { return CryptoResonate_1.CryptoResonate; } });
var merkle_1 = require("./merkle");
Object.defineProperty(exports, "PromiseMerkleTree", { enumerable: true, get: function () { return merkle_1.PromiseMerkleTree; } });
var utils_1 = require("./utils");
Object.defineProperty(exports, "hashObject", { enumerable: true, get: function () { return utils_1.hashObject; } });
Object.defineProperty(exports, "sign", { enumerable: true, get: function () { return utils_1.sign; } });
Object.defineProperty(exports, "verify", { enumerable: true, get: function () { return utils_1.verify; } });
Object.defineProperty(exports, "canonicalJSON", { enumerable: true, get: function () { return utils_1.canonicalJSON; } });
Object.defineProperty(exports, "combineHashes", { enumerable: true, get: function () { return utils_1.combineHashes; } });
