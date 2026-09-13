/**
 * A curated (non-exhaustive) list of common disposable/temporary email
 * domains. Blocking these at registration is a cheap first line of defense
 * against obviously-fake signups; it is NOT a substitute for actual email
 * verification (see email.service.js + auth verify-email flow), since new
 * disposable domains appear constantly. Both layers are used together.
 */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'temp-mail.org', 'guerrillamail.com',
  'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.net', '10minutemail.com',
  '10minutemail.net', 'throwawaymail.com', 'yopmail.com', 'trashmail.com',
  'getnada.com', 'sharklasers.com', 'dispostable.com', 'maildrop.cc',
  'fakeinbox.com', 'mailnesia.com', 'mintemail.com', 'spamgourmet.com',
  'mytemp.email', 'moakt.com', 'emailondeck.com', 'discardmail.com',
  'tempinbox.com', 'mohmal.com', 'burnermail.io', 'inboxbear.com',
]);

function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
}

module.exports = { DISPOSABLE_EMAIL_DOMAINS, isDisposableEmail };
