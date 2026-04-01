import { Suspense } from "react";
import EditCardClient from "./EditCardClient";

export default function EditCardPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-gray-400">Loading...</div>}>
      <EditCardClient />
    </Suspense>
  );
}
