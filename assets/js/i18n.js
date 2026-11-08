/**
 * Business Scope in Your City — Comprehensive Pan-India Localization & i18n Engine
 * Supports all 22 official Eighth Schedule Indian Languages + English:
 * Hindi (hi), Bengali (bn), Telugu (te), Marathi (mr), Tamil (ta), Gujarati (gu),
 * Urdu (ur), Kannada (kn), Odia (or), Malayalam (ml), Punjabi (pa), Assamese (as),
 * Maithili (mai), Santali (sat), Kashmiri (ks), Nepali (ne), Konkani (kok),
 * Sindhi (sd), Dogri (doi), Manipuri (mni), Bodo (brx), Sanskrit (sa), and English (en).
 *
 * Core Capabilities:
 * 1. 5-Layer Persistent State: URL parameter (?lang=xx), sessionStorage, localStorage,
 *    window.name, and cookies guarantee language never resets to English when switching pages.
 * 2. Deep DOM Tree & Pattern Translation: Automatically traverses and translates text nodes,
 *    placeholders, titles, option values, composite phrases ("Explore Mumbai →", "14 Opportunities"),
 *    colons, arrows, and dynamic cards without requiring data-i18n tags.
 * 3. Bidirectional & Lossless: Retains original English strings via WeakMap / node properties so
 *    switching between any language and back to English is instantaneous and 100% accurate.
 * 4. Automatic Link & Navigation Interception: All internal links and programmatic navigations
 *    automatically preserve the chosen language parameter across all 18 platform pages.
 * 5. MutationObserver & Multi-Pass Auto-Translation: Newly rendered dynamic content (cities,
 *    opportunities, blueprints, launch plans, modal previews) is translated immediately upon arrival.
 * 6. Native Ergonomic UI: Header switcher button, mobile drawer integration, and searchable modal.
 */

const I18N = (function() {
  'use strict';

  const STORAGE_KEY = 'bsc_selected_language';
  let currentLang = 'en';
  let domObserver = null;
  let isTranslating = false;

  // Master catalog of all 22 Eighth Schedule Indian Languages + English
  const LANGUAGES = [
    { code: 'en', native: 'English', english: 'English', region: 'All India', popular: true, rtl: false },
    { code: 'hi', native: 'हिन्दी', english: 'Hindi', region: 'North / Central India', popular: true, rtl: false },
    { code: 'bn', native: 'বাংলা', english: 'Bengali', region: 'West Bengal, Tripura, Assam', popular: true, rtl: false },
    { code: 'te', native: 'తెలుగు', english: 'Telugu', region: 'Andhra Pradesh, Telangana', popular: true, rtl: false },
    { code: 'mr', native: 'मराठी', english: 'Marathi', region: 'Maharashtra, Goa', popular: true, rtl: false },
    { code: 'ta', native: 'தமிழ்', english: 'Tamil', region: 'Tamil Nadu, Puducherry', popular: true, rtl: false },
    { code: 'gu', native: 'ગુજરાતી', english: 'Gujarati', region: 'Gujarat, DNH & DD', popular: true, rtl: false },
    { code: 'ur', native: 'اردو', english: 'Urdu', region: 'Pan-India, Telangana, UP, J&K', popular: true, rtl: true },
    { code: 'kn', native: 'ಕನ್ನಡ', english: 'Kannada', region: 'Karnataka', popular: true, rtl: false },
    { code: 'or', native: 'ଓଡ଼ିଆ', english: 'Odia', region: 'Odisha', popular: true, rtl: false },
    { code: 'ml', native: 'മലയാളം', english: 'Malayalam', region: 'Kerala, Lakshadweep', popular: true, rtl: false },
    { code: 'pa', native: 'ਪੰਜਾਬੀ', english: 'Punjabi', region: 'Punjab, Haryana, Delhi', popular: true, rtl: false },
    { code: 'as', native: 'অসমীয়া', english: 'Assamese', region: 'Assam', popular: false, rtl: false },
    { code: 'mai', native: 'मैथिली', english: 'Maithili', region: 'Bihar, Jharkhand', popular: false, rtl: false },
    { code: 'sat', native: 'ᱥᱟᱱᱛᱟᱲᱤ', english: 'Santali', region: 'Jharkhand, WB, Odisha', popular: false, rtl: false },
    { code: 'ks', native: 'کٲشُر', english: 'Kashmiri', region: 'Jammu & Kashmir', popular: false, rtl: true },
    { code: 'ne', native: 'नेपाली', english: 'Nepali', region: 'Sikkim, WB, Uttarakhand', popular: false, rtl: false },
    { code: 'kok', native: 'कोंकणी', english: 'Konkani', region: 'Goa, Coastal Karnataka', popular: false, rtl: false },
    { code: 'sd', native: 'سنڌي / सिन्धी', english: 'Sindhi', region: 'Gujarat, Maharashtra, Rajasthan', popular: false, rtl: false },
    { code: 'doi', native: 'डोगरी', english: 'Dogri', region: 'Jammu & Kashmir, HP', popular: false, rtl: false },
    { code: 'mni', native: 'মৈতৈলোন্', english: 'Manipuri', region: 'Manipur', popular: false, rtl: false },
    { code: 'brx', native: 'बड़ो', english: 'Bodo', region: 'Assam, Bodoland', popular: false, rtl: false },
    { code: 'sa', native: 'संस्कृतम्', english: 'Sanskrit', region: 'Classical / Pan-India', popular: false, rtl: false }
  ];

  // City Name Localizations across major languages
  const CITY_NAMES = {
    'Mumbai': { hi: 'मुंबई', bn: 'মুম্বাই', te: 'ముంబై', mr: 'मुंबई', ta: 'மும்பை', gu: 'મુંબઈ', ur: 'ممبئی', kn: 'ಮುಂಬೈ', or: 'ମୁମ୍ବାଇ', ml: 'മുംബൈ', pa: 'ਮੁੰਬਈ' },
    'Delhi': { hi: 'दिल्ली', bn: 'দিল্লি', te: 'ఢిల్లీ', mr: 'दिल्ली', ta: 'டெல்லி', gu: 'દિલ્હી', ur: 'دہلی', kn: 'ದೆಹಲಿ', or: 'ଦିଲ୍ଲୀ', ml: 'ഡൽഹി', pa: 'ਦਿੱਲੀ' },
    'Bengaluru': { hi: 'बेंगलुरु', bn: 'বেঙ্গালুরু', te: 'బెంగళూరు', mr: 'बेंगळुरू', ta: 'பெங்களூரு', gu: 'બેંગલુરુ', ur: 'بنگلور', kn: 'ಬೆಂಗಳೂರು', or: 'ବେଙ୍ଗାଲୁରୁ', ml: 'ബംഗളൂരു', pa: 'ਬੈਂਗਲੁਰੂ' },
    'Kolkata': { hi: 'कोलकाता', bn: 'কলকাতা', te: 'కోల్‌కతా', mr: 'कोलकाता', ta: 'கொல்கத்தா', gu: 'કોલકાતા', ur: 'کولکتہ', kn: 'ಕೋಲ್ಕತ್ತಾ', or: 'କୋଲକାତା', ml: 'കൊൽക്കത്ത', pa: 'ਕੋਲਕਾਤਾ' },
    'Hyderabad': { hi: 'हैदराबाद', bn: 'হায়দ্রাবাদ', te: 'హైదరాబాద్', mr: 'हैदराबाद', ta: 'ஹைதராபாத்', gu: 'હૈદરાબાદ', ur: 'حیدرآباد', kn: 'ಹೈದರಾಬಾದ್', or: 'ହାଇଦ୍ରାବାଦ', ml: 'ഹൈദരാബാദ്', pa: 'ਹੈਦਰਾਬਾਦ' },
    'Pune': { hi: 'पुणे', bn: 'পুনে', te: 'పూణే', mr: 'पुणे', ta: 'புனே', gu: 'પુણે', ur: 'پونے', kn: 'ಪುಣೆ', or: 'ପୁଣେ', ml: 'പുണെ', pa: 'ਪੁਣੇ' },
    'Ahmedabad': { hi: 'अहमदाबाद', bn: 'আহমেদাবাদ', te: 'అహ్మదాబాద్', mr: 'अहमदाबाद', ta: 'அகமதாபாத்', gu: 'અમદાવાદ', ur: 'احمد آباد', kn: 'ಅಹಮದಾಬಾದ್', or: 'ଅହମ୍ମଦାବାଦ', ml: 'അഹമ്മദാബാദ്', pa: 'ਅਹਿਮਦਾਬਾਦ' },
    'Chennai': { hi: 'चेन्नई', bn: 'চেন্নাই', te: 'చెన్నై', mr: 'चेन्नई', ta: 'சென்னை', gu: 'ચેન્નાઈ', ur: 'چنئی', kn: 'ಚೆನ್ನೈ', or: 'ଚେନ୍ନାଇ', ml: 'ചെന്നൈ', pa: 'ਚੇਨਈ' },
    'Jaipur': { hi: 'जयपुर', bn: 'জয়পুর', te: 'జైపూర్', mr: 'जयपूर', ta: 'ஜெய்ப்பூர்', gu: 'જયપુર', ur: 'جے پور', kn: 'ಜೈಪುರ', or: 'ଜୟପୁର', ml: 'ജയ്പൂർ', pa: 'ਜੈਪੁਰ' },
    'Lucknow': { hi: 'लखनऊ', bn: 'লখনউ', te: 'లక్నో', mr: 'लखनौ', ta: 'லக்னோ', gu: 'લખનૌ', ur: 'لکھنؤ', kn: 'ಲಕ್ನೋ', or: 'ଲକ୍ଷ୍ନୌ', ml: 'ലഖ്നൗ', pa: 'ਲਖਨਊ' },
    'Nagpur': { hi: 'नागपुर', bn: 'নাগপুর', te: 'నాగపూర్', mr: 'नागपूर', ta: 'நாக்பூர்', gu: 'નાગપુર', ur: 'ناگپور', kn: 'ನಾಗಪುರ', or: 'ନାଗପୁର', ml: 'നാഗ്പൂർ', pa: 'ਨਾਗਪੁਰ' },
    'Indore': { hi: 'इंदौर', bn: 'ইন্দোর', te: 'ఇండోర్', mr: 'इंदूर', ta: 'இந்தூர்', gu: 'ઇન્દોર', ur: 'اندور', kn: 'ಇಂದೋರ್', or: 'ଇନ୍ଦୋର', ml: 'ഇൻഡോർ', pa: 'ਇੰਦੌਰ' },
    'Surat': { hi: 'सूरत', bn: 'সুরাট', te: 'సూరత్', mr: 'सुरत', ta: 'சூரத்', gu: 'સુરત', ur: 'سورت', kn: 'ಸೂರತ್', or: 'ସୁରଟ', ml: 'സൂററ്റ്', pa: 'ਸੂਰਤ' },
    'Bhopal': { hi: 'भोपाल', bn: 'ভোপাল', te: 'భోపాల్', mr: 'भोपाळ', ta: 'போபால்', gu: 'ભોપાલ', ur: 'بھوپال', kn: 'ಭೋಪಾಲ್', or: 'ଭୋପାଳ', ml: 'ഭോപ്പാൽ', pa: 'ਭੋਪਾਲ' },
    'Patna': { hi: 'पटना', bn: 'পাটনা', te: 'పాట్నా', mr: 'पाटणा', ta: 'பாட்னா', gu: 'પટના', ur: 'پٹنہ', kn: 'ಪಾಟ್ನಾ', or: 'ପାଟନା', ml: 'പട്ന', pa: 'ਪਟਨਾ' },
    'Vadodara': { hi: 'वडोदरा', bn: 'ভাদোদরা', te: 'వడోదర', mr: 'वडोदरा', ta: 'வடோதரா', gu: 'વડોદરા', ur: 'وڈودرا', kn: 'ವಡೋದರಾ', or: 'ଭଦୋଦରା', ml: 'വഡോദര', pa: 'ਵਡੋਦਰਾ' },
    'Coimbatore': { hi: 'कोयंबटूर', bn: 'কোয়েম্বাটুর', te: 'కోయంబత్తూరు', mr: 'कोइम्बतूर', ta: 'கோயம்புத்தூர்', gu: 'કોઈમ્બતૂર', ur: 'کوئمبٹور', kn: 'ಕೊಯಮತ್ತೂರು', or: 'କୋଏମ୍ବାଟୁର', ml: 'കോയമ്പത്തൂർ', pa: 'ਕੋਇੰਬਟੂਰ' },
    'Kochi': { hi: 'कोच्चि', bn: 'কোচি', te: 'కొచ్చి', mr: 'कोची', ta: 'கொச்சி', gu: 'કોચી', ur: 'کوچی', kn: 'ಕೊಚ್ಚಿ', or: 'କୋଚି', ml: 'കൊച്ചി', pa: 'ਕੋਚੀ' },
    'Chandigarh': { hi: 'चंडीगढ़', bn: 'চণ্ডীগড়', te: 'చండీగఢ్', mr: 'चंदिगढ', ta: 'சண்டிகர்', gu: 'ચંદીગઢ', ur: 'چندی گڑھ', kn: 'ಚಂಡೀಗಢ', or: 'ଚଣ୍ଡିଗଡ଼', ml: 'ചണ്ഡീഗഢ്', pa: 'ਚੰਡੀਗੜ੍ਹ' },
    'Varanasi': { hi: 'वाराणसी', bn: 'বারাণসী', te: 'వారణాసి', mr: 'वाराणसी', ta: 'வாரணாசி', gu: 'વારાણસી', ur: 'وارانسی', kn: 'ವಾರಣಾಸಿ', or: 'ବାରାଣସୀ', ml: 'വാരണാസി', pa: 'ਵਾਰਾਣਸੀ' }
  };

  // Comprehensive master UI dictionary
  const PHRASE_DICTIONARY = {
    // Navigation & Brand
    'Opportunities': {
      hi: 'व्यापारिक अवसर', bn: 'ব্যবসায়িক সুযোগ', te: 'వ్యాపార అవకాశాలు', mr: 'व्यावसायिक संधी',
      ta: 'தொழில் வாய்ப்புகள்', gu: 'વ્યાપારિક તકો', ur: 'کاروباری مواقع', kn: 'ವ್ಯಾಪಾರ ಅವಕಾಶಗಳು',
      or: 'ବ୍ୟବସାୟ ସୁଯୋଗ', ml: 'സംരംഭക അവസരങ്ങൾ', pa: 'ਵਪਾਰਕ ਮੌਕੇ', as: 'ব্যৱসায়িক সুযোগ',
      mai: 'व्यापारिक अवसर', ne: 'व्यापारिक अवसरहरू', sa: 'व्यापारिक अवसराः'
    },
    'Explore Opportunities': {
      hi: 'व्यापारिक अवसर खोजें', bn: 'সুযোগ অন্বেষণ করুন', te: 'అవకాశాలను అన్వేషించండి', mr: 'संधी शोधा',
      ta: 'வாய்ப்புகளை ஆராயுங்கள்', gu: 'તકોનું અન્વેષણ કરો', ur: 'مواقع تلاش کریں', kn: 'ಅವಕಾಶಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
      or: 'ସୁଯୋଗ ଅନ୍ୱେଷଣ କରନ୍ତୁ', ml: 'അവസരങ്ങൾ കണ്ടെത്തുക', pa: 'ਮੌਕੇ ਖੋਜੋ'
    },
    'All Opportunities': {
      hi: 'सभी व्यापारिक अवसर', bn: 'সকল সুযোগ', te: 'అన్ని అవకాశాలు', mr: 'सर्व संधी',
      ta: 'அனைத்து வாய்ப்புகள்', gu: 'બધી તકો', ur: 'تمام مواقع', kn: 'ಎಲ್ಲಾ ಅವಕಾಶಗಳು'
    },
    'Cities': {
      hi: 'शहर', bn: 'শহরসমূহ', te: 'నగరాలు', mr: 'शहरं', ta: 'நகரங்கள்', gu: 'શહેરો',
      ur: 'شہر', kn: 'ನಗರಗಳು', or: 'ସହରସମୂହ', ml: 'നഗരങ്ങൾ', pa: 'ਸ਼ਹਿਰ', as: 'নগৰসমূহ'
    },
    'Cities Directory': {
      hi: 'शहर निर्देशिका', bn: 'শহরের ডিরেক্টরি', te: 'నగరాల డైరెక్టరీ', mr: 'शहर निर्देशिका',
      ta: 'நகரங்கள் அடைவு', gu: 'શહેર ડિરેક્ટરી', ur: 'شہروں کی ڈائرکٹری', kn: 'ನಗರಗಳ ಡೈರೆಕ್ಟರಿ'
    },
    'City Directory': {
      hi: 'शहर निर्देशिका', bn: 'শহরের ডিরেক্টরি', te: 'నగర డైరెక్టరీ', mr: 'शहर निर्देशिका',
      ta: 'நகர அடைவு', gu: 'શહેર ડિરેક્ટરી', ur: 'شہر کی ڈائرکٹری'
    },
    'All Cities': {
      hi: 'सभी शहर', bn: 'সকল শহর', te: 'అన్ని నగరాలు', mr: 'सर्व शहरं',
      ta: 'அனைத்து நகரங்கள்', gu: 'બધા શહેરો', ur: 'تمام شہر', kn: 'ಎಲ್ಲಾ ನಗರಗಳು'
    },
    'All 88+ Cities': {
      hi: 'सभी 88+ शहर', bn: 'সকল ৮৮+ শহর', te: 'అన్ని 88+ నగరాలు', mr: 'सर्व ८८+ शहरं',
      ta: 'அனைத்து 88+ நகரங்கள்', gu: 'બધા 88+ શહેરો', ur: 'تمام 88+ شہر'
    },
    'Blueprints': {
      hi: 'ब्लूप्रिंट्स', bn: 'ব্লুপ্রিন্ট', te: 'బ్లూప్రింట్లు', mr: 'ब्लूप्रिंट्स',
      ta: 'வடிவமைப்புகள்', gu: 'બ્લૂપ્રિન્ટ્સ', ur: 'بلیو پرنٹس', kn: 'ಬ್ಲೂಪ್ರಿಂಟ್ಗಳು'
    },
    'Business Blueprints': {
      hi: 'व्यापारिक ब्लूप्रिंट्स', bn: 'ব্যবসায়িক ব্লুপ্রিন্ট', te: 'వ్యాపార బ్లూప్రింట్లు', mr: 'व्यवसाय ब्लूप्रिंट्स',
      ta: 'வணிகத் திட்ட வரைபடங்கள்', gu: 'વ્યાપાર બ્લૂપ્રિન્ટ્સ', ur: 'کاروباری بلیو پرنٹس'
    },
    'Launch Plans': {
      hi: 'लॉन्च योजनाएं', bn: 'লঞ্চ পরিকল্পনা', te: 'లాంచ్ ప్రణాళికలు', mr: 'लाँच योजना',
      ta: 'துவக்கத் திட்டங்கள்', gu: 'લોન્ચ યોજનાઓ', ur: 'لانچ پلانز', kn: 'ಲಾಂಚ್ ಯೋಜನೆಗಳು'
    },
    '90-Day Launch Plans': {
      hi: '90-दिवसीय लॉन्च योजनाएं', bn: '৯০ দিনের লঞ্চ পরিকল্পনা', te: '90 రోజుల లాంచ్ ప్రణాళికలు',
      mr: '९० दिवसांची लाँच योजना', ta: '90 நாள் துவக்கத் திட்டங்கள்', gu: '90-દિવસીય લોન્ચ યોજનાઓ'
    },
    'Insights': {
      hi: 'मार्केट इनसाइट्स', bn: 'মার্কেট অন্তর্দৃষ্টি', te: 'మార్కెట్ విశ్లేషణ', mr: 'मार्केट इनसाइट्स',
      ta: 'சந்தை பார்வைகள்', gu: 'બજાર વિશ્લેષણ', ur: 'مارکیٹ بصیرت', kn: 'ಮಾರುಕಟ್ಟೆ ಒಳನೋಟಗಳು'
    },
    'Market Insights': {
      hi: 'बाजार विश्लेषण व इनसाइट्स', bn: 'বাজার বিশ্লেষণ ও অন্তর্দৃষ্টি', te: 'మార్కెట్ విశ్లేషణ మరియు అంతర్దృష్టులు',
      mr: 'बाजार विश्लेषण आणि इनसाइट्स', ta: 'சந்தை பகுப்பாய்வு & நுண்ணறிவு', gu: 'બજાર વિશ્લેષણ અને ઇનસાઇટ્સ'
    },
    'Insights & Case Studies': {
      hi: 'इनसाइट्स और केस स्टडीज', bn: 'অন্তর্দৃষ্টি ও কেস স্টাডি', te: 'విశ్లేషణ మరియు కేస్ స్టడీస్', mr: 'इनसाइट्स आणि केस स्टडीज'
    },
    'About': {
      hi: 'हमारे बारे में', bn: 'আমাদের সম্পর্কে', te: 'మా గురించి', mr: 'आमच्याबद्दल',
      ta: 'எங்களைப் பற்றி', gu: 'અમારા વિશે', ur: 'ہمارے متعلق', kn: 'ನಮ್ಮ ಬಗ್ಗೆ'
    },
    'About Us': {
      hi: 'हमारे बारे में', bn: 'আমাদের সম্পর্কে', te: 'మా గురించి', mr: 'आमच्याबद्दल',
      ta: 'எங்களைப் பற்றி', gu: 'અમારા વિશે', ur: 'ہمارے متعلق'
    },
    'FAQ': {
      hi: 'अक्सर पूछे जाने वाले सवाल', bn: 'সাধারণ প্রশ্নোত্তর', te: 'తరచుగా అడిగే ప్రశ్నలు',
      mr: 'नेहमी विचारले जाणारे प्रश्न', ta: 'அடிக்கடி கேட்கப்படும் கேள்விகள்', gu: 'વારંવાર પૂછાતા પ્રશ્નો'
    },
    'Frequently Asked Questions': {
      hi: 'अक्सर पूछे जाने वाले सवाल (FAQ)', bn: 'সাধারণ প্রশ্নোত্তর (FAQ)',
      te: 'తరచుగా అడిగే ప్రశ్నలు (FAQ)', mr: 'नेहमी विचारले जाणारे प्रश्न (FAQ)',
      ta: 'அடிக்கடி கேட்கப்படும் கேள்விகள் (FAQ)', gu: 'વારંવાર પૂછાતા પ્રશ્નો (FAQ)'
    },
    'Access Purchases': {
      hi: 'खरीदी गई रिपोर्ट्स देखें', bn: 'কেনা রিপোর্ট অ্যাক্সেস', te: 'కొనుగోలు చేసిన నివేదికలు',
      mr: 'खरेदी केलेले अहवाल पहा', ta: 'வாங்கிய அறிக்கைகள்', gu: 'ખરીદેલ અહેવાલો જુઓ'
    },
    'Access Purchased Reports': {
      hi: 'खरीदी गई रिपोर्ट्स देखें', bn: 'কেনা রিপোর্ট অ্যাক্সেস করুন', te: 'కొనుగోలు చేసిన నివేదికలు చూడండి',
      mr: 'खरेदी केलेले अहवाल मिळवा', ta: 'வாங்கிய அறிக்கைகளைப் பெறுக', gu: 'ખરીદેલ અહેવાલો ઍક્સેસ કરો'
    },
    'Order Support': {
      hi: 'ऑर्डर सहायता', bn: 'অর্ডার সহায়তা', te: 'ఆర్డర్ మద్దతు', mr: 'ऑर्डर सपोर्ट',
      ta: 'ஆர்டர் உதவி', gu: 'ઓર્ડર સહાય', ur: 'آرڈر سپورٹ'
    },
    'Custom Research': {
      hi: 'कस्टम रिसर्च', bn: 'কাস্টম গবেষণা', te: 'అనుకూల పరిశోధన', mr: 'कस्टम रिसर्च',
      ta: 'தனிப்பயன் ஆராய்ச்சி', gu: 'કસ્ટમ સંશોધન', ur: 'کسٹم تحقیق'
    },
    'Commission Custom Research': {
      hi: 'कस्टम मार्केट रिसर्च कराएं', bn: 'কাস্টম মার্কেট রিসার্চ করান',
      te: 'కస్టమ్ మార్కెట్ పరిశోధన చేయించండి', mr: 'कस्टम रिसर्चची मागणी करा',
      ta: 'தனிப்பயன் சந்தை ஆராய்ச்சி கோருங்கள்', gu: 'કસ્ટમ સંશોધન કરાવો'
    },
    'Custom City Research': {
      hi: 'कस्टम शहर रिसर्च', bn: 'কাস্টম শহর গবেষণা', te: 'కస్టమ్ సిటీ పరిశోధన', mr: 'कस्टम शहर रिसर्च'
    },
    'Methodology': {
      hi: 'शोध पद्धति', bn: 'গবেষণা পদ্ধতি', te: 'పరిశోధనా విధానం', mr: 'संशोधन पद्धती',
      ta: 'ஆராய்ச்சி முறை', gu: 'સંશોધન પદ્ધતિ', ur: 'طریقہ کار'
    },
    'Research Methodology': {
      hi: 'अनुसंधान एवं शोध पद्धति', bn: 'গবেষণা ও অনুসন্ধান পদ্ধতি', te: 'పరిశోధనా పద్ధతి',
      mr: 'संशोधन कार्यपद्धती', ta: 'ஆராய்ச்சி நெறிமுறை', gu: 'સંશોધન પદ્ધતિ'
    },
    'How It Works': {
      hi: 'यह कैसे काम करता है', bn: 'এটি কীভাবে কাজ করে', te: 'ఇది ఎలా పనిచేస్తుంది',
      mr: 'हे कसे कार्य करते', ta: 'இது எவ்வாறு செயல்படுகிறது', gu: 'આ કેવી રીતે કાર્ય કરે છે'
    },
    'Contact': {
      hi: 'संपर्क', bn: 'যোগাযোগ', te: 'సంప్రదించండి', mr: 'संपर्क', ta: 'தொடர்பு', gu: 'સંપર્ક', ur: 'رابطہ'
    },
    'Contact Our Analysts': {
      hi: 'हमारे विश्लेषकों से संपर्क करें', bn: 'আমাদের বিশ্লেষকদের সাথে যোগাযোগ করুন',
      te: 'మా విశ్లేషకులను సంప్రదించండి', mr: 'आमच्या विश्लेषकांशी संपर्क साधा',
      ta: 'எங்கள் ஆய்வாளர்களைத் தொடர்பு கொள்ளவும்', gu: 'અમારા વિશ્લેષકોનો સંપર્ક કરો'
    },
    'Home': {
      hi: 'होम', bn: 'হোম', te: 'హోమ్', mr: 'मुख्यपृष्ठ', ta: 'முகப்பு', gu: 'હોમ', ur: 'ہوم'
    },
    'Menu': {
      hi: 'मेनू', bn: 'মেনু', te: 'మెనూ', mr: 'मेनू', ta: 'மெனு', gu: 'મેનુ', ur: 'مینو'
    },
    'Orders': {
      hi: 'ऑर्डर्स', bn: 'অর্ডার', te: 'ఆర్డర్లు', mr: 'ऑर्डर्स', ta: 'ஆர்டர்கள்', gu: 'ઓર્ડર', ur: 'آرڈرز'
    },
    'Explore': {
      hi: 'अन्वेषण', bn: 'অন্বেষণ', te: 'అన్వేషించండి', mr: 'अन्वेषण', ta: 'ஆராயுங்கள்', gu: 'અન્વેષણ'
    },
    'Business Scope': {
      hi: 'बिजनेस स्कोप', bn: 'বিজনেস স্কোপ', te: 'బిజినెస్ స్కోప్', mr: 'बिझनेस स्कोप',
      ta: 'வணிக வாய்ப்பு', gu: 'બિઝનેસ સ્કોપ', ur: 'بزنس اسکوپ'
    },
    'in Your City': {
      hi: 'आपके शहर में', bn: 'আপনার শহরে', te: 'మీ నగరంలో', mr: 'तुमच्या शहरात',
      ta: 'உங்கள் நகரில்', gu: 'તમારા શહેરમાં', ur: 'آپ کے شہر میں'
    },
    'Business Scope in Your City': {
      hi: 'बिजनेस स्कोप इन योर सिटी', bn: 'বিজনেস স্কোপ ইন ইওর সিটি', te: 'బిజినెస్ స్కోప్ ఇన్ యువర్ సిటీ',
      mr: 'बिझनेस स्कोप इन युवर सिटी', ta: 'உங்கள் நகரில் தொழில் வாய்ப்பு', gu: 'બિઝનેસ સ્કોપ ઇન યોર સિટી'
    },
    'Discover Local Gaps. Build Real Businesses.': {
      hi: 'स्थानीय बाजार की कमियों को पहचानें। वास्तविक और लाभदायक व्यवसाय बनाएं।',
      bn: 'স্থানীয় বাজারের ফাঁক চিহ্নিত করুন। বাস্তব ব্যবসা গড়ে তুলুন।',
      te: 'స్థానిక మార్కెట్ ఖాళీలను గుర్తించండి. స్థిరమైన వ్యాపారాలను నిర్మించండి.',
      mr: 'स्थानिक बाजारातील संधी शोधा. प्रत्यक्ष यशस्वी व्यवसाय उभारा.',
      ta: 'உள்ளூர் சந்தை இடைவெளிகளைக் கண்டறியுங்கள். வெற்றிகரமான வணிகங்களை உருவாக்குங்கள்.',
      gu: 'સ્થાનિક બજારની જરૂરિયાતો ઓળખો. સાચા વ્યવસાયનું નિર્માણ કરો.'
    },
    'Find the business scope in your city.': {
      hi: 'अपने शहर में व्यापार की संभावनाएं खोजें।',
      bn: 'আপনার শহরে ব্যবসার পরিধি খুঁজে নিন।',
      te: 'మీ నగరంలో వ్యాపార అవకాశాలను కనుగొనండి.',
      mr: 'आपल्या शहरातील व्यावसायिक संधी शोधा.',
      ta: 'உங்கள் நகரில் உள்ள வணிக வாய்ப்புகளைக் கண்டறியவும்.',
      gu: 'તમારા શહેરમાં વ્યાપારની શક્યતાઓ શોધો.'
    },
    'Local Opportunity Intelligence for India': {
      hi: 'भारत के शहरों के लिए प्रमाणित स्थानीय बाजार अनुसंधान',
      bn: 'ভারতের জন্য স্থানীয় সুযোগ গোয়েন্দা তথ্য',
      te: 'భారతదేశం కోసం స్థానిక అవకాశ ఇంటెలిజెన్స్',
      mr: 'भारतासाठी स्थानिक व्यावसायिक बुद्धिमत्ता'
    },
    'Where do you want to build?': {
      hi: 'आप अपना व्यवसाय कहां शुरू करना चाहते हैं?',
      bn: 'আপনি কোথায় ব্যবসা শুরু করতে চান?',
      te: 'మీరు ఎక్కడ వ్యాపారం నిర్మించాలనుకుంటున్నారు?',
      mr: 'तुम्ही कुठे व्यवसाय उभारू इच्छिता?',
      ta: 'நீங்கள் எங்கு வணிகத்தை உருவாக்க விரும்புகிறீர்கள்?',
      gu: 'તમે ક્યાં વ્યાપાર શરૂ કરવા માંગો છો?'
    },
    'Search any Indian city to open its empirical market profile, local gap analysis, and verified business opportunities.': {
      hi: 'किसी भी भारतीय शहर को खोजें और उसका प्रामाणिक बाजार प्रोफाइल, स्थानीय गैप विश्लेषण और सत्यापित अवसर देखें।',
      bn: 'যেকোনো ভারতীয় শহর অনুসন্ধান করুন এবং এর বাজার প্রোফাইল এবং যাচাইকৃত ব্যবসার সুযোগ দেখুন।',
      te: 'మార్కెట్ ప్రొఫైల్ మరియు ధృవీకరించిన వ్యాపార అవకాశాలను చూడటానికి ఏదైనా భారతీయ నగరాన్ని శోధించండి.',
      mr: 'कोणतेही भारतीय शहर शोधा आणि त्याचे बाजार विश्लेषण आणि सत्यापित व्यावसायिक संधी पहा.'
    },
    'Top Markets:': {
      hi: 'प्रमुख बाजार:', bn: 'শীর্ষ বাজার:', te: 'ప్రధాన మార్కెట్లు:', mr: 'प्रमुख बाजारपेठा:',
      ta: 'முக்கிய சந்தைகள்:', gu: 'ટોચના બજારો:'
    },

    // Metrics, Badges & Technical Indicators
    'Population Band': {
      hi: 'जनसंख्या वर्ग', bn: 'জনসংখ্যার স্তর', te: 'జనాభా వర్గం', mr: 'लोकसंख्या गट',
      ta: 'மக்கள் தொகை பிரிவு', gu: 'વસ્તી શ્રેણી', ur: 'آبادی کا بینڈ'
    },
    'Business Density': {
      hi: 'व्यापार घनत्व', bn: 'ব্যবসায়ের ঘনত্ব', te: 'వ్యాపార సాంద్రత', mr: 'व्यापार घनता',
      ta: 'வணிக அடர்த்தி', gu: 'વ્યાપાર ઘનતા', ur: 'کاروباری کثافت'
    },
    'Capital Required': {
      hi: 'आवश्यक पूंजी (Capex)', bn: 'প্রয়োজনীয় মূলধন', te: 'అవసరమైన పెట్టుబడి', mr: 'आवश्यक भांडवल',
      ta: 'தேவைப்படும் மூலதனம்', gu: 'જરૂરી મૂડી', ur: 'مطلوبہ سرمایہ'
    },
    'Investment Range': {
      hi: 'निवेश सीमा', bn: 'বিনিয়োগের পরিসীমা', te: 'పెట్టుబడి పరిధి', mr: 'गुंतवणूक मर्यादा',
      ta: 'முதலீட்டு வரம்பு', gu: 'રોકાણ મર્યાદા', ur: 'سرمایہ کاری کی حد'
    },
    'Payback Period': {
      hi: 'पेबैक अवधि', bn: 'পে-ব্যাক সময়কাল', te: 'పేబ్యాక్ కాలం', mr: 'परतावा कालावधी',
      ta: 'முதலீடு திரும்பப் பெறும் காலம்', gu: 'પેબેક સમયગાળો'
    },
    'Break-even': {
      hi: 'ब्रेक-इवन (नो-प्रॉफिट नो-लॉस)', bn: 'ব্রেক-ইভেন সময়', te: 'బ్రేక్-ఈవెన్ సమయం', mr: 'ब्रेक-इव्हन वेळ',
      ta: 'லாப-நஷ்டமற்ற நிலை', gu: 'બ્રેક-ઇવન સમય'
    },
    'Break-even Timeline': {
      hi: 'ब्रेक-इवन समयसीमा', bn: 'ব্রেক-ইভেন সময়রেখা', te: 'బ్రేక్-ఈవెన్ కాలపరిమితి', mr: 'ब्रेक-इव्हन कालमर्यादा',
      ta: 'பிரேக்-ஈவன் காலவரிசை', gu: 'બ્રેક-ઇવન સમયરેખા'
    },
    'Regulatory Risk': {
      hi: 'नियामक व लाइसेंसिंग जोखिम', bn: 'নিয়ন্ত্রক ঝুঁকি', te: 'నియంత్రణ ప్రమాదం', mr: 'नियामक धोका',
      ta: 'ஒழுங்குமுறை ஆபத்து', gu: 'નિયમનકારી જોખમ'
    },
    'Difficulty Level': {
      hi: 'कठिनाई स्तर', bn: 'কঠিনতার স্তর', te: 'కష్టతర స్థాయి', mr: 'काठिण्य पातळी',
      ta: 'சிரம நிலை', gu: 'મુશ્કેલી સ્તર'
    },
    'Expected ROI': {
      hi: 'अनुमानित रिटर्न (ROI)', bn: 'প্রত্যাশিত রিটার্ন (ROI)', te: 'ఆశించిన రాబడి (ROI)', mr: 'अपेक्षित परतावा (ROI)',
      ta: 'எதிர்பார்க்கப்படும் வருவாய்', gu: 'અપેક્ષિત રિટર્ન'
    },
    'Target Customers': {
      hi: 'लक्षित ग्राहक', bn: 'লক্ষ্য গ্রাহক', te: 'లక్ష్య వినియోగదారులు', mr: 'लक्षित ग्राहक',
      ta: 'இலக்கு வாடிக்கையாளர்கள்', gu: 'લક્ષિત ગ્રાહકો'
    },
    'Key Suppliers': {
      hi: 'प्रमुख आपूर्तिकर्ता', bn: 'প্রধান সরবরাহকারী', te: 'ప్రధాన సరఫరాదారులు', mr: 'प्रमुख पुरवठादार',
      ta: 'முக்கிய சப்ளையர்கள்', gu: 'મુખ્ય સપ્લાયર્સ'
    },
    'Why this works in': {
      hi: 'यह इस शहर में क्यों सफल है:', bn: 'কেন এটি এই শহরে কাজ করে:', te: 'ఇది ఈ నగరంలో ఎందుకు పనిచేస్తుంది:',
      mr: 'हे या शहरात का यशस्वी ठरते:', ta: 'இது ஏன் இந்த நகரில் செயல்படுகிறது:', gu: 'આ આ શહેરમાં કેમ સફળ થશે:'
    },
    'Evidence Supported': {
      hi: 'प्रमाण आधारित', bn: 'প্রমাণ সমর্থিত', te: 'ఆధారాలతో కూడినది', mr: 'पुराव्यांवर आधारित',
      ta: 'சான்று ஆதரவுடையது', gu: 'પુરાવા આધારિત'
    },
    'Field Verified': {
      hi: 'जमीनी रूप से सत्यापित', bn: 'মাঠপর্যায়ে যাচাইকৃত', te: 'క్షేత్రస్థాయిలో ధృవీకరించబడింది', mr: 'प्रत्यक्ष पडताळणीकृत',
      ta: 'கள சரிபார்க்கப்பட்டது', gu: 'ગ્રાઉન્ડ પર ચકાસાયેલ'
    },
    'Desk Research': {
      hi: 'माध्यमिक डेटा विश्लेषण', bn: 'ডেস্ক গবেষণা', te: 'డెస్క్ పరిశోధన', mr: 'दुय्यम संशोधन',
      ta: 'மேசை ஆராய்ச்சி', gu: 'ડેસ્ક સંશોધન'
    },
    'Validated': {
      hi: 'सत्यापित', bn: 'যাচাইকৃত', te: 'ధృవీకరించబడింది', mr: 'प्रमाणित', ta: 'சரிபார்க்கப்பட்டது', gu: 'ચકાસાયેલ'
    },
    'Not yet researched': {
      hi: 'शोध प्रगति पर है', bn: 'গবেষণা এখনও সম্পন্ন হয়নি', te: 'ఇంకా పరిశోధించబడలేదు', mr: 'अद्याप संशोधन झालेले नाही',
      ta: 'இன்னும் ஆராய்ச்சி செய்யப்படவில்லை', gu: 'સંશોધન બાકી છે'
    },
    'Active Trade': {
      hi: 'सक्रिय वाणिज्यिक केंद्र', bn: 'সক্রিয় বাণিজ্য কেন্দ্র', te: 'చురుకైన వాణిజ్యం', mr: 'सक्रिय व्यापार केंद्र',
      ta: 'செயலில் உள்ள வர்த்தகம்', gu: 'સક્રિય વ્યાપાર કેન્દ્ર'
    },
    'Metro Cluster': {
      hi: 'महानगरीय क्लस्टर', bn: 'মেট্রো ক্লাস্টার', te: 'మెట్రో క్లస్టర్', mr: 'महानगरीय समूह',
      ta: 'பெருநகர கொத்து', gu: 'મેટ્રો ક્લસ્ટર'
    },
    'Tier 1 Metro': {
      hi: 'टियर 1 मेट्रो', bn: 'টায়ার ১ মেট্রো', te: 'టైర్ 1 మెట్రో', mr: 'टियर १ मेट्रो',
      ta: 'டயர் 1 பெருநகரம்', gu: 'ટાયર 1 મેટ્રો'
    },
    'Tier 2 Emerging': {
      hi: 'टियर 2 उभरता बाजार', bn: 'টায়ার ২ উদীয়মান বাজার', te: 'టైర్ 2 అభివృద్ధి చెందుతున్న నగరం',
      mr: 'टियर २ उदयोन्मुख बाजार', ta: 'டயர் 2 வளர்ந்து வரும் நகரம்', gu: 'ટાયર 2 ઊભરતું બજાર'
    },
    'Tier 3 Market': {
      hi: 'टियर 3 स्थानीय बाजार', bn: 'টায়ার ৩ বাজার', te: 'టైర్ 3 మార్కెట్', mr: 'टियर ३ स्थानिक बाजार',
      ta: 'டயர் 3 உள்ளூர் சந்தை', gu: 'ટાયર 3 બજાર'
    },
    'Low Risk': {
      hi: 'कम जोखिम', bn: 'কম ঝুঁকি', te: 'తక్కువ ప్రమాదం', mr: 'कमी धोका', ta: 'குறைந்த ஆபத்து', gu: 'ઓછું જોખમ'
    },
    'Medium Risk': {
      hi: 'मध्यम जोखिम', bn: 'মাঝারি ঝুঁকি', te: 'మధ్యస్థ ప్రమాదం', mr: 'मध्यम धोका', ta: 'நடுத்தர ஆபத்து', gu: 'મધ્યમ જોખમ'
    },
    'High Risk': {
      hi: 'उच्च जोखिम', bn: 'উচ্চ ঝুঁকি', te: 'అధిక ప్రమాదం', mr: 'जास्त धोका', ta: 'அதிக ஆபத்து', gu: 'વધારે જોખમ'
    },

    // Actions & Buttons
    'Search': { hi: 'खोजें', bn: 'অনুসন্ধান', te: 'శోధించండి', mr: 'शोधा', ta: 'தேடு', gu: 'શોધો', ur: 'تلاش کریں' },
    'Reset': { hi: 'रीसेट', bn: 'রিসেট', te: 'రీసెట్', mr: 'रीसेट', ta: 'மீட்டமை', gu: 'રીસેટ' },
    'Clear Filters': {
      hi: 'फिल्टर हटाएं', bn: 'ফিল্টার মুছুন', te: 'ఫిల్టర్లను క్లియర్ చేయండి', mr: 'फिल्टर्स काढा',
      ta: 'வடிப்பான்களை அழிக்கவும்', gu: 'ફિલ્ટર્સ સાફ કરો'
    },
    'Reset All Filters': {
      hi: 'सभी फिल्टर रीसेट करें', bn: 'সকল ফিল্টার রিসেট করুন', te: 'అన్ని ఫిల్టర్లను రీసెట్ చేయండి',
      mr: 'सर्व फिल्टर्स रीसेट करा', ta: 'அனைத்து வடிப்பான்களையும் மீட்டமைக்கவும்', gu: 'બધા ફિલ્ટર્સ રીસેટ કરો'
    },
    'Apply Filters': {
      hi: 'फिल्टर लागू करें', bn: 'ফিল্টার প্রয়োগ করুন', te: 'ఫిల్టర్లను వర్తింపజేయండి', mr: 'फिल्टर्स लागू करा',
      ta: 'வடிப்பான்களைப் பயன்படுத்துங்கள்', gu: 'ફિલ્ટર્સ લાગુ કરો'
    },
    'Filter Opportunities': {
      hi: 'अवसरों को फिल्टर करें', bn: 'সুযোগ ফিল্টার করুন', te: 'అవకాశాలను ఫిల్టర్ చేయండి', mr: 'संधी फिल्टर करा',
      ta: 'வாய்ப்புகளை வடிகட்டவும்', gu: 'તકોને ફિલ્ટર કરો'
    },
    'Download Free Sample': {
      hi: 'मुफ्त सैंपल डाउनलोड करें', bn: 'বিনামূল্যে নমুনা ডাউনলোড করুন', te: 'ఉచిత నమూనాను డౌన్‌లోడ్ చేయండి',
      mr: 'विनामूल्य नमुना डाउनलोड करा', ta: 'இலவச மாதிரியைப் பதிவிறக்கவும்', gu: 'મફત સેમ્પલ ડાઉનલોડ કરો'
    },
    'Select This Tier': {
      hi: 'यह टियर चुनें', bn: 'এই টায়ারটি নির্বাচন করুন', te: 'ఈ శ్రేణిని ఎంచుకోండి', mr: 'हा टियर निवडा',
      ta: 'இந்த அடுக்கைத் தேர்ந்தெடுக்கவும்', gu: 'આ ટાયર પસંદ કરો'
    },
    'Purchase Blueprint': {
      hi: 'ब्लूप्रिंट खरीदें', bn: 'ব্লুপ্রিন্ট কিনুন', te: 'బ్లూప్రింట్ కొనుగోలు చేయండి', mr: 'ब्लूप्रिंट खरेदी करा',
      ta: 'திட்ட வரைபடத்தை வாங்கவும்', gu: 'બ્લૂપ્રિન્ટ ખરીદો'
    },
    'View Deliverables': {
      hi: 'शामिल सामग्री देखें', bn: 'উপাদানগুলি দেখুন', te: 'అందించే పత్రాలను చూడండి', mr: 'समाविष्ट घटक पहा',
      ta: 'வழங்கல்களைக் காண்க', gu: 'ડિલિવરેબલ્સ જુઓ'
    },
    'Share Dossier': {
      hi: 'डॉक्यूमेंट शेयर करें', bn: 'নথি শেয়ার করুন', te: 'డాక్యుమెంట్ షేర్ చేయండి', mr: 'दस्तऐवज शेअर करा',
      ta: 'ஆவணத்தைப் பகிரவும்', gu: 'દસ્તાવેજ શેર કરો'
    },
    'Copy Link': {
      hi: 'लिंक कॉपी करें', bn: 'লিংক কপি করুন', te: 'లింక్ కాపీ చేయండి', mr: 'लिंक कॉपी करा',
      ta: 'இணைப்பை நகலெடுக்கவும்', gu: 'લિંક કૉપિ કરો'
    },
    'Copied!': { hi: 'कॉपी हो गया!', bn: 'কপি হয়েছে!', te: 'కాపీ చేయబడింది!', mr: 'कॉपी झाले!', ta: 'நகலெடுக்கப்பட்டது!', gu: 'કૉપિ થઈ ગયું!' },
    'Close': { hi: 'बंद करें', bn: 'বন্ধ করুন', te: 'మూసివేయి', mr: 'बंद करा', ta: 'மூடு', gu: 'બંધ કરો', ur: 'بند کریں' },
    'Next': { hi: 'अगला', bn: 'পরবর্তী', te: 'తరువాత', mr: 'पुढील', ta: 'அடுத்து', gu: 'આગળ', ur: 'اگلا' },
    'Previous': { hi: 'पिछला', bn: 'পূর্ববর্তী', te: 'మునుపటి', mr: 'मागील', ta: 'முந்தைய', gu: 'પાછળ', ur: 'پچھلا' },

    // Sectors & Categories
    'Food & Beverage': {
      hi: 'खाद्य एवं पेय (F&B)', bn: 'খাদ্য ও পানীয়', te: 'ఆహారం & పానీయాలు', mr: 'अन्न आणि पेये',
      ta: 'உணவு & பானங்கள்', gu: 'ખાદ્ય અને પીણાં', ur: 'خوراک اور مشروبات'
    },
    'Clean Energy & EV': {
      hi: 'स्वच्छ ऊर्जा व ईवी', bn: 'পরিচ্ছন্ন শক্তি ও ইভি', te: 'క్లీన్ ఎనర్జీ & ఈవీ', mr: 'स्वच्छ ऊर्जा आणि ईव्ही',
      ta: 'தூய ஆற்றல் & மின்வாகனம்', gu: 'ક્લીન એનર્જી અને ઇવી', ur: 'صاف ستھری توانائی اور ای وی'
    },
    'B2B Services': {
      hi: 'बी2बी सेवाएं (व्यावसायिक)', bn: 'বি২বি পরিষেবা', te: 'బీ2బీ సేవలు', mr: 'बी२बी सेवा',
      ta: 'பி2பி சேவைகள்', gu: 'બી2બી સેવાઓ', ur: 'بی ٹو بی خدمات'
    },
    'Logistics & Hyperlocal': {
      hi: 'लॉजिस्टिक्स व हाइपरलोकल', bn: 'লজিস্টিক ও হাইপারলোকাল', te: 'లాజిస్టిక్స్ & హైపర్‌లోకల్', mr: 'लॉजिस्टिक्स आणि हायपरलोकल',
      ta: 'லாஜிஸ்டிக்ஸ் & உள்ளூர் டெலிவரி', gu: 'લોજિસ્ટિક્સ અને હાઇપરલોકલ', ur: 'لاجسٹکس اور ہائپر لوکل'
    },
    'Healthcare & Elderly Care': {
      hi: 'स्वास्थ्य व बुजुर्गों की देखभाल', bn: 'স্বাস্থ্যসেবা ও প্রবীণ যত্ন', te: 'ఆరోగ్య సంరక్షణ & వృద్ధుల సంరక్షణ', mr: 'आरोग्यसेवा व ज्येष्ठ नागरिक काळजी',
      ta: 'சுகாதாரம் & முதியோர் பராமரிப்பு', gu: 'આરોગ્ય સંભાળ અને વડીલોની સંભાળ', ur: 'صحت کی دیکھ بھال اور بزرگوں کی دیکھ بھال'
    },
    'Light Manufacturing': {
      hi: 'लघु विनिर्माण (Manufacturing)', bn: 'ক্ষুদ্র উৎপাদন শিল্প', te: 'చిన్న తరహా తయారీ', mr: 'लघु उत्पादन उद्योग',
      ta: 'சிறு உற்பத்தி தொழில்', gu: 'લઘુ ઉત્પાદન', ur: 'ہلکی مینوفیکچرنگ'
    },
    'Education & Childcare': {
      hi: 'शिक्षा व बाल देखभाल', bn: 'শিক্ষা ও শিশু যত্ন', te: 'విద్య & శిశు సంరక్షణ', mr: 'शिक्षण आणि बाल संगोपन',
      ta: 'கல்வி & குழந்தை பராமரிப்பு', gu: 'શિક્ષણ અને બાળ સંભાળ'
    },
    'Home & Personal Services': {
      hi: 'घरेलू व व्यक्तिगत सेवाएं', bn: 'গৃহস্থালি ও ব্যক্তিগত পরিষেবা', te: 'గృహ & వ్యక్తిగత సేవలు', mr: 'घरगुती आणि वैयक्तिक सेवा',
      ta: 'வீட்டு & தனிநபர் சேவைகள்', gu: 'ઘરેલું અને વ્યક્તિગત સેવાઓ'
    },

    // Regions
    'North India': { hi: 'उत्तर भारत', bn: 'উত্তর ভারত', te: 'ఉత్తర భారతదేశం', mr: 'उत्तर भारत', ta: 'வட இந்தியா', gu: 'ઉત્તર ભારત', ur: 'شمالی ہندوستان' },
    'South India': { hi: 'दक्षिण भारत', bn: 'দক্ষিণ ভারত', te: 'దక్షిణ భారతదేశం', mr: 'दक्षिण भारत', ta: 'தென் இந்தியா', gu: 'દક્ષિણ ભારત', ur: 'جنوبی ہندوستان' },
    'West India': { hi: 'पश्चिम भारत', bn: 'পশ্চিম ভারত', te: 'పశ్చిమ భారతదేశం', mr: 'पश्चिम भारत', ta: 'மேற்கு இந்தியா', gu: 'પશ્ચિમ ભારત', ur: 'مغربی ہندوستان' },
    'East India': { hi: 'पूर्वी भारत', bn: 'পূর্ব ভারত', te: 'తూర్పు భారతదేశం', mr: 'पूर्व भारत', ta: 'கிழக்கு இந்தியா', gu: 'પૂર્વ ભારત', ur: 'مشرقی ہندوستان' },
    'Central India': { hi: 'मध्य भारत', bn: 'মধ্য ভারত', te: 'మధ్య భారతదేశం', mr: 'मध्य भारत', ta: 'மத்திய இந்தியா', gu: 'મધ્ય ભારત', ur: 'وسطی ہندوستان' },
    'Northeast India': { hi: 'पूर्वोत्तर भारत', bn: 'উত্তর-পূর্ব ভারত', te: 'ఈశాన్య భారతదేశం', mr: 'ईशान्य भारत', ta: 'வடகிழக்கு இந்தியா', gu: 'ઉત્તરપૂર્વ ભારત' },

    // Legal & Footer
    'Privacy Policy': {
      hi: 'गोपनीयता नीति', bn: 'গোপনীয়তা নীতি', te: 'గోప్యతా విధానం', mr: 'गोपनीयता धोरण',
      ta: 'தனியுரிமைக் கொள்கை', gu: 'ગોપનીયતા નીતિ', ur: 'پرائیویسی پالیسی'
    },
    'Terms of Service': {
      hi: 'सेवा की शर्तें', bn: 'সেবার শর্তাবলী', te: 'సేవా నిబంధనలు', mr: 'सेवेच्या अटी',
      ta: 'சேவை விதிமுறைகள்', gu: 'સેવાની શરતો', ur: 'سروس کی شرائط'
    },
    'Refund Policy': {
      hi: 'रिफंड नीति', bn: 'ফেরত নীতি', te: 'రీఫండ్ విధానం', mr: 'परतावा धोरण',
      ta: 'பணம் திரும்பப்பெறும் கொள்கை', gu: 'રિફંડ નીતિ', ur: 'رقم واپسی کی پالیسی'
    },
    'Risk Disclaimer': {
      hi: 'जोखिम अस्वीकरण', bn: 'ঝুঁকি সংক্রান্ত সতর্কবার্তা', te: 'ప్రమాద హెచ్చరిక', mr: 'धोका अस्वीकरण',
      ta: 'ஆபத்து மறுப்பு', gu: 'જોખમ અસ્વીકરણ', ur: 'رسک ڈس کلیمر'
    },
    'Research Policy': {
      hi: 'शोध व डेटा नीति', bn: 'গবেষণা নীতি', te: 'పరిశోధన విధానం', mr: 'संशोधन धोरण',
      ta: 'ஆராய்ச்சிக் கொள்கை', gu: 'સંશોધન નીતિ'
    },
    'Business Scope in Your City. All rights reserved.': {
      hi: 'बिजनेस स्कोप इन योर सिटी। सर्वाधिकार सुरक्षित।',
      bn: 'বিজনেস স্কোপ ইন ইওর সিটি। সর্বস্বত্ব সংরক্ষিত।',
      te: 'బిజినెస్ స్కోప్ ఇన్ యువర్ సిటీ. సర్వహక్కులు ప్రత్యేకించబడ్డాయి.',
      mr: 'बिझनेस स्कोप इन युवर सिटी. सर्व हक्क राखीव.',
      ta: 'உங்கள் நகரில் தொழில் வாய்ப்பு. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
      gu: 'બિઝનેસ સ્કોપ ઇન યોર સિટી. બધા હકો સુરક્ષિત છે.'
    },
    'Loading latest market intelligence...': {
      hi: 'नवीनतम बाजार अनुसंधान लोड हो रहा है...', bn: 'সর্বশেষ বাজার তথ্য লোড হচ্ছে...',
      te: 'తాజా మార్కెట్ ఇంటెలిజెన్స్ లోడ్ అవుతోంది...', mr: 'नवीनतम बाजार माहिती लोड होत आहे...',
      ta: 'சமீபத்திய சந்தை நுண்ணறிவு ஏற்றப்படுகிறது...', gu: 'તાજેતરની બજાર માહિતી લોડ થઈ રહી છે...'
    },
    'Loading nationwide cities database...': {
      hi: 'देशभर के शहरों का डेटाबेस लोड हो रहा है...', bn: 'দেশব্যাপী শহরগুলির ডাটাবেস লোড হচ্ছে...',
      te: 'దేశవ్యాప్త నగరాల డేటాబేస్ లోడ్ అవుతోంది...', mr: 'देशभरातील शहरांचा डेटाबेस लोड होत आहे...'
    }
  };

  /**
   * Safe decorator extractor.
   * Strips non-alphanumeric decorators (arrows, colons, numbers, bullets, brackets).
   */
  function cleanDecorators(str) {
    if (!str || typeof str !== 'string') return { prefix: '', core: '', suffix: '' };
    const trimmed = str.trim();
    // Match leading & trailing non-word decorators (handling Unicode scripts)
    const match = trimmed.match(/^([^\w\u0900-\u0D7F]*)(.*?)([^\w\u0900-\u0D7F]*)$/u);
    if (!match) return { prefix: '', core: trimmed, suffix: '' };
    return {
      prefix: match[1] || '',
      core: (match[2] || '').trim(),
      suffix: match[3] || ''
    };
  }

  /**
   * Helper to translate a city name into target native script if available.
   */
  function translateCityName(name, lang) {
    if (!name || lang === 'en') return name;
    if (CITY_NAMES[name] && CITY_NAMES[name][lang]) {
      return CITY_NAMES[name][lang];
    }
    if (CITY_NAMES[name] && CITY_NAMES[name]['hi']) {
      return CITY_NAMES[name]['hi'];
    }
    return name;
  }

  /**
   * Universal translation getter for a phrase, key, or pattern.
   * If target is English or not found, falls back safely.
   */
  function translatePhrase(phrase, lang) {
    if (!phrase || typeof phrase !== 'string') return phrase;
    const target = lang || currentLang || 'en';
    if (target === 'en') return phrase;

    const trimmed = phrase.trim();

    // 1. Direct exact dictionary match
    if (PHRASE_DICTIONARY[trimmed]) {
      if (PHRASE_DICTIONARY[trimmed][target]) return PHRASE_DICTIONARY[trimmed][target];
      if (PHRASE_DICTIONARY[trimmed]['hi']) return PHRASE_DICTIONARY[trimmed]['hi'];
    }

    // 2. Decorator stripped match (colons, arrows, bullets, etc.)
    const dec = cleanDecorators(trimmed);
    if (dec.core && PHRASE_DICTIONARY[dec.core]) {
      const matchCore = PHRASE_DICTIONARY[dec.core][target] || PHRASE_DICTIONARY[dec.core]['hi'];
      if (matchCore) {
        const suf = dec.suffix.trim();
        const needsSpace = suf && !/^[.,:;!?%)]/.test(suf);
        return (dec.prefix ? dec.prefix.trim() + ' ' : '') + matchCore + (suf ? (needsSpace ? ' ' : '') + suf : '');
      }
    }

    // 3. Dynamic Pattern Matching

    // Pattern A: "Explore {City} →" or "Explore {City}"
    const exploreMatch = dec.core.match(/^Explore\s+([A-Za-z\s]+)$/i);
    if (exploreMatch) {
      const city = exploreMatch[1].trim();
      const arrow = dec.suffix ? dec.suffix.trim() : '→';
      if (target === 'hi') return `${localCity} का अन्वेषण करें ${arrow}`.trim();
      if (target === 'bn') return `${localCity} অন্বেষণ করুন ${arrow}`.trim();
      if (target === 'te') return `${localCity}ని అన్వేషించండి ${arrow}`.trim();
      if (target === 'mr') return `${localCity}चे अन्वेषण करा ${arrow}`.trim();
      if (target === 'ta') return `${localCity} ஆராயுங்கள் ${arrow}`.trim();
      if (target === 'gu') return `${localCity}નું અન્વેષણ કરો ${arrow}`.trim();
      return `${localCity} का अन्वेषण करें ${arrow}`.trim();
    }

    // Pattern B: "Published Opportunities in {City}"
    const pubMatch = dec.core.match(/^Published Opportunities in\s+(.+)$/i);
    if (pubMatch) {
      const city = pubMatch[1].trim();
      const localCity = translateCityName(city, target);
      if (target === 'hi') return `${localCity} में प्रकाशित व्यापारिक अवसर`;
      if (target === 'bn') return `${localCity}-এ প্রকাশিত ব্যবসায়িক সুযোগ`;
      if (target === 'te') return `${localCity}లో ప్రచురించిన వ్యాపార అవకాశాలు`;
      if (target === 'mr') return `${localCity} मध्ये प्रकाशित व्यावसायिक संधी`;
      if (target === 'ta') return `${localCity}-இல் வெளியிடப்பட்ட தொழில் வாய்ப்புகள்`;
      return `${localCity} में प्रकाशित व्यापारिक अवसर`;
    }

    // Pattern C: "{N} Opportunities" or "{N} Opportunity"
    const countMatch = dec.core.match(/^(\d+)\s+Opportunit(?:y|ies)$/i);
    if (countMatch) {
      const count = countMatch[1];
      const oppWord = PHRASE_DICTIONARY['Opportunities'][target] || PHRASE_DICTIONARY['Opportunities']['hi'];
      return `${count} ${oppWord}`;
    }

    // Pattern D: "All {N}+ Cities"
    const allCitiesMatch = dec.core.match(/^All\s+(\d+)\+?\s*Cities$/i);
    if (allCitiesMatch) {
      const count = allCitiesMatch[1];
      if (target === 'hi') return `सभी ${count}+ शहर ${dec.suffix || '→'}`.trim();
      if (target === 'bn') return `সকল ${count}+ শহর ${dec.suffix || '→'}`.trim();
      if (target === 'te') return `అన్ని ${count}+ నగరాలు ${dec.suffix || '→'}`.trim();
      return `सभी ${count}+ शहर ${dec.suffix || '→'}`.trim();
    }

    // Pattern E: "Showing {A} to {B} of {C} cities"
    const showMatch = dec.core.match(/^Showing\s+(\d+)\s+to\s+(\d+)\s+of\s+(\d+)\s+cities$/i);
    if (showMatch) {
      return `${showMatch[3]} शहरों में से ${showMatch[1]} से ${showMatch[2]} प्रदर्शित`;
    }

    // Pattern F: "Search: "{term}""
    const searchMatch = dec.core.match(/^Search:\s*"([^"]+)"$/i);
    if (searchMatch) {
      return `खोज: "${searchMatch[1]}"`;
    }

    // 4. City Name standalone match
    if (CITY_NAMES[trimmed]) {
      return translateCityName(trimmed, target);
    }

    return phrase;
  }

  /**
   * Determine initial language using 5-layer persistent fallback:
   * 1. URL search parameter (?lang=xx or ?locale=xx)
   * 2. sessionStorage (same session tab persistence)
   * 3. localStorage (long term persistence)
   * 4. window.name (tab lifecycle persistence)
   * 5. document.cookie (cross-page persistence)
   * 6. navigator.languages
   */
  function detectInitialLanguage() {
    // 1. URL search parameter
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const param = urlParams.get('lang') || urlParams.get('locale');
      if (param) {
        const clean = param.toLowerCase().trim();
        const match = LANGUAGES.find(l => l.code === clean);
        if (match) return match.code;
      }
    } catch (e) {}

    // 2. sessionStorage
    try {
      const sSaved = sessionStorage.getItem(STORAGE_KEY);
      if (sSaved && LANGUAGES.some(l => l.code === sSaved)) {
        return sSaved;
      }
    } catch (e) {}

    // 3. localStorage
    try {
      const lSaved = localStorage.getItem(STORAGE_KEY);
      if (lSaved && LANGUAGES.some(l => l.code === lSaved)) {
        return lSaved;
      }
    } catch (e) {}

    // 4. window.name
    try {
      if (window.name && window.name.includes('bsc_lang:')) {
        const parts = window.name.split('bsc_lang:');
        if (parts[1]) {
          const code = parts[1].split(';')[0].trim().toLowerCase();
          const match = LANGUAGES.find(l => l.code === code);
          if (match) return match.code;
        }
      }
    } catch (e) {}

    // 5. document.cookie
    try {
      const m = document.cookie.match(/(?:bsc_lang|googtrans)=\/?(?:en\/)?([a-z]{2,3})/i);
      if (m && m[1]) {
        const code = m[1].toLowerCase();
        const match = LANGUAGES.find(l => l.code === code);
        if (match) return match.code;
      }
    } catch (e) {}

    // 6. Browser Language
    try {
      const navLangs = navigator.languages || [navigator.language || navigator.userLanguage];
      for (let l of navLangs) {
        if (!l) continue;
        const clean = l.split('-')[0].toLowerCase();
        const match = LANGUAGES.find(item => item.code === clean);
        if (match && match.code !== 'en') return match.code;
      }
    } catch (e) {}

    return 'en';
  }

  /**
   * Save selected language across all storage layers.
   */
  function saveLanguageState(code) {
    // 1. window.name
    try {
      let currentName = window.name || '';
      currentName = currentName.replace(/bsc_lang:[a-z]+;?/gi, '');
      window.name = `bsc_lang:${code};` + currentName;
    } catch (e) {}

    // 2. sessionStorage
    try {
      sessionStorage.setItem(STORAGE_KEY, code);
    } catch (e) {}

    // 3. localStorage
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {}

    // 4. document.cookie
    try {
      const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `bsc_lang=${code}; expires=${expires}; path=/; SameSite=Lax;`;
    } catch (e) {}

    // 5. URL query parameter (without page reload)
    try {
      const url = new URL(window.location.href);
      if (code === 'en') {
        url.searchParams.delete('lang');
      } else {
        url.searchParams.set('lang', code);
      }
      window.history.replaceState(window.history.state, '', url.toString());
    } catch (e) {}
  }

  /**
   * Build a URL that retains the active language.
   */
  function getLocalizedUrl(href, lang) {
    if (!href) return href;
    const targetLang = lang || currentLang || 'en';
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      return href;
    }
    try {
      const isAbsolute = href.startsWith('http://') || href.startsWith('https://');
      const url = new URL(href, window.location.href);
      if (url.origin === window.location.origin) {
        if (targetLang === 'en') {
          url.searchParams.delete('lang');
        } else {
          url.searchParams.set('lang', targetLang);
        }
        return isAbsolute ? url.href : (url.pathname + url.search + url.hash);
      }
    } catch (e) {}
    return href;
  }

  /**
   * Rewrites all internal <a> links on the page to automatically carry ?lang=${currentLang}
   */
  function propagateLanguageToLinks(code) {
    const lang = code || currentLang || 'en';
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
      if (href.startsWith('http') && !href.includes(window.location.host)) return;

      const localized = getLocalizedUrl(href, lang);
      if (localized && localized !== href) {
        a.setAttribute('href', localized);
      }
    });
  }

  /**
   * Intercepts clicks on internal links to guarantee language preservation.
   */
  function setupNavigationInterceptor() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
      if (href.startsWith('http') && !href.includes(window.location.host)) return;

      if (currentLang && currentLang !== 'en') {
        const localized = getLocalizedUrl(href, currentLang);
        if (localized) {
          link.setAttribute('href', localized);
          link.href = localized;
        }
      }
    }, true);

    // Global helper so programmatic navigation anywhere in code preserves language
    window.navigateTo = function(url) {
      window.location.href = getLocalizedUrl(url, currentLang);
    };
  }

  /**
   * Universal DOM Text Node and Element Translator.
   * Walks the DOM tree, remembers original English text, and swaps in translated phrases.
   */
  function translateDOMTree(root, lang) {
    if (!root) root = document.body;
    if (!root) return;
    const targetLang = lang || currentLang || 'en';

    const SHOW_TEXT = (typeof NodeFilter !== 'undefined' && NodeFilter.SHOW_TEXT) ? NodeFilter.SHOW_TEXT : 4;
    const FILTER_ACCEPT = (typeof NodeFilter !== 'undefined' && NodeFilter.FILTER_ACCEPT) ? NodeFilter.FILTER_ACCEPT : 1;
    const FILTER_REJECT = (typeof NodeFilter !== 'undefined' && NodeFilter.FILTER_REJECT) ? NodeFilter.FILTER_REJECT : 2;
    const FILTER_SKIP = (typeof NodeFilter !== 'undefined' && NodeFilter.FILTER_SKIP) ? NodeFilter.FILTER_SKIP : 3;

    isTranslating = true;
    try {
      if (typeof document.createTreeWalker !== 'function') return;

      // 1. Walk Text Nodes
      const walker = document.createTreeWalker(
        root,
        SHOW_TEXT,
        {
          acceptNode: function(node) {
            const parent = node.parentElement;
            if (!parent) return FILTER_REJECT;
            const tag = parent.tagName ? parent.tagName.toUpperCase() : '';
            if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'CODE' || tag === 'PRE') {
              return FILTER_REJECT;
            }
            if (parent.closest && (parent.closest('.lang-modal') || parent.closest('#header-lang-btn') || parent.closest('#mobile-drawer-lang-btn'))) {
              return FILTER_REJECT;
            }
            const text = node.nodeValue ? node.nodeValue.trim() : '';
            if (!text || text.length < 2) return FILTER_SKIP;
            return FILTER_ACCEPT;
          }
        },
        false
      );

      let node;
      const nodesToTranslate = [];
      while ((node = walker.nextNode())) {
        nodesToTranslate.push(node);
      }

      nodesToTranslate.forEach(textNode => {
        const parent = textNode.parentElement;
        if (!parent) return;

        // Lossless storage of original English text on the node itself
        if (textNode._bscOrig === undefined) {
          textNode._bscOrig = textNode.nodeValue;
        }

        const origFull = textNode._bscOrig;
        const origTrimmed = origFull.trim();

        if (targetLang === 'en') {
          if (textNode.nodeValue !== origFull) {
            textNode.nodeValue = origFull;
          }
        } else {
          const trans = translatePhrase(origTrimmed, targetLang);
          if (trans && trans !== origTrimmed) {
            textNode.nodeValue = origFull.replace(origTrimmed, trans);
          }
        }
      });

      // 2. Translate Form Placeholders and Inputs
      root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
        if (el.getAttribute('data-orig-placeholder') === null) {
          el.setAttribute('data-orig-placeholder', el.getAttribute('placeholder') || '');
        }
        const orig = el.getAttribute('data-orig-placeholder');
        if (targetLang === 'en') {
          el.setAttribute('placeholder', orig);
        } else {
          const trans = translatePhrase(orig, targetLang);
          if (trans) el.setAttribute('placeholder', trans);
        }
      });

      // 3. Translate Select Option Labels
      root.querySelectorAll('select option').forEach(opt => {
        if (opt.getAttribute('data-orig-text') === null) {
          opt.setAttribute('data-orig-text', opt.textContent.trim());
        }
        const orig = opt.getAttribute('data-orig-text');
        if (targetLang === 'en') {
          opt.textContent = orig;
        } else {
          const trans = translatePhrase(orig, targetLang);
          if (trans && trans !== orig) opt.textContent = trans;
        }
      });

      // 4. City Profile Special Heading Hook
      const cityOppsH2 = document.getElementById('city-opps-heading');
      if (cityOppsH2 && window.currentCityName) {
        const localCity = translateCityName(window.currentCityName, targetLang);
        if (targetLang === 'en') {
          cityOppsH2.innerHTML = `Published Opportunities in <span class="city-name-placeholder">${window.currentCityName}</span>`;
        } else {
          cityOppsH2.innerHTML = `<span class="city-name-placeholder">${localCity}</span> में प्रकाशित व्यापारिक अवसर`;
        }
      }

    } finally {
      isTranslating = false;
    }
  }

  /**
   * Master Language Application Controller.
   */
  function applyLanguage(code, persist) {
    if (!LANGUAGES.some(l => l.code === code)) code = 'en';
    currentLang = code;

    if (persist) {
      saveLanguageState(code);
    } else {
      // Sync URL if missing parameter
      try {
        const url = new URL(window.location.href);
        if (code !== 'en' && url.searchParams.get('lang') !== code) {
          url.searchParams.set('lang', code);
          window.history.replaceState(window.history.state, '', url.toString());
        }
      } catch (e) {}
    }

    const langObj = LANGUAGES.find(l => l.code === code) || LANGUAGES[0];

    // 1. HTML attributes & RTL support (Urdu, Kashmiri)
    document.documentElement.lang = code;
    if (langObj.rtl) {
      document.documentElement.dir = 'rtl';
      document.body.classList.add('rtl-mode');
    } else {
      document.documentElement.dir = 'ltr';
      document.body.classList.remove('rtl-mode');
    }

    // 2. Update Header Switcher button label
    const triggerBtn = document.getElementById('header-lang-btn');
    if (triggerBtn) {
      updateTriggerButtonLabel(triggerBtn, code);
    }

    // 3. Immediate Deep DOM Translation
    translateDOMTree(document.body, code);

    // 4. Update Modal selection state
    const activeSearch = document.getElementById('lang-search-input')?.value || '';
    renderLanguageButtons(activeSearch.trim().toLowerCase());

    // 5. Propagate language to all internal links
    propagateLanguageToLinks(code);
  }

  function updateTriggerButtonLabel(btn, code) {
    const lang = LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lang-icon">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
      <span class="lang-name-text">${lang.native}</span>
      <span class="lang-badge-pill">${lang.code.toUpperCase()}</span>
    `;

    const mobileLabel = document.getElementById('mobile-lang-label');
    if (mobileLabel) {
      mobileLabel.textContent = `Language: ${lang.native} (${lang.english})`;
    }
  }

  function injectLanguageSwitcherUI() {
    // 1. Header action button
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('header-lang-btn')) {
      const langBtn = document.createElement('button');
      langBtn.type = 'button';
      langBtn.id = 'header-lang-btn';
      langBtn.className = 'btn btn-lang-switcher';
      langBtn.setAttribute('aria-haspopup', 'dialog');
      langBtn.setAttribute('aria-label', 'Change Language / भाषा बदलें');
      updateTriggerButtonLabel(langBtn, currentLang);
      langBtn.addEventListener('click', openLanguageModal);
      headerActions.insertBefore(langBtn, headerActions.firstChild);
    }

    // 2. Mobile drawer button
    const mobileDrawer = document.getElementById('mobile-drawer');
    if (mobileDrawer && !document.getElementById('mobile-drawer-lang-btn')) {
      const mobileLangItem = document.createElement('div');
      mobileLangItem.className = 'mobile-drawer-lang-wrap';
      mobileLangItem.innerHTML = `
        <button type="button" class="btn btn-outline btn-full btn-mobile-lang" id="mobile-drawer-lang-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span id="mobile-lang-label">Language / भाषा: ${getLangName(currentLang)}</span>
        </button>
      `;
      const footer = mobileDrawer.querySelector('.mobile-drawer-footer');
      if (footer) {
        mobileDrawer.insertBefore(mobileLangItem, footer);
      } else {
        mobileDrawer.appendChild(mobileLangItem);
      }
      document.getElementById('mobile-drawer-lang-btn')?.addEventListener('click', () => {
        if (typeof window._toggleMobileDrawer === 'function') {
          window._toggleMobileDrawer(false);
        }
        openLanguageModal();
      });
    }

    // 3. Modal Picker Dialog
    if (!document.getElementById('lang-modal')) {
      const modal = document.createElement('div');
      modal.id = 'lang-modal';
      modal.className = 'modal lang-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'lang-modal-heading');
      modal.hidden = true;

      modal.innerHTML = `
        <div class="mobile-drawer-backdrop" id="lang-modal-backdrop"></div>
        <div class="modal-panel lang-modal-panel">
          <div class="modal-head">
            <div class="lang-modal-title-group">
              <span class="lang-modal-icon">🌐</span>
              <div>
                <h2 id="lang-modal-heading" class="lang-modal-title">Choose Your Indian Language</h2>
                <p class="lang-modal-sub">Available in all 22 official Eighth Schedule languages of India + English</p>
              </div>
            </div>
            <button class="modal-close" id="lang-modal-close" type="button" aria-label="Close language selector">&times;</button>
          </div>

          <div class="lang-search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="search" id="lang-search-input" placeholder="Search language (e.g. Hindi, Bengali, Tamil, Telugu, Marathi)..." autocomplete="off">
          </div>

          <div class="lang-grid-container" id="lang-options-grid"></div>

          <div class="lang-modal-footer">
            <span class="lang-indicator-note">✓ Instant full-site translation &amp; cross-page persistence</span>
            <button type="button" class="btn btn-outline btn-sm" id="lang-modal-done-btn">Close</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById('lang-modal-close')?.addEventListener('click', closeLanguageModal);
      document.getElementById('lang-modal-backdrop')?.addEventListener('click', closeLanguageModal);
      document.getElementById('lang-modal-done-btn')?.addEventListener('click', closeLanguageModal);

      const searchInput = document.getElementById('lang-search-input');
      searchInput?.addEventListener('input', (e) => {
        renderLanguageButtons(e.target.value.trim().toLowerCase());
      });

      renderLanguageButtons('');
    }
  }

  function getLangName(code) {
    const l = LANGUAGES.find(item => item.code === code);
    return l ? `${l.native} (${l.english})` : 'English';
  }

  function renderLanguageButtons(filter) {
    const container = document.getElementById('lang-options-grid');
    if (!container) return;

    const filtered = LANGUAGES.filter(l => {
      if (!filter) return true;
      return l.english.toLowerCase().includes(filter) ||
             l.native.toLowerCase().includes(filter) ||
             l.region.toLowerCase().includes(filter) ||
             l.code.toLowerCase().includes(filter);
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 24px; color: var(--text-muted);">
          No matching language found for "${escapeHtml(filter)}". All 22 official Indian languages are supported.
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(l => {
      const isSelected = l.code === currentLang;
      return `
        <button type="button" class="lang-option-card ${isSelected ? 'is-selected' : ''}" data-lang-code="${l.code}">
          <div class="lang-option-top">
            <span class="lang-native-script">${escapeHtml(l.native)}</span>
            <span class="lang-code-tag">${escapeHtml(l.code.toUpperCase())}</span>
          </div>
          <div class="lang-english-name">${escapeHtml(l.english)}</div>
          <div class="lang-region-name">${escapeHtml(l.region)}</div>
          ${isSelected ? '<span class="lang-active-check">✓ Active</span>' : ''}
        </button>
      `;
    }).join('');

    container.querySelectorAll('.lang-option-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedCode = btn.getAttribute('data-lang-code');
        applyLanguage(selectedCode, true);
        closeLanguageModal();
      });
    });
  }

  function openLanguageModal() {
    const modal = document.getElementById('lang-modal');
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    const searchInput = document.getElementById('lang-search-input');
    if (searchInput) {
      searchInput.value = '';
      renderLanguageButtons('');
      setTimeout(() => searchInput.focus(), 100);
    }
  }

  function closeLanguageModal() {
    const modal = document.getElementById('lang-modal');
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    const trigger = document.getElementById('header-lang-btn');
    if (trigger) trigger.focus();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Observe DOM mutations so dynamic content (loaded via API or search filters)
   * gets translated immediately and internal links are localized.
   */
  let debounceTimer = null;
  function setupDomObserver() {
    if (domObserver) return;
    try {
      domObserver = new MutationObserver(() => {
        if (isTranslating) return;
        if (currentLang && currentLang !== 'en') {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            translateDOMTree(document.body, currentLang);
            propagateLanguageToLinks(currentLang);
          }, 80);
        }
      });
      domObserver.observe(document.body, { childList: true, subtree: true });
    } catch(e) {}
  }

  /**
   * Main Initialization Lifecycle.
   */
  function init() {
    currentLang = detectInitialLanguage();
    injectLanguageSwitcherUI();
    setupNavigationInterceptor();
    applyLanguage(currentLang, false);
    setupDomObserver();

    // Multi-pass scheduled auto-translation for asynchronous API data
    const intervals = [60, 180, 450, 900, 1800, 3200];
    intervals.forEach(delay => {
      setTimeout(() => {
        if (currentLang !== 'en') {
          translateDOMTree(document.body, currentLang);
        }
        propagateLanguageToLinks(currentLang);
      }, delay);
    });
  }

  // Public Interface
  return {
    init: init,
    setLanguage: (code) => applyLanguage(code, true),
    getCurrentLanguage: () => currentLang,
    getLanguages: () => LANGUAGES,
    openModal: openLanguageModal,
    closeModal: closeLanguageModal,
    translatePhrase: (phrase, lang) => translatePhrase(phrase, lang || currentLang),
    translatePage: () => translateDOMTree(document.body, currentLang),
    propagateLinks: () => propagateLanguageToLinks(currentLang),
    getLocalizedUrl: getLocalizedUrl
  };
})();

// Attach to window for global access across scripts
window.I18N = I18N;

// Auto-run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', I18N.init);
} else {
  I18N.init();
}
