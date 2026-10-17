/**
 * Business Scope in Your City — All-India Multilingual & Localization Engine (i18n)
 * Supports all 22 Eighth Schedule Indian Languages + English:
 * Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Urdu, Kannada, Odia, Malayalam,
 * Punjabi, Assamese, Maithili, Santali, Kashmiri, Nepali, Konkani, Sindhi, Dogri,
 * Manipuri, Bodo, Sanskrit, and English.
 * 
 * Features:
 * - Persistent Cross-Page Translation: URL parameter propagation (?lang=xx), window.name,
 *   sessionStorage, localStorage, and cookie multi-layer synchronization so switching pages
 *   never drops the chosen language.
 * - Automatic Link Rewriting: All internal links and clicks dynamically preserve the active language.
 * - Immediate Deep DOM & Dictionary Translation: Headings, filters, cards, badges, and workflow
 *   translate instantly upon page load across all 17 platform pages.
 * - Synchronized Google Translate Engine: Automatic polling and execution for full dossier
 *   and body text translation with banner suppression.
 * - Right-To-Left (RTL) mode for Urdu and Kashmiri.
 * - Accessible Modal Picker with fuzzy search across scripts, native names, and English aliases.
 */

const I18N = (function() {
  'use strict';

  const STORAGE_KEY = 'bsc_selected_language';
  let currentLang = 'en';
  let gtPollInterval = null;
  let domObserver = null;

  // Master catalog of 22 Eighth Schedule Indian Languages + English
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

  // Comprehensive multi-page translation dictionaries
  const TRANSLATIONS = {
    en: {
      brand_title: 'Business Scope',
      brand_subtitle: 'in Your City',
      nav_opportunities: 'Opportunities',
      nav_cities: 'Cities',
      nav_blueprints: 'Blueprints',
      nav_launch_plans: 'Launch Plans',
      nav_insights: 'Insights',
      nav_about: 'About',
      nav_faq: 'FAQ',
      nav_account: 'Access Purchases',
      nav_custom: 'Custom Research',
      nav_menu: 'Menu',
      search_city_label: 'Target City',
      search_city_all: 'All Indian Cities',
      search_budget_label: 'Max Capex Budget',
      search_budget_all: 'Any Capital Range',
      search_model_label: 'Operating Model',
      search_model_all: 'All Business Models',
      search_btn: 'Search Opportunities',
      hero_badge: 'Local Opportunity Intelligence for India',
      hero_title: 'Find the business scope in your city.',
      hero_desc: 'Explore practical business possibilities based on local customer problems, your budget, and the way you want to operate. Review assumptions, risks, and low-cost ways to test demand before investing.',
      where_to_build: 'Where do you want to build?',
      where_to_build_sub: 'Search any Indian city to open its empirical market profile, local gap analysis, and verified business opportunities.',
      search_city_placeholder: 'Search your city (e.g. Mumbai, Bengaluru, Jaipur, Lucknow, Patna, Guwahati)...',
      open_city_btn: 'Open City →',
      top_markets: 'Top Markets:',
      all_cities_btn: 'All 88+ Cities →',
      workflow_title: 'How "Business Scope in Your City" Works',
      workflow_sub: 'A disciplined, data-driven pathway from identifying a local municipal market to launching a validated business.',
      cities_hero_title: 'Explore Business Opportunities Across India',
      cities_hero_sub: 'Discover business opportunities city by city, from India\'s largest metropolitan markets to emerging local economies.',
      tier_all: 'All Cities',
      tier_1: 'Tier 1',
      tier_2: 'Tier 2',
      tier_3: 'Tier 3',
      tier_4: 'Tier 4',
      tier_5: 'Tier 5',
      tier_1_sub: 'Major metropolitan markets',
      tier_2_sub: 'Large emerging commercial centers',
      tier_3_sub: 'Growing regional economies',
      tier_4_sub: 'Emerging local business markets',
      tier_5_sub: 'Smaller cities & specialized clusters',
      city_search_label: 'Search Cities',
      city_state_label: 'State / UT',
      city_tier_label: 'Market Tier',
      city_status_label: 'Research Status',
      reset_btn: 'Reset',
      explore_city_btn: 'Explore Guide →',
      opps_in_city: 'Business Opportunities in',
      read_opp_guide: 'Read Opportunity Guide →',
      access_blueprint: 'Access Blueprint →',
      view_all_cities: 'View all cities →',
      browse_catalogue: 'Browse full catalogue →',
      startup_capex: 'Startup Capex Range',
      indicative_capex: 'Indicative Startup Capex',
      badge_verified: 'Verified Gap',
      badge_validated: 'Customer Validated',
      badge_supported: 'Evidence Supported',
      badge_desk: 'Desk Research',
      footer_rights: 'All rights reserved.',
      lang_switch_btn: 'Language',
      lang_modal_title: 'Choose Your Indian Language',
      lang_search_placeholder: 'Search language (e.g. Hindi, Bengali, Tamil, Telugu)...',
      all_india_notice: 'Available in all 22 official Indian languages + English'
    },
    hi: {
      brand_title: 'बिजनेस स्कोप',
      brand_subtitle: 'आपके शहर में',
      nav_opportunities: 'अवसर (Opportunities)',
      nav_cities: 'शहर (Cities)',
      nav_blueprints: 'ब्लूप्रिंट्स (Blueprints)',
      nav_launch_plans: '90-दिवसीय योजनाएं',
      nav_insights: 'मार्केट इनसाइट्स',
      nav_about: 'हमारे बारे में',
      nav_faq: 'सवाल-जवाब (FAQ)',
      nav_account: 'खरीदी गई रिपोर्ट्स',
      nav_custom: 'कस्टम रिसर्च कराएं',
      nav_menu: 'मेनू',
      search_city_label: 'लक्ष्य शहर',
      search_city_all: 'भारत के सभी शहर',
      search_budget_label: 'अधिकतम बजट',
      search_budget_all: 'सभी बजट रेंज',
      search_model_label: 'बिजनेस मॉडल',
      search_model_all: 'सभी प्रकार के मॉडल',
      search_btn: 'अवसर खोजें',
      hero_badge: 'भारतीय शहरों के लिए स्थानीय व्यावसायिक बुद्धिमत्ता',
      hero_title: 'अपने शहर में सही बिजनेस का स्कोप पहचानें।',
      hero_desc: 'स्थानीय ग्राहकों की जरूरतों, अपने बजट और परिचालन मॉडल के आधार पर वास्तविक व्यापारिक अवसरों की खोज करें। पूंजी लगाने से पहले मान्यताओं, जोखिमों और मांग का परीक्षण करें।',
      where_to_build: 'आप किस शहर में बिजनेस शुरू करना चाहते हैं?',
      where_to_build_sub: 'किसी भी भारतीय शहर का नाम खोजें और उसकी बाजार प्रोफाइल, व्यापारिक अंतर व सत्यापित अवसर देखें।',
      search_city_placeholder: 'अपना शहर खोजें (उदा. मुंबई, दिल्ली, बेंगलुरु, लखनऊ, जयपुर, पटना)...',
      open_city_btn: 'शहर खोलें →',
      top_markets: 'प्रमुख शहर:',
      all_cities_btn: 'सभी 88+ शहर देखें →',
      workflow_title: '"बिजनेस स्कोप इन योर सिटी" कैसे काम करता है',
      workflow_sub: 'स्थानीय शहर की पहचान से लेकर सत्यापित व्यवसाय शुरू करने की एक व्यवस्थित और डेटा-संचालित प्रक्रिया।',
      cities_hero_title: 'भारत भर के शहरों में व्यावसायिक अवसरों की खोज करें',
      cities_hero_sub: 'भारत के प्रमुख महानगरों से लेकर उभरते छोटे शहरों तक, हर शहर के अनुसार सही व्यापारिक अवसर खोजें।',
      tier_all: 'सभी शहर',
      tier_1: 'टियर 1 (महानगर)',
      tier_2: 'टियर 2 (उभरते केंद्र)',
      tier_3: 'टियर 3 (क्षेत्रीय केंद्र)',
      tier_4: 'टियर 4 (स्थानीय बाजार)',
      tier_5: 'टियर 5 (कस्बे व क्लस्टर)',
      tier_1_sub: 'प्रमुख महानगरीय बाजार',
      tier_2_sub: 'बड़े उभरते वाणिज्यिक केंद्र',
      tier_3_sub: 'बढ़ती क्षेत्रीय अर्थव्यवस्थाएं',
      tier_4_sub: 'उभरते स्थानीय व्यापारिक बाजार',
      tier_5_sub: 'छोटे शहर और विशेष औद्योगिक क्लस्टर',
      city_search_label: 'शहर खोजें',
      city_state_label: 'राज्य / केंद्र शासित प्रदेश',
      city_tier_label: 'मार्केट टियर',
      city_status_label: 'रिसर्च स्थिति',
      reset_btn: 'रीसेट करें',
      explore_city_btn: 'गाइड देखें →',
      opps_in_city: 'व्यावसायिक अवसर:',
      read_opp_guide: 'विस्तृत गाइड पढ़ें →',
      access_blueprint: 'ब्लूप्रिंट प्राप्त करें →',
      view_all_cities: 'सभी शहर देखें →',
      browse_catalogue: 'पूरी सूची ब्राउज़ करें →',
      startup_capex: 'अनुमानित शुरुआती पूंजी',
      indicative_capex: 'शुरुआती निवेश लागत',
      badge_verified: 'सत्यापित अवसर',
      badge_validated: 'ग्राहक प्रमाणित',
      badge_supported: 'तथ्यों द्वारा समर्थित',
      badge_desk: 'डेस्क रिसर्च',
      footer_rights: 'सर्वाधिकार सुरक्षित।',
      lang_switch_btn: 'भाषा',
      lang_modal_title: 'अपनी भाषा चुनें (Choose Language)',
      lang_search_placeholder: 'भाषा खोजें (जैसे हिन्दी, বাংলা, தமிழ், मराठी)...',
      all_india_notice: 'भारत की सभी 22 आधिकारिक भाषाओं में उपलब्ध'
    },
    bn: {
      brand_title: 'বিজনেস স্কোপ',
      brand_subtitle: 'আপনার শহরে',
      nav_opportunities: 'সুযোগসমূহ (Opportunities)',
      nav_cities: 'শহরসমূহ (Cities)',
      nav_blueprints: 'ব্লুপ্রিন্ট',
      nav_launch_plans: '৯০ দিনের পরিকল্পনা',
      nav_insights: 'বাজার গবেষণা',
      nav_about: 'আমাদের সম্পর্কে',
      nav_faq: 'প্রশ্নোত্তর',
      nav_account: 'কেনা রিপোর্ট দেখুন',
      nav_custom: 'কাস্টম রিসার্চ',
      nav_menu: 'মেনু',
      search_city_label: 'নির্দিষ্ট শহর',
      search_city_all: 'ভারতের সকল শহর',
      search_budget_label: 'সর্বোচ্চ বাজেট',
      search_budget_all: 'সকল বাজেট রেঞ্জ',
      search_model_label: 'বিজনেস মডেল',
      search_model_all: 'সকল মডেল',
      search_btn: 'সুযোগ অনুসন্ধান করুন',
      hero_badge: 'ভারতের জন্য স্থানীয় ব্যবসায়িক বুদ্ধিমত্তা',
      hero_title: 'আপনার শহরের সেরা ব্যবসায়িক সুযোগ খুঁজুন।',
      hero_desc: 'স্থানীয় চাহিদা, আপনার বিনিয়োগ বাজেট এবং পদ্ধতির ওপর ভিত্তি করে লাভজনক ব্যবসার সম্ভাবনা যাচাই করুন। মূলধন বিনিয়োগের আগে বাজার যাচাই করুন।',
      where_to_build: 'আপনি কোথায় ব্যবসা শুরু করতে চান?',
      where_to_build_sub: 'যেকোনো ভারতীয় শহরের নাম অনুসন্ধান করে স্থানীয় বাজার বিশ্লেষণ ও ব্যবসায়িক সুযোগ দেখুন।',
      search_city_placeholder: 'আপনার শহর খুঁজুন (যেমন কলকাতা, শিলিগুড়ি, দুর্গাপুর, মুম্বাই)...',
      open_city_btn: 'শহর দেখুন →',
      top_markets: 'প্রধান শহরসমূহ:',
      all_cities_btn: 'সকল ৮৮+ শহর →',
      workflow_title: '"বিজনেস স্কোপ ইন ইয়োর সিটি" কীভাবে কাজ করে',
      workflow_sub: 'শহর নির্বাচন থেকে শুরু করে লাভজনক ব্যবসা চালুর সঠিক পদক্ষেপ।',
      cities_hero_title: 'ভারত জুড়ে ব্যবসায়িক সুযোগ অনুসন্ধান করুন',
      cities_hero_sub: 'ভারতের মেট্রোপলিটন মার্কেট থেকে শুরু করে স্থানীয় বাণিজ্য কেন্দ্র পর্যন্ত শহরভিত্তিক সুযোগ খুঁজুন।',
      tier_all: 'সকল শহর',
      tier_1: 'টায়ার ১ (মেট্রো)',
      tier_2: 'টায়ার ২ (বাণিজ্যিক কেন্দ্র)',
      tier_3: 'টায়ার ৩ (আঞ্চলিক শহর)',
      tier_4: 'টায়ার ৪ (স্থানীয় বাজার)',
      tier_5: 'টায়ার ৫ (ছোট শহর ও ক্লাস্টার)',
      tier_1_sub: 'প্রধান মেট্রোপলিটন বাজার',
      tier_2_sub: 'বড় উদীয়মান বাণিজ্যিক কেন্দ্র',
      tier_3_sub: 'ক্রমবর্ধমান আঞ্চলিক অর্থনীতি',
      tier_4_sub: 'উদীয়মান স্থানীয় বাজার',
      tier_5_sub: 'ছোট শহর ও বিশেষ শিল্প ক্লাস্টার',
      city_search_label: 'শহর অনুসন্ধান',
      city_state_label: 'রাজ্য / কেন্দ্রশাসিত অঞ্চল',
      city_tier_label: 'মার্কেট টায়ার',
      city_status_label: 'গবেষণার অবস্থা',
      reset_btn: 'রিসেট',
      explore_city_btn: 'গাইড দেখুন →',
      opps_in_city: 'ব্যবসায়িক সুযোগসমূহ:',
      read_opp_guide: 'বিস্তারিত গাইড পড়ুন →',
      access_blueprint: 'ব্লুপ্রিন্ট সংগ্রহ করুন →',
      view_all_cities: 'সমস্ত শহর দেখুন →',
      browse_catalogue: 'সম্পূর্ণ তালিকা দেখুন →',
      startup_capex: 'প্রাথমিক বিনিয়োগ পরিসীমা',
      indicative_capex: 'আনুমানিক মূলধন',
      badge_verified: 'যাচাইকৃত তথ্য',
      badge_validated: 'গ্রাহক দ্বারা প্রমাণিত',
      badge_supported: 'প্রমাণিত বিশ্লেষণ',
      badge_desk: 'ডেস্ক গবেষণা',
      footer_rights: 'সর্বস্বত্ব সংরক্ষিত।',
      lang_switch_btn: 'ভাষা',
      lang_modal_title: 'আপনার পছন্দের ভাষা নির্বাচন করুন',
      lang_search_placeholder: 'ভাষা খুঁজুন (যেমন বাংলা, হিন্দি, তামিল)...',
      all_india_notice: 'ভারতের সমস্ত ২২টি সরকারি ভাষায় উপলব্ধ'
    },
    te: {
      brand_title: 'బిజినెస్ స్కోప్',
      brand_subtitle: 'మీ నగరంలో',
      nav_opportunities: 'వ్యాపార అవకాశాలు',
      nav_cities: 'నగరాలు',
      nav_blueprints: 'బ్లూప్రింట్లు',
      nav_launch_plans: '90-రోజుల ప్రణాళికలు',
      nav_insights: 'మార్కెట్ విశ్లేషణ',
      nav_about: 'మా గురించి',
      nav_faq: 'తరచుగా అడిగే ప్రశ్నలు',
      nav_account: 'మీ నివేదికలు',
      nav_custom: 'ప్రత్యేక పరిశోధన',
      nav_menu: 'మెనూ',
      search_city_label: 'లక్ష్య నగరం',
      search_city_all: 'భారతదేశంలోని అన్ని నగరాలు',
      search_budget_label: 'గరిష్ట పెట్టుబడి',
      search_budget_all: 'అన్ని బడ్జెట్ శ్రేణులు',
      search_model_label: 'వ్యాపార విధానం',
      search_model_all: 'అన్ని మోడల్స్',
      search_btn: 'అవకాశాలను శోధించండి',
      hero_badge: 'భారతీయ నగరాలకు స్థానిక వ్యాపార మేధస్సు',
      hero_title: 'మీ నగరంలో వ్యాపార అవకాశాలను కనుగొనండి.',
      hero_desc: 'స్థానిక వినియోగదారుల సమస్యలు, మీ బడ్జెట్ మరియు నిర్వహణ విధానం ఆధారంగా వాస్తవ అవకాశాలను అన్వేషించండి.',
      where_to_build: 'మీరు ఎక్కడ వ్యాపారం నిర్మించాలనుకుంటున్నారు?',
      where_to_build_sub: 'ఏదైనా భారతీయ నగరాన్ని ఎంచుకుని స్థానిక మార్కెట్ విశ్లేషణ మరియు అవకాశాలను చూడండి.',
      search_city_placeholder: 'నగరాన్ని శోధించండి (ఉదా. హైదరాబాద్, విశాఖపట్నం, విజయవాడ, బెంగళూరు)...',
      open_city_btn: 'నగరాన్ని తెరవండి →',
      top_markets: 'ప్రధాన నగరాలు:',
      all_cities_btn: 'అన్ని 88+ నగరాలు →',
      workflow_title: 'మా ప్లాట్‌ఫారమ్ ఎలా పనిచేస్తుంది',
      workflow_sub: 'నగరాన్ని ఎంచుకోవడం నుండి విజయవంతమైన వ్యాపారం ప్రారంభించే వరకు సరైన మార్గం.',
      cities_hero_title: 'భారతదేశ వ్యాప్తంగా వ్యాపార అవకాశాలు',
      cities_hero_sub: 'మెట్రో నగరాల నుండి అభివృద్ధి చెందుతున్న చిన్న పట్టణాల వరకు నగరాల వారిగా అవకాశాలు.',
      tier_all: 'అన్ని నగరాలు',
      tier_1: 'టైర్ 1 (మెట్రోలు)',
      tier_2: 'టైర్ 2 (వాణిజ్య కేంద్రాలు)',
      tier_3: 'టైర్ 3 (ప్రాంతీయ నగరాలు)',
      tier_4: 'టైర్ 4 (స్థానిక మార్కెట్లు)',
      tier_5: 'టైర్ 5 (చిన్న పట్టణాలు)',
      city_search_label: 'నగరాన్ని శోధించండి',
      city_state_label: 'రాష్ట్రం',
      city_tier_label: 'మార్కెట్ టైర్',
      city_status_label: 'పరిశోధన స్థితి',
      reset_btn: 'రీసెట్',
      explore_city_btn: 'గైడ్ చూడండి →',
      opps_in_city: 'వ్యాపార అవకాశాలు:',
      read_opp_guide: 'పూర్తి గైడ్ చదవండి →',
      access_blueprint: 'బ్లూప్రింట్ పొందండి →',
      view_all_cities: 'అన్ని నగరాలు చూడండి →',
      browse_catalogue: 'మొత్తం డైరెక్టరీ →',
      startup_capex: 'ప్రారంభ పెట్టుబడి పరిధి',
      indicative_capex: 'అంచనా పెట్టుబడి',
      badge_verified: 'ధృవీకరించబడినది',
      badge_validated: 'ఖాతాదారుల ఆమోదం',
      badge_supported: 'నిరూపిత సమాచారం',
      badge_desk: 'పరిశోధన ఆధారం',
      footer_rights: 'సర్వహక్కులు ప్రత్యేకించబడ్డాయి.',
      lang_switch_btn: 'భాష',
      lang_modal_title: 'మీ భాషను ఎంచుకోండి',
      lang_search_placeholder: 'భాష కోసం శోధించండి (తెలుగు, హిందీ, తమిళం)...',
      all_india_notice: 'భారతదేశంలోని అన్ని 22 అధికారిక భాషలలో అందుబాటులో ఉంది'
    },
    mr: {
      brand_title: 'बिझनेस स्कोप',
      brand_subtitle: 'तुमच्या शहरात',
      nav_opportunities: 'व्यवसाय संधी (Opportunities)',
      nav_cities: 'शहरे (Cities)',
      nav_blueprints: 'ब्लूप्रिंट्स',
      nav_launch_plans: '९० दिवसांची योजना',
      nav_insights: 'मार्केट इनसाइट्स',
      nav_about: 'आमच्याबद्दल',
      nav_faq: 'वारंवार विचारले जाणारे प्रश्न',
      nav_account: 'खरेदी केलेले रिपोर्ट्स',
      nav_custom: 'कस्टम रिसर्च',
      nav_menu: 'मेनू',
      search_city_label: 'लक्ष्य शहर',
      search_city_all: 'भारतातील सर्व शहरे',
      search_budget_label: 'कमाल भांडवल',
      search_budget_all: 'सर्व भांडवल मर्यादा',
      search_model_label: 'ऑपरेटिंग मॉडेल',
      search_model_all: 'सर्व बिझनेस मॉडेल्स',
      search_btn: 'संधी शोधा',
      hero_badge: 'भारतीय शहरांसाठी स्थानिक व्यवसाय विश्लेषण',
      hero_title: 'तुमच्या शहरात व्यवसायाची नेमकी संधी शोधा.',
      hero_desc: 'स्थानिक ग्राहकांच्या गरजा, तुमचे भांडवल आणि कामकाजाच्या पद्धतीनुसार प्रत्यक्ष व्यवसाय संधींचा शोध घ्या.',
      where_to_build: 'तुम्हाला कोणत्या शहरात व्यवसाय सुरू करायचा आहे?',
      where_to_build_sub: 'कोणत्याही भारतीय शहराचे नाव शोधा आणि त्याचे मार्केट प्रोफाइल, व्यापारी तूट व सत्यापित संधी पहा.',
      search_city_placeholder: 'तुमचे शहर शोधा (उदा. मुंबई, पुणे, नागपूर, नाशिक, संभाजीनगर)...',
      open_city_btn: 'शहर उघडा →',
      top_markets: 'प्रमुख शहरे:',
      all_cities_btn: 'सर्व ८८+ शहरे →',
      workflow_title: 'आमची कार्यपद्धती कशी चालते',
      workflow_sub: 'स्थानिक बाजारपेठेच्या निवडीपासून ते प्रत्यक्ष व्यवसाय उभारणीपर्यंतची खात्रीशीर पायरी.',
      cities_hero_title: 'भारतातील शहरांनुसार व्यवसाय संधी शोधा',
      cities_hero_sub: 'मोठ्या महानगरांपासून ते स्थानिक उदयोन्मुख बाजारपेठांपर्यंत शहरनिहाय संशोधन.',
      tier_all: 'सर्व शहरे',
      tier_1: 'टियर १ (महानगर)',
      tier_2: 'टियर २ (व्यापारी केंद्र)',
      tier_3: 'टियर ३ (प्रादेशिक शहरे)',
      tier_4: 'टियर ४ (स्थानिक बाजार)',
      tier_5: 'टियर ५ (लहान शहरे)',
      city_search_label: 'शहर शोधा',
      city_state_label: 'राज्य',
      city_tier_label: 'मार्केट टियर',
      city_status_label: 'संशोधन स्थिती',
      reset_btn: 'रीसेट करा',
      explore_city_btn: 'गाईड पहा →',
      opps_in_city: 'व्यवसाय संधी:',
      read_opp_guide: 'सविस्तर गाईड वाचा →',
      access_blueprint: 'ब्लूप्रिंट मिळवा →',
      view_all_cities: 'सर्व शहरे पहा →',
      browse_catalogue: 'सर्व यादी पहा →',
      startup_capex: 'सुरुवातीचे भांडवल मर्यादा',
      indicative_capex: 'अंदाजे भांडवल',
      badge_verified: 'सत्यापित संधी',
      badge_validated: 'ग्राहक प्रमाणित',
      badge_supported: 'पुरावा समर्थित',
      badge_desk: 'डेस्क संशोधन',
      footer_rights: 'सर्व हक्क राखीव.',
      lang_switch_btn: 'भाषा',
      lang_modal_title: 'तुमची भाषा निवडा',
      lang_search_placeholder: 'भाषा शोधा (उदा. मराठी, हिंदी, गुजराती)...',
      all_india_notice: 'भारतातील सर्व २२ अधिकृत भाषांमध्ये उपलब्ध'
    },
    ta: {
      brand_title: 'பிசினஸ் ஸ்கோப்',
      brand_subtitle: 'உங்கள் நகரில்',
      nav_opportunities: 'தொழில் வாய்ப்புகள் (Opportunities)',
      nav_cities: 'நகரங்கள் (Cities)',
      nav_blueprints: 'ப்ளூபிரிண்ட்கள்',
      nav_launch_plans: '90-நாள் திட்டங்கள்',
      nav_insights: 'சந்தை நுண்ணறிவு',
      nav_about: 'எங்களை பற்றி',
      nav_faq: 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
      nav_account: 'வாங்கிய அறிக்கைகள்',
      nav_custom: 'சிறப்பு ஆய்வு',
      nav_menu: 'பட்டியல்',
      search_city_label: 'இலக்கு நகரம்',
      search_city_all: 'இந்தியாவின் அனைத்து நகரங்கள்',
      search_budget_label: 'அதிகபட்ச மூலதனம்',
      search_budget_all: 'அனைத்து பட்ஜெட் வரம்புகள்',
      search_model_label: 'வணிக முறை',
      search_model_all: 'அனைத்து வணிக மாதிரிகள்',
      search_btn: 'வாய்ப்புகளைத் தேடுங்கள்',
      hero_badge: 'இந்திய நகரங்களுக்கான உள்ளூர் வணிக நுண்ணறிவு',
      hero_title: 'உங்கள் நகரில் சரியான வணிக வாய்ப்பைக் கண்டறியுங்கள்.',
      hero_desc: 'உள்ளூர் வாடிக்கையாளர் தேவைகள் மற்றும் உங்கள் முதலீட்டுக்கு ஏற்ப லாபகரமான வணிகங்களை ஆய்வு செய்யுங்கள்.',
      where_to_build: 'நீங்கள் எங்கு தொழில் தொடங்க விரும்புகிறீர்கள்?',
      where_to_build_sub: 'எந்தவொரு இந்திய நகரத்தையும் தேர்வு செய்து அதன் உள்ளூர் சந்தை மற்றும் வாய்ப்புகளைப் பாருங்கள்.',
      search_city_placeholder: 'உங்கள் நகரத்தைத் தேடுங்கள் (எ.கா. சென்னை, கோவை, மதுரை, திருச்சி)...',
      open_city_btn: 'நகரத்தைக் காண்க →',
      top_markets: 'முக்கிய நகரங்கள்:',
      all_cities_btn: 'அனைத்து 88+ நகரங்கள் →',
      workflow_title: 'எங்கள் தளம் எவ்வாறு செயல்படுகிறது',
      workflow_sub: 'நகரத் தேர்விலிருந்து வெற்றிகரமான வணிகத் தொடக்கம் வரையிலான நம்பகமான வழிமுறை.',
      cities_hero_title: 'இந்தியா முழுவதும் உள்ள வணிக வாய்ப்புகள்',
      cities_hero_sub: 'பெருநகரங்கள் முதல் வளர்ந்து வரும் சிறு நகரங்கள் வரை நகர வாரியான வணிக பகுப்பாய்வு.',
      tier_all: 'அனைத்து நகரங்கள்',
      tier_1: 'டயர் 1 (பெருநகரங்கள்)',
      tier_2: 'டயர் 2 (வணிக மையங்கள்)',
      tier_3: 'டயர் 3 (வட்டார நகரங்கள்)',
      tier_4: 'டயர் 4 (உள்ளூர் சந்தைகள்)',
      tier_5: 'டயர் 5 (சிறு நகரங்கள்)',
      city_search_label: 'நகரத் தேடல்',
      city_state_label: 'மாநிலம்',
      city_tier_label: 'சந்தை நிலை',
      city_status_label: 'ஆய்வு நிலை',
      reset_btn: 'மீட்டமைக்க',
      explore_city_btn: 'வழிகாட்டியைப் பார் →',
      opps_in_city: 'வணிக வாய்ப்புகள்:',
      read_opp_guide: 'முழு வழிகாட்டியைப் படிக்கவும் →',
      access_blueprint: 'ப்ளூபிரிண்ட் பெறவும் →',
      view_all_cities: 'அனைத்து நகரங்களையும் காண்க →',
      browse_catalogue: 'முழு பட்டியல் →',
      startup_capex: 'தொடக்க முதலீட்டு வரம்பு',
      indicative_capex: 'உத்தேச முதலீடு',
      badge_verified: 'சரிபார்க்கப்பட்டது',
      badge_validated: 'வாடிக்கையாளர் அங்கீகாரம்',
      badge_supported: 'ஆதாரப்பூர்வமானது',
      badge_desk: 'ஆய்வகத் தகவல்',
      footer_rights: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
      lang_switch_btn: 'மொழி',
      lang_modal_title: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
      lang_search_placeholder: 'மொழியைத் தேடுங்கள் (தமிழ், இந்தி, தெலுங்கு)...',
      all_india_notice: 'இந்தியாவின் அனைத்து 22 அதிகாரப்பூர்வ மொழிகளிலும் கிடைக்கிறது'
    },
    gu: {
      brand_title: 'બિઝનેસ સ્કોપ',
      brand_subtitle: 'તમારા શહેરમાં',
      nav_opportunities: 'વ્યાપાર તકો',
      nav_cities: 'શહેરો',
      nav_blueprints: 'બ્લૂપ્રિન્ટ્સ',
      nav_launch_plans: '૯૦ દિવસીય આયોજન',
      nav_insights: 'માર્કેટ ઇનસાઇટ્સ',
      nav_about: 'અમારા વિશે',
      nav_faq: 'વારંવાર પૂછાતા પ્રશ્નો',
      nav_account: 'ખરીદેલ રિપોર્ટ્સ',
      nav_custom: 'કસ્ટમ રિસર્ચ',
      nav_menu: 'મેનુ',
      search_city_label: 'લક્ષ્ય શહેર',
      search_city_all: 'ભારતના તમામ શહેરો',
      search_budget_label: 'મહત્તમ બજેટ',
      search_budget_all: 'તમામ બજેટ શ્રેણી',
      search_model_label: 'બિઝનેસ મોડેલ',
      search_model_all: 'તમામ મોડેલ્સ',
      search_btn: 'તકો શોધો',
      hero_badge: 'ભારતીય શહેરો માટે સ્થાનિક વ્યાપાર બુદ્ધિમત્તા',
      hero_title: 'તમારા શહેરમાં સાચી બિઝનેસ તક ઓળખો.',
      hero_desc: 'સ્થાનિક ગ્રાહકોની જરૂરિયાતો અને તમારા બજેટ મુજબ વાસ્તવિક બિઝનેસ તકો શોધો.',
      where_to_build: 'તમે કયા શહેરમાં બિઝનેસ શરૂ કરવા માંગો છો?',
      where_to_build_sub: 'કોઈપણ ભારતીય શહેર શોધો અને તેની માર્કેટ પ્રોફાઇલ અને વ્યાપાર તકો જુઓ.',
      search_city_placeholder: 'તમારું શહેર શોધો (દા.ત. અમદાવાદ, સુરત, વડોદરા, રાજકોટ)...',
      open_city_btn: 'શહેર જુઓ →',
      top_markets: 'મુખ્ય શહેરો:',
      all_cities_btn: 'તમામ ૮૮+ શહેરો →',
      workflow_title: 'અમારું પ્લેટફોર્મ કેવી રીતે કાર્ય કરે છે',
      workflow_sub: 'શહેરની પસંદગીથી લઈને સફળ બિઝનેસ શરૂ કરવા સુધીનો વિશ્વસનીય માર્ગ.',
      cities_hero_title: 'સમગ્ર ભારતમાં વ્યાપાર તકોની શોધ કરો',
      cities_hero_sub: 'મેટ્રો શહેરોથી લઈને ઊભરતા નાના શહેરો સુધી શહેરવાર વ્યાપાર તકો.',
      tier_all: 'તમામ શહેરો',
      tier_1: 'ટિયર ૧ (મેટ્રો)',
      tier_2: 'ટિયર ૨ (વાણિજ્યિક કેન્દ્રો)',
      tier_3: 'ટિયર ૩ (પ્રાદેશિક શહેરો)',
      tier_4: 'ટિયર ૪ (સ્થાનિક બજારો)',
      tier_5: 'ટિયર ૫ (નાના નગરો)',
      city_search_label: 'શહેર શોધો',
      city_state_label: 'રાજ્ય',
      city_tier_label: 'માર્કેટ ટિયર',
      city_status_label: 'સંશોધન સ્થિતિ',
      reset_btn: 'રીસેટ',
      explore_city_btn: 'માર્ગદર્શિકા જુઓ →',
      opps_in_city: 'વ્યાપાર તકો:',
      read_opp_guide: 'વિગતવાર માર્ગદર્શિકા વાંચો →',
      access_blueprint: 'બ્લૂપ્રિન્ટ મેળવો →',
      view_all_cities: 'તમામ શહેરો જુઓ →',
      browse_catalogue: 'સંપૂર્ણ ડિરેક્ટરી →',
      startup_capex: 'પ્રારંભિક મૂડી મર્યાદા',
      indicative_capex: 'અંદાજિત રોકાણ',
      badge_verified: 'ચકાસાયેલ તક',
      badge_validated: 'ગ્રાહક પ્રમાણિત',
      badge_supported: 'પુરાવા આધારિત',
      badge_desk: 'ડેસ્ક સંશોધન',
      footer_rights: 'સર્વાધિકાર સુરક્ષિત.',
      lang_switch_btn: 'ભાષા',
      lang_modal_title: 'તમારી ભાષા પસંદ કરો',
      lang_search_placeholder: 'ભાષા શોધો (ગુજરાતી, હિન્દી, મરાઠી)...',
      all_india_notice: 'ભારતની તમામ ૨૨ સત્તાવાર ભાષાઓમાં ઉપલબ્ધ'
    },
    ur: {
      brand_title: 'بزنس اسکوپ',
      brand_subtitle: 'آپ کے شہر میں',
      nav_opportunities: 'کاروباری مواقع',
      nav_cities: 'شہر',
      nav_blueprints: 'بلیو پرنٹس',
      nav_launch_plans: '90 روزہ منصوبے',
      nav_insights: 'مارکیٹ ریسرچ',
      nav_about: 'ہمارے بارے میں',
      nav_faq: 'اکثر پوچھے گئے سوالات',
      nav_account: 'خریدی گئی رپورٹس',
      nav_custom: 'خصوصی تحقیق',
      nav_menu: 'مینو',
      search_city_label: 'منتخب شہر',
      search_city_all: 'بھارت کے تمام شہر',
      search_budget_label: 'زیادہ سے زیادہ سرمایہ',
      search_budget_all: 'تمام بجٹ حدود',
      search_model_label: 'کاروباری ماڈل',
      search_model_all: 'تمام ماڈلز',
      search_btn: 'مواقع تلاش کریں',
      hero_badge: 'ہندوستانی شہروں کے لیے مقامی کاروباری معلومات',
      hero_title: 'اپنے شہر میں بہترین کاروباری امکانات تلاش کریں۔',
      hero_desc: 'مقامی صارفین کے مسائل، اپنے بجٹ اور کاروباری ماڈل کے مطابق تصدیق شدہ مواقع دریافت کریں۔',
      where_to_build: 'آپ کس شہر میں کاروبار شروع کرنا چاہتے ہیں؟',
      where_to_build_sub: 'کسی بھی ہندوستانی شہر کا نام تلاش کریں اور اس کا مارکیٹ پروفائل اور مواقع دیکھیں۔',
      search_city_placeholder: 'اپنا شہر تلاش کریں (جیسے ممبئی، دہلی، حیدرآباد، لکھنؤ)...',
      open_city_btn: 'شہر کھولیں ←',
      top_markets: 'اہم مارکیٹس:',
      all_cities_btn: 'تمام 88+ شہر ←',
      workflow_title: 'ہمارا پلیٹ فارم کیسے کام کرتا ہے',
      workflow_sub: 'شہر کے انتخاب سے لے کر تصدیق شدہ کاروبار کے آغاز تک کا باضابطہ طریقہ۔',
      cities_hero_title: 'پورے بھارت کے شہروں میں کاروباری مواقع دریافت کریں',
      cities_hero_sub: 'بڑے میٹرو پولیٹن شہروں سے لے کر ابھرتے ہوئے قصبات تک ہر شہر کی تفصیلات۔',
      tier_all: 'تمام شہر',
      tier_1: 'ٹیئر 1 (میٹروز)',
      tier_2: 'ٹیئر 2 (تجارتی مراکز)',
      tier_3: 'ٹیئر 3 (علاقائی شہر)',
      tier_4: 'ٹیئر 4 (مقامی مارکیٹس)',
      tier_5: 'ٹیئر 5 (چھوٹے قصبات)',
      city_search_label: 'شہر تلاش کریں',
      city_state_label: 'ریاست',
      city_tier_label: 'مارکیٹ ٹیئر',
      city_status_label: 'تحقیقی حیثیت',
      reset_btn: 'دوبارہ ترتیب دیں',
      explore_city_btn: 'گائیڈ دیکھیں ←',
      opps_in_city: 'کاروباری مواقع:',
      read_opp_guide: 'مکمل گائیڈ پڑھیں ←',
      access_blueprint: 'بلیو پرنٹ حاصل کریں ←',
      view_all_cities: 'تمام شہر دیکھیں ←',
      browse_catalogue: 'مکمل فہرست ←',
      startup_capex: 'ابتدائی سرمایہ کاری کی حد',
      indicative_capex: 'تخمینہ شدہ سرمایہ',
      badge_verified: 'تصدیق شدہ موقع',
      badge_validated: 'صارفین سے تصدیق شدہ',
      badge_supported: 'شواہد پر مبنی',
      badge_desk: 'ڈیسک ریسرچ',
      footer_rights: 'جملہ حقوق محفوظ ہیں۔',
      lang_switch_btn: 'زبان',
      lang_modal_title: 'اپنی زبان منتخب کریں',
      lang_search_placeholder: 'زبان تلاش کریں (اردو، ہندی، بنگالی)...',
      all_india_notice: 'بھارت کی تمام 22 سرکاری زبانوں میں دستیاب ہے'
    },
    kn: {
      brand_title: 'ಬಿಸಿನೆಸ್ ಸ್ಕೋಪ್',
      brand_subtitle: 'ನಿಮ್ಮ ನಗರದಲ್ಲಿ',
      nav_opportunities: 'ವ್ಯವಹಾರ ಅವಕಾಶಗಳು',
      nav_cities: 'ನಗರಗಳು',
      nav_blueprints: 'ಬ್ಲೂಪ್ರಿಂಟ್‌ಗಳು',
      nav_launch_plans: '90-ದಿನಗಳ ಯೋಜನೆಗಳು',
      nav_insights: 'ಮಾರುಕಟ್ಟೆ ಒಳನೋಟಗಳು',
      nav_about: 'ನಮ್ಮ ಬಗ್ಗೆ',
      nav_faq: 'ಪ್ರಶ್ನೋತ್ತರಗಳು',
      nav_account: 'ವರದಿಗಳು',
      nav_custom: 'ವಿಶೇಷ ಸಂಶೋಧನೆ',
      nav_menu: 'ಮೆನು',
      search_city_label: 'ಗುರಿ ನಗರ',
      search_city_all: 'ಭಾರತದ ಎಲ್ಲಾ ನಗರಗಳು',
      search_budget_label: 'ಗರಿಷ್ಠ ಬಜೆಟ್',
      search_budget_all: 'ಎಲ್ಲಾ ಬಂಡವಾಳ ಶ್ರೇಣಿ',
      search_model_label: 'ವ್ಯವಹಾರ ಮಾದರಿ',
      search_model_all: 'ಎಲ್ಲಾ ಮಾದರಿಗಳು',
      search_btn: 'ಅವಕಾಶಗಳನ್ನು ಹುಡುಕಿ',
      hero_badge: 'ಭಾರತೀಯ ನಗರಗಳಿಗಾಗಿ ಸ್ಥಳೀಯ ವ್ಯಾಪಾರ ಬುದ್ಧಿಮತ್ತೆ',
      hero_title: 'ನಿಮ್ಮ ನಗರದಲ್ಲಿ ಸರಿಯಾದ ವ್ಯವಹಾರ ಅವಕಾಶವನ್ನು ಕಂಡುಕೊಳ್ಳಿ.',
      hero_desc: 'ಸ್ಥಳೀಯ ಗ್ರಾಹಕರ ಸಮಸ್ಯೆಗಳು, ನಿಮ್ಮ ಬಜೆಟ್ ಮತ್ತು ಕಾರ್ಯಾಚರಣೆ ವಿಧಾನದ ಆಧಾರದ ಮೇಲೆ ನೈಜ ಅವಕಾಶಗಳನ್ನು ಅನ್ವೇಷಿಸಿ.',
      where_to_build: 'ನೀವು ಎಲ್ಲಿ ವ್ಯವಹಾರ ಆರಂಭಿಸಲು ಬಯಸುತ್ತೀರಿ?',
      where_to_build_sub: 'ಯಾವುದೇ ಭಾರತೀಯ ನಗರವನ್ನು ಹುಡುಕಿ ಮತ್ತು ಸ್ಥಳೀಯ ಮಾರುಕಟ್ಟೆ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಅವಕಾಶಗಳನ್ನು ವೀಕ್ಷಿಸಿ.',
      search_city_placeholder: 'ನಿಮ್ಮ ನಗರವನ್ನು ಹುಡುಕಿ (ಉದಾ. ಬೆಂಗಳೂರು, ಮೈಸೂರು, ಮಂಗಳೂರು, ಹುಬ್ಬಳ್ಳಿ)...',
      open_city_btn: 'ನಗರ ತೆರೆಯಿರಿ →',
      top_markets: 'ಪ್ರಮುಖ ನಗರಗಳು:',
      all_cities_btn: 'ಎಲ್ಲಾ 88+ ನಗರಗಳು →',
      workflow_title: 'ನಮ್ಮ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ',
      workflow_sub: 'ನಗರದ ಆಯ್ಕೆಯಿಂದ ಹಿಡಿದು ಯಶಸ್ವಿ ವ್ಯಾಪಾರ ಪ್ರಾರಂಭದವರೆಗೆ ಕ್ರಮಬದ್ಧ ಮಾರ್ಗ.',
      cities_hero_title: 'ಭಾರತದಾದ್ಯಂತ ವ್ಯವಹಾರ ಅವಕಾಶಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
      cities_hero_sub: 'ಮೆಟ್ರೋ ನಗರಗಳಿಂದ ಹಿಡಿದು ಬೆಳೆಯುತ್ತಿರುವ ಸಣ್ಣ ಪಟ್ಟಣಗಳವರೆಗೆ ನಗರವಾರು ಅವಕಾಶಗಳು.',
      tier_all: 'ಎಲ್ಲಾ ನಗರಗಳು',
      tier_1: 'ಶ್ರೇಣಿ 1 (ಮೆಟ್ರೋಗಳು)',
      tier_2: 'ಶ್ರೇಣಿ 2 (ವಾಣಿಜ್ಯ ಕೇಂದ್ರಗಳು)',
      tier_3: 'ಶ್ರೇಣಿ 3 (ಪ್ರಾದೇಶಿಕ ನಗರಗಳು)',
      tier_4: 'ಶ್ರೇಣಿ 4 (ಸ್ಥಳೀಯ ಮಾರುಕಟ್ಟೆಗಳು)',
      tier_5: 'ಶ್ರೇಣಿ 5 (ಸಣ್ಣ ಪಟ್ಟಣಗಳು)',
      city_search_label: 'ನಗರ ಹುಡುಕಿ',
      city_state_label: 'ರಾಜ್ಯ',
      city_tier_label: 'ಮಾರುಕಟ್ಟೆ ಶ್ರೇಣಿ',
      city_status_label: 'ಸಂಶೋಧನಾ ಸ್ಥಿತಿ',
      reset_btn: 'ಮರುಹೊಂದಿಸಿ',
      explore_city_btn: 'ಮಾರ್ಗದರ್ಶಿ ನೋಡಿ →',
      opps_in_city: 'ವ್ಯವಹಾರ ಅವಕಾಶಗಳು:',
      read_opp_guide: 'ಸಂಪೂರ್ಣ ಮಾರ್ಗದರ್ಶಿ ಓದಿ →',
      access_blueprint: 'ಬ್ಲೂಪ್ರಿಂಟ್ ಪಡೆಯಿರಿ →',
      view_all_cities: 'ಎಲ್ಲಾ ನಗರಗಳನ್ನು ವೀಕ್ಷಿಸಿ →',
      browse_catalogue: 'ಸಂಪೂರ್ಣ ಡೈರೆಕ್ಟರಿ →',
      startup_capex: 'ಪ್ರಾರಂಭಿಕ ಬಂಡವಾಳ ಶ್ರೇಣಿ',
      indicative_capex: 'ಅಂದಾಜು ಹೂಡಿಕೆ',
      badge_verified: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ',
      badge_validated: 'ಗ್ರಾಹಕರಿಂದ ಅನುಮೋದಿತ',
      badge_supported: 'ಸಾಕ್ಷ್ಯ ಬೆಂಬಲಿತ',
      badge_desk: 'ಡೆಸ್ಕ್ ಸಂಶೋಧನೆ',
      footer_rights: 'ಎಲ್ಲಾ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
      lang_switch_btn: 'ಭಾಷೆ',
      lang_modal_title: 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
      lang_search_placeholder: 'ಭಾಷೆ ಹುಡುಕಿ (ಕನ್ನಡ, ಹಿಂದಿ, ತೆಲುಗು)...',
      all_india_notice: 'ಭಾರತದ ಎಲ್ಲಾ 22 ಅಧಿಕೃತ ಭಾಷೆಗಳಲ್ಲಿ ಲಭ್ಯವಿದೆ'
    },
    ml: {
      brand_title: 'ബിസിനസ് സ്കോപ്പ്',
      brand_subtitle: 'നിങ്ങളുടെ നഗരത്തിൽ',
      nav_opportunities: 'ബിസിനസ് സാധ്യതകൾ',
      nav_cities: 'നഗരങ്ങൾ',
      nav_blueprints: 'ബ്ലൂപ്രിന്റുകൾ',
      nav_launch_plans: '90 ദിവസത്തെ പദ്ധതികൾ',
      nav_insights: 'വിപണി വിശകലനം',
      nav_about: 'ഞങ്ങളെക്കുറിച്ച്',
      nav_faq: 'ചോദ്യോത്തരങ്ങൾ',
      nav_account: 'റിപ്പോർട്ടുകൾ',
      nav_custom: 'പ്രത്യേക ഗവേഷണം',
      nav_menu: 'മെനു',
      search_city_label: 'ലക്ഷ്യ നഗരം',
      search_city_all: 'ഭാരതത്തിലെ എല്ലാ നഗരങ്ങളും',
      search_budget_label: 'പരമാവധി ബജറ്റ്',
      search_budget_all: 'എല്ലാ ബജറ്റും',
      search_model_label: 'ബിസിനസ് മോഡൽ',
      search_model_all: 'എല്ലാ മോഡലുകളും',
      search_btn: 'അവസരങ്ങൾ കണ്ടെത്തുക',
      hero_badge: 'ഇന്ത്യൻ നഗരങ്ങൾക്കായുള്ള പ്രാദേശിക വിപണി വിവരങ്ങൾ',
      hero_title: 'നിങ്ങളുടെ നഗരത്തിലെ ശരിയായ ബിസിനസ് സാധ്യതകൾ കണ്ടെത്തുക.',
      hero_desc: 'പ്രാദേശിക ഉപഭോക്തൃ ആവശ്യങ്ങളും നിങ്ങളുടെ നിക്ഷേപ ശേഷിയും അടിസ്ഥാനമാക്കി യഥാർത്ഥ ബിസിനസ് അവസരങ്ങൾ കണ്ടെത്തുക.',
      where_to_build: 'നിങ്ങൾ എവിടെയാണ് ബിസിനസ് ആരംഭിക്കാൻ ആഗ്രഹിക്കുന്നത്?',
      where_to_build_sub: 'ഏതെങ്കിലും ഇന്ത്യൻ നഗരം തിരഞ്ഞ് പ്രാദേശിക വിപണി വിവരങ്ങളും ബിസിനസ് അവസരങ്ങളും കാണുക.',
      search_city_placeholder: 'നിങ്ങളുടെ നഗരം തിരയുക (ഉദാ. കൊച്ചി, തിരുവനന്തപുരം, കോഴിക്കോട്, തൃശൂർ)...',
      open_city_btn: 'നഗരം തുറക്കുക →',
      top_markets: 'പ്രധാന നഗരങ്ങൾ:',
      all_cities_btn: 'എല്ലാ 88+ നഗരങ്ങളും →',
      workflow_title: 'ഞങ്ങളുടെ പ്ലാറ്റ്‌ഫോം എങ്ങനെ പ്രവർത്തിക്കുന്നു',
      workflow_sub: 'നഗരം തിരഞ്ഞെടുക്കുന്നത് മുതൽ വിജയകരമായ ബിസിനസ് ആരംഭം വരെയുള്ള വ്യക്തമായ ഘട്ടങ്ങൾ.',
      cities_hero_title: 'ഇന്ത്യയിലുടനീളമുള്ള ബിസിനസ് അവസരങ്ങൾ',
      cities_hero_sub: 'വൻനഗരങ്ങൾ മുതൽ വളർന്നുവരുന്ന ചെറിയ നഗരങ്ങൾ വരെയുള്ള നഗര വിശകലനം.',
      tier_all: 'എല്ലാ നഗരങ്ങളും',
      tier_1: 'ടയർ 1 (മെട്രോകൾ)',
      tier_2: 'ടയർ 2 (വാണിജ്യ കേന്ദ്രങ്ങൾ)',
      tier_3: 'ടയർ 3 (പ്രാദേശിക നഗരങ്ങൾ)',
      tier_4: 'ടയർ 4 (പ്രാദേശിക വിപണികൾ)',
      tier_5: 'ടയർ 5 (ചെറുപട്ടണങ്ങൾ)',
      city_search_label: 'നഗരം തിരയുക',
      city_state_label: 'സംസ്ഥാനം',
      city_tier_label: 'മാർക്കറ്റ് ടയർ',
      city_status_label: 'ഗവേഷണ സ്ഥിതി',
      reset_btn: 'റീസെറ്റ്',
      explore_city_btn: 'വിവരങ്ങൾ കാണുക →',
      opps_in_city: 'ബിസിനസ് അവസരങ്ങൾ:',
      read_opp_guide: 'പൂർണ്ണ വിവരങ്ങൾ വായിക്കുക →',
      access_blueprint: 'ബ്ലൂപ്രിന്റ് നേടുക →',
      view_all_cities: 'എല്ലാ നഗരങ്ങളും കാണുക →',
      browse_catalogue: 'മുഴുവൻ ലിസ്റ്റ് →',
      startup_capex: 'പ്രാരംഭ നിക്ഷേപ പരിധി',
      indicative_capex: 'ഉദ്ദേശിക്കുന്ന നിക്ഷേപം',
      badge_verified: 'സ്ഥിരീകരിച്ചത്',
      badge_validated: 'ഉപഭോക്താക്കൾ അംഗീകരിച്ചത്',
      badge_supported: 'തെളിവുകളുടെ പിന്തുണയോടെ',
      badge_desk: 'ഡെസ്ക് ഗവേഷണം',
      footer_rights: 'എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം.',
      lang_switch_btn: 'ഭാഷ',
      lang_modal_title: 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക',
      lang_search_placeholder: 'ഭാഷ തിരയുക (മലയാളം, ഹിന്ദി, തമിഴ്)...',
      all_india_notice: 'ഇന്ത്യയിലെ എല്ലാ 22 ഔദ്യോഗിക ഭാഷകളിലും ലഭ്യമാണ്'
    },
    pa: {
      brand_title: 'ਬਿਜ਼ਨਸ ਸਕੋਪ',
      brand_subtitle: 'ਤੁਹਾਡੇ ਸ਼ਹਿਰ ਵਿੱਚ',
      nav_opportunities: 'ਵਪਾਰਕ ਮੌਕੇ',
      nav_cities: 'ਸ਼ਹਿਰ',
      nav_blueprints: 'ਬਲੂਪ੍ਰਿੰਟਸ',
      nav_launch_plans: '90 ਦਿਨਾਂ ਦੀਆਂ ਯੋਜਨਾਵਾਂ',
      nav_insights: 'ਮਾਰਕੀਟ ਰਿਸਰਚ',
      nav_about: 'ਸਾਡੇ ਬਾਰੇ',
      nav_faq: 'ਸਵਾਲ-ਜਵਾਬ',
      nav_account: 'ਖਰੀਦੀਆਂ ਗਈਆਂ ਰਿਪੋਰਟਾਂ',
      nav_custom: 'ਵਿਸ਼ੇਸ਼ ਖੋਜ',
      nav_menu: 'ਮੀਨੂ',
      search_city_label: 'ਟਾਰਗੇਟ ਸ਼ਹਿਰ',
      search_city_all: 'ਭਾਰਤ ਦੇ ਸਾਰੇ ਸ਼ਹਿਰ',
      search_budget_label: 'ਵੱਧ ਤੋਂ ਵੱਧ ਬਜਟ',
      search_budget_all: 'ਸਾਰੀਆਂ ਬਜਟ ਰੇਂਜਾਂ',
      search_model_label: 'ਬਿਜ਼ਨਸ ਮਾਡਲ',
      search_model_all: 'ਸਾਰੇ ਮਾਡਲ',
      search_btn: 'ਮੌਕੇ ਲੱਭੋ',
      hero_badge: 'ਭਾਰਤੀ ਸ਼ਹਿਰਾਂ ਲਈ ਸਥਾਨਕ ਵਪਾਰਕ ਸਮਝ',
      hero_title: 'ਆਪਣੇ ਸ਼ਹਿਰ ਵਿੱਚ ਸਹੀ ਵਪਾਰਕ ਮੌਕੇ ਲੱਭੋ।',
      hero_desc: 'ਸਥਾਨਕ ਲੋੜਾਂ ਅਤੇ ਆਪਣੇ ਬਜਟ ਦੇ ਆਧਾਰ ਤੇ ਅਸਲ ਵਪਾਰਕ ਸੰਭਾਵਨਾਵਾਂ ਦੀ ਪੜਚੋਲ ਕਰੋ।',
      where_to_build: 'ਤੁਸੀਂ ਕਿਹੜੇ ਸ਼ਹਿਰ ਵਿੱਚ ਵਪਾਰ ਸ਼ੁਰੂ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?',
      where_to_build_sub: 'ਕਿਸੇ ਵੀ ਭਾਰਤੀ ਸ਼ਹਿਰ ਨੂੰ ਖੋਜੋ ਅਤੇ ਉੱਥੋਂ ਦੇ ਵਪਾਰਕ ਮੌਕੇ ਦੇਖੋ।',
      search_city_placeholder: 'ਆਪਣਾ ਸ਼ਹਿਰ ਲੱਭੋ (ਜਿਵੇਂ ਲੁਧਿਆਣਾ, ਅੰਮ੍ਰਿਤਸਰ, ਜਲੰਧਰ, ਚੰਡੀਗੜ੍ਹ)...',
      open_city_btn: 'ਸ਼ਹਿਰ ਖੋਲ੍ਹੋ →',
      top_markets: 'ਪ੍ਰਮੁੱਖ ਸ਼ਹਿਰ:',
      all_cities_btn: 'ਸਾਰੇ 88+ ਸ਼ਹਿਰ →',
      workflow_title: 'ਸਾਡਾ ਪਲੇਟਫਾਰਮ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
      workflow_sub: 'ਸ਼ਹਿਰ ਦੀ ਚੋਣ ਤੋਂ ਲੈ ਕੇ ਪ੍ਰਮਾਣਿਤ ਵਪਾਰ ਸ਼ੁਰੂ ਕਰਨ ਤੱਕ ਦਾ ਯੋਜਨਾਬੱਧ ਤਰੀਕਾ।',
      cities_hero_title: 'ਸਾਰੇ ਭਾਰਤ ਦੇ ਸ਼ਹਿਰਾਂ ਵਿੱਚ ਵਪਾਰਕ ਮੌਕੇ ਲੱਭੋ',
      cities_hero_sub: 'ਵੱਡੇ ਮਹਾਨਗਰਾਂ ਤੋਂ ਲੈ ਕੇ ਛੋਟੇ ਕਸਬਿਆਂ ਤੱਕ ਹਰ ਸ਼ਹਿਰ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ।',
      tier_all: 'ਸਾਰੇ ਸ਼ਹਿਰ',
      tier_1: 'ਟੀਅਰ 1 (ਮੈਟਰੋ ਸ਼ਹਿਰ)',
      tier_2: 'ਟੀਅਰ 2 (ਵਪਾਰਕ ਕੇਂਦਰ)',
      tier_3: 'ਟੀਅਰ 3 (ਖੇਤਰੀ ਸ਼ਹਿਰ)',
      tier_4: 'ਟੀਅਰ 4 (ਸਥਾਨਕ ਬਾਜ਼ਾਰ)',
      tier_5: 'ਟੀਅਰ 5 (ਛੋਟੇ ਕਸਬੇ)',
      city_search_label: 'ਸ਼ਹਿਰ ਖੋਜੋ',
      city_state_label: 'ਰਾਜ',
      city_tier_label: 'ਮਾਰਕੀਟ ਟੀਅਰ',
      city_status_label: 'ਖੋਜ ਸਥਿਤੀ',
      reset_btn: 'ਰੀਸੈਟ ਕਰੋ',
      explore_city_btn: 'ਗਾਈਡ ਦੇਖੋ →',
      opps_in_city: 'ਵਪਾਰਕ ਮੌਕੇ:',
      read_opp_guide: 'ਪੂਰੀ ਗਾਈਡ ਪੜ੍ਹੋ →',
      access_blueprint: 'ਬਲੂਪ੍ਰਿੰਟ ਪ੍ਰਾਪਤ ਕਰੋ →',
      view_all_cities: 'ਸਾਰੇ ਸ਼ਹਿਰ ਦੇਖੋ →',
      browse_catalogue: 'ਪੂਰੀ ਸੂਚੀ →',
      startup_capex: 'ਸ਼ੁਰੂਆਤੀ ਪੂੰਜੀ ਰੇਂਜ',
      indicative_capex: 'ਅੰਦਾਜ਼ਨ ਨਿਵੇਸ਼',
      badge_verified: 'ਪ੍ਰਮਾਣਿਤ ਮੌਕਾ',
      badge_validated: 'ਗਾਹਕ ਦੁਆਰਾ ਪ੍ਰਮਾਣਿਤ',
      badge_supported: 'ਤੱਥਾਂ ਤੇ ਆਧਾਰਿਤ',
      badge_desk: 'ਡੈਸਕ ਰਿਸਰਚ',
      footer_rights: 'ਸਾਰੇ ਹੱਕ ਰਾਖਵੇਂ ਹਨ।',
      lang_switch_btn: 'ਭਾਸ਼ਾ',
      lang_modal_title: 'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ',
      lang_search_placeholder: 'ਭਾਸ਼ਾ ਖੋਜੋ (ਪੰਜਾਬੀ, ਹਿੰਦੀ, ਉਰਦੂ)...',
      all_india_notice: 'ਭਾਰਤ ਦੀਆਂ ਸਾਰੀਆਂ 22 ਸਰਕਾਰੀ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਉਪਲਬਧ'
    },
    or: {
      brand_title: 'ବିଜନେସ ସ୍କୋପ',
      brand_subtitle: 'ଆପଣଙ୍କ ସହରରେ',
      nav_opportunities: 'ବ୍ୟବସାୟ ସୁଯୋଗ',
      nav_cities: 'ସହରସମୂହ',
      nav_blueprints: 'ବ୍ଲୁପ୍ରିଣ୍ଟ',
      nav_launch_plans: '୯୦ ଦିନର ଯୋଜନା',
      nav_insights: 'ବଜାର ଅନୁସନ୍ଧାନ',
      nav_about: 'ଆମ ବିଷୟରେ',
      nav_faq: 'ପ୍ରଶ୍ନୋତ୍ତର',
      nav_account: 'ରିପୋର୍ଟ ଦେଖନ୍ତୁ',
      nav_custom: 'କଷ୍ଟମ ରିସର୍ଚ୍ଚ',
      nav_menu: 'ମେନୁ',
      search_city_label: 'ଲକ୍ଷ୍ୟ ସହର',
      search_city_all: 'ଭାରତର ସମସ୍ତ ସହର',
      search_budget_label: 'ସର୍ବାଧିକ ବଜେଟ',
      search_budget_all: 'ସମସ୍ତ ବଜେଟ ପରିସର',
      search_model_label: 'ବିଜନେସ ମଡେଲ',
      search_model_all: 'ସମସ୍ତ ମଡେଲ',
      search_btn: 'ସୁଯୋଗ ଖୋଜନ୍ତୁ',
      hero_badge: 'ଭାରତୀୟ ସହରଗୁଡ଼ିକ ପାଇଁ ସ୍ଥାନୀୟ ବ୍ୟବସାୟିକ ଅନ୍ତର୍ଦୃଷ୍ଟି',
      hero_title: 'ଆପଣଙ୍କ ସହରରେ ଉପଯୁକ୍ତ ବ୍ୟବସାୟ ସୁଯୋଗ ଖୋଜନ୍ତୁ।',
      hero_desc: 'ସ୍ଥାନୀୟ ଚାହିଦା ଏବଂ ଆପଣଙ୍କ ପୁଞ୍ଜି ଆଧାରରେ ପ୍ରକୃତ ବ୍ୟବସାୟିକ ସୁଯୋଗ ଆବିଷ୍କାର କରନ୍ତୁ।',
      where_to_build: 'ଆପଣ କେଉଁ ସହରରେ ବ୍ୟବସାୟ ଆରମ୍ଭ କରିବାକୁ ଚାହାଁନ୍ତି?',
      where_to_build_sub: 'ଯେକୌଣସି ଭାରତୀୟ ସହର ଖୋଜନ୍ତୁ ଏବଂ ସେଠାକାର ବଜାର ବିଶ୍ଳେଷଣ ଦେଖନ୍ତୁ।',
      search_city_placeholder: 'ଆପଣଙ୍କ ସହର ଖୋଜନ୍ତୁ (ଯଥା ଭୁବନେଶ୍ୱର, କଟକ, ରାଉରକେଲା)...',
      open_city_btn: 'ସହର ଦେଖନ୍ତୁ →',
      top_markets: 'ପ୍ରମୁଖ ସହର:',
      all_cities_btn: 'ସମସ୍ତ ୮୮+ ସହର →',
      workflow_title: 'ଆମର କାର୍ଯ୍ୟପ୍ରଣାଳୀ କିପରି କାମ କରେ',
      workflow_sub: 'ସହର ଚୟନ ଠାରୁ ଆରମ୍ଭ କରି ବ୍ୟବସାୟ ପ୍ରତିଷ୍ଠା ପର୍ଯ୍ୟନ୍ତ ଏକ ସଠିକ ମାର୍ଗଦର୍ଶନ।',
      cities_hero_title: 'ଭାରତ ସାରା ବ୍ୟବସାୟିକ ସୁଯୋଗ ଆବିଷ୍କାର କରନ୍ତୁ',
      cities_hero_sub: 'ମେଟ୍ରୋ ସହର ଠାରୁ ଆରମ୍ଭ କରି ଉଦୀୟମାନ ଛୋଟ ସହର ପର୍ଯ୍ୟନ୍ତ ବିସ୍ତୃତ ତଥ୍ୟ।',
      tier_all: 'ସମସ୍ତ ସହର',
      tier_1: 'ଟିୟର ୧ (ମେଟ୍ରୋ)',
      tier_2: 'ଟିୟର ୨ (ବାଣିଜ୍ୟିକ କେନ୍ଦ୍ର)',
      tier_3: 'ଟିୟର ୩ (ଆଞ୍ଚଳିକ ସହର)',
      tier_4: 'ଟିୟर ୪ (ସ୍ଥାନୀୟ ବଜାର)',
      tier_5: 'ଟିୟର ୫ (ଛୋଟ ସହର)',
      city_search_label: 'ସହର ଖୋଜନ୍ତୁ',
      city_state_label: 'ରାଜ୍ୟ',
      city_tier_label: 'ମାର୍କେଟ ଟିୟର',
      city_status_label: 'ଗବେଷଣା ସ୍ଥିତି',
      reset_btn: 'ରିସେଟ',
      explore_city_btn: 'ଗାଇଡ ଦେଖନ୍ତୁ →',
      opps_in_city: 'ବ୍ୟବସାୟ ସୁଯୋଗ:',
      read_opp_guide: 'ସମ୍ପୂର୍ଣ୍ଣ ଗାଇଡ ପଢ଼ନ୍ତୁ →',
      access_blueprint: 'ବ୍ଲୁପ୍ରିଣ୍ଟ ସଂଗ୍ରହ କରନ୍ତୁ →',
      view_all_cities: 'ସମସ୍ତ ସହର ଦେଖନ୍ତୁ →',
      browse_catalogue: 'ସମ୍ପୂର୍ଣ୍ଣ ତାଲିକା →',
      startup_capex: 'ପ୍ରାରମ୍ଭିକ ପୁଞ୍ଜି ପରିସର',
      indicative_capex: 'ଆନୁମାନିକ ପୁଞ୍ଜି',
      badge_verified: 'ପ୍ରମାଣିତ ସୁଯୋଗ',
      badge_validated: 'ଗ୍ରାହକ ସ୍ୱୀକୃତ',
      badge_supported: 'ପ୍ରମାଣ ଆଧାରିତ',
      badge_desk: 'ଡେସ୍କ ରିସର୍ଚ୍ଚ',
      footer_rights: 'ସମସ୍ତ ଅଧିକାର ସଂରକ୍ଷିତ।',
      lang_switch_btn: 'ଭାଷା',
      lang_modal_title: 'ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ',
      lang_search_placeholder: 'ଭାଷା ଖୋଜନ୍ତୁ (ଓଡ଼ିଆ, ହିନ୍ଦୀ, ବଙ୍ଗଳା)...',
      all_india_notice: 'ଭାରତର ସମସ୍ତ ୨୨ଟି ସରକାରୀ ଭାଷାରେ ଉପଲବ୍ଧ'
    }
  };

  /**
   * Universal Fallback string getter: checks current language, then Hindi, then English
   */
  function getTranslation(key, code) {
    const lang = code || currentLang || 'en';
    if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
      return TRANSLATIONS[lang][key];
    }
    if (TRANSLATIONS['hi'] && TRANSLATIONS['hi'][key] && lang !== 'en') {
      return TRANSLATIONS['hi'][key];
    }
    if (TRANSLATIONS['en'] && TRANSLATIONS['en'][key]) {
      return TRANSLATIONS['en'][key];
    }
    return '';
  }

  /**
   * Determine initial language using 5-layer persistent fallback:
   * 1. URL search parameter (?lang=xx or ?locale=xx)
   * 2. window.name (persists within the tab/iframe across full navigations)
   * 3. sessionStorage
   * 4. localStorage
   * 5. document.cookie (googtrans)
   * 6. navigator.languages
   */
  function detectInitialLanguage() {
    // 1. URL parameter
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const langParam = urlParams.get('lang') || urlParams.get('locale');
      if (langParam) {
        const match = LANGUAGES.find(l => l.code.toLowerCase() === langParam.toLowerCase());
        if (match) return match.code;
      }
    } catch (e) {}

    // 2. window.name
    try {
      if (window.name && window.name.includes('bsc_lang:')) {
        const parts = window.name.split('bsc_lang:');
        if (parts[1]) {
          const code = parts[1].split(';')[0].trim().toLowerCase();
          const match = LANGUAGES.find(l => l.code.toLowerCase() === code);
          if (match) return match.code;
        }
      }
    } catch (e) {}

    // 3. sessionStorage
    try {
      const sSaved = sessionStorage.getItem(STORAGE_KEY);
      if (sSaved && LANGUAGES.some(l => l.code === sSaved)) {
        return sSaved;
      }
    } catch (e) {}

    // 4. localStorage
    try {
      const lSaved = localStorage.getItem(STORAGE_KEY);
      if (lSaved && LANGUAGES.some(l => l.code === lSaved)) {
        return lSaved;
      }
    } catch (e) {}

    // 5. document.cookie (googtrans=/en/hi)
    try {
      const m = document.cookie.match(/googtrans=\/en\/([a-z]+)/i);
      if (m && m[1]) {
        const cCode = m[1].toLowerCase();
        const match = LANGUAGES.find(l => l.code === cCode);
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

    // 4. document.cookie (root path, no restrictive domain)
    try {
      if (code === 'en') {
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      } else {
        document.cookie = `googtrans=/en/${code}; path=/;`;
      }
    } catch (e) {}

    // 5. URL query parameter (without reloading)
    try {
      const url = new URL(window.location.href);
      if (code === 'en') {
        url.searchParams.delete('lang');
      } else {
        url.searchParams.set('lang', code);
      }
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  }

  /**
   * Rewrites all internal <a> links on the page to automatically carry ?lang=${currentLang}
   * so every click between pages seamlessly persists the selected language.
   */
  function propagateLanguageToLinks(code) {
    const lang = code || currentLang || 'en';
    
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
      if (href.startsWith('http') && !href.includes(window.location.host)) return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin === window.location.origin) {
          if (lang === 'en') {
            url.searchParams.delete('lang');
          } else {
            url.searchParams.set('lang', lang);
          }
          const isRelative = !href.startsWith('http') && !href.startsWith('//');
          const finalHref = isRelative ? (url.pathname + url.search + url.hash) : url.href;
          if (a.getAttribute('href') !== finalHref) {
            a.setAttribute('href', finalHref);
          }
        }
      } catch (e) {}
    });
  }

  /**
   * Intercepts any click on links to guarantee the destination URL preserves the active language.
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
        try {
          const url = new URL(href, window.location.href);
          if (url.origin === window.location.origin) {
            url.searchParams.set('lang', currentLang);
            link.href = url.href;
          }
        } catch (err) {}
      }
    }, true);
  }

  /**
   * Initializes the Google Translate widget and handles automated combo box switching.
   */
  function initGoogleTranslateIntegration() {
    if (window._bsc_gt_initialized) return;
    window._bsc_gt_initialized = true;

    let gtDiv = document.getElementById('google_translate_element');
    if (!gtDiv) {
      gtDiv = document.createElement('div');
      gtDiv.id = 'google_translate_element';
      gtDiv.style.display = 'none';
      document.body.appendChild(gtDiv);
    }

    window.googleTranslateElementInit = function() {
      try {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'en,hi,bn,te,mr,ta,gu,ur,kn,ml,pa,or,as,mai,ne,sd,sa',
          autoDisplay: false
        }, 'google_translate_element');

        if (currentLang && currentLang !== 'en') {
          activateGoogleTranslate(currentLang);
        }
      } catch (e) {}
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.onerror = function() {};
    document.head.appendChild(script);
  }

  /**
   * Activates Google Translate with a persistent poller looking for .goog-te-combo.
   */
  function activateGoogleTranslate(code) {
    if (gtPollInterval) {
      clearInterval(gtPollInterval);
      gtPollInterval = null;
    }

    if (!code || code === 'en') {
      try {
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      } catch (e) {}
      const select = document.querySelector('.goog-te-combo');
      if (select && select.value !== 'en') {
        select.value = 'en';
        select.dispatchEvent(new Event('change'));
      }
      return;
    }

    try {
      document.cookie = `googtrans=/en/${code}; path=/;`;
    } catch (e) {}

    let attempts = 0;
    const maxAttempts = 35; // 35 * 120ms = ~4.2s
    gtPollInterval = setInterval(() => {
      attempts++;
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        if (select.value !== code) {
          select.value = code;
          select.dispatchEvent(new Event('change'));
        }
        clearInterval(gtPollInterval);
        gtPollInterval = null;
      } else if (attempts >= maxAttempts) {
        clearInterval(gtPollInterval);
        gtPollInterval = null;
      }
    }, 120);
  }

  /**
   * Deeply translates all standard page headings, filters, cards, and UI across all 17 platform pages.
   */
  function applyDictionaryTranslations(code) {
    const getStr = (k) => getTranslation(k, code);

    // 1. Elements with explicit data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = getStr(key);
      if (val) el.textContent = val;
    });

    // 2. Brand logo subtitle
    const brandSub = document.querySelector('.brand-text small');
    if (brandSub) brandSub.textContent = getStr('brand_subtitle');

    // 3. Desktop & Mobile Navigation Links
    const navItems = [
      { sel: 'a[href*="opportunities"]', text: getStr('nav_opportunities') },
      { sel: 'a[href*="cities"]', text: getStr('nav_cities') },
      { sel: 'a[href*="blueprints"]', text: getStr('nav_blueprints') },
      { sel: 'a[href*="launch-plans"]', text: getStr('nav_launch_plans') },
      { sel: 'a[href*="insights"]', text: getStr('nav_insights') },
      { sel: 'a[href*="about"]', text: getStr('nav_about') },
      { sel: 'a[href*="faq"]', text: getStr('nav_faq') },
      { sel: 'a[href*="account"]', text: getStr('nav_account') },
      { sel: 'a[href*="custom-research"]', text: getStr('nav_custom') }
    ];

    navItems.forEach(item => {
      document.querySelectorAll(`.desktop-nav ${item.sel}, .mobile-nav-drawer ${item.sel}`).forEach(link => {
        link.textContent = item.text;
      });
    });

    // 4. Mobile bottom tab bar
    const bottomLabels = {
      'Explore': getStr('nav_opportunities'),
      'Cities': getStr('nav_cities'),
      'Blueprints': getStr('nav_blueprints'),
      'Orders': getStr('nav_account'),
      'Menu': getStr('nav_menu')
    };
    document.querySelectorAll('.mobile-bottom-item span').forEach(s => {
      const orig = s.getAttribute('data-orig-text') || s.textContent.trim();
      if (!s.getAttribute('data-orig-text')) s.setAttribute('data-orig-text', orig);
      if (bottomLabels[orig]) s.textContent = bottomLabels[orig];
    });

    // 5. Homepage "Where do you want to build?" Card
    const promptTitle = document.querySelector('.hero-city-prompt-title span:nth-child(2)');
    if (promptTitle) promptTitle.textContent = getStr('where_to_build');

    const promptSub = document.querySelector('.hero-city-prompt-sub');
    if (promptSub) promptSub.textContent = getStr('where_to_build_sub');

    const promptInput = document.getElementById('home-city-search-input');
    if (promptInput) promptInput.placeholder = getStr('search_city_placeholder');

    const promptGoBtn = document.getElementById('home-city-go-btn');
    if (promptGoBtn) promptGoBtn.textContent = getStr('open_city_btn');

    const quickLabel = document.querySelector('.hero-city-quick-label');
    if (quickLabel) quickLabel.textContent = getStr('top_markets');

    // 6. 8-Step Discovery Workflow Section
    const wfHeading = document.getElementById('workflow-heading');
    if (wfHeading) wfHeading.textContent = getStr('workflow_title');

    const wfSub = document.querySelector('.workflow-header p');
    if (wfSub) wfSub.textContent = getStr('workflow_sub');

    // 7. Cities Directory Page (pages/cities/index.html)
    const citiesH1 = document.querySelector('.city-directory-main .catalogue-title-row h1, .catalogue-hero h1');
    if (citiesH1 && citiesH1.textContent.includes('Explore Business Opportunities')) {
      citiesH1.textContent = getStr('cities_hero_title');
    }

    const citiesSub = document.querySelector('.city-directory-main .section-subtext, .catalogue-hero .section-subtext');
    if (citiesSub && citiesSub.textContent.includes('Discover business opportunities city by city')) {
      citiesSub.textContent = getStr('cities_hero_sub');
    }

    // Visual Tier Cards
    const tierMap = [
      { sel: '.tier-card-btn[data-tier=""] .tier-card-badge', text: getStr('tier_all') },
      { sel: '.tier-card-btn[data-tier="Tier 1"] .tier-card-badge', text: getStr('tier_1') },
      { sel: '.tier-card-btn[data-tier="Tier 2"] .tier-card-badge', text: getStr('tier_2') },
      { sel: '.tier-card-btn[data-tier="Tier 3"] .tier-card-badge', text: getStr('tier_3') },
      { sel: '.tier-card-btn[data-tier="Tier 4"] .tier-card-badge', text: getStr('tier_4') },
      { sel: '.tier-card-btn[data-tier="Tier 5"] .tier-card-badge', text: getStr('tier_5') }
    ];
    tierMap.forEach(tm => {
      const el = document.querySelector(tm.sel);
      if (el) el.textContent = tm.text;
    });

    // Cities Filters
    const citySearchLabel = document.querySelector('label[for="city-search-input"]');
    if (citySearchLabel) citySearchLabel.textContent = getStr('city_search_label');

    const cityStateLabel = document.querySelector('label[for="state-filter-select"]');
    if (cityStateLabel) cityStateLabel.textContent = getStr('city_state_label');

    const cityTierLabel = document.querySelector('label[for="tier-filter-select"]');
    if (cityTierLabel) cityTierLabel.textContent = getStr('city_tier_label');

    const cityStatusLabel = document.querySelector('label[for="coverage-filter-select"]');
    if (cityStatusLabel) cityStatusLabel.textContent = getStr('city_status_label');

    const clearCityBtn = document.getElementById('clear-city-search-btn');
    if (clearCityBtn) clearCityBtn.textContent = getStr('reset_btn');

    // 8. City Profile Page (pages/city/index.html)
    const cityOppsH2 = document.getElementById('city-opps-heading');
    if (cityOppsH2 && window.currentCityName) {
      cityOppsH2.innerHTML = `${getStr('opps_in_city')} <span class="city-name-placeholder">${escapeHtml(window.currentCityName)}</span>`;
    }

    const resetCityFilters = document.getElementById('reset-city-filters-btn');
    if (resetCityFilters) resetCityFilters.textContent = getStr('reset_btn');

    // 9. Hero Search Forms on Homepage and Opportunities
    const cityLabel = document.querySelector('label[for="hero-city-select"]');
    if (cityLabel) cityLabel.textContent = getStr('search_city_label');

    const cityAllOpt = document.querySelector('#hero-city-select option[value=""]');
    if (cityAllOpt) cityAllOpt.textContent = getStr('search_city_all');

    const budgetLabel = document.querySelector('label[for="hero-budget-select"], label[for="hero-budget-filter"]');
    if (budgetLabel) budgetLabel.textContent = getStr('search_budget_label');

    const budgetAllOpt = document.querySelector('#hero-budget-select option[value=""]');
    if (budgetAllOpt) budgetAllOpt.textContent = getStr('search_budget_all');

    const searchSubmitBtn = document.querySelector('#hero-search-form button[type="submit"]');
    if (searchSubmitBtn) searchSubmitBtn.textContent = getStr('search_btn');

    // 10. Deep Text Node Scanning for Common Card Actions & Badges
    applyDeepTextTranslations(code);
  }

  /**
   * Scans text nodes for common buttons, badges, and links to ensure immediate native Indian language rendering.
   */
  function applyDeepTextTranslations(code) {
    if (!code || code === 'en') return;
    const getStr = (k) => getTranslation(k, code);

    // Action buttons on cards
    document.querySelectorAll('.card a, .btn, .link-arrow').forEach(el => {
      const txt = el.textContent.trim();
      if (txt.includes('Explore') && txt.includes('Guide')) {
        el.textContent = getStr('explore_city_btn') || txt;
      } else if (txt.includes('Read Opportunity Guide')) {
        el.textContent = getStr('read_opp_guide') || txt;
      } else if (txt.includes('Access Blueprint')) {
        el.textContent = getStr('access_blueprint') || txt;
      } else if (txt.includes('View all cities')) {
        el.textContent = getStr('view_all_cities') || txt;
      } else if (txt.includes('Browse full catalogue')) {
        el.textContent = getStr('browse_catalogue') || txt;
      }
    });

    // Evidence tags & Badges
    document.querySelectorAll('.badge, .evidence-tag, .budget-label').forEach(el => {
      const txt = el.textContent.trim();
      if (txt === 'Verified Gap') el.textContent = getStr('badge_verified') || txt;
      else if (txt === 'Customer Validated') el.textContent = getStr('badge_validated') || txt;
      else if (txt === 'Evidence Supported') el.textContent = getStr('badge_supported') || txt;
      else if (txt === 'Startup Capex Range') el.textContent = getStr('startup_capex') || txt;
      else if (txt === 'Indicative Startup Capex') el.textContent = getStr('indicative_capex') || txt;
    });
  }

  /**
   * Master Language Application Controller.
   */
  function applyLanguage(code, persist) {
    if (!LANGUAGES.some(l => l.code === code)) code = 'en';
    currentLang = code;

    if (persist) {
      saveLanguageState(code);
    }

    const langObj = LANGUAGES.find(l => l.code === code) || LANGUAGES[0];

    // 1. HTML attributes & RTL support
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

    // 3. Immediate Dictionary & DOM translation
    applyDictionaryTranslations(code);

    // 4. Update Modal selection state
    const activeSearch = document.getElementById('lang-search-input')?.value || '';
    renderLanguageButtons(activeSearch.trim().toLowerCase());

    // 5. Propagate language to all internal links so next page transitions persist language
    propagateLanguageToLinks(code);

    // 6. Trigger Google Translate for deep body dossiers and articles
    activateGoogleTranslate(code);
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
      langBtn.setAttribute('aria-label', 'Change Language');
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
      document.getElementById('mobile-drawer-lang-btn').addEventListener('click', () => {
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

      document.getElementById('lang-modal-close').addEventListener('click', closeLanguageModal);
      document.getElementById('lang-modal-backdrop').addEventListener('click', closeLanguageModal);
      document.getElementById('lang-modal-done-btn').addEventListener('click', closeLanguageModal);

      const searchInput = document.getElementById('lang-search-input');
      searchInput.addEventListener('input', (e) => {
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
   * Observe DOM mutations to auto-translate and rewrite links for dynamically loaded content.
   */
  function setupDomObserver() {
    if (domObserver) return;
    domObserver = new MutationObserver(() => {
      if (currentLang && currentLang !== 'en') {
        propagateLanguageToLinks(currentLang);
        applyDeepTextTranslations(currentLang);
      }
    });
    domObserver.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Main Initialization Lifecycle.
   */
  function init() {
    currentLang = detectInitialLanguage();
    injectLanguageSwitcherUI();
    setupNavigationInterceptor();
    applyLanguage(currentLang, false);
    initGoogleTranslateIntegration();
    setupDomObserver();

    // Secondary pass after DOM is fully painted
    setTimeout(() => {
      propagateLanguageToLinks(currentLang);
      applyDeepTextTranslations(currentLang);
    }, 300);
  }

  // Public Interface
  return {
    init: init,
    setLanguage: (code) => applyLanguage(code, true),
    getCurrentLanguage: () => currentLang,
    getLanguages: () => LANGUAGES,
    openModal: openLanguageModal,
    closeModal: closeLanguageModal,
    propagateLinks: () => propagateLanguageToLinks(currentLang)
  };
})();

// Auto-run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', I18N.init);
} else {
  I18N.init();
}
