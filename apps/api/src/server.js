"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pino_1 = __importDefault(require("pino"));
const app = (0, express_1.default)();
const logger = (0, pino_1.default)();
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.json({ message: 'FitMax API is running' });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
