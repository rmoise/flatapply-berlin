/**
 * WG-Gesucht URL Builder
 * Constructs search URLs for WG-Gesucht with support for combined property types
 */

export interface WGGesuchtSearchParams {
  city?: string;
  cityId?: number;
  minRent?: number;
  maxRent?: number;
  propertyTypes?: number[]; // 0=WG, 1=1-room apt, 2=apartments
  noDeact?: boolean; // exclude deactivated listings
  offerFilter?: boolean; // only show offers (not requests)
  sortOrder?: number; // 0=by date
}

export class WGGesuchtURLBuilder {
  private static readonly BASE_URL = 'https://www.wg-gesucht.de';
  private static readonly DEFAULT_CITY_ID = 8; // Berlin
  
  /**
   * Build a combined search URL for multiple property types
   */
  static buildCombinedSearchUrl(params: WGGesuchtSearchParams): string {
    const {
      cityId = this.DEFAULT_CITY_ID,
      minRent,
      maxRent,
      propertyTypes = [0, 1, 2], // Default to all types
      noDeact = true,
      offerFilter = true,
      sortOrder = 0
    } = params;
    
    // Build the path based on property types
    const pathSegments = [];
    if (propertyTypes.includes(0)) pathSegments.push('wg-zimmer');
    if (propertyTypes.includes(1)) pathSegments.push('1-zimmer-wohnungen');
    if (propertyTypes.includes(2)) pathSegments.push('wohnungen');
    
    const path = pathSegments.join('-und-');
    const typeString = propertyTypes.join('+');
    
    // Base URL structure
    let url = `${this.BASE_URL}/${path}-in-Berlin.${cityId}.${typeString}.1.0.html`;
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (offerFilter) queryParams.append('offer_filter', '1');
    queryParams.append('city_id', cityId.toString());
    queryParams.append('sort_order', sortOrder.toString());
    if (noDeact) queryParams.append('noDeact', '1');
    
    // Add categories
    propertyTypes.forEach(type => {
      queryParams.append('categories[]', type.toString());
    });
    
    // Add rent filters if specified
    if (minRent) queryParams.append('rent_from', minRent.toString());
    if (maxRent) queryParams.append('rent_to', maxRent.toString());
    
    return `${url}?${queryParams.toString()}`;
  }
  
  /**
   * Build URL for a specific page number
   */
  static buildPageUrl(baseUrl: string, pageNumber: number): string {
    // WG-Gesucht uses format: .1.0.html where first number is page
    return baseUrl.replace(/\.(\d+)\.0\.html/, `.${pageNumber}.0.html`);
  }
  
  /**
   * Parse property type from listing data
   */
  static parsePropertyType(title: string, description?: string): number {
    const text = `${title} ${description || ''}`.toLowerCase();
    
    if (text.includes('wg-zimmer') || text.includes('wg zimmer') || 
        (text.includes('wg') && text.includes('zimmer'))) {
      return 0; // WG room
    } else if (text.includes('1-zimmer-wohnung') || text.includes('1 zimmer wohnung')) {
      return 1; // 1-room apartment
    } else if (text.includes('wohnung') || text.includes('apartment')) {
      return 2; // Apartment
    }
    
    return 0; // Default to WG room
  }
}

// Example usage:
// const url = WGGesuchtURLBuilder.buildCombinedSearchUrl({
//   minRent: 400,
//   maxRent: 1200,
//   propertyTypes: [0, 1, 2], // All types
//   noDeact: true
// });