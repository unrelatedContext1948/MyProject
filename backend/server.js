//Start Server
const app = require("./src/app");
const PORT = 3000; //typically for Node-Servers
app.listen(PORT, (err) => {
  if (err) {
    console.log("The Server did not start:", err);
    return;
  }
  console.log(`The Server is running on http://localhost:${PORT}`);
});
