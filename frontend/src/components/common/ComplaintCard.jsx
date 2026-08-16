import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';

export const ComplaintCard = ({ complaint }) => {
  const {
    id,
    category,
    description,
    location,
    dateReported,
    priority,
    status,
    image
  } = complaint;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-5">
      {/* Image Thumbnail */}
      <div className="w-full md:w-40 h-28 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
        <img 
          src={image} 
          alt={category} 
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      {/* Details Area */}
      <div className="flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary-600 font-display tracking-wider bg-primary-50 px-2 py-0.5 rounded">
                {id}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={priority} />
              <StatusBadge status={status} />
            </div>
          </div>

          <h4 className="text-sm font-semibold text-slate-800 mt-2 line-clamp-2">
            {description}
          </h4>
        </div>

        {/* Metadata Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{dateReported}</span>
            </div>
          </div>

          <Link 
            to={`/complaints/${id}`}
            className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-all"
          >
            View Details
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
