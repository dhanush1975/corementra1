
  import { createRoot } from "react-dom/client";
  import { Amplify } from "aws-amplify";
  import outputs from "../amplify_outputs.json";
  import "./styles/index.css";

  Amplify.configure(outputs);

  // Dynamic import defers evaluating App (and everything it transitively
  // imports, including generateClient() calls) until after Amplify.configure()
  // has run — static imports are hoisted and would run first otherwise.
  import("./app/App.tsx").then(({ default: App }) => {
    createRoot(document.getElementById("root")!).render(<App />);
  });
