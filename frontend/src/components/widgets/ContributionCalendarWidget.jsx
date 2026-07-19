import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { Activity } from 'lucide-react';

export const ContributionCalendarWidget = ({ initialData }) => {
  const [data, setData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
    } else if (!data) {
      fetchContributions();
    }
  }, [initialData]);

  const fetchContributions = async () => {
    try {
      const token = localStorage.getItem('gitmentor_token');
      const res = await fetch('http://localhost:5000/api/analytics/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.contributions);
      }
    } catch (error) {
      console.error('Error fetching contributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = (count) => {
    if (count === 0) return 'bg-[#1a1a1e]';
    if (count <= 2) return 'bg-muted-cyan/30';
    if (count <= 5) return 'bg-muted-cyan/60';
    if (count <= 8) return 'bg-muted-cyan/80';
    return 'bg-muted-cyan';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-muted-cyan" />
          <h2 className="text-lg font-medium text-canvas-white tracking-tight">Contribution Consistency</h2>
        </div>
        {!loading && data && (
          <div className="text-sm font-mono">
            <span className="text-muted-steel">Total Last Year: </span>
            <span className="text-canvas-white font-semibold">{data.totalContributions}</span>
          </div>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-28 w-full" />
      ) : data && data.weeks ? (
        <div className="flex overflow-hidden pb-4 pt-2 w-full justify-end">
          <div className="flex gap-1 justify-end">
            {data.weeks.map((week, wIndex) => (
              <div key={wIndex} className="flex flex-col gap-1">
                {week.contributionDays.map((day, dIndex) => (
                  <div
                    key={day.date}
                    title={`${day.contributionCount} contributions on ${day.date}`}
                    className={`w-[11px] h-[11px] rounded-[2px] transition-all cursor-pointer hover:ring-1 hover:ring-canvas-white hover:ring-offset-1 hover:ring-offset-charcoal-base ${getColorClass(day.contributionCount)}`}
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-steel">Unable to load contribution data. Ensure your GitHub account is fully linked.</div>
      )}
    </Card>
  );
};
