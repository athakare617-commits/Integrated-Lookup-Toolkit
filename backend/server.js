import app from './app.js';
import { autoPushSchemaAndSeed } from './config/db.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(` Integrated Lookup Toolkit API Server running`);
  console.log(` Port: ${PORT}`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);

  // Run automated database check and schema/seed push
  try {
    await autoPushSchemaAndSeed();
  } catch (err) {
    console.warn('Startup database autopush encountered an error:', err.message);
  }
});

export default server;
