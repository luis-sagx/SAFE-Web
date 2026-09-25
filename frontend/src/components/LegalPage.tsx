import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/** Sección visible en pantalla, para marcarla en el índice como Wikipedia.
 *  Sin IntersectionObserver (jsdom, navegadores muy viejos) no marca nada. */
function useActiveSection(sections: LegalSection[]) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      // Solo cuenta la franja superior de la pantalla: la sección "actual" es
      // la que se está empezando a leer, no la que asoma abajo.
      { rootMargin: "0px 0px -70% 0px" },
    );
    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [sections]);

  return active;
}

function TableOfContents({
  sections,
  active,
}: Readonly<{ sections: LegalSection[]; active?: string }>) {
  return (
    <ol className="space-y-0.5 border-l border-hairline">
      {sections.map((section, index) => {
        const current = section.id === active;
        return (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={current ? "location" : undefined}
              className={`-ml-px flex min-h-11 items-center gap-2 border-l-2 py-1.5 pl-4 pr-2 text-base leading-snug hover:underline ${
                current
                  ? "border-primary font-semibold text-ink"
                  : "border-transparent text-link"
              }`}
            >
              <span className="w-5 shrink-0 font-mono text-sm text-muted">
                {index + 1}
              </span>
              {section.title}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/** Vuelve a la página anterior (login, registro, portada). Si se abrió en una
 *  pestaña nueva, como desde la casilla del registro, no hay a dónde volver:
 *  el enlace lleva al registro. */
function BackLink() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasHistory = location.key !== "default";

  return (
    <Link
      to="/registro"
      onClick={(event) => {
        if (!hasHistory) return;
        event.preventDefault();
        navigate(-1);
      }}
      className="mb-6 inline-flex min-h-11 items-center text-base font-medium text-link underline"
    >
      ← Volver
    </Link>
  );
}

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
  /** Lo que va antes de las secciones numeradas (introducción, resumen). */
  children?: ReactNode;
}

/** Página legal con índice lateral fijo, como la documentación. */
export default function LegalPage({
  title,
  lastUpdated,
  sections,
  children,
}: Readonly<LegalPageProps>) {
  const active = useActiveSection(sections);
  const sidebar = useRef<HTMLElement>(null);

  // El índice tiene su propio scroll: lo mueve para que la sección actual
  // quede siempre a la vista, centrada.
  useEffect(() => {
    const nav = sidebar.current;
    const link = nav?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!nav || !link || typeof nav.scrollTo !== "function") return;
    nav.scrollTo({
      top: link.offsetTop - nav.clientHeight / 2 + link.offsetHeight / 2,
      behavior: "smooth",
    });
  }, [active]);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12">
        <aside className="hidden lg:block">
          <nav
            ref={sidebar}
            aria-labelledby="indice"
            className="sticky top-0 max-h-screen overflow-y-auto py-12"
          >
            <h2
              id="indice"
              className="mb-3 font-mono text-sm uppercase tracking-[0.14em] text-muted"
            >
              Contenido
            </h2>
            <TableOfContents sections={sections} active={active} />
          </nav>
        </aside>

        <main className="max-w-3xl py-12">
          <BackLink />

          <h1 className="text-4xl font-bold text-ink">{title}</h1>
          <p className="mt-3 text-base text-muted">
            Última actualización: {lastUpdated}
          </p>

          <div className="mt-8 space-y-10 text-base leading-relaxed text-body">
            {/* En celular no hay lateral: el índice se pliega arriba. */}
            <details className="rounded-lg border border-hairline-strong bg-surface lg:hidden">
              <summary className="min-h-11 cursor-pointer px-5 py-2.5 font-semibold text-ink">
                Contenido
              </summary>
              <nav aria-label="Contenido" className="px-3 pb-4">
                <TableOfContents sections={sections} />
              </nav>
            </details>

            {children}

            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-titulo`}
                className="scroll-mt-6"
              >
                <h2
                  id={`${section.id}-titulo`}
                  className="mb-3 text-xl font-semibold text-ink"
                >
                  {index + 1}. {section.title}
                </h2>
                {section.body}
              </section>
            ))}

            <p className="border-t border-hairline pt-6 text-sm text-muted">
              SAFE-Web · Versión vigente desde el {lastUpdated}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
