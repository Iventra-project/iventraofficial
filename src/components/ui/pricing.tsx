import { Check, Star } from 'lucide-react';
import { InteractiveHoverButton } from './interactive-hover-button.tsx';

type PricingAction =
  | { href: string; onClick?: never }
  | { href?: never; onClick: () => void };

export type PricingPlan = {
  label: string;
  name: string;
  price: string;
  period: string;
  priceNote?: string;
  features: string[];
  description: string;
  buttonText: string;
  isPopular?: boolean;
} & PricingAction;

interface PricingProps {
  plans: PricingPlan[];
  eyebrow?: string;
  title: string;
  description: string;
}

export function Pricing({ plans, eyebrow, title, description }: PricingProps) {
  return (
    <section
      id="pricing"
      className="relative w-full border-b border-slate-200/80 bg-[#f7f9fc] py-20 md:py-28"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto mb-12 max-w-2xl space-y-4 text-center">
          {eyebrow && (
            <p className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {eyebrow}
            </p>
          )}
          <h2 className="text-3xl font-display font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            {title}
          </h2>
          <p className="text-base leading-relaxed text-slate-600">{description}</p>
        </header>

        <div className="grid grid-cols-1 items-stretch gap-6 text-left lg:grid-cols-3 lg:gap-8">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`card-lift relative flex h-full flex-col rounded-2xl border bg-white p-6 text-center sm:p-8 ${
                plan.isPopular
                  ? 'z-10 border-2 border-blue-600 shadow-[0_18px_42px_rgba(37,99,235,0.16)] lg:-translate-y-2'
                  : 'border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.08)] lg:translate-y-2'
              }`}
            >
              <div className="flex min-h-8 items-center justify-between gap-2">
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold tracking-wide text-slate-700">
                  {plan.label}
                </span>
                {plan.isPopular && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                    <Star size={14} fill="currentColor" aria-hidden="true" />
                    Paling Populer
                  </span>
                )}
              </div>

              <h3 className="mt-4 text-xl font-display font-bold tracking-tight text-slate-900 sm:text-2xl">
                {plan.name}
              </h3>

              <div className="mt-6 flex min-h-14 items-baseline justify-center gap-2">
                <span
                  className={`text-3xl font-display font-extrabold leading-tight tracking-tight sm:text-4xl ${
                    plan.isPopular ? 'text-blue-600' : 'text-slate-900'
                  }`}
                >
                  {plan.price}
                </span>
                <span className="text-sm font-semibold leading-6 tracking-wide text-slate-500">
                  {plan.period}
                </span>
              </div>
              {plan.priceNote && (
                <p className="mt-1 text-xs leading-5 text-slate-500">{plan.priceNote}</p>
              )}

              <ul className="mt-6 flex-1 space-y-3 text-left text-sm leading-relaxed text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check
                      size={16}
                      className="mt-1 shrink-0 text-blue-600"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <hr className="my-6 w-full border-slate-200" />

              <InteractiveHoverButton
                text={plan.buttonText}
                href={plan.href}
                onClick={plan.onClick}
                dotColor={plan.isPopular ? "bg-blue-600" : "bg-blue-600"}
                hoverColor={plan.isPopular ? "group-hover:bg-blue-600" : "group-hover:bg-blue-600"}
                className={`w-full min-h-12 rounded-xl text-sm font-bold shadow-xs ${
                  plan.isPopular
                    ? 'border-2 border-blue-600 bg-blue-50/70 text-blue-700 hover:border-blue-700 hover:shadow-md'
                    : 'border border-slate-200 bg-white text-slate-800 hover:border-blue-600 hover:shadow-md'
                }`}
              />
              <p className="mt-5 text-xs leading-5 text-slate-500">{plan.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
