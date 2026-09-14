export type EmergencyHelpline = {
  name: string;
  number: string;
  category: string;
  description: string;
  primary: boolean;
  nationwide: boolean;
  emergency: boolean;
};

export type EmergencyScenario =
  | "accident"
  | "fire"
  | "flood"
  | "earthquake"
  | "landslide"
  | "electricity"
  | "snake-bite"
  | "medical"
  | "cyber-fraud"
  | "gas-leak"
  | "child"
  | "women"
  | "general";

export type EmergencyGuidance = {
  title: string;
  icon: string;
  steps: string[];
  contacts: EmergencyHelpline[];
};

export const emergencyHelplines: readonly EmergencyHelpline[] = [
  { name: "Unified Emergency Response Support System", number: "112", category: "Emergency", description: "Police, fire, health and other emergency response. Primary emergency option.", primary: true, nationwide: true, emergency: true },
  { name: "Police", number: "100", category: "Police", description: "Police emergency assistance. Availability and routing may vary by state.", primary: false, nationwide: false, emergency: true },
  { name: "Fire", number: "101", category: "Fire", description: "Fire emergency assistance. Availability and routing may vary by state.", primary: false, nationwide: false, emergency: true },
  { name: "National Ambulance Service", number: "102", category: "Medical", description: "Ambulance service. Availability may vary by state and service area.", primary: false, nationwide: false, emergency: true },
  { name: "Ambulance / Emergency Medical", number: "108", category: "Medical", description: "Ambulance and emergency medical assistance. Availability may vary by state.", primary: false, nationwide: false, emergency: true },
  { name: "Child Helpline", number: "1098", category: "Child protection", description: "Support for children in distress or needing protection.", primary: false, nationwide: true, emergency: true },
  { name: "Women Helpline", number: "181", category: "Women safety", description: "Women helpline support. Availability and local routing may vary by state.", primary: false, nationwide: false, emergency: true },
  { name: "National Cyber Crime Helpline", number: "1930", category: "Cyber crime", description: "Report cyber financial fraud and cyber crime.", primary: false, nationwide: true, emergency: false },
  { name: "LPG Leak Helpline", number: "1906", category: "Gas leak", description: "Report an LPG leak.", primary: false, nationwide: true, emergency: true },
  { name: "Relief / Natural Calamity", number: "1070", category: "Disaster", description: "Relief and natural calamity assistance. Availability may vary by state or administration.", primary: false, nationwide: false, emergency: true },
  { name: "Road Accident", number: "1073", category: "Road safety", description: "Road accident assistance. Availability may vary by state or service area.", primary: false, nationwide: false, emergency: true },
  { name: "Indian Railways", number: "139", category: "Railway", description: "Railway assistance and information.", primary: false, nationwide: true, emergency: false },
  { name: "National Consumer Helpline", number: "1915", category: "Consumer", description: "Consumer grievance assistance.", primary: false, nationwide: true, emergency: false },
  { name: "Elderline", number: "14567", category: "Elderly support", description: "Support for senior citizens.", primary: false, nationwide: true, emergency: false },
  { name: "Ayushman Bharat", number: "14555", category: "Health scheme", description: "Ayushman Bharat assistance.", primary: false, nationwide: true, emergency: false },
  { name: "Kisan Call Centre", number: "1551", category: "Agriculture", description: "Agriculture support for farmers.", primary: false, nationwide: true, emergency: false },
  { name: "National Narcotics Helpline", number: "1933", category: "Narcotics", description: "National narcotics helpline.", primary: false, nationwide: true, emergency: false },
];

const findHelpline = (number: string) => emergencyHelplines.find((helpline) => helpline.number === number)!;

const guidance: Record<EmergencyScenario, EmergencyGuidance> = {
  accident: {
    title: "Emergency Assistance",
    icon: "🚨",
    steps: ["Move to a safe location if possible.", "Avoid unnecessary movement of seriously injured people.", "Call 112 / ambulance.", "Provide the exact location to responders."],
    contacts: [findHelpline("112"), findHelpline("108"), findHelpline("102")],
  },
  fire: {
    title: "Fire Emergency",
    icon: "🚨",
    steps: ["Evacuate to a safe location and keep others away from the fire.", "Do not take risks or attempt dangerous firefighting.", "Call emergency services and provide the exact location."],
    contacts: [findHelpline("112"), findHelpline("101")],
  },
  flood: {
    title: "Flood Emergency",
    icon: "🚨",
    steps: ["Move to higher, safer ground if it is safe to do so.", "Avoid fast-moving water, damaged bridges and downed power lines.", "Contact emergency services and provide your location."],
    contacts: [findHelpline("112"), findHelpline("1070")],
  },
  earthquake: {
    title: "Earthquake Emergency",
    icon: "🚨",
    steps: ["Move away from damaged buildings and other hazards.", "If shaking is ongoing, protect your head and follow local safety instructions.", "Contact emergency services from a safe location."],
    contacts: [findHelpline("112"), findHelpline("1070")],
  },
  landslide: {
    title: "Landslide Emergency",
    icon: "🚨",
    steps: ["Move away from slopes, debris and damaged roads.", "Do not enter unstable areas or cross debris.", "Contact emergency services and provide your exact location."],
    contacts: [findHelpline("112"), findHelpline("1070")],
  },
  electricity: {
    title: "Electricity Hazard",
    icon: "⚡",
    steps: ["Stay away from fallen wires, sparks and damaged equipment.", "Keep other people away and do not touch the wire or equipment.", "Call emergency services from a safe location."],
    contacts: [findHelpline("112")],
  },
  "snake-bite": {
    title: "Medical Emergency",
    icon: "🚨",
    steps: ["Move away from the snake and keep the person calm and still.", "Do not cut, suck or tightly tie the bite area.", "Call an ambulance and seek professional medical care immediately."],
    contacts: [findHelpline("112"), findHelpline("108"), findHelpline("102")],
  },
  medical: {
    title: "Medical Emergency",
    icon: "🚨",
    steps: ["Move to a safe place and avoid giving treatment beyond your training.", "Call an ambulance and provide the exact location.", "Follow instructions from professional responders."],
    contacts: [findHelpline("112"), findHelpline("108"), findHelpline("102")],
  },
  "cyber-fraud": {
    title: "Cyber Crime",
    icon: "💻",
    steps: ["Contact your bank or payment provider using its official channel.", "Preserve transaction details and evidence.", "Report cyber financial fraud promptly."],
    contacts: [findHelpline("1930"), findHelpline("112")],
  },
  "gas-leak": {
    title: "Gas Leak",
    icon: "🔥",
    steps: ["Do not operate electrical switches or create a flame.", "If safe, turn off the gas supply, leave the area and keep others away.", "Call the LPG helpline; call 112 if there is immediate danger."],
    contacts: [findHelpline("1906"), findHelpline("112")],
  },
  child: {
    title: "Child Helpline",
    icon: "👶",
    steps: ["Move the child to a safe place if possible.", "Share the child’s location with responders.", "Call the child helpline or 112 if there is immediate danger."],
    contacts: [findHelpline("1098"), findHelpline("112")],
  },
  women: {
    title: "Women Helpline",
    icon: "👩",
    steps: ["Move to a safe place and contact someone trusted if possible.", "Share your location with responders.", "Call the women helpline or 112 if there is immediate danger."],
    contacts: [findHelpline("181"), findHelpline("112")],
  },
  general: {
    title: "Emergency Assistance",
    icon: "🚨",
    steps: ["If there is immediate danger, move to a safer place if possible.", "Call 112 and provide your exact location.", "Follow instructions from professional emergency responders."],
    contacts: [findHelpline("112")],
  },
};

const scenarioKeywords: ReadonlyArray<[EmergencyScenario, string[]]> = [
  ["cyber-fraud", ["online fraud", "cyber fraud", "cybercrime", "cyber crime", "धोखाधड़ी", "फ्रॉड"]],
  ["gas-leak", ["gas leak", "lpg leak", "cylinder leak", "गैस लीक", "गैस रिसाव"]],
  ["child", ["child emergency", "child missing", "lost child", "baccha kho", "बच्चा खो", "बच्चा गुम"]],
  ["women", ["women in distress", "woman in distress", "महिला", "महिलाओं", "छेड़छाड़"]],
  ["earthquake", ["earthquake", "भूकंप"]],
  ["landslide", ["landslide", "भूस्खलन", "pahad gir", "पहाड़ गिर"]],
  ["flood", ["flood", "बाढ़", "baadh"]],
  ["fire", ["fire", "aag", "आग", "धुआं", "धुआँ"]],
  ["electricity", ["fallen wire", "live wire", "electric shock", "बिजली का तार", "गिरे तार", "करंट"]],
  ["snake-bite", ["snake bite", "snakebite", "सांप ने काटा", "सांप का काटना", "सांप काट"]],
  ["medical", ["medical emergency", "heart attack", "बेहोश", "सांस नहीं", "breathing problem", "chest pain"]],
  ["landslide", ["road collapse", "road caved", "सड़क धंस", "सड़क टूट", "road टूट"]],
  ["accident", ["accident", "crash", "road accident", "दुर्घटना", "हादसा"]],
];

export function detectEmergencyScenario(input: string): EmergencyScenario | null {
  const normalized = input.toLocaleLowerCase();
  const match = scenarioKeywords.find(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword.toLocaleLowerCase())));
  if (match) return match[0];
  if (["emergency", "urgent", "help me", "बचाओ", "आपात", "मदद चाहिए"].some((keyword) => normalized.includes(keyword))) return "general";
  return null;
}

export function getEmergencyGuidance(scenario: EmergencyScenario): EmergencyGuidance {
  return guidance[scenario];
}

export function getStateSpecificHelplines(): readonly EmergencyHelpline[] {
  return [];
}
