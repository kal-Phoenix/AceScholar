import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface IosDateTimePickerProps {
  value: string; // YYYY-MM-DDTHH:mm
  onChange: (value: string) => void;
}

// Constant lists defined outside to ensure stable reference and prevent unnecessary effect triggers
const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentYearVal = new Date().getFullYear();
const yearsList = Array.from({ length: 8 }, (_, i) => currentYearVal + i);
const hoursList = Array.from({ length: 12 }, (_, i) => i + 1); // 1 to 12
const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')); // "00" to "59"
const amPmList = ['AM', 'PM'];

// Helper to get number of days in any month of any year
const getDaysInMonth = (monthIdx: number, year: number) => {
  return new Date(year, monthIdx + 1, 0).getDate();
};

export default function IosDateTimePicker({ value, onChange }: IosDateTimePickerProps) {
  // Pure string parser to prevent timezone/Date parsing anomalies!
  const parseIsoString = (val: string) => {
    if (!val) return null;
    const match = val.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!match) return null;
    const [_, yrStr, moStr, dyStr, hhStr, mmStr] = match;
    const yr = parseInt(yrStr, 10);
    const mo = parseInt(moStr, 10) - 1; // 0-11
    const dy = parseInt(dyStr, 10);
    const hr = parseInt(hhStr, 10);
    const min = parseInt(mmStr, 10);
    return { yr, mo, dy, hr, min };
  };

  // Determine initial indices from parsed date
  const getInitialIndices = () => {
    const parsed = parseIsoString(value);
    let yr, moIdx, dy, hr, min;

    if (parsed) {
      yr = parsed.yr;
      moIdx = parsed.mo;
      dy = parsed.dy;
      hr = parsed.hr;
      min = parsed.min;
    } else {
      const now = new Date();
      yr = now.getFullYear();
      moIdx = now.getMonth();
      dy = now.getDate();
      hr = now.getHours();
      min = now.getMinutes();
    }

    const isPm = hr >= 12;
    let hour12 = hr % 12;
    if (hour12 === 0) hour12 = 12;

    const yrIdx = yearsList.indexOf(yr) !== -1 ? yearsList.indexOf(yr) : 0;
    const dyIdx = dy - 1; // 0-indexed
    const hourIdx = hour12 - 1; // 0-11
    const minuteIdx = min;
    const amPmIdx = isPm ? 1 : 0;

    return { yrIdx, moIdx, dyIdx, hourIdx, minuteIdx, amPmIdx };
  };

  const initIndices = getInitialIndices();

  // Indices state
  const [selectedYearIdx, setSelectedYearIdx] = useState(initIndices.yrIdx);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(initIndices.moIdx);
  const [selectedDayIdx, setSelectedDayIdx] = useState(initIndices.dyIdx);
  const [selectedHourIdx, setSelectedHourIdx] = useState(initIndices.hourIdx);
  const [selectedMinuteIdx, setSelectedMinuteIdx] = useState(initIndices.minuteIdx);
  const [selectedAmPmIdx, setSelectedAmPmIdx] = useState(initIndices.amPmIdx);

  // Days list is dynamic based on month and year
  const daysInSelectedMonth = getDaysInMonth(selectedMonthIdx, yearsList[selectedYearIdx] || currentYearVal);
  const daysList = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

  // Scroll references
  const monthScrollRef = useRef<HTMLDivElement>(null);
  const dayScrollRef = useRef<HTMLDivElement>(null);
  const yearScrollRef = useRef<HTMLDivElement>(null);
  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);
  const amPmScrollRef = useRef<HTMLDivElement>(null);

  // Track active user interaction for each wheel to ignore programmatic/layout scrolls
  const userInteractedRef = useRef<Record<string, boolean>>({
    month: false,
    day: false,
    year: false,
    hour: false,
    minute: false,
    ampm: false,
  });

  const wheelTimeoutRef = useRef<Record<string, any>>({});

  const lastEmittedValueRef = useRef<string>('');

  const ITEM_HEIGHT = 40; // Pixel height of each row in the wheels

  // Scroll a ref smoothly or instantly to a specific index
  const scrollToIdx = (
    ref: React.RefObject<HTMLDivElement | null>,
    idx: number
  ) => {
    if (ref.current) {
      const targetScrollTop = idx * ITEM_HEIGHT;
      // If we are already extremely close to target position, do nothing
      if (Math.abs(ref.current.scrollTop - targetScrollTop) < 1.5) {
        return;
      }
      ref.current.scrollTop = targetScrollTop;
    }
  };

  // Sync scroll positions when state index changes
  useEffect(() => {
    scrollToIdx(monthScrollRef, selectedMonthIdx);
  }, [selectedMonthIdx]);

  useEffect(() => {
    scrollToIdx(dayScrollRef, selectedDayIdx);
  }, [selectedDayIdx]);

  useEffect(() => {
    scrollToIdx(yearScrollRef, selectedYearIdx);
  }, [selectedYearIdx]);

  useEffect(() => {
    scrollToIdx(hourScrollRef, selectedHourIdx);
  }, [selectedHourIdx]);

  useEffect(() => {
    scrollToIdx(minuteScrollRef, selectedMinuteIdx);
  }, [selectedMinuteIdx]);

  useEffect(() => {
    scrollToIdx(amPmScrollRef, selectedAmPmIdx);
  }, [selectedAmPmIdx]);

  // Sync state if external prop value changes (using deterministic parsing)
  useEffect(() => {
    // Prevent feedback loops from our own internal updates
    if (value && value === lastEmittedValueRef.current) {
      return;
    }

    const parsed = parseIsoString(value);
    if (!parsed) return;

    const { yr, mo, dy, hr, min } = parsed;

    const yrIdx = yearsList.indexOf(yr);
    const moIdx = mo;
    const dyIdx = dy - 1;
    
    const isPm = hr >= 12;
    let hr12 = hr % 12;
    if (hr12 === 0) hr12 = 12;
    const hrIdx = hr12 - 1;
    const minIdx = min;
    const apIdx = isPm ? 1 : 0;

    if (yrIdx !== -1 && yrIdx !== selectedYearIdx) setSelectedYearIdx(yrIdx);
    if (moIdx !== selectedMonthIdx) setSelectedMonthIdx(moIdx);
    if (dyIdx !== selectedDayIdx) setSelectedDayIdx(dyIdx);
    if (hrIdx !== selectedHourIdx) setSelectedHourIdx(hrIdx);
    if (minIdx !== selectedMinuteIdx) setSelectedMinuteIdx(minIdx);
    if (apIdx !== selectedAmPmIdx) setSelectedAmPmIdx(apIdx);
  }, [value]);

  // Build actual date ISO string and dispatch onChange
  useEffect(() => {
    const yr = yearsList[selectedYearIdx] || currentYearVal;
    const mo = String(selectedMonthIdx + 1).padStart(2, '0');
    
    // Day can be briefly out of bounds during month switching; clamp it safely
    const currentDaysCount = getDaysInMonth(selectedMonthIdx, yr);
    const clampedDay = Math.min(selectedDayIdx + 1, currentDaysCount);
    const dy = String(clampedDay).padStart(2, '0');

    const selectedHour = hoursList[selectedHourIdx];
    const selectedMinute = parseInt(minutesList[selectedMinuteIdx]);
    const amPm = amPmList[selectedAmPmIdx];

    let finalHour = selectedHour;
    if (amPm === 'PM' && selectedHour < 12) {
      finalHour += 12;
    } else if (amPm === 'AM' && selectedHour === 12) {
      finalHour = 0;
    }

    const hh = String(finalHour).padStart(2, '0');
    const mm = String(selectedMinute).padStart(2, '0');

    const formattedValue = `${yr}-${mo}-${dy}T${hh}:${mm}`;
    
    if (formattedValue !== value) {
      lastEmittedValueRef.current = formattedValue;
      onChange(formattedValue);
    }
  }, [selectedYearIdx, selectedMonthIdx, selectedDayIdx, selectedHourIdx, selectedMinuteIdx, selectedAmPmIdx]);

  // Scroll event handlers (detect scrolling and update active item indices)
  const handleScroll = (
    e: React.UIEvent<HTMLDivElement>,
    currentIdx: number,
    setIdx: (idx: number) => void,
    key: 'month' | 'day' | 'year' | 'hour' | 'minute' | 'ampm',
    maxIdx: number
  ) => {
    // Only process scroll events if they were triggered by active user interaction
    if (!userInteractedRef.current[key]) return;

    const scrollTop = e.currentTarget.scrollTop;
    const calculatedIdx = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIdx = Math.max(0, Math.min(calculatedIdx, maxIdx));

    if (clampedIdx !== currentIdx) {
      setIdx(clampedIdx);
    }
  };

  const getInteractionHandlers = (key: 'month' | 'day' | 'year' | 'hour' | 'minute' | 'ampm') => {
    return {
      onPointerDown: () => {
        userInteractedRef.current[key] = true;
      },
      onPointerUp: () => {
        userInteractedRef.current[key] = false;
      },
      onPointerCancel: () => {
        userInteractedRef.current[key] = false;
      },
      onWheel: () => {
        userInteractedRef.current[key] = true;
        if (wheelTimeoutRef.current[key]) {
          clearTimeout(wheelTimeoutRef.current[key]);
        }
        wheelTimeoutRef.current[key] = setTimeout(() => {
          userInteractedRef.current[key] = false;
        }, 200);
      },
    };
  };

  const getFriendlyDisplay = () => {
    const m = monthsList[selectedMonthIdx];
    const d = daysList[Math.min(selectedDayIdx, daysList.length - 1)] || 1;
    const y = yearsList[selectedYearIdx];
    const hr = hoursList[selectedHourIdx];
    const min = minutesList[selectedMinuteIdx];
    const ap = amPmList[selectedAmPmIdx];
    return `${m} ${d}, ${y} at ${hr}:${min} ${ap}`;
  };

  return (
    <div className="w-full bg-[#131d31] p-3 sm:p-5 rounded-2xl border border-slate-800/80 shadow-2xl select-none" id="tactile-date-picker">
      
      {/* Top selection badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3.5 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <div className="bg-amber-500/10 text-amber-500 p-2 rounded-lg">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Deadline</h4>
            <p className="text-[10px] sm:text-[11px] text-slate-400">Scroll the wheels to select deadline.</p>
          </div>
        </div>

        <div className="bg-[#0f1422] border border-amber-500/30 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg text-xs font-extrabold text-amber-400 shadow-lg tracking-wide">
          📅 {getFriendlyDisplay()}
        </div>
      </div>

      {/* Embedded CSS for clean wheel scroll physics */}
      <style>{`
        .wheel-scroll-container::-webkit-scrollbar {
          display: none;
        }
        .wheel-scroll-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Main Wheel Container with iOS Glassmorphism */}
      <div className="relative h-[220px] bg-[#090d16] rounded-xl border border-slate-800/90 flex overflow-hidden shadow-inner">
        
        {/* iOS Central Target Lens Highlight Bar */}
        <div className="absolute left-0 right-0 top-[90px] h-[40px] border-y border-amber-500/25 bg-amber-500/5 pointer-events-none z-10 flex justify-between px-2">
          <div className="w-1 h-full bg-amber-500/10"></div>
          <div className="w-1 h-full bg-amber-500/10"></div>
        </div>

        {/* 3D Cylindrical Shader Gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-[65px] bg-gradient-to-b from-[#090d16] via-[#090d16]/90 to-transparent pointer-events-none z-10"></div>
        <div className="absolute inset-x-0 bottom-0 h-[65px] bg-gradient-to-t from-[#090d16] via-[#090d16]/90 to-transparent pointer-events-none z-10"></div>

        {/* 1. MONTH WHEEL */}
        <div className="flex-1 min-w-[42px] sm:min-w-[50px] relative border-r border-slate-900/60 flex flex-col items-center">
          <div className="absolute top-2.5 text-[8px] sm:text-[9px] font-extrabold text-slate-500 uppercase tracking-widest z-20 pointer-events-none">Month</div>
          <div 
            ref={monthScrollRef}
            onScroll={(e) => handleScroll(e, selectedMonthIdx, setSelectedMonthIdx, 'month', monthsList.length - 1)}
            {...getInteractionHandlers('month')}
            className="wheel-scroll-container w-full h-full overflow-y-scroll snap-y snap-mandatory py-[90px]"
          >
            {monthsList.map((m, idx) => (
              <div 
                key={idx}
                onClick={() => setSelectedMonthIdx(idx)}
                className={`h-[40px] flex items-center justify-center text-center snap-center transition-all duration-150 cursor-pointer ${
                  selectedMonthIdx === idx 
                    ? 'text-amber-400 font-extrabold text-[12px] sm:text-sm scale-110' 
                    : 'text-slate-500 hover:text-slate-300 text-[10px] sm:text-xs font-semibold'
                }`}
              >
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* 2. DAY WHEEL */}
        <div className="w-[32px] sm:w-[55px] relative border-r border-slate-900/60 flex flex-col items-center">
          <div className="absolute top-2.5 text-[8px] sm:text-[9px] font-extrabold text-slate-500 uppercase tracking-widest z-20 pointer-events-none">Day</div>
          <div 
            ref={dayScrollRef}
            onScroll={(e) => handleScroll(e, selectedDayIdx, setSelectedDayIdx, 'day', daysList.length - 1)}
            {...getInteractionHandlers('day')}
            className="wheel-scroll-container w-full h-full overflow-y-scroll snap-y snap-mandatory py-[90px]"
          >
            {daysList.map((d, idx) => (
              <div 
                key={idx}
                onClick={() => setSelectedDayIdx(idx)}
                className={`h-[40px] flex items-center justify-center text-center snap-center transition-all duration-150 cursor-pointer ${
                  selectedDayIdx === idx 
                    ? 'text-amber-400 font-extrabold text-[12px] sm:text-sm scale-110' 
                    : 'text-slate-500 hover:text-slate-300 text-[10px] sm:text-xs font-semibold'
                }`}
              >
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* 3. YEAR WHEEL */}
        <div className="flex-1 min-w-[46px] sm:min-w-[55px] relative border-r border-slate-900/60 flex flex-col items-center">
          <div className="absolute top-2.5 text-[8px] sm:text-[9px] font-extrabold text-slate-500 uppercase tracking-widest z-20 pointer-events-none">Year</div>
          <div 
            ref={yearScrollRef}
            onScroll={(e) => handleScroll(e, selectedYearIdx, setSelectedYearIdx, 'year', yearsList.length - 1)}
            {...getInteractionHandlers('year')}
            className="wheel-scroll-container w-full h-full overflow-y-scroll snap-y snap-mandatory py-[90px]"
          >
            {yearsList.map((y, idx) => (
              <div 
                key={idx}
                onClick={() => setSelectedYearIdx(idx)}
                className={`h-[40px] flex items-center justify-center text-center snap-center transition-all duration-150 cursor-pointer ${
                  selectedYearIdx === idx 
                    ? 'text-amber-400 font-extrabold text-[12px] sm:text-sm scale-110' 
                    : 'text-slate-500 hover:text-slate-300 text-[10px] sm:text-xs font-semibold'
                }`}
              >
                {y}
              </div>
            ))}
          </div>
        </div>

        {/* Divider Column */}
        <div className="w-[6px] sm:w-[10px] bg-slate-900/10 pointer-events-none flex items-center justify-center text-slate-600 font-bold text-xs z-20">
          •
        </div>

        {/* 4. HOUR WHEEL */}
        <div className="w-[32px] sm:w-[55px] relative border-r border-slate-900/60 flex flex-col items-center">
          <div className="absolute top-2.5 text-[8px] sm:text-[9px] font-extrabold text-slate-500 uppercase tracking-widest z-20 pointer-events-none">Hour</div>
          <div 
            ref={hourScrollRef}
            onScroll={(e) => handleScroll(e, selectedHourIdx, setSelectedHourIdx, 'hour', hoursList.length - 1)}
            {...getInteractionHandlers('hour')}
            className="wheel-scroll-container w-full h-full overflow-y-scroll snap-y snap-mandatory py-[90px]"
          >
            {hoursList.map((hr, idx) => (
              <div 
                key={idx}
                onClick={() => setSelectedHourIdx(idx)}
                className={`h-[40px] flex items-center justify-center text-center snap-center transition-all duration-150 cursor-pointer ${
                  selectedHourIdx === idx 
                    ? 'text-amber-400 font-extrabold text-[12px] sm:text-sm scale-110' 
                    : 'text-slate-500 hover:text-slate-300 text-[10px] sm:text-xs font-semibold'
                }`}
              >
                {hr}
              </div>
            ))}
          </div>
        </div>

        {/* 5. MINUTE WHEEL */}
        <div className="w-[32px] sm:w-[55px] relative border-r border-slate-900/60 flex flex-col items-center">
          <div className="absolute top-2.5 text-[8px] sm:text-[9px] font-extrabold text-slate-500 uppercase tracking-widest z-20 pointer-events-none">Min</div>
          <div 
            ref={minuteScrollRef}
            onScroll={(e) => handleScroll(e, selectedMinuteIdx, setSelectedMinuteIdx, 'minute', minutesList.length - 1)}
            {...getInteractionHandlers('minute')}
            className="wheel-scroll-container w-full h-full overflow-y-scroll snap-y snap-mandatory py-[90px]"
          >
            {minutesList.map((min, idx) => (
              <div 
                key={idx}
                onClick={() => setSelectedMinuteIdx(idx)}
                className={`h-[40px] flex items-center justify-center text-center snap-center transition-all duration-150 cursor-pointer ${
                  selectedMinuteIdx === idx 
                    ? 'text-amber-400 font-extrabold text-[12px] sm:text-sm scale-110' 
                    : 'text-slate-500 hover:text-slate-300 text-[10px] sm:text-xs font-semibold'
                }`}
              >
                {min}
              </div>
            ))}
          </div>
        </div>

        {/* 6. AM/PM WHEEL */}
        <div className="w-[42px] sm:w-[60px] relative flex flex-col items-center">
          <div className="absolute top-2.5 text-[8px] sm:text-[9px] font-extrabold text-slate-500 uppercase tracking-widest z-20 pointer-events-none">AM/PM</div>
          <div 
            ref={amPmScrollRef}
            onScroll={(e) => handleScroll(e, selectedAmPmIdx, setSelectedAmPmIdx, 'ampm', amPmList.length - 1)}
            {...getInteractionHandlers('ampm')}
            className="wheel-scroll-container w-full h-full overflow-y-scroll snap-y snap-mandatory py-[90px]"
          >
            {amPmList.map((ap, idx) => (
              <div 
                key={idx}
                onClick={() => setSelectedAmPmIdx(idx)}
                className={`h-[40px] flex items-center justify-center text-center snap-center transition-all duration-150 cursor-pointer ${
                  selectedAmPmIdx === idx 
                    ? 'text-amber-400 font-extrabold text-[12px] sm:text-sm scale-110' 
                    : 'text-slate-500 hover:text-slate-300 text-[10px] sm:text-xs font-semibold'
                }`}
              >
                {ap}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
