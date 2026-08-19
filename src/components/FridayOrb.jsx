import React, { useEffect, useRef } from 'react';

export default function FridayOrb({ state = 'IDLE', audioLevel = 0, isMuted = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let rotation = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 65;

      rotation += 0.015;

      // Color scheme according to Friday state
      let color1, color2, glowColor;
      switch (state) {
        case 'LISTENING':
          color1 = '#00f2fe';
          color2 = '#4facfe';
          glowColor = 'rgba(0, 242, 254, 0.65)';
          break;
        case 'THINKING':
          color1 = '#a855f7';
          color2 = '#ec4899';
          glowColor = 'rgba(168, 85, 247, 0.65)';
          break;
        case 'WORKING':
          color1 = '#10b981';
          color2 = '#06b6d4';
          glowColor = 'rgba(16, 185, 129, 0.65)';
          break;
        case 'SPEAKING':
          color1 = '#06b6d4';
          color2 = '#3b82f6';
          glowColor = 'rgba(6, 182, 212, 0.7)';
          break;
        case 'WAITING_FOR_CONFIRMATION':
          color1 = '#f59e0b';
          color2 = '#f97316';
          glowColor = 'rgba(245, 158, 11, 0.65)';
          break;
        case 'ERROR':
          color1 = '#ef4444';
          color2 = '#b91c1c';
          glowColor = 'rgba(239, 68, 68, 0.65)';
          break;
        case 'IDLE':
        default:
          color1 = '#00f2fe';
          color2 = '#8b5cf6';
          glowColor = 'rgba(0, 242, 254, 0.35)';
          break;
      }

      if (isMuted) {
        color1 = '#64748b';
        color2 = '#334155';
        glowColor = 'rgba(100, 116, 139, 0.2)';
      }

      // Dynamic reactive radius
      const dynamicRadius = baseRadius + (state === 'LISTENING' || state === 'SPEAKING' ? audioLevel * 28 : Math.sin(rotation * 2) * 4);

      // 1. Outer Ambient Glow Halo
      const outerGlow = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, dynamicRadius * 1.85);
      outerGlow.addColorStop(0, glowColor);
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius * 1.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Animated Orbiting Hologram Rings
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);
      ctx.strokeStyle = color1;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(0, 0, dynamicRadius + 14, 0, Math.PI * 1.4);
      ctx.stroke();

      ctx.rotate(-rotation * 2.2);
      ctx.strokeStyle = color2;
      ctx.beginPath();
      ctx.arc(0, 0, dynamicRadius + 22, 0, Math.PI * 1.2);
      ctx.stroke();
      ctx.restore();

      // 3. Central Core Orb Gradient
      const coreGradient = ctx.createRadialGradient(
        centerX - dynamicRadius * 0.3,
        centerY - dynamicRadius * 0.3,
        dynamicRadius * 0.1,
        centerX,
        centerY,
        dynamicRadius
      );
      coreGradient.addColorStop(0, '#ffffff');
      coreGradient.addColorStop(0.3, color1);
      coreGradient.addColorStop(0.8, color2);
      coreGradient.addColorStop(1, '#050711');

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.max(10, dynamicRadius), 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.restore();

      // 4. Subtle Inner Swirl Particles
      ctx.save();
      ctx.translate(centerX, centerY);
      for (let i = 0; i < 4; i++) {
        const angle = rotation * (i + 1) * 0.8;
        const px = Math.cos(angle) * (dynamicRadius * 0.42);
        const py = Math.sin(angle) * (dynamicRadius * 0.42);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, audioLevel, isMuted]);

  return (
    <div className="flex flex-col items-center justify-center relative">
      <canvas
        ref={canvasRef}
        width={250}
        height={250}
        className="floating-orb cursor-pointer"
      />
    </div>
  );
}
