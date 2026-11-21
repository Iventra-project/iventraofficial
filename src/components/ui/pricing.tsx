import { Check, Star, Trophy } from 'lucide-react';
import { InteractiveHoverButton } from './interactive-hover-button.tsx';
import { ScrollReveal } from './ScrollReveal.tsx';

type PricingAction =
  | { href: string; onClick?: never }
  | { href?: never; onClick: () => void };

export type PricingPlan = {
  label?: string;
  name: string;
  price: string;
  period?: string;
  priceNote?: string;
  features: string[];
  description?: string;
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
      className="relative w-full border-b border-slate-200/80 bg-[#f7f9fc] py-16 md:py-20 overflow-hidden"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mx-auto mb-10 max-w-2xl space-y-3 text-center" yOffset={24}>
          <header>
            {eyebrow && (
              <p className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {eyebrow}
              </p>
            )}
            <h2 className="text-3xl font-display font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {title}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 mt-2">{description}</p>
          </header>
        </ScrollReveal>

        {/* 3-Card Deck Container with snug spacing & fan-out hover */}
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-6 lg:grid-cols-3 lg:gap-3 xl:gap-4">
          {plans.map((plan, index) => {
            const isSpark = index === 0;
            const isSparkPro = plan.isPopular || index === 1;
            const isExpert = index === 2 || plan.name.toLowerCase().includes('expert');
            const cardDelay = index === 0 ? 0.08 : index === 1 ? 0.18 : 0.28;

            return (
              <ScrollReveal
                key={plan.name}
                delay={cardDelay}
                yOffset={32}
                className={`h-full flex flex-col ${isSparkPro ? 'relative z-10' : 'relative z-0'}`}
              >
                <article
                  className={`relative flex flex-col h-full rounded-2xl border bg-white text-center transition-all duration-300 ease-out ${
                    isSparkPro
                      ? 'p-6 sm:p-7 border-2 border-blue-600 shadow-[0_16px_36px_rgba(37,99,235,0.12)] lg:scale-100 lg:-translate-y-1 hover:lg:scale-[1.02] hover:lg:-translate-y-2 hover:lg:shadow-[0_20px_42px_rgba(37,99,235,0.18)] hover:lg:z-30'
                      : isSpark
                      ? 'p-5 sm:p-6 border-slate-200 shadow-[0_4px_16px_rgba(15,23,42,0.05)] lg:scale-[0.96] lg:origin-right lg:translate-x-3 hover:lg:!-translate-x-5 hover:lg:!-rotate-1 hover:lg:!scale-[0.99] hover:lg:!z-20 hover:lg:shadow-xl hover:lg:border-blue-400'
                      : 'p-5 sm:p-6 border-slate-200 shadow-[0_4px_16px_rgba(15,23,42,0.05)] lg:scale-[0.96] lg:origin-left lg:-translate-x-3 hover:lg:!translate-x-5 hover:lg:!rotate-1 hover:lg:!scale-[0.99] hover:lg:!z-20 hover:lg:shadow-xl hover:lg:border-amber-400'
                  }`}
                >
                {/* Top Badge Slot */}
                <div className="h-7 flex items-center justify-center">
                  {isSparkPro ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-0.5 text-[11px] font-semibold text-white shadow-2xs">
                      <Star size={12} fill="currentColor" aria-hidden="true" />
                      Paling Populer
                    </span>
                  ) : isExpert ? (
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-2xs"
                      title="Iventra Expert"
                    >
                      <Trophy size={14} className="stroke-[2.3]" />
                    </span>
                  ) : (
                    <span className="opacity-0 select-none text-[11px] py-0.5">•</span>
                  )}
                </div>

                {/* Plan Title */}
                <h3 className="mt-2 text-xl font-display font-bold tracking-tight text-slate-900">
                  {plan.name}
                </h3>

                {/* Price Display */}
                <div className="my-3 flex items-baseline justify-center gap-1.5 flex-nowrap">
                  <span
                    className={`text-3xl sm:text-4xl font-display font-black tracking-tight whitespace-nowrap ${
                      isSparkPro ? 'text-blue-600' : 'text-slate-900'
                    }`}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-xs font-semibold tracking-wide text-slate-500 whitespace-nowrap">
                      {plan.period}
                    </span>
                  )}
                </div>

                {plan.priceNote && (
                  <p className="text-xs text-slate-500 -mt-1 mb-2">{plan.priceNote}</p>
                )}

                {/* Features List */}
                <ul className="my-5 flex-1 space-y-2.5 text-left text-xs sm:text-sm leading-snug text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        size={15}
                        className="mt-0.5 shrink-0 text-blue-600"
                        aria-hidden="true"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Action Button */}
                <div className="pt-4 border-t border-slate-100 mt-auto">
                  <InteractiveHoverButton
                    text={plan.buttonText}
                    href={plan.href}
                    onClick={plan.onClick}
                    dotColor="bg-blue-600"
                    hoverColor="group-hover:bg-blue-600"
                    className={`w-full min-h-11 rounded-xl text-xs sm:text-sm font-bold shadow-xs ${
                      isSparkPro
                        ? 'border-2 border-blue-600 bg-blue-50/70 text-blue-700 hover:border-blue-700 hover:shadow-md'
                        : 'border border-slate-200 bg-white text-slate-800 hover:border-blue-600 hover:shadow-md'
                    }`}
                  />
                  {plan.description && (
                    <p className="mt-3 text-xs leading-normal text-slate-500">{plan.description}</p>
                  )}
                </div>
              </article>
            </ScrollReveal>
          );
        })}
        </div>
      </div>
    </section>
  );
}
