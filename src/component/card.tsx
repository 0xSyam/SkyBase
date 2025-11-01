'use client';

import LiquidGlassReact from '@tinymomentum/liquid-glass-react';
import '@tinymomentum/liquid-glass-react/dist/components/LiquidGlassBase.css';

const { LiquidGlassContainer, LiquidGlassLink } = LiquidGlassReact;

export default function StockCard() {
  return (
    <LiquidGlassContainer
      width={437}
      height={985}
      borderRadius={20}
      innerShadowColor="#000000"
      innerShadowBlur={15}
      innerShadowSpread={-5}
      glassTintColor="rgba(255, 255, 255, 0)"
      glassTintOpacity={0}
      frostBlurRadius={0}
      noiseFrequency={0.008}
      noiseStrength={77}
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Stok Barang</h2>
        <LiquidGlassLink
          width={120}
          height={40}
          borderRadius={12}
          innerShadowColor="rgba(0,0,0,0.4)"
          innerShadowBlur={10}
          innerShadowSpread={-3}
          glassTintColor="#ffffff"
          glassTintOpacity={20}
          frostBlurRadius={1}
          noiseFrequency={0.008}
          noiseStrength={77}
          href="#"
          className="flex items-center justify-center text-sm font-medium text-white bg-blue-600 px-3 rounded-md"
        >
          Selengkapnya →
        </LiquidGlassLink>
      </div>
    </LiquidGlassContainer>
  );
}
