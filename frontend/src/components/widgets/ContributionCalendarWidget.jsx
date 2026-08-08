import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { Activity } from 'lucide-react';

export const ContributionCalendarWidget = ({ initialData, className }) => {
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
    if (count === 0) return 'bg-white/[0.03] border-white/[0.04]'; 
    if (count <= 2) return 'bg-[#003847] border-[#003847]/50 shadow-[inset_0_0_4px_rgba(88,166,255,0.1)]';
    if (count <= 5) return 'bg-[#005a73] border-[#005a73]/50 shadow-[inset_0_0_4px_rgba(88,166,255,0.15)]';
    if (count <= 8) return 'bg-[#007b9e] border-[#007b9e]/50 shadow-[inset_0_0_6px_rgba(88,166,255,0.2)]';
    return 'bg-[#009bc8] border-[#009bc8]/50 shadow-[inset_0_0_8px_rgba(88,166,255,0.25)]';
  };

  const getMonthLabels = () => {
    if (!data || !data.weeks) return [];
    const labels = [];
    let currentMonth = -1;
    data.weeks.forEach((week, i) => {
      const firstDay = week.contributionDays[0];
      if (firstDay) {
        const date = new Date(firstDay.date);
        const month = date.getMonth();
        if (month !== currentMonth) {
          labels.push({ month: date.toLocaleString('default', { month: 'short' }), index: i });
          currentMonth = month;
        }
      }
    });
    return labels;
  };

  const calculateTotal = () => {
    if (!data || !data.weeks) return 0;
    if (data.totalContributions !== undefined) return data.totalContributions;
    return data.weeks.reduce((acc, week) => {
      return acc + week.contributionDays.reduce((dAcc, day) => dAcc + day.contributionCount, 0);
    }, 0);
  };

  return (
    <Card className={`h-full flex flex-col ${className || 'p-6'}`}>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-muted-cyan/10 flex items-center justify-center border border-muted-cyan/20">
            <Activity size={16} className="text-muted-cyan" />
          </div>
          <h2 className="text-lg font-medium text-canvas-white tracking-tight">Contribution Consistency</h2>
        </div>
        {!loading && data && (
          <div className="text-sm font-sans text-muted-steel">
            <span className="text-canvas-white font-semibold">{calculateTotal()}</span> contributions in the last year
          </div>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : data && data.weeks ? (
        <div className="w-full overflow-x-auto hide-scrollbar pb-2">
          <div className="flex flex-col w-max pr-8">
            {/* Month Labels */}
            <div className="flex pl-[30px] mb-1 relative w-full" style={{ height: '16px' }}>
              {getMonthLabels().map((label, i) => (
                <span 
                  key={i} 
                  className="absolute text-[12px] text-muted-steel font-medium font-sans"
                  style={{ left: `calc(30px + ${label.index * 14}px)` }}
                >
                  {label.month}
                </span>
              ))}
            </div>

            <div className="flex">
              {/* Day Labels */}
              <div className="flex flex-col gap-[4px] pr-2 shrink-0 pt-0 w-[30px] items-start text-left">
                <span className="text-[12px] text-muted-steel leading-[10px] h-[10px] block opacity-0 font-sans">Sun</span>
                <span className="text-[12px] text-muted-steel leading-[10px] h-[10px] block font-sans">Mon</span>
                <span className="text-[12px] text-muted-steel leading-[10px] h-[10px] block opacity-0 font-sans">Tue</span>
                <span className="text-[12px] text-muted-steel leading-[10px] h-[10px] block font-sans">Wed</span>
                <span className="text-[12px] text-muted-steel leading-[10px] h-[10px] block opacity-0 font-sans">Thu</span>
                <span className="text-[12px] text-muted-steel leading-[10px] h-[10px] block font-sans">Fri</span>
                <span className="text-[12px] text-muted-steel leading-[10px] h-[10px] block opacity-0 font-sans">Sat</span>
              </div>

              {/* Matrix */}
              <div className="flex gap-[4px]">
                {data.weeks.map((week, wIndex) => (
                  <div key={wIndex} className="flex flex-col gap-[4px]">
                    {Array.from({ length: 7 }).map((_, dIndex) => {
                      const day = week.contributionDays.find(d => new Date(d.date).getDay() === dIndex);
                      if (day) {
                        return (
                          <div
                            key={day.date}
                            title={`${day.contributionCount} contributions on ${day.date}`}
                            className={`w-[10px] h-[10px] rounded-[3px] transition-all duration-200 cursor-pointer border ${getColorClass(day.contributionCount)} hover:ring-1 hover:ring-muted-cyan hover:ring-offset-1 hover:ring-offset-bg-deep hover:scale-150 hover:shadow-[0_0_8px_rgba(88,166,255,0.3)]`}
                          ></div>
                        );
                      } else {
                         return <div key={`empty-${dIndex}`} className="w-[10px] h-[10px]"></div>; 
                      }
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Legend */}
            <div className="flex justify-end items-center mt-3 font-sans w-full pr-1">
               <div className="flex items-center gap-1 text-[12px] text-muted-steel">
                 <span className="mr-1">Less</span>
                 <div className="w-[10px] h-[10px] rounded-[3px] border bg-white/[0.03] border-white/[0.04]"></div>
                 <div className="w-[10px] h-[10px] rounded-[3px] border border-[#003847]/50 bg-[#003847]"></div>
                 <div className="w-[10px] h-[10px] rounded-[3px] border border-[#005a73]/50 bg-[#005a73]"></div>
                 <div className="w-[10px] h-[10px] rounded-[3px] border border-[#007b9e]/50 bg-[#007b9e]"></div>
                 <div className="w-[10px] h-[10px] rounded-[3px] border border-[#009bc8]/50 bg-[#009bc8]"></div>
                 <span className="ml-1">More</span>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-steel">Unable to load contribution data. Ensure your GitHub account is fully linked.</div>
      )}
    </Card>
  );
};
