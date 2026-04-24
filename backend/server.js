//Start Server
const app = require("./src/app");
const PORT = 3000; //typically for Node-Servers
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
