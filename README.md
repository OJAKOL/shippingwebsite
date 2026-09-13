# ZAHAATI Freight Website

## Local setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Create the local environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Set the MySQL password in `.env` and apply the schema:

   ```powershell
   mysql -u root -p < database_schema.sql
   ```

4. Start the backend and static site:

   ```powershell
   npm start
   ```

   Open `http://localhost:3000`.

## Production deployment

GitHub Pages hosts the static HTML, CSS, and JavaScript only. Deploy `server.js` separately on a Node-compatible host with a reachable MySQL database.

Set these backend environment variables on the API host:

- `PORT`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `FRONTEND_ORIGIN` set to the exact GitHub Pages origin, for example `https://ojakol.github.io`
- `NODE_ENV=production`

After deploying the API, edit `config.js` before publishing the static site:

```js
window.ZAHAATI_API_BASE = 'https://api.example.com/api';
```

The production server refuses to start when required database or frontend-origin configuration is missing. Authentication, quote, address, and shipment requests use HttpOnly session cookies and credentialed CORS.

## Database updates

Re-run `database_schema.sql` when new tables are added. It currently creates users, sessions, addresses, quotes, shipments, services, categories, and newsletter subscriptions.
