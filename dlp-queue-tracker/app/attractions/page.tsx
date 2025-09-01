'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Clock, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface Attraction {
  id: string;
  name: string;
  parkName: string;
  currentWaitTime: number | null;
  status: string;
  avgWaitTime: number;
  trend: 'up' | 'down' | 'stable';
  todayData: { time: string; waitTime: number }[];
}

interface DowntimeData {
  currentDowntime: any;
  recentDowntimes: any[];
  stats: {
    totalDowntimeMinutes: number;
    totalDowntimeCount: number;
    avgDowntimePerIncident: number;
    reliabilityPercentage: number;
    dailyStats: any[];
  };
}

export default function AttractionsPage() {
  const searchParams = useSearchParams();
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [downtimeData, setDowntimeData] = useState<DowntimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPark, setFilterPark] = useState<'all' | 'disneyland' | 'studios'>('all');

  useEffect(() => {
    fetchAttractions();
  }, []);

  // Handle URL parameter for specific attraction
  useEffect(() => {
    const attractionId = searchParams.get('id');
    if (attractionId && attractions.length > 0) {
      const attraction = attractions.find(a => a.id === attractionId);
      if (attraction) {
        setSelectedAttraction(attraction);
        fetchAttractionDetails(attractionId);
        // Scroll to the attraction in the list
        setTimeout(() => {
          const element = document.getElementById(`attraction-${attractionId}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [searchParams, attractions]);

  const fetchAttractions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attractions');
      if (!response.ok) throw new Error('Failed to fetch attractions');
      const data = await response.json();
      setAttractions(data);
      if (data.length > 0 && !selectedAttraction) {
        setSelectedAttraction(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch attractions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttractionDetails = async (attractionId: string) => {
    try {
      const [detailsResponse, downtimeResponse] = await Promise.all([
        fetch(`/api/attractions/${attractionId}`),
        fetch(`/api/attractions/${attractionId}/downtime`)
      ]);
      
      if (!detailsResponse.ok) throw new Error('Failed to fetch attraction details');
      const detailsData = await detailsResponse.json();
      setSelectedAttraction(detailsData);
      
      if (downtimeResponse.ok) {
        const downtimeData = await downtimeResponse.json();
        setDowntimeData(downtimeData);
      }
    } catch (error) {
      console.error('Failed to fetch attraction details:', error);
    }
  };

  const filteredAttractions = attractions.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPark = filterPark === 'all' || 
      (filterPark === 'disneyland' && a.parkName === 'Disneyland Park') ||
      (filterPark === 'studios' && a.parkName === 'Walt Disney Studios Park');
    return matchesSearch && matchesPark;
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPERATING':
        return 'text-green-600';
      case 'DOWN':
        return 'text-yellow-600';
      case 'CLOSED':
      case 'REFURBISHMENT':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading attractions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Attractions</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Attractions List */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>All Attractions</CardTitle>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search attractions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <select
                  value={filterPark}
                  onChange={(e) => setFilterPark(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="all">All Parks</option>
                  <option value="disneyland">Disneyland Park</option>
                  <option value="studios">Walt Disney Studios</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredAttractions.map((attraction) => (
                  <div
                    id={`attraction-${attraction.id}`}
                    key={attraction.id}
                    onClick={() => {
                      setSelectedAttraction(attraction);
                      fetchAttractionDetails(attraction.id);
                    }}
                    className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] hover:border-primary/50 dark:hover:bg-accent/10 hover:bg-accent/5 ${
                      selectedAttraction?.id === attraction.id ? 'border-primary bg-primary/10 dark:bg-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{attraction.name}</p>
                        <p className="text-xs text-muted-foreground">{attraction.parkName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(attraction.trend)}
                        {attraction.status === 'OPERATING' && attraction.currentWaitTime !== null ? (
                          <span className="font-bold text-sm">{attraction.currentWaitTime} min</span>
                        ) : (
                          <span className={`text-xs ${getStatusColor(attraction.status)}`}>
                            {attraction.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attraction Details */}
        <div className="md:col-span-2">
          {selectedAttraction && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{selectedAttraction.name}</CardTitle>
                  <CardDescription>{selectedAttraction.parkName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Current Wait</p>
                      <p className="text-2xl font-bold">
                        {selectedAttraction.currentWaitTime !== null
                          ? `${selectedAttraction.currentWaitTime} min`
                          : selectedAttraction.status}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Average Today</p>
                      <p className="text-2xl font-bold">{selectedAttraction.avgWaitTime} min</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Trend</p>
                      <div className="flex items-center justify-center mt-2">
                        {getTrendIcon(selectedAttraction.trend)}
                        <span className="ml-1 capitalize">{selectedAttraction.trend}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Today's Wait Times</CardTitle>
                  <CardDescription>Wait time throughout the day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={selectedAttraction.todayData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="waitTime" 
                        stroke="#3b82f6" 
                        name="Wait Time (min)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Downtime Statistics */}
              {downtimeData && (
                <>
                  {downtimeData.currentDowntime && (
                    <Card className="mt-6 border-yellow-500/50 bg-yellow-50/10 dark:bg-yellow-900/10">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                          Currently Down
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm">Down since: {format(new Date(downtimeData.currentDowntime.down_start), 'MMM dd, HH:mm')}</p>
                          <p className="text-sm">Duration: {Math.round((Date.now() - new Date(downtimeData.currentDowntime.down_start).getTime()) / 60000)} minutes</p>
                          <p className="text-sm">Reason: {downtimeData.currentDowntime.reason}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Reliability Statistics</CardTitle>
                      <CardDescription>Last 30 days performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Reliability</p>
                          <p className="text-2xl font-bold">
                            <span className={downtimeData.stats.reliabilityPercentage >= 95 ? 'text-green-600' : downtimeData.stats.reliabilityPercentage >= 90 ? 'text-yellow-600' : 'text-red-600'}>
                              {downtimeData.stats.reliabilityPercentage}%
                            </span>
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Downtime</p>
                          <p className="text-2xl font-bold">
                            {Math.round(downtimeData.stats.totalDowntimeMinutes / 60)}h
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Incidents</p>
                          <p className="text-2xl font-bold">
                            {downtimeData.stats.totalDowntimeCount}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Avg Duration</p>
                          <p className="text-2xl font-bold">
                            {downtimeData.stats.avgDowntimePerIncident} min
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {downtimeData.recentDowntimes.length > 0 && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Recent Downtime Periods</CardTitle>
                        <CardDescription>Last 7 days</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {downtimeData.recentDowntimes.map((downtime: any) => (
                            <div key={downtime.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium text-sm">
                                  {format(new Date(downtime.down_start), 'MMM dd, HH:mm')}
                                  {downtime.down_end && ` - ${format(new Date(downtime.down_end), 'HH:mm')}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {downtime.reason} • {downtime.duration_minutes ? `${downtime.duration_minutes} minutes` : 'Ongoing'}
                                </p>
                              </div>
                              <div>
                                {downtime.down_end ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}