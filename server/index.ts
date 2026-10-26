import { apiApp } from './api.ts';

const PORT = process.env.PORT || 3001;

apiApp.listen(PORT, () => {
  console.log(`[Iventra SQLite Backend] Server listening on http://localhost:${PORT}`);
});
