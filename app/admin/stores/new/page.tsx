import Link from "next/link";
import StoreForm from "./StoreForm";

export const dynamic = "force-dynamic";

export default function NewStorePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/stores" className="text-sm text-indigo-600">
        ← Mağazalara qayıt
      </Link>
      <h1 className="mb-1 mt-3 text-xl font-bold text-gray-900">
        Yeni mağaza qeydiyyatı
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Qeydiyyatdan sonra mağazanın QR kodu avtomatik yaradılacaq.
      </p>
      <StoreForm />
    </div>
  );
}
