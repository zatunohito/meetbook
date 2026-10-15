import { saveStore } from "@/app/actions/admin";
import { StoreForm } from "@/components/admin-forms";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "書店を追加" };

export default function NewStore() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="書店を追加" />
      <StoreForm save={saveStore.bind(null, null)} />
    </div>
  );
}
