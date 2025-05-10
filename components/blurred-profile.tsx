"use client";

import React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function BlurredProfile() {
  return (
    <div className="space-y-7">
      {/* Blurred Profile Header */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <Avatar className="h-24 w-24 sm:h-28 sm:w-28 bg-gray-300/50 backdrop-blur-md mb-4">
            <AvatarFallback className="text-xl sm:text-2xl text-transparent font-light">?</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-md rounded-full"></div>
        </div>
        
        <Skeleton className="h-8 w-40 rounded-lg mb-2" />
        <Skeleton className="h-5 w-32 rounded-lg" />
      </div>

      {/* Experience Section */}
      <div>
        <Skeleton className="h-7 w-28 rounded-lg mx-auto mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-5 w-36 rounded-lg mb-2" />
                <Skeleton className="h-4 w-28 rounded-lg mb-1" />
                <Skeleton className="h-3 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Education Section */}
      <div>
        <Skeleton className="h-7 w-28 rounded-lg mx-auto mb-4" />
        <div className="space-y-3">
          <div className="text-center">
            <Skeleton className="h-6 w-40 rounded-lg mx-auto mb-2" />
            <Skeleton className="h-5 w-52 rounded-lg mx-auto mb-1" />
            <Skeleton className="h-4 w-24 rounded-lg mx-auto" />
          </div>
        </div>
      </div>

      {/* LinkedIn Button (Disabled) */}
      <div className="pt-4">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
} 