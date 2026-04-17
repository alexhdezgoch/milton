/**
 * Thin GA4 event wrapper.
 * Guards against window.gtag being undefined (ad blockers, SSR-like environments).
 */
function fire(eventName, params) {
  if (typeof window === 'undefined') return
  if (typeof window.gtag !== 'function') return
  window.gtag('event', eventName, params || {})
}

export const analytics = {
  /** Fired when a user clicks any "Try for free" / trial-start CTA. source identifies placement. */
  trialStart: (source) => fire('trial_start', { source }),

  /** Fired when a user clicks a pricing section CTA. source identifies the page. */
  pricingCtaClick: (source) => fire('pricing_cta_click', { source }),

  /** Fired when a user clicks the "Log in" link. */
  loginClick: () => fire('login_click'),

  /** Fired from article pages when the inline article CTA is clicked. slug = article slug. */
  articleCtaClick: (slug) => fire('article_cta_click', { slug }),

  /** Fired when a lead magnet form is submitted. form_id identifies which form. */
  leadMagnetSubmit: (formId) => fire('lead_magnet_submit', { form_id: formId }),
}
