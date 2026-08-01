import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/about")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({ message: "Hello1111" });
      },
    },
  },
  component: About,
});

function About() {
  const [reply, setReply] = useState("");

  return (
    <main className="p-10">
      <button
        className="bg-blue-500 text-white p-2 rounded"
        onClick={() => {
          // This button manually fetches its own route's POST handler!
          fetch("/about", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "TanStacker" }),
          })
            .then((res) => res.json())
            .then((data) => setReply(data.message));
        }}
      >
        Say Hello {reply && `- ${reply}`}
      </button>
    </main>
  );
}
