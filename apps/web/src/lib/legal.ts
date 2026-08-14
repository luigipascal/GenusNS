/** Legal entity constants — aligned with rondanini.com imprint. */
export const LEGAL = {
  companyName: "Rondanini Publishing Ltd",
  tradingAs: "0dB_Labs",
  /** Full imprint mark used in footers and legal pages */
  imprint: "Rondanini Publishing Ltd t/a 0dB_Labs",
  companyNo: "16548159",
  jurisdiction: "England and Wales",
  registeredOffice:
    "60 Tottenham Court Road, Suite 6438a, Fitzrovia, London, W1T 2EW",
  tel: "+44 203 432 3380",
  emailInfo: "info@rondanini.com",
  emailPrivacy: "privacy@rondanini.com",
  parentSite: "https://rondanini.com",
  forumUrl: "https://aigents.berta.one/forum/genus-ns-lab",
  forumLabel: "GENUS//NS AIgents Forum",
  youtubeUrl: "https://www.youtube.com/@genusns/videos",
  youtubeLabel: "YouTube",
  artist: "GENUS//NS",
  operator: "Neural Syntax",
  label: "0dB_Labs",
} as const;

export function companyRegistrationLine(): string {
  return `${LEGAL.companyName.toUpperCase()} — Registered in ${LEGAL.jurisdiction} (No. ${LEGAL.companyNo}). Registered office: ${LEGAL.registeredOffice}. Tel: ${LEGAL.tel}. Trading as ${LEGAL.tradingAs}.`;
}
