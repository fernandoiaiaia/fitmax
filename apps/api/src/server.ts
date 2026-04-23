import express from 'express';
import pino from 'pino';

const app = express();
const logger = pino();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'FitMax API is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
