const API_BASE_URL = 'https://api.themeparks.wiki/v1';

// Based on the OpenAPI schema
export interface EntityLiveData {
  id: string;
  name: string;
  entityType: 'DESTINATION' | 'PARK' | 'ATTRACTION' | 'RESTAURANT' | 'HOTEL' | 'SHOW';
  status?: 'OPERATING' | 'DOWN' | 'CLOSED' | 'REFURBISHMENT';
  lastUpdated: string;
  queue?: {
    STANDBY?: {
      waitTime?: number | null;
    };
    SINGLE_RIDER?: {
      waitTime?: number | null;
    };
    RETURN_TIME?: {
      state: 'AVAILABLE' | 'TEMP_FULL' | 'FINISHED';
      returnStart?: string | null;
      returnEnd?: string | null;
    };
    PAID_RETURN_TIME?: {
      state: 'AVAILABLE' | 'TEMP_FULL' | 'FINISHED';
      returnStart?: string | null;
      returnEnd?: string | null;
      price?: {
        amount: number;
        currency: string;
        formatted?: string;
      };
    };
  };
  showtimes?: Array<{
    type: string;
    startTime?: string | null;
    endTime?: string | null;
  }>;
  operatingHours?: Array<{
    type: string;
    startTime?: string | null;
    endTime?: string | null;
  }>;
}

export interface EntityLiveDataResponse {
  id: string;
  name: string;
  entityType: string;
  timezone: string;
  liveData: EntityLiveData[];
}

export interface DestinationEntry {
  id: string;
  name: string;
  slug: string;
  parks: Array<{
    id: string;
    name: string;
  }>;
}

export interface EntitySchedule {
  date: string;
  openingTime: string;
  closingTime: string;
  type: 'OPERATING' | 'TICKETED_EVENT' | 'PRIVATE_EVENT' | 'EXTRA_HOURS' | 'INFO';
}

class ThemeParksAPI {
  private async fetchAPI<T>(endpoint: string): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('Fetching:', url);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store' // Disable caching for real-time data
    });

    if (!response.ok) {
      console.error(`API request failed: ${response.status} ${response.statusText}`);
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getDestinations() {
    const data = await this.fetchAPI<{ destinations: DestinationEntry[] }>('/destinations');
    return data.destinations;
  }

  async getEntityLiveData(entityId: string): Promise<EntityLiveDataResponse> {
    return this.fetchAPI<EntityLiveDataResponse>(`/entity/${entityId}/live`);
  }

  async getEntitySchedule(entityId: string) {
    return this.fetchAPI<any>(`/entity/${entityId}/schedule`);
  }

  async getDisneylandParisData() {
    // First get all destinations to find Disneyland Paris
    const destinations = await this.getDestinations();
    
    // Find Disneyland Paris (usually 'dlp' slug)
    const dlp = destinations.find(d => 
      d.slug === 'dlp' || 
      d.name.toLowerCase().includes('disneyland paris') ||
      d.name.toLowerCase().includes('disney paris')
    );
    
    if (!dlp) {
      console.error('Disneyland Paris not found in destinations');
      throw new Error('Disneyland Paris destination not found');
    }
    
    console.log('Found DLP:', dlp);
    return dlp;
  }

  async getAllDisneylandParisLiveData() {
    try {
      // Get DLP destination info
      const dlp = await this.getDisneylandParisData();
      
      // Get live data for the entire destination (includes all parks)
      const liveDataResponse = await this.getEntityLiveData(dlp.id);
      
      console.log(`Fetched ${liveDataResponse.liveData.length} entities`);
      
      // Find the two parks
      const disneylandPark = dlp.parks.find(p => 
        p.name.includes('Disneyland Park') || 
        p.name === 'Parc Disneyland'
      );
      const studiosPark = dlp.parks.find(p => 
        p.name.includes('Studios') || 
        p.name.includes('Studio')
      );
      
      // Filter attractions by park
      const disneylandAttractions: EntityLiveData[] = [];
      const studiosAttractions: EntityLiveData[] = [];
      
      // If we have park IDs, we can get more specific data
      if (disneylandPark && studiosPark) {
        // Try to get park-specific data
        const [dlpParkData, studiosParkData] = await Promise.allSettled([
          this.getEntityLiveData(disneylandPark.id),
          this.getEntityLiveData(studiosPark.id)
        ]);
        
        if (dlpParkData.status === 'fulfilled') {
          disneylandAttractions.push(...dlpParkData.value.liveData.filter(e => e.entityType === 'ATTRACTION'));
        }
        if (studiosParkData.status === 'fulfilled') {
          studiosAttractions.push(...studiosParkData.value.liveData.filter(e => e.entityType === 'ATTRACTION'));
        }
      }
      
      // If park-specific fetch failed or no data, use destination data
      if (disneylandAttractions.length === 0 && studiosAttractions.length === 0) {
        // Try to split by name patterns (fallback)
        liveDataResponse.liveData.forEach(entity => {
          if (entity.entityType === 'ATTRACTION') {
            // This is a rough split - ideally we'd have parent IDs
            if (entity.name.includes('Marvel') || entity.name.includes('Toy Story') || 
                entity.name.includes('Ratatouille') || entity.name.includes('Studio')) {
              studiosAttractions.push(entity);
            } else {
              disneylandAttractions.push(entity);
            }
          }
        });
      }
      
      // Transform to our format
      const transformAttraction = (entity: EntityLiveData) => ({
        id: entity.id,
        name: entity.name,
        waitTime: entity.queue?.STANDBY?.waitTime ?? null,
        status: entity.status || 'CLOSED',
        lastUpdated: entity.lastUpdated
      });
      
      return {
        disneyland: disneylandAttractions.map(transformAttraction),
        studios: studiosAttractions.map(transformAttraction),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to fetch live data:', error);
      // Return mock data as fallback
      const { mockLiveData } = await import('./mockData');
      return mockLiveData;
    }
  }
}

export const themeparksAPI = new ThemeParksAPI();