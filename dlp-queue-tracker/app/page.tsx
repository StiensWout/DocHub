'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface QueueItem {
  id: string;
  name: string;
  waitTime: number | null;
  status: string;
  lastUpdated: string;
}

interface ParkData {
  disneyland: QueueItem[];
  studios: QueueItem[];
  timestamp: string;
}

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<ParkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/queue-times');
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set initial timestamp on client side only
    setLastRefresh(new Date());
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPERATING':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'DOWN':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'CLOSED':
      case 'REFURBISHMENT':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getWaitTimeColor = (waitTime: number | null) => {
    if (waitTime === null) return 'text-gray-500';
    if (waitTime <= 15) return 'text-green-600';
    if (waitTime <= 30) return 'text-yellow-600';
    if (waitTime <= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const filterOperatingAttractions = (attractions: QueueItem[]) => {
    return attractions
      .filter(a => a.status === 'OPERATING')
      .sort((a, b) => (b.waitTime || 0) - (a.waitTime || 0));
  };

  const filterDownAttractions = (attractions: QueueItem[]) => {
    return attractions.filter(a => a.status === 'DOWN');
  };

  const filterClosedAttractions = (attractions: QueueItem[]) => {
    return attractions.filter(a => a.status === 'CLOSED' || a.status === 'REFURBISHMENT');
  };

  const AttractionList = ({ attractions, showClosed = false }: { attractions: QueueItem[], showClosed?: boolean }) => {
    const filtered = showClosed ? filterClosedAttractions(attractions) : filterOperatingAttractions(attractions);
    
    return (
      <div className="space-y-2">
        {filtered.map((attraction) => (
          <div 
            key={attraction.id} 
            onClick={() => router.push(`/attractions?id=${attraction.id}`)}
            className="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] hover:border-primary/50 dark:hover:bg-accent/10 hover:bg-accent/5"
          >
            <div className="flex items-center gap-2">
              {getStatusIcon(attraction.status)}
              <span className={attraction.status !== 'OPERATING' ? 'text-muted-foreground' : ''}>
                {attraction.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {attraction.status === 'OPERATING' && attraction.waitTime !== null ? (
                <>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className={`font-bold ${getWaitTimeColor(attraction.waitTime)}`}>
                    {attraction.waitTime} min
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">{attraction.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Error: {error}</p>
              <Button onClick={fetchData} className="mt-4">Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Live Queue Times</h1>
          {lastRefresh && (
            <p className="text-gray-600">
              Last updated: {format(lastRefresh, 'HH:mm:ss')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Currently Down Attractions */}
      {data && (filterDownAttractions(data.disneyland).length > 0 || filterDownAttractions(data.studios).length > 0) && (
        <Card className="mb-6 border-yellow-500/50 bg-yellow-50/10 dark:bg-yellow-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Currently Down Attractions
            </CardTitle>
            <CardDescription>
              These attractions are temporarily unavailable
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {filterDownAttractions(data.disneyland).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Disneyland Park</h3>
                  <div className="space-y-2">
                    {filterDownAttractions(data.disneyland).map((attraction) => (
                      <div
                        key={attraction.id}
                        onClick={() => router.push(`/attractions?id=${attraction.id}`)}
                        className="flex items-center justify-between p-2 border border-yellow-500/30 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] bg-yellow-50/20 dark:bg-yellow-900/20"
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <span>{attraction.name}</span>
                        </div>
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">DOWN</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {filterDownAttractions(data.studios).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Walt Disney Studios Park</h3>
                  <div className="space-y-2">
                    {filterDownAttractions(data.studios).map((attraction) => (
                      <div
                        key={attraction.id}
                        onClick={() => router.push(`/attractions?id=${attraction.id}`)}
                        className="flex items-center justify-between p-2 border border-yellow-500/30 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] bg-yellow-50/20 dark:bg-yellow-900/20"
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <span>{attraction.name}</span>
                        </div>
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">DOWN</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Disneyland Park</CardTitle>
            <CardDescription>
              {data?.disneyland.filter(a => a.status === 'OPERATING').length || 0} attractions operating
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <AttractionList attractions={data?.disneyland || []} />
                {data && (
                  <>
                    {filterDownAttractions(data.disneyland).length > 0 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-yellow-600 hover:text-yellow-700 dark:text-yellow-400">
                          Show temporarily down attractions ({filterDownAttractions(data.disneyland).length})
                        </summary>
                        <div className="mt-2">
                          <div className="space-y-2">
                            {filterDownAttractions(data.disneyland).map((attraction) => (
                              <div
                                key={attraction.id}
                                onClick={() => router.push(`/attractions?id=${attraction.id}`)}
                                className="flex items-center justify-between p-3 border border-yellow-500/30 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] bg-yellow-50/10 dark:bg-yellow-900/10"
                              >
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  <span>{attraction.name}</span>
                                </div>
                                <span className="text-sm text-yellow-600">DOWN</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </details>
                    )}
                    {filterClosedAttractions(data.disneyland).length > 0 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400">
                          Show closed/refurbishment attractions ({filterClosedAttractions(data.disneyland).length})
                        </summary>
                        <div className="mt-2">
                          <div className="space-y-2">
                            {filterClosedAttractions(data.disneyland).map((attraction) => (
                              <div
                                key={attraction.id}
                                onClick={() => router.push(`/attractions?id=${attraction.id}`)}
                                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] hover:border-primary/50 dark:hover:bg-accent/10 hover:bg-accent/5"
                              >
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span className="text-muted-foreground">{attraction.name}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">{attraction.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </details>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Walt Disney Studios Park</CardTitle>
            <CardDescription>
              {data?.studios.filter(a => a.status === 'OPERATING').length || 0} attractions operating
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <AttractionList attractions={data?.studios || []} />
                {data && (
                  <>
                    {filterDownAttractions(data.studios).length > 0 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-yellow-600 hover:text-yellow-700 dark:text-yellow-400">
                          Show temporarily down attractions ({filterDownAttractions(data.studios).length})
                        </summary>
                        <div className="mt-2">
                          <div className="space-y-2">
                            {filterDownAttractions(data.studios).map((attraction) => (
                              <div
                                key={attraction.id}
                                onClick={() => router.push(`/attractions?id=${attraction.id}`)}
                                className="flex items-center justify-between p-3 border border-yellow-500/30 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] bg-yellow-50/10 dark:bg-yellow-900/10"
                              >
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  <span>{attraction.name}</span>
                                </div>
                                <span className="text-sm text-yellow-600">DOWN</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </details>
                    )}
                    {filterClosedAttractions(data.studios).length > 0 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400">
                          Show closed/refurbishment attractions ({filterClosedAttractions(data.studios).length})
                        </summary>
                        <div className="mt-2">
                          <div className="space-y-2">
                            {filterClosedAttractions(data.studios).map((attraction) => (
                              <div
                                key={attraction.id}
                                onClick={() => router.push(`/attractions?id=${attraction.id}`)}
                                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] hover:border-primary/50 dark:hover:bg-accent/10 hover:bg-accent/5"
                              >
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span className="text-muted-foreground">{attraction.name}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">{attraction.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </details>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {data && (
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-default">
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {data.disneyland.concat(data.studios).filter(a => a.status === 'OPERATING' && a.waitTime && a.waitTime <= 15).length}
                </p>
                <p className="text-sm text-muted-foreground">Short Wait (≤15 min)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-default">
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {Math.max(...data.disneyland.concat(data.studios).map(a => a.waitTime || 0))}
                </p>
                <p className="text-sm text-muted-foreground">Longest Wait (min)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-default">
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(
                    data.disneyland.concat(data.studios)
                      .filter(a => a.status === 'OPERATING' && a.waitTime)
                      .reduce((sum, a) => sum + (a.waitTime || 0), 0) /
                    data.disneyland.concat(data.studios)
                      .filter(a => a.status === 'OPERATING' && a.waitTime).length || 0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Average Wait (min)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}