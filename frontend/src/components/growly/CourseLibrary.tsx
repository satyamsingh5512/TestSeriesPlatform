'use client';
import React from 'react';
import { Users, ArrowRight } from 'lucide-react';

const courses = [
  {
    id: 1,
    title: 'Strategic Leadership for Team Leads',
    category: 'Leadership',
    assigned: 48,
    duration: '6h 30m',
    level: 'Advanced',
    gradient: 'from-growly-blue to-growly-steel',
    categoryColor: 'bg-growly-blue-light text-growly-blue',
  },
  {
    id: 2,
    title: 'Data-Driven Decision Making',
    category: 'Analytics',
    assigned: 31,
    duration: '4h 15m',
    level: 'Intermediate',
    gradient: 'from-teal-500 to-growly-steel',
    categoryColor: 'bg-teal-50 text-teal-700',
  },
  {
    id: 3,
    title: 'Effective Cross-Team Communication',
    category: 'Soft Skills',
    assigned: 62,
    duration: '3h 00m',
    level: 'Beginner',
    gradient: 'from-purple-400 to-growly-steel',
    categoryColor: 'bg-purple-50 text-purple-700',
  },
  {
    id: 4,
    title: 'React & TypeScript for Engineers',
    category: 'Engineering',
    assigned: 25,
    duration: '12h 00m',
    level: 'Advanced',
    gradient: 'from-growly-steel to-blue-400',
    categoryColor: 'bg-growly-blue-light text-growly-blue',
  },
];

function CourseThumbnail({ gradient }: { gradient: string }) {
  return (
    <div className={`w-full h-24 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 relative overflow-hidden`}>
      {/* Decorative geometric accent */}
      <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/10" />
      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/10" />
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
        <div className="w-5 h-5 rounded-md bg-white/60" />
      </div>
    </div>
  );
}

export function CourseLibrary() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[16px] font-semibold text-growly-ink">Suggested Courses</h3>
          <p className="text-[12px] text-growly-muted mt-0.5">Curated for your teams</p>
        </div>
        <button className="text-[12px] font-semibold text-growly-blue hover:text-growly-steel transition-colors">
          Browse all →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
        {courses.map((course) => (
          <div
            key={course.id}
            className="border border-gray-100 rounded-xl p-4 hover:border-growly-blue-mid hover:shadow-sm transition-all duration-200 group flex flex-col"
          >
            <CourseThumbnail gradient={course.gradient} />

            {/* Category badge */}
            <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full w-fit mb-2 ${course.categoryColor}`}>
              {course.category}
            </span>

            <h4 className="text-[13px] font-semibold text-growly-ink leading-snug mb-1 flex-1">
              {course.title}
            </h4>

            <div className="flex items-center gap-1.5 text-[11px] text-growly-muted mb-3">
              <Users size={11} />
              <span>Assigned to {course.assigned} employees</span>
              <span className="mx-1">·</span>
              <span>{course.duration}</span>
            </div>

            <button className="flex items-center justify-center gap-1.5 w-full bg-growly-blue hover:bg-growly-blue/90 active:scale-[0.98] text-white text-[12px] font-semibold py-2 rounded-lg transition-all duration-150 group-hover:shadow-sm">
              View Details
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
