import { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { Activity } from 'lucide-react';
import { API_URL } from '../../services/apiClient';

export const ContributionCalendarWidget = ({ initialData, className }) => {
  const [data, setData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);

  const fetchContributions = async () => {
    try {
      const token = localStorage.getItem('gitmentor_token');
      const res = await fetch(`${API_URL}/analytics/profile`, {
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (initialData) {
        setData(initialData);
        setLoading(false);
      } else {
        fetchContributions();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [initialData]);

  const processedWeeks = useMemo(() => {
    if (!data || !data.weeks) return [];
    let currentMonth = -1;
    return data.weeks.map((week) => {
      let monthLabel = null;
      const firstDay = week.contributionDays[0];
      if (firstDay) {
        const date = new Date(firstDay.date);
        const month = date.getMonth();
        if (month !== currentMonth) {
          monthLabel = date.toLocaleString('default', { month: 'short' });
          currentMonth = month;
        }
      }
      return { ...week, monthLabel };
    });
  }, [data]);

  const getColorClass = (count) => {
    if (count === 0) return 'bg-white/[0.03] border-white/[0.04]'; 
    if (count <= 2) return 'bg-[#003847] border-[#003847]/50 shadow-[inset_0_0_4px_rgba(88,166,255,0.1)]';
    if (count <= 5) return 'bg-[#005a73] border-[#005a73]/50 shadow-[inset_0_0_4px_rgba(88,166,255,0.15)]';
    if (count <= 8) return 'bg-[#007b9e] border-[#007b9e]/50 shadow-[inset_0_0_6px_rgba(88,166,255,0.2)]';
    return 'bg-[#009bc8] border-[#009bc8]/50 shadow-[inset_0_0_8px_rgba(88,166,255,0.25)]';
  };

  const calculateTotal = () => {
    if (!data || !data.weeks) return 0;
    return data.weeks.reduce((acc, week) => {
      return acc + week.contributionDays.reduce((dAcc, day) => dAcc + (Number(day.contributionCount) || 0), 0);
    }, 0);
  };

  return (
    <Card className={`h-full flex flex-col ${className || 'p-6'}`}>
      <div className="flex items-center justify-between mb-6 shrink-0">
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
        <div className="w-full pb-2">
          {/* Matrix Container */}
          <div className="grid w-full gap-x-[3px] sm:gap-x-1 gap-y-[3px] sm:gap-y-1" style={{ gridTemplateColumns: `30px repeat(${processedWeeks.length}, minmax(0, 1fr))` }}>
            
            {/* Row 0: Month Labels */}
            <div className="col-start-1 h-[20px]"></div>
            {processedWeeks.map((week, i) => (
              <div key={`month-${i}`} className="relative flex items-end pb-1 h-[20px]">
                {week.monthLabel && (
                  <span className="absolute left-0 bottom-1 text-[10px] sm:text-[12px] text-muted-steel font-medium whitespace-nowrap z-0">
                    {week.monthLabel}
                  </span>
                )}
              </div>
            ))}

            {/* Rows 1-7: Days */}
            {Array.from({ length: 7 }).map((_, dIndex) => [
              <div key={`day-label-${dIndex}`} className="flex items-center justify-start">
                 <span className={`text-[9px] sm:text-[11px] text-muted-steel leading-none ${dIndex % 2 === 0 ? 'opacity-0' : ''}`}>
                   {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dIndex]}
                 </span>
              </div>,
              
              ...processedWeeks.map((week, wIndex) => {
                const day = week.contributionDays.find(d => new Date(d.date).getDay() === dIndex);
                if (day) {
                  return (
                    <div
                      key={`dot-${wIndex}-${dIndex}`}
                      title={`${day.contributionCount} contributions on ${day.date}`}
                      className={`w-full aspect-square rounded-[2px] sm:rounded-[3px] transition-all duration-200 cursor-pointer border ${getColorClass(day.contributionCount)} hover:ring-1 hover:ring-muted-cyan hover:ring-offset-1 hover:ring-offset-bg-deep hover:scale-150 hover:shadow-[0_0_8px_rgba(88,166,255,0.3)] z-10 relative`}
                    ></div>
                  );
                } else {
                  return <div key={`empty-${wIndex}-${dIndex}`} className="w-full aspect-square"></div>;
                }
              })
            ])}
          </div>

          {/* Footer Legend */}
          <div className="flex justify-end items-center mt-5 font-sans w-full pr-1">
             <div className="flex items-center gap-1.5 text-[11px] sm:text-[13px] text-muted-steel">
               <span className="mr-2">Less</span>
               <div className="w-[12px] h-[12px] sm:w-[15px] sm:h-[15px] rounded-[3px] sm:rounded-[4px] border bg-white/[0.03] border-white/[0.04]"></div>
               <div className="w-[12px] h-[12px] sm:w-[15px] sm:h-[15px] rounded-[3px] sm:rounded-[4px] border border-[#003847]/50 bg-[#003847]"></div>
               <div className="w-[12px] h-[12px] sm:w-[15px] sm:h-[15px] rounded-[3px] sm:rounded-[4px] border border-[#005a73]/50 bg-[#005a73]"></div>
               <div className="w-[12px] h-[12px] sm:w-[15px] sm:h-[15px] rounded-[3px] sm:rounded-[4px] border border-[#007b9e]/50 bg-[#007b9e]"></div>
               <div className="w-[12px] h-[12px] sm:w-[15px] sm:h-[15px] rounded-[3px] sm:rounded-[4px] border border-[#009bc8]/50 bg-[#009bc8]"></div>
               <span className="ml-2">More</span>
             </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-steel">Unable to load contribution data. Ensure your GitHub account is fully linked.</div>
      )}
    </Card>
  );
};
