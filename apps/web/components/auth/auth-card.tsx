import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  imageSrc: string;
  imageAlt: string;
  imageEyebrow: string;
  imageCaption: string;
};

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  imageSrc,
  imageAlt,
  imageEyebrow,
  imageCaption
}: AuthCardProps) {
  return (
    <main className="min-h-dvh bg-[#f8fafc] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-[1400px] gap-3 sm:min-h-[calc(100dvh-2.5rem)] sm:gap-4 lg:min-h-[calc(100dvh-3rem)] lg:grid-cols-[minmax(0,0.8fr)_minmax(32rem,1.2fr)] lg:gap-5">
        <aside className="relative isolate min-h-[220px] overflow-hidden rounded-[28px] sm:min-h-[280px] sm:rounded-[36px] lg:min-h-full lg:rounded-[42px]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover object-[center_62%]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17352d]/28 via-[#17352d]/6 to-transparent px-5 pb-5 pt-16 sm:px-7 sm:pb-7 lg:px-8 lg:pb-8">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-white/90 uppercase">
              {imageEyebrow}
            </p>
            <p className="mt-2 max-w-sm font-serif text-3xl leading-none text-white sm:text-4xl">
              {imageCaption}
            </p>
          </div>
        </aside>

        <section className="flex flex-col overflow-y-auto rounded-[28px] bg-white px-6 py-7 shadow-[0_18px_50px_rgba(23,53,45,0.06)] sm:rounded-[36px] sm:px-10 sm:py-10 lg:rounded-[42px] lg:px-12">
          <Link href="/" className="group flex items-center gap-3" aria-label="Invocore home">
            <span className="grid size-9 place-items-center rounded-lg border border-emerald-900/10 bg-[#f4f8f5] text-sm font-semibold text-emerald-950 shadow-sm transition-transform duration-300 group-hover:-rotate-3">
              I
            </span>
            <span className="text-base font-semibold tracking-[0.18em] text-emerald-950 uppercase">
              Invocore
            </span>
          </Link>

          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
            <h1 className="font-serif text-4xl leading-none text-[#17352d] sm:text-[2.75rem]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 text-sm leading-relaxed text-[#60756c]">{subtitle}</p>
            ) : null}
            <div className="mt-8">{children}</div>
            {footer ? (
              <div className="mt-6 text-center text-sm text-[#789087]">{footer}</div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
