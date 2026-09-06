import app from "./app.mjs";
const port = process.env.PORT || 4317;
app
  .listen(port, process.env.HOST || "127.0.0.1", () =>
    console.log("Public ledger API listening on " + port),
  )
  .on("error", (error) => {
    console.error(error.message);
    process.exit(1);
  });
