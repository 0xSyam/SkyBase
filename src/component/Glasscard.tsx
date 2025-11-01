"use client";

import React, { PropsWithChildren, useId } from "react";

type GlassCardProps = PropsWithChildren<{
  className?: string;
}>;

export default function GlassCard({ children, className = "" }: GlassCardProps) {
  const id = useId();
  const filterId = `glass-distortion-${id}`;

  return (
    <div
      className={`relative flex flex-col items-center overflow-hidden rounded-xl bg-transparent shadow-[2px_4px_25px_0_rgba(93,121,133,0.20)] transition-all ${className}`}
    >
      {/* BLUR layer */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backdropFilter: "blur(6px)",
          filter: `url(#${filterId})`,
          borderRadius: "inherit",
        }}
      />
      {/* TINT layer */}
      <div className="absolute inset-0 z-[1] bg-white/50 rounded-inherit" />
      {/* SHINE layer */}
      <div
        className="absolute inset-0 z-[2] rounded-inherit"
        style={{
          boxShadow:
            "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5)",
        }}
      />
      {/* CONTENT */}
      <div className="relative z-[3] w-full h-full">{children}</div>

      {/* SVG filter defs */}
      <svg className="absolute opacity-0 pointer-events-none" width="0" height="0">
        <filter id={filterId} x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.01"
            numOctaves="1"
            seed="5"
            result="turbulence"
          />
          <feComponentTransfer in="turbulence" result="mapped">
            <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
            <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
            <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
          </feComponentTransfer>
          <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
          <feSpecularLighting
            in="softMap"
            surfaceScale="5"
            specularConstant="1"
            specularExponent="100"
            lightingColor="white"
            result="specLight"
          >
            <fePointLight x="-200" y="-200" z="300" />
          </feSpecularLighting>
          <feComposite in="specLight" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litImage" />
          <feDisplacementMap in="SourceGraphic" in2="softMap" scale="50" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </div>
  );
}
