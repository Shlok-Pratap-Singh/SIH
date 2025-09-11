export const translations = {
  en: {
    'app.title': 'Tourist Safety',
    'app.subtitle': 'Northeast India',
    'status.safe': 'Safe Zone',
    'status.moderate': 'Moderate Risk',
    'status.unsafe': 'High Risk',
    'button.emergency': 'EMERGENCY',
    'button.help': 'Tap for immediate help',
    'location.current': 'Current Location',
    'map.safety': 'Safety Map',
    'news.updates': 'News & Alerts',
    'contacts.police': 'Police',
    'contacts.medical': 'Medical',
    'nav.home': 'Home',
    'nav.map': 'Map',
    'nav.alerts': 'Alerts',
    'nav.profile': 'Profile',
  },
  hi: {
    'app.title': 'पर्यटक सुरक्षा',
    'app.subtitle': 'पूर्वोत्तर भारत',
    'status.safe': 'सुरक्षित क्षेत्र',
    'status.moderate': 'मध्यम जोखिम',
    'status.unsafe': 'उच्च जोखिम',
    'button.emergency': 'आपातकाल',
    'button.help': 'तत्काल सहायता के लिए टैप करें',
    'location.current': 'वर्तमान स्थान',
    'map.safety': 'सुरक्षा मानचित्र',
    'news.updates': 'समाचार और अलर्ट',
    'contacts.police': 'पुलिस',
    'contacts.medical': 'चिकित्सा',
    'nav.home': 'घर',
    'nav.map': 'मानचित्र',
    'nav.alerts': 'अलर्ट',
    'nav.profile': 'प्रोफ़ाइल',
  },
  as: {
    'app.title': 'পৰ্যটক সুৰক্ষা',
    'app.subtitle': 'উত্তৰ-পূৰ্ব ভাৰত',
    'status.safe': 'সুৰক্ষিত এলেকা',
    'status.moderate': 'মধ্যম বিপদ',
    'status.unsafe': 'উচ্চ বিপদ',
    'button.emergency': 'জৰুৰীকালীন',
    'button.help': 'তৎক্ষণাৎ সহায়তাৰ বাবে টেপ কৰক',
    'location.current': 'বৰ্তমান স্থান',
    'map.safety': 'সুৰক্ষা মানচিত্ৰ',
    'news.updates': 'বাতৰি আৰু সতৰ্কবাণী',
    'contacts.police': 'আৰক্ষী',
    'contacts.medical': 'চিকিৎসা',
    'nav.home': 'ঘৰ',
    'nav.map': 'মানচিত্ৰ',
    'nav.alerts': 'সতৰ্কবাণী',
    'nav.profile': 'প্ৰ'ফাইল',
  },
};

export function useTranslation(language: string = 'en') {
  return {
    t: (key: string) => {
      return translations[language as keyof typeof translations]?.[key as keyof typeof translations.en] || key;
    }
  };
}
