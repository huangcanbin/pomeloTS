Object.defineProperty(exports, "__esModule", { value: true });
const pomeloLogger = require("pomelo-logger");
const system = require("system");
let logger = pomeloLogger.getLogger("bgx", system.__filename);
exports.default = logger;
