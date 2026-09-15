import { detectEmergencyScenario } from "./emergency-helplines";

export type OfflineLanguage = "en" | "hi";

export type OfflineSahayakResponse = {
  message: string;
  offline: true;
  emergency?: boolean;
  emergencyScenario?: import("./emergency-helplines").EmergencyScenario;
};

type OfflineTopic = {
  keywords: string[];
  response: Record<OfflineLanguage, string>;
};

const fallback: Record<OfflineLanguage, string> = {
  en: "I’m currently in Offline Assistance Mode. I can help with problem submission, tracking, government review, university assignment, funding, and solution development. Please ask about one of these topics.",
  hi: "मैं अभी ऑफलाइन सहायता मोड में हूँ। मैं समस्या दर्ज करने, स्थिति देखने, सरकारी समीक्षा, विश्वविद्यालय को असाइनमेंट, फंडिंग और समाधान विकास में मदद कर सकता हूँ। कृपया इनमें से किसी विषय के बारे में पूछें।",
};

const topics: OfflineTopic[] = [
  {
    keywords: ["road", "roads", "broken road", "sadak", "सड़क", "सड़क", "गड्ढा", "infrastructure", "public infrastructure"],
    response: {
      en: "For a road or infrastructure problem:\n1. Note the exact location, landmark, village/ward and district.\n2. Describe the damage, safety risk and how many people are affected.\n3. Take clear photos or a short video from a safe place.\n4. Submit it through Submit a Problem and keep the submission ID for tracking.\nDo not stand in traffic or attempt unsafe repairs.",
      hi: "सड़क या सार्वजनिक बुनियादी ढांचे की समस्या के लिए:\n1. सही स्थान, नजदीकी पहचान, गांव/वार्ड और जिला लिखें।\n2. नुकसान, सुरक्षा जोखिम और प्रभावित लोगों का विवरण दें।\n3. सुरक्षित स्थान से साफ फोटो या छोटा वीडियो लें।\n4. समस्या दर्ज करें और स्थिति देखने के लिए सबमिशन आईडी संभालकर रखें।\nट्रैफिक के बीच खड़े न हों और असुरक्षित मरम्मत न करें।",
    },
  },
  {
    keywords: ["water", "drinking water", "water supply", "pani", "पानी", "जल", "पेयजल", "sanitation", "स्वच्छता", "शौचालय", "कचरा", "waste"],
    response: {
      en: "For a water problem:\n1. Record the location, source (tap, handpump or pipeline) and how long it has been affected.\n2. Explain whether the water is unavailable, dirty, leaking or unsafe and who is affected.\n3. Add a photo/video if it can be taken safely.\n4. Submit the problem with contact details and track the ID after submission. Do not drink visibly contaminated water; use a safe source and contact local emergency services for urgent health risks.",
      hi: "पानी की समस्या के लिए:\n1. स्थान, स्रोत (नल, चापाकल या पाइपलाइन) और समस्या की अवधि लिखें।\n2. बताएं कि पानी नहीं आ रहा, गंदा है, रिसाव है या असुरक्षित है और कौन प्रभावित है।\n3. सुरक्षित हो तो फोटो/वीडियो लगाएं।\n4. संपर्क विवरण के साथ समस्या दर्ज करें और आईडी से स्थिति देखें। दूषित दिखने वाला पानी न पिएं; सुरक्षित स्रोत का उपयोग करें।",
    },
  },
  {
    keywords: ["electricity", "power", "bijli", "बिजली", "विद्युत", "transformer"],
    response: {
      en: "For an electricity problem, include the affected area, pole/transformer number if visible, outage duration and any fallen wire or spark. Keep people away from live wires, do not touch damaged equipment, and report urgent hazards to the local electricity emergency service. For the portal, submit the location, description, safe photos and your contact details, then save the tracking ID.",
      hi: "बिजली की समस्या में प्रभावित क्षेत्र, दिखने पर पोल/ट्रांसफॉर्मर नंबर, बिजली बंद रहने की अवधि और गिरे तार या चिंगारी की जानकारी दें। जीवित तारों से दूर रहें और खराब उपकरण को न छुएं। तत्काल खतरे की सूचना स्थानीय बिजली आपात सेवा को दें। पोर्टल पर स्थान, विवरण, सुरक्षित फोटो और संपर्क देकर समस्या दर्ज करें और आईडी संभालें।",
    },
  },
  {
    keywords: ["school", "education", "college", "शिक्षा", "स्कूल", "विद्यालय", "पढ़ाई", "padhai"],
    response: {
      en: "For an education problem, describe the school/college location, the facility or learning issue, how long it has existed, and how many learners are affected. Add safe supporting photos or documents if available. Submit the problem with a clear title and contact details; the government reviews it and may assign a suitable university team for a solution.",
      hi: "शिक्षा की समस्या में स्कूल/कॉलेज का स्थान, सुविधा या पढ़ाई से जुड़ी समस्या, उसकी अवधि और प्रभावित विद्यार्थियों की संख्या बताएं। उपलब्ध हो तो सुरक्षित फोटो या दस्तावेज जोड़ें। स्पष्ट शीर्षक और संपर्क विवरण के साथ समस्या दर्ज करें; सरकार समीक्षा कर उपयुक्त विश्वविद्यालय टीम को समाधान के लिए दे सकती है।",
    },
  },
  {
    keywords: ["hospital", "health", "healthcare", "health care", "अस्पताल", "स्वास्थ्य", "इलाज", "medical"],
    response: {
      en: "For a healthcare problem, describe the facility/location, service gap, urgency and people affected without sharing unnecessary private medical information. Attach only safe, relevant evidence. Sahayak cannot replace emergency care: contact local emergency services for immediate danger. Submit the systemic problem with your contact details and track its ID.",
      hi: "स्वास्थ्य समस्या में अस्पताल/स्थान, सेवा की कमी, तात्कालिकता और प्रभावित लोगों का विवरण दें; अनावश्यक निजी चिकित्सा जानकारी साझा न करें। केवल सुरक्षित और जरूरी प्रमाण लगाएं। आपात स्थिति में तुरंत स्थानीय आपात सेवा से संपर्क करें। व्यापक समस्या संपर्क विवरण के साथ दर्ज करें और आईडी से स्थिति देखें।",
    },
  },
  {
    keywords: ["agriculture", "farming", "farmer", "खेती", "कृषि", "किसान", "fasal", "फसल"],
    response: {
      en: "For an agriculture problem, record the village, crop or activity, season, affected area, symptoms and support needed. Add non-sensitive photos of the issue when safe. Submit a specific description and keep the tracking ID. For urgent crop, weather or animal-health risks, also contact the relevant local department.",
      hi: "कृषि समस्या में गांव, फसल या गतिविधि, मौसम, प्रभावित क्षेत्र, लक्षण और आवश्यक सहायता लिखें। सुरक्षित हो तो समस्या की गैर-निजी फोटो लगाएं। स्पष्ट विवरण देकर समस्या दर्ज करें और ट्रैकिंग आईडी रखें। फसल, मौसम या पशु स्वास्थ्य के तत्काल जोखिम में संबंधित स्थानीय विभाग से भी संपर्क करें।",
    },
  },
  {
    keywords: ["submit", "submission", "complaint", "problem", "report", "दर्ज", "शिकायत", "समस्या", "समस्या दर्ज", "कैसे करूं", "kaise karu"],
    response: {
      en: "To submit a societal problem:\n1. Open Submit a Problem.\n2. Choose a category and write a clear title and description.\n3. Add district, village/city, exact location and who is affected.\n4. Add your contact details and supporting files if safe.\n5. Review the information and submit. Save the submission/tracking ID. Never include passwords, OTPs, financial secrets or unnecessary personal data.",
      hi: "सामाजिक समस्या दर्ज करने के लिए:\n1. Submit a Problem खोलें।\n2. श्रेणी चुनकर स्पष्ट शीर्षक और विवरण लिखें।\n3. जिला, गांव/शहर, सही स्थान और प्रभावित लोगों की जानकारी दें।\n4. संपर्क विवरण और सुरक्षित सहायक फाइलें जोड़ें।\n5. जानकारी जांचकर सबमिट करें और सबमिशन/ट्रैकिंग आईडी रखें। पासवर्ड, OTP या अनावश्यक निजी जानकारी न दें।",
    },
  },
  {
    keywords: ["required information", "information required", "details", "क्या चाहिए", "जानकारी", "विवरण", "documents"],
    response: {
      en: "A useful submission includes: problem title, category, detailed description, exact location, district and village/city, when it started, people affected, urgency, your contact details, and safe supporting evidence. Be factual and avoid passwords, OTPs, identity numbers or private information that is not needed.",
      hi: "अच्छे सबमिशन में समस्या का शीर्षक, श्रेणी, विस्तृत विवरण, सही स्थान, जिला और गांव/शहर, शुरुआत का समय, प्रभावित लोग, तात्कालिकता, संपर्क विवरण और सुरक्षित प्रमाण शामिल होते हैं। तथ्यात्मक रहें और पासवर्ड, OTP, पहचान संख्या या गैर-जरूरी निजी जानकारी न दें।",
    },
  },
  {
    keywords: ["photo", "photos", "pdf", "video", "attachment", "file", "फोटो", "वीडियो", "दस्तावेज", "पीडीएफ"],
    response: {
      en: "To add evidence, use the attachment controls on the submission form. Choose clear, relevant photos, PDFs or short videos; check that they do not expose passwords or private information, and keep file sizes within the form limit. Take photos/videos only from a safe place and add a short caption explaining what they show.",
      hi: "प्रमाण जोड़ने के लिए सबमिशन फॉर्म के अटैचमेंट विकल्प का उपयोग करें। साफ और संबंधित फोटो, PDF या छोटे वीडियो चुनें; उनमें पासवर्ड या निजी जानकारी न हो और फाइल आकार सीमा में हो। फोटो/वीडियो केवल सुरक्षित स्थान से लें और छोटा कैप्शन लिखें।",
    },
  },
  {
    keywords: ["track", "tracking", "status", "स्थिति", "ट्रैक", "प्रगति", "submission id"],
    response: {
      en: "To track a submitted problem, open My Submissions and use the saved submission ID or your dashboard list. Keep checking the latest status and messages. If you submitted while offline, the portal cannot send it until connectivity returns; do not assume it was submitted unless you receive a confirmation ID.",
      hi: "दर्ज समस्या की स्थिति देखने के लिए My Submissions खोलें और सेव की गई सबमिशन आईडी या डैशबोर्ड सूची देखें। नवीनतम स्थिति और संदेश जांचते रहें। ऑफलाइन रहते हुए पोर्टल समस्या भेज नहीं सकता; कनेक्शन लौटने तक इसे जमा हुआ न मानें और पुष्टि आईडी जरूर देखें।",
    },
  },
  {
    keywords: ["after submission", "review", "verification", "समीक्षा", "सत्यापन", "जमा करने के बाद"],
    response: {
      en: "After citizen submission, the government team reviews the details and verifies the problem. They may request clarification, update the status, prioritize it, or assign it to a suitable university. Keep your contact details available and respond to clarification requests through the portal.",
      hi: "नागरिक के सबमिशन के बाद सरकारी टीम विवरण की समीक्षा और समस्या का सत्यापन करती है। वे स्पष्टीकरण मांग सकती है, स्थिति बदल सकती है, प्राथमिकता दे सकती है या उपयुक्त विश्वविद्यालय को असाइन कर सकती है। संपर्क विवरण उपलब्ध रखें और पोर्टल पर मांगी गई जानकारी दें।",
    },
  },
  {
    keywords: ["government", "sarkar", "सरकार", "review", "verify", "verification"],
    response: {
      en: "Government review checks whether the report is sufficiently clear, genuine and actionable. Officials verify location, evidence, urgency and duplication, then decide the next workflow step. A verified report can move toward university assignment, funding review and project monitoring.",
      hi: "सरकारी समीक्षा में देखा जाता है कि रिपोर्ट स्पष्ट, वास्तविक और कार्रवाई योग्य है या नहीं। अधिकारी स्थान, प्रमाण, तात्कालिकता और दोहराव की जांच कर अगला चरण तय करते हैं। सत्यापित रिपोर्ट विश्वविद्यालय असाइनमेंट, फंडिंग समीक्षा और प्रोजेक्ट निगरानी की ओर बढ़ सकती है।",
    },
  },
  {
    keywords: ["university", "college assignment", "विश्वविद्यालय", "यूनिवर्सिटी", "महाविद्यालय", "assignment"],
    response: {
      en: "Once a problem is verified, government can assign it to a suitable university based on expertise and capacity. The university reviews the challenge, identifies a faculty mentor and forms a student team. Assignment is not completion; progress remains tracked through project stages.",
      hi: "समस्या सत्यापित होने के बाद सरकार विशेषज्ञता और क्षमता के आधार पर उसे उपयुक्त विश्वविद्यालय को दे सकती है। विश्वविद्यालय चुनौती की समीक्षा, फैकल्टी मेंटर का चयन और छात्र टीम बनाता है। असाइनमेंट का अर्थ समाधान पूरा होना नहीं है; प्रगति चरणों में ट्रैक होती है।",
    },
  },
  {
    keywords: ["accept", "acceptance", "स्वीकार", "स्वीकृति", "university acceptance"],
    response: {
      en: "The assigned university studies the problem, confirms that it can work on it, and accepts or declines the assignment through the portal. After acceptance, the team prepares a solution plan, budget and milestones for review.",
      hi: "असाइन किए गए विश्वविद्यालय की टीम समस्या का अध्ययन कर अपनी क्षमता की पुष्टि करती है और पोर्टल पर असाइनमेंट स्वीकार या अस्वीकार करती है। स्वीकृति के बाद टीम समाधान योजना, बजट और माइलस्टोन तैयार करती है।",
    },
  },
  {
    keywords: ["funding", "fund", "money", "budget", "पैसा", "फंड", "फंडिंग", "बजट"],
    response: {
      en: "Government verifies and assigns challenges. University teams prepare solutions, and Industry sponsors eligible projects or provides expertise. Check the portal for current sponsorship status and official contacts.",
      hi: "उपयुक्त प्रोजेक्ट योजना और अनुमानित बजट के बाद सरकारी फंडिंग की समीक्षा होती है। स्वीकृति आधिकारिक समीक्षा पर निर्भर करती है और वर्कफ्लो में दर्ज होती है। फंडिंग स्वीकृति का अर्थ यह नहीं कि Sahayak नागरिक को पैसा देता है; प्रश्नों के लिए पोर्टल स्थिति और आधिकारिक संपर्क देखें।",
    },
  },
  {
    keywords: ["development", "develop", "solution", "project", "विकास", "समाधान", "प्रोजेक्ट", "परियोजना"],
    response: {
      en: "During university project development, the team turns the approved idea into a practical solution. It researches user needs, builds a prototype, records milestones, tests with stakeholders, incorporates feedback and prepares deployment documentation. Citizens can follow the project status in the portal.",
      hi: "विश्वविद्यालय प्रोजेक्ट विकास में टीम स्वीकृत विचार को व्यावहारिक समाधान में बदलती है। टीम जरूरतों का अध्ययन, प्रोटोटाइप निर्माण, माइलस्टोन अपडेट, हितधारकों के साथ परीक्षण, प्रतिक्रिया सुधार और डिप्लॉयमेंट दस्तावेज तैयार करती है। नागरिक पोर्टल में स्थिति देख सकते हैं।",
    },
  },
  {
    keywords: ["faculty", "mentor", "teacher", "फैकल्टी", "मेंटर", "शिक्षक"],
    response: {
      en: "The faculty mentor guides the student team, checks technical and ethical quality, coordinates with government and citizens, reviews milestones, manages risks and helps prepare a maintainable deployment. The mentor does not replace the government’s verification or the citizen’s feedback.",
      hi: "फैकल्टी मेंटर छात्र टीम का मार्गदर्शन, तकनीकी और नैतिक गुणवत्ता की जांच, सरकार व नागरिकों के साथ समन्वय, माइलस्टोन समीक्षा, जोखिम प्रबंधन और टिकाऊ डिप्लॉयमेंट में मदद करता है। मेंटर सरकारी सत्यापन या नागरिक की प्रतिक्रिया का स्थान नहीं लेता।",
    },
  },
  {
    keywords: ["student", "team", "student team", "छात्र", "विद्यार्थी", "टीम"],
    response: {
      en: "The student team researches the real need, proposes and builds the solution, documents decisions, follows safety and privacy practices, reports milestones and tests with intended users. The team should communicate limitations honestly and hand over deployment and maintenance information.",
      hi: "छात्र टीम वास्तविक जरूरत का अध्ययन, समाधान का प्रस्ताव और निर्माण, निर्णयों का दस्तावेजीकरण, सुरक्षा व गोपनीयता का पालन, माइलस्टोन रिपोर्ट और उपयोगकर्ताओं के साथ परीक्षण करती है। टीम सीमाएं ईमानदारी से बताए और डिप्लॉयमेंट व रखरखाव की जानकारी सौंपे।",
    },
  },
  {
    keywords: ["milestone", "milestones", "status stage", "stages", "चरण", "माइलस्टोन", "स्थिति चरण"],
    response: {
      en: "Typical stages are: submitted, under review, verified/approved, assigned, awaiting university acceptance, accepted, funding review/approved, in progress or prototype, testing, deployed, and completed/problem solved. Exact labels can vary by portal status; the dashboard is the source of truth.",
      hi: "सामान्य चरण हैं: सबमिट, समीक्षा में, सत्यापित/स्वीकृत, असाइन, विश्वविद्यालय स्वीकृति की प्रतीक्षा, स्वीकृत, फंडिंग समीक्षा/स्वीकृत, प्रगति या प्रोटोटाइप, परीक्षण, डिप्लॉय और पूरा/समस्या हल। सही लेबल पोर्टल स्थिति में देखें।",
    },
  },
  {
    keywords: ["testing", "deployment", "deployed", "परीक्षण", "डिप्लॉय", "तैनाती"],
    response: {
      en: "Testing checks safety, reliability, usability and whether the solution addresses the reported need. Deployment means the agreed solution is put into intended use with documentation, support and monitoring. Feedback can still lead to improvements after deployment.",
      hi: "परीक्षण में सुरक्षा, विश्वसनीयता, उपयोग में सरलता और समस्या के समाधान की जांच होती है। डिप्लॉयमेंट का अर्थ है कि सहमत समाधान दस्तावेज, सहायता और निगरानी के साथ उपयोग में लगाया गया है। डिप्लॉयमेंट के बाद भी प्रतिक्रिया से सुधार हो सकते हैं।",
    },
  },
  {
    keywords: ["problem solved", "solved", "resolved", "हल", "समस्या हल", "समाधान हो गया"],
    response: {
      en: "Problem Solved means the agreed solution has been implemented, tested and marked complete in the project workflow, with evidence or stakeholder confirmation where applicable. It does not mean every related issue in the area has disappeared; report a new or remaining issue separately.",
      hi: "Problem Solved का अर्थ है कि सहमत समाधान लागू, परीक्षणित और प्रोजेक्ट वर्कफ्लो में पूरा दर्ज किया गया है, जहां जरूरी हो वहां प्रमाण या हितधारक पुष्टि के साथ। इसका अर्थ क्षेत्र की हर संबंधित समस्या खत्म होना नहीं है; बची समस्या अलग से दर्ज करें।",
    },
  },
  {
    keywords: ["help", "sahayak", "सहायता", "मदद", "how can you help"],
    response: {
      en: "Sahayak can explain how to submit and track a problem, what evidence is useful, and how government-university solution stages work. Describe your issue in plain language, include the location and category, and never share passwords or OTPs. Use the portal’s official workflow for real submissions.",
      hi: "Sahayak समस्या दर्ज करने और ट्रैक करने, उपयोगी प्रमाण और सरकार-विश्वविद्यालय समाधान चरण समझा सकता है। अपनी समस्या, स्थान और श्रेणी सरल भाषा में बताएं और पासवर्ड या OTP कभी साझा न करें। वास्तविक सबमिशन के लिए पोर्टल के आधिकारिक वर्कफ्लो का उपयोग करें।",
    },
  },
  {
    keywords: ["offline", "no internet", "internet unavailable", "इंटरनेट नहीं", "ऑफलाइन", "नेट नहीं"],
    response: {
      en: "You are in Offline Assistance Mode. I can still explain portal steps and common categories using local guidance, but I cannot submit, upload, authenticate, fetch current status or contact government without internet. Write down your details and submit when connectivity returns; wait for a confirmation ID.",
      hi: "आप ऑफलाइन सहायता मोड में हैं। मैं स्थानीय जानकारी से पोर्टल के चरण और सामान्य श्रेणियां समझा सकता हूं, लेकिन इंटरनेट के बिना सबमिट, अपलोड, लॉगिन, वर्तमान स्थिति प्राप्त या सरकार से संपर्क नहीं कर सकता। विवरण लिख लें और कनेक्शन लौटने पर सबमिट करें; पुष्टि आईडी का इंतजार करें।",
    },
  },
];

function detectLanguage(input: string, preferredLanguage?: OfflineLanguage): OfflineLanguage {
  if (/[\u0900-\u097F]/.test(input)) return "hi";
  if (preferredLanguage) return preferredLanguage;
  return "en";
}

export function getOfflineSahayakResponse(input: string, preferredLanguage?: OfflineLanguage): OfflineSahayakResponse {
  const normalized = input.toLocaleLowerCase();
  const language = detectLanguage(input, preferredLanguage);
  const emergencyScenario = detectEmergencyScenario(input);
  if (emergencyScenario) {
    return {
      message: "",
      offline: true,
      emergency: true,
      emergencyScenario,
    };
  }
  const topic = topics.find(({ keywords }) =>
    keywords.some((keyword) => normalized.includes(keyword.toLocaleLowerCase())),
  );

  return { message: topic?.response[language] || fallback[language], offline: true };
}
