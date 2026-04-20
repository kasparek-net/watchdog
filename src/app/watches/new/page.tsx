import { currentUser } from "@clerk/nextjs/server";
import NewWatchForm from "./form";

export default async function NewWatchPage() {
  const user = await currentUser();
  const defaultEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Nové hlídání</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Zadej URL, klikni na element který chceš hlídat, a my tě upozorníme,
        kdykoli se jeho text změní.
      </p>
      <NewWatchForm defaultEmail={defaultEmail} />
    </div>
  );
}
