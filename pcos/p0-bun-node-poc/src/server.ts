import express, { Request, Response } from 'express';

const app = express();

app.get('/', (req: Request, res: Response): void => {
  res.send('Hello from POC Server!');
});

const PORT = process.env.PORT || 3000; // Default to 3000 if PORT is not set

app.listen(PORT, (): void => {
  console.log(`Server running on http://localhost:${PORT}`);
});