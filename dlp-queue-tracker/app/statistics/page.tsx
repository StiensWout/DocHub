'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfDay, endOfDay } from 'date-fns';
import { TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react';

interface StatsData {
  hourlyAverage: any[];
  topAttractions: any[];
  dailyTrends: any[];
  currentStats: {
    avgWaitTime: number;
    maxWaitTime: number;
    totalAttractions: number;
    operatingAttractions: number;
  };
}

export default function StatisticsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPark, setSelectedPark] = useState<'all' | 'disneyland' | 'studios'>('all');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchStatistics();
  }, [selectedPark, selectedDate]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/statistics?park=${selectedPark}&date=${selectedDate}`);
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading statistics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Queue Statistics</h1>
        <div className="flex gap-4">
          <select
            value={selectedPark}
            onChange={(e) => setSelectedPark(e.target.value as any)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Parks</option>
            <option value="disneyland">Disneyland Park</option>
            <option value="studios">Walt Disney Studios</option>
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Wait</p>
                <p className="text-2xl font-bold">{data?.currentStats.avgWaitTime || 0} min</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Max Wait</p>
                <p className="text-2xl font-bold">{data?.currentStats.maxWaitTime || 0} min</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Operating</p>
                <p className="text-2xl font-bold">{data?.currentStats.operatingAttractions || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Rides</p>
                <p className="text-2xl font-bold">{data?.currentStats.totalAttractions || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Average Wait Times by Hour</CardTitle>
            <CardDescription>Today's hourly breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data?.hourlyAverage || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="avgWait" stroke="#3b82f6" fill="#93c5fd" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Attractions by Wait Time</CardTitle>
            <CardDescription>Current longest waits</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.topAttractions || []} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="waitTime" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trends */}
      <Card>
        <CardHeader>
          <CardTitle>7-Day Wait Time Trends</CardTitle>
          <CardDescription>Average wait times over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data?.dailyTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgWait" stroke="#3b82f6" name="Average Wait" />
              <Line type="monotone" dataKey="maxWait" stroke="#ef4444" name="Max Wait" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}