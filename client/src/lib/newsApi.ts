// News API integration for Northeast India safety updates
export interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: 'safety' | 'alert' | 'info' | 'emergency';
  state?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  sourceUrl?: string;
  publishedAt: string;
  isActive: boolean;
}

// Northeast India states for filtering news
const NORTHEAST_STATES = [
  'Assam', 'Meghalaya', 'Arunachal Pradesh', 'Nagaland', 
  'Manipur', 'Mizoram', 'Tripura', 'Sikkim'
];

// Keywords for filtering relevant safety news
const SAFETY_KEYWORDS = [
  'accident', 'road closure', 'landslide', 'flood', 'earthquake',
  'protest', 'bandh', 'curfew', 'violence', 'terrorist', 'militant',
  'border', 'security', 'army', 'police', 'emergency', 'rescue',
  'tourist', 'travel', 'safety', 'warning', 'advisory', 'alert',
  'weather', 'cyclone', 'storm', 'heavy rain', 'monsoon',
  'festival', 'celebration', 'procession', 'gathering', 'rally'
];

// Function to fetch news from NewsAPI
export async function fetchNewsFromAPI(): Promise<NewsItem[]> {
  try {
    const apiKey = process.env.VITE_NEWS_API_KEY || process.env.NEWS_API_KEY || 'your_api_key_here';
    
    // Create search query for Northeast India
    const stateQuery = NORTHEAST_STATES.join(' OR ');
    const keywordQuery = SAFETY_KEYWORDS.map(keyword => `"${keyword}"`).join(' OR ');
    const query = `(${stateQuery}) AND (${keywordQuery})`;
    
    const url = `https://newsapi.org/v2/everything?` +
      `q=${encodeURIComponent(query)}&` +
      `language=en&` +
      `sortBy=publishedAt&` +
      `pageSize=50&` +
      `from=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&` +
      `apiKey=${apiKey}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'ok') {
      throw new Error(`NewsAPI error: ${data.message}`);
    }
    
    // Process and filter articles
    const processedNews: NewsItem[] = data.articles
      .filter((article: any) => article.title && article.description)
      .map((article: any) => ({
        id: generateId(article.url || article.title),
        title: article.title,
        content: article.description,
        category: categorizeNews(article.title + ' ' + article.description),
        state: extractState(article.title + ' ' + article.description),
        priority: determinePriority(article.title + ' ' + article.description),
        sourceUrl: article.url,
        publishedAt: article.publishedAt,
        isActive: true
      }))
      .slice(0, 20); // Limit to 20 most recent articles
    
    return processedNews;
  } catch (error) {
    console.error('Error fetching news from API:', error);
    return [];
  }
}

// Function to categorize news based on content
function categorizeNews(content: string): 'safety' | 'alert' | 'info' | 'emergency' {
  const text = content.toLowerCase();
  
  const emergencyKeywords = ['emergency', 'urgent', 'critical', 'disaster', 'terrorist', 'militant', 'attack'];
  const alertKeywords = ['alert', 'warning', 'closure', 'protest', 'bandh', 'curfew', 'landslide', 'flood'];
  const safetyKeywords = ['safety', 'security', 'police', 'army', 'patrol', 'rescue', 'festival security'];
  
  if (emergencyKeywords.some(keyword => text.includes(keyword))) {
    return 'emergency';
  }
  
  if (alertKeywords.some(keyword => text.includes(keyword))) {
    return 'alert';
  }
  
  if (safetyKeywords.some(keyword => text.includes(keyword))) {
    return 'safety';
  }
  
  return 'info';
}

// Function to extract state from news content
function extractState(content: string): string | undefined {
  const text = content.toLowerCase();
  
  for (const state of NORTHEAST_STATES) {
    if (text.includes(state.toLowerCase())) {
      return state;
    }
  }
  
  // Check for major cities to infer state
  const cityStateMap: { [key: string]: string } = {
    'guwahati': 'Assam',
    'dispur': 'Assam',
    'jorhat': 'Assam',
    'dibrugarh': 'Assam',
    'tezpur': 'Assam',
    'silchar': 'Assam',
    'shillong': 'Meghalaya',
    'tura': 'Meghalaya',
    'cherrapunji': 'Meghalaya',
    'dawki': 'Meghalaya',
    'itanagar': 'Arunachal Pradesh',
    'tawang': 'Arunachal Pradesh',
    'pasighat': 'Arunachal Pradesh',
    'kohima': 'Nagaland',
    'dimapur': 'Nagaland',
    'mokokchung': 'Nagaland',
    'imphal': 'Manipur',
    'churachandpur': 'Manipur',
    'thoubal': 'Manipur',
    'aizawl': 'Mizoram',
    'lunglei': 'Mizoram',
    'champhai': 'Mizoram',
    'agartala': 'Tripura',
    'udaipur': 'Tripura',
    'kailashahar': 'Tripura',
    'gangtok': 'Sikkim',
    'namchi': 'Sikkim',
    'pelling': 'Sikkim',
    'yuksom': 'Sikkim'
  };
  
  for (const [city, state] of Object.entries(cityStateMap)) {
    if (text.includes(city)) {
      return state;
    }
  }
  
  return undefined;
}

// Function to determine priority based on content
function determinePriority(content: string): 'low' | 'medium' | 'high' | 'critical' {
  const text = content.toLowerCase();
  
  const criticalKeywords = ['terrorist', 'militant', 'attack', 'bomb', 'explosion', 'kidnapping', 'hostage'];
  const highKeywords = ['emergency', 'disaster', 'major accident', 'landslide', 'flood', 'earthquake'];
  const mediumKeywords = ['protest', 'bandh', 'closure', 'curfew', 'warning', 'alert'];
  
  if (criticalKeywords.some(keyword => text.includes(keyword))) {
    return 'critical';
  }
  
  if (highKeywords.some(keyword => text.includes(keyword))) {
    return 'high';
  }
  
  if (mediumKeywords.some(keyword => text.includes(keyword))) {
    return 'medium';
  }
  
  return 'low';
}

// Function to generate consistent ID from URL or title
function generateId(input: string): string {
  return btoa(input).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
}

// Function to fetch local news from backend
export async function fetchLocalNews(state?: string, limit?: number): Promise<NewsItem[]> {
  try {
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    if (limit) params.append('limit', limit.toString());
    
    const response = await fetch(`/api/getNewsUpdates?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const news = await response.json();
    return news;
  } catch (error) {
    console.error('Error fetching local news:', error);
    return [];
  }
}

// Function to combine API news with local news
export async function fetchAllNews(state?: string, limit: number = 20): Promise<NewsItem[]> {
  try {
    const [apiNews, localNews] = await Promise.all([
      fetchNewsFromAPI(),
      fetchLocalNews(state, limit)
    ]);
    
    // Combine and sort by publication date
    const allNews = [...apiNews, ...localNews];
    allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    
    // Remove duplicates based on title similarity
    const uniqueNews = removeDuplicates(allNews);
    
    return uniqueNews.slice(0, limit);
  } catch (error) {
    console.error('Error fetching all news:', error);
    return [];
  }
}

// Function to remove duplicate news articles
function removeDuplicates(news: NewsItem[]): NewsItem[] {
  const seen = new Set();
  return news.filter(item => {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Function to filter news by category
export function filterNewsByCategory(news: NewsItem[], category: string): NewsItem[] {
  return news.filter(item => item.category === category);
}

// Function to filter news by priority
export function filterNewsByPriority(news: NewsItem[], minPriority: 'low' | 'medium' | 'high' | 'critical'): NewsItem[] {
  const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
  const threshold = priorityOrder[minPriority];
  
  return news.filter(item => priorityOrder[item.priority] >= threshold);
}

// Function to get emergency alerts specifically
export async function getEmergencyAlerts(): Promise<NewsItem[]> {
  const allNews = await fetchAllNews();
  return filterNewsByCategory(allNews, 'emergency')
    .concat(filterNewsByPriority(allNews, 'critical'))
    .slice(0, 5);
}

export default {
  fetchNewsFromAPI,
  fetchLocalNews,
  fetchAllNews,
  filterNewsByCategory,
  filterNewsByPriority,
  getEmergencyAlerts
};
