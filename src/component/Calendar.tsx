"use client";

import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function Calendar({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  id,
  className = ""
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(value || null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const selected = selectedDate ? new Date(selectedDate) : null;

  useEffect(() => {
    setInputValue(value);
    setSelectedDate(value || null);
  }, [value]);

  const handleDateChange = (dateStr: string) => {
    setSelectedDate(dateStr);
    setInputValue(formatDate(new Date(dateStr)));
    onChange(dateStr);
    setShowCalendar(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    const parsed = parseDDMMYYYY(val);
    if (parsed) {
      const dateStr = parsed.toISOString().split('T')[0];
      setSelectedDate(dateStr);
      onChange(dateStr);
    }
  };

  const toggleCalendar = () => setShowCalendar(!showCalendar);

  const goToPrevMonth = () => {
    setCurrentDate(prev => {
      const date = new Date(prev);
      date.setMonth(date.getMonth() - 1);
      return date;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const date = new Date(prev);
      date.setMonth(date.getMonth() + 1);
      return date;
    });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDDMMYYYY = (val: string): Date | null => {
    const m = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(val);
    if (!m) return null;
    const dd = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10) - 1;
    const yyyy = parseInt(m[3], 10);
    const dt = new Date(yyyy, mm, dd);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month + 1}-${day.toString().padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const isSameMonth = true;

      days.push(
        <button
          key={dateStr}
          type="button"
          onClick={() => handleDateChange(dateStr)}
          className={`
            mx-0.5 h-10 w-10 rounded-lg text-sm font-semibold transition-all
            ${isSelected 
              ? 'bg-[#0D63F3] text-white shadow-lg shadow-[#0D63F3]/25' 
              : isToday 
                ? 'border-2 border-[#0D63F3] text-[#0D63F3] font-bold' 
                : 'text-gray-700 hover:bg-gray-100'
            }
            ${!isSameMonth && 'text-gray-400'}
            flex items-center justify-center
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <label
        htmlFor={id}
        className="group relative inline-flex w-full md:w-auto flex-1 items-center gap-2 rounded-xl md:rounded-lg border-2 border-[#0D63F3] bg-white px-3 py-2.5 md:py-2 text-sm font-semibold text-[#0D63F3] shadow-[0_8px_24px_rgba(13,99,243,0.12)] transition-all cursor-pointer focus-within:border-[#0A4EC1] focus-within:shadow-[0_12px_28px_rgba(13,99,243,0.2)]"
        onClick={toggleCalendar}
      >
        <CalendarIcon className="h-4 w-4 flex-shrink-0 text-[#0D63F3]" strokeWidth={2.5} />
        <input
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          readOnly={false}
          className="w-full md:w-32 border-none bg-transparent text-sm font-semibold text-[#0D63F3] outline-none placeholder:text-[#0D63F3]/60 flex-1 cursor-pointer"
          onClick={toggleCalendar}
        />
      </label>

      {/* Calendar Popup */}
      {showCalendar && (
        <div className="absolute top-full left-0 z-50 mt-2 w-80 rounded-2xl bg-white p-4 shadow-xl shadow-black/10 border border-white/50">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="text-lg font-semibold text-gray-900">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5">
            {renderCalendarDays()}
          </div>

          {/* Today Button */}
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              const todayStr = today.toISOString().split('T')[0];
              handleDateChange(todayStr);
            }}
            className="mt-4 w-full rounded-xl bg-[#0D63F3] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0D63F3]/25 hover:bg-[#0A4EC1] transition-all"
          >
            Hari Ini
          </button>
        </div>
      )}
    </div>
  );
}