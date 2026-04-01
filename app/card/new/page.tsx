import { Suspense } from "react";
import NewCardClient from "./NewCardClient";

export default function NewCardPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-gray-400">Loading...</div>}>
      <NewCardClient />
    </Suspense>
  );
}
