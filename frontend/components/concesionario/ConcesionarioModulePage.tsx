import Link from "next/link";

interface ConcesionarioModulePageProps {
  title: string;
  description: string;
}

export default function ConcesionarioModulePage({
  title,
  description,
}: ConcesionarioModulePageProps) {
  return (
    <div className="p-4">
      <div className="surface-card border-round border-1 border-200 p-4">
        <h2 className="m-0 mb-2 text-900">{title}</h2>
        <p className="m-0 text-700 line-height-3">{description}</p>

        <div className="mt-4 flex gap-3 flex-wrap">
          <Link
            href="/empresa/concesionario"
            className="no-underline px-3 py-2 border-round bg-primary text-white"
          >
            Ir al dashboard de concesionario
          </Link>
        </div>
      </div>
    </div>
  );
}

