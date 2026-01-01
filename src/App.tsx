import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const controlClassName =
    "h-9 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="m-0 min-h-screen pt-24 text-center flex flex-col items-center space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">
        Welcome to Tauri + React
      </h1>

      <div className="flex items-center justify-center gap-4">
        <a
          href="https://vite.dev"
          target="_blank"
          className="font-medium text-primary hover:text-primary/80"
        >
          <img
            src="/vite.svg"
            className="h-16 p-3 will-change-[filter] transition-[filter] duration-750 hover:drop-shadow-[0_0_2em_#747bff]"
            alt="Vite logo"
          />
        </a>
        <a
          href="https://tauri.app"
          target="_blank"
          className="font-medium text-primary hover:text-primary/80"
        >
          <img
            src="/tauri.svg"
            className="h-16 p-3 will-change-[filter] transition-[filter] duration-750 hover:drop-shadow-[0_0_2em_#24c8db]"
            alt="Tauri logo"
          />
        </a>
        <a
          href="https://react.dev"
          target="_blank"
          className="font-medium text-primary hover:text-primary/80"
        >
          <img
            src={reactLogo}
            className="h-16 p-3 will-change-[filter] transition-[filter] duration-750 hover:drop-shadow-[0_0_2em_#61dafb]"
            alt="React logo"
          />
        </a>
      </div>
      <p className="text-sm text-muted-foreground">
        Click on the Tauri, Vite, and React logos to learn more.
      </p>

      <form
        className="flex justify-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          className={`${controlClassName} w-40`}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button
          className={`${controlClassName} cursor-pointer hover:border-ring active:bg-muted`}
          type="submit"
        >
          Greet
        </button>
      </form>
      <p>{greetMsg}</p>
    </main>
  );
}

export default App;
