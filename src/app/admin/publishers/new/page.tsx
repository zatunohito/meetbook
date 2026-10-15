import { savePublisher } from "@/app/actions/admin";
import { PublisherForm } from "@/components/admin-forms";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "出版社を追加" };

export default function NewPublisher() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="出版社を追加" />
      <PublisherForm save={savePublisher.bind(null, null)} />
    </div>
  );
}
