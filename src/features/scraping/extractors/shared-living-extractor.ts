/**
 * Extracts shared living (WG) specific information from listing descriptions
 */

export interface SharedLivingDetails {
  // Current flatmates
  totalFlatmates?: number;
  currentResidents?: {
    gender?: 'male' | 'female' | 'mixed';
    ageRange?: string;
    count?: number;
  };
  
  // Preferences for new flatmate
  preferredGender?: 'any' | 'female' | 'male';
  preferredAgeRange?: {
    min?: number;
    max?: number;
  };
  
  // House rules
  smokingAllowed?: boolean;
  petsAllowed?: boolean;
  
  // Living situation
  languages?: string[];
  atmosphere?: string[];
  studentWG?: boolean;
  professionalWG?: boolean;
  internationalWG?: boolean;
}

export function extractSharedLivingDetails(description: string, title?: string): SharedLivingDetails {
  const details: SharedLivingDetails = {};
  const lowerDesc = description.toLowerCase();
  const lowerTitle = (title || '').toLowerCase();
  
  // Extract current residents info
  extractCurrentResidents(lowerDesc, details);
  
  // Extract preferences for new flatmate
  extractPreferences(lowerDesc, details);
  
  // Extract house rules
  extractHouseRules(lowerDesc, details);
  
  // Extract living situation
  extractLivingSituation(lowerDesc, lowerTitle, details);
  
  return details;
}

function extractCurrentResidents(desc: string, details: SharedLivingDetails) {
  // Look for patterns like "2er WG", "3 person flat", "WG mit 4 Personen"
  const sizePatterns = [
    /(\d+)er[\s-]?wg/i,
    /(\d+)[\s-]?personen?[\s-]?wg/i,
    /wg[\s-]?mit[\s-]?(\d+)[\s-]?personen/i,
    /(\d+)[\s-]?people/i,
    /(\d+)[\s-]?person[\s-]?flat/i,
    /(\d+)[\s-]?zimmer[\s-]?wg/i
  ];
  
  for (const pattern of sizePatterns) {
    const match = desc.match(pattern);
    if (match) {
      details.totalFlatmates = parseInt(match[1]);
      break;
    }
  }
  
  // Gender composition
  if (/männer[\s-]?wg|nur männer|only men|all male|reine männer/i.test(desc)) {
    details.currentResidents = { ...details.currentResidents, gender: 'male' };
  } else if (/frauen[\s-]?wg|nur frauen|only women|all female|reine frauen/i.test(desc)) {
    details.currentResidents = { ...details.currentResidents, gender: 'female' };
  } else if (/gemischte|mixed|männer und frauen|men and women/i.test(desc)) {
    details.currentResidents = { ...details.currentResidents, gender: 'mixed' };
  }
  
  // Age information
  const agePatterns = [
    /bewohner.*?(\d{2})[\s-]?bis[\s-]?(\d{2})/i,
    /alter.*?(\d{2})[\s-]?-[\s-]?(\d{2})/i,
    /zwischen[\s-]?(\d{2})[\s-]?und[\s-]?(\d{2})/i,
    /age.*?(\d{2})[\s-]?to[\s-]?(\d{2})/i
  ];
  
  for (const pattern of agePatterns) {
    const match = desc.match(pattern);
    if (match) {
      details.currentResidents = {
        ...details.currentResidents,
        ageRange: `${match[1]}-${match[2]}`
      };
      break;
    }
  }
}

function extractPreferences(desc: string, details: SharedLivingDetails) {
  // Gender preferences
  if (/suchen eine frau|looking for.*?female|weibliche mitbewohnerin/i.test(desc)) {
    details.preferredGender = 'female';
  } else if (/suchen einen mann|looking for.*?male|männlichen mitbewohner/i.test(desc)) {
    details.preferredGender = 'male';
  } else if (/geschlecht egal|gender doesn't matter|egal ob mann oder frau/i.test(desc)) {
    details.preferredGender = 'any';
  }
  
  // Age preferences
  const agePrefPatterns = [
    /suchen.*?(\d{2})[\s-]?bis[\s-]?(\d{2})/i,
    /alter.*?zwischen[\s-]?(\d{2})[\s-]?und[\s-]?(\d{2})/i,
    /looking for.*?(\d{2})[\s-]?to[\s-]?(\d{2})/i,
    /ideal.*?(\d{2})[\s-]?-[\s-]?(\d{2})/i
  ];
  
  for (const pattern of agePrefPatterns) {
    const match = desc.match(pattern);
    if (match) {
      details.preferredAgeRange = {
        min: parseInt(match[1]),
        max: parseInt(match[2])
      };
      break;
    }
  }
}

function extractHouseRules(desc: string, details: SharedLivingDetails) {
  // Smoking
  if (/nichtraucher|non[\s-]?smoker|no smoking|rauchfrei|smoke[\s-]?free/i.test(desc)) {
    details.smokingAllowed = false;
  } else if (/raucher willkommen|smoking allowed|rauchen erlaubt/i.test(desc)) {
    details.smokingAllowed = true;
  } else if (/balkon.*rauchen|rauchen.*balkon|smoke.*balcony/i.test(desc)) {
    details.smokingAllowed = true; // Allowed on balcony
  }
  
  // Pets
  if (/keine haustiere|no pets|haustiere nicht erlaubt|pets not allowed/i.test(desc)) {
    details.petsAllowed = false;
  } else if (/haustiere willkommen|pets allowed|haustiere erlaubt|pet[\s-]?friendly/i.test(desc)) {
    details.petsAllowed = true;
  }
}

function extractLivingSituation(desc: string, title: string, details: SharedLivingDetails) {
  // Languages
  const languages: string[] = [];
  const langPatterns = [
    { pattern: /deutsch|german/i, lang: 'German' },
    { pattern: /englisch|english/i, lang: 'English' },
    { pattern: /spanisch|spanish/i, lang: 'Spanish' },
    { pattern: /französisch|french/i, lang: 'French' },
    { pattern: /italienisch|italian/i, lang: 'Italian' },
    { pattern: /international/i, lang: 'International' }
  ];
  
  langPatterns.forEach(({ pattern, lang }) => {
    if (pattern.test(desc)) {
      languages.push(lang);
    }
  });
  
  if (languages.length > 0) {
    details.languages = languages;
  }
  
  // Atmosphere/Type
  const atmosphere: string[] = [];
  
  if (/studenten[\s-]?wg|student/i.test(desc) || /student/i.test(title)) {
    details.studentWG = true;
    atmosphere.push('Student');
  }
  
  if (/berufstätig|professional|working/i.test(desc)) {
    details.professionalWG = true;
    atmosphere.push('Professional');
  }
  
  if (/international/i.test(desc) || languages.length > 2) {
    details.internationalWG = true;
    atmosphere.push('International');
  }
  
  // Additional atmosphere keywords
  const atmosphereKeywords = [
    { pattern: /ruhig|quiet|calm/i, keyword: 'Quiet' },
    { pattern: /gesellig|social|friendly/i, keyword: 'Social' },
    { pattern: /familiär|family/i, keyword: 'Family-like' },
    { pattern: /zweck[\s-]?wg|purpose/i, keyword: 'Functional' },
    { pattern: /party|feier/i, keyword: 'Party-friendly' },
    { pattern: /vegetarisch|vegetarian/i, keyword: 'Vegetarian' },
    { pattern: /vegan/i, keyword: 'Vegan' },
    { pattern: /öko|eco|sustainable/i, keyword: 'Eco-friendly' }
  ];
  
  atmosphereKeywords.forEach(({ pattern, keyword }) => {
    if (pattern.test(desc)) {
      atmosphere.push(keyword);
    }
  });
  
  if (atmosphere.length > 0) {
    details.atmosphere = [...new Set(atmosphere)]; // Remove duplicates
  }
}

/**
 * Formats shared living details for display
 */
export function formatSharedLivingDetails(details: SharedLivingDetails): string {
  const parts: string[] = [];
  
  if (details.totalFlatmates) {
    parts.push(`${details.totalFlatmates}-person WG`);
  }
  
  if (details.currentResidents?.gender) {
    parts.push(`${details.currentResidents.gender} flatmates`);
  }
  
  if (details.preferredGender && details.preferredGender !== 'any') {
    parts.push(`Looking for ${details.preferredGender}`);
  }
  
  if (details.smokingAllowed === false) {
    parts.push('Non-smoking');
  }
  
  if (details.petsAllowed === true) {
    parts.push('Pet-friendly');
  }
  
  if (details.atmosphere && details.atmosphere.length > 0) {
    parts.push(details.atmosphere.join(', '));
  }
  
  return parts.join(' • ');
}