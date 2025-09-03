'use client';

import { useEffect, useRef, useState } from 'react';

type Section = {
  id: string;
  label: string;
};

interface SectionSliderProps {
  sections: Section[];
}

export default function SectionSlider({ sections }: SectionSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [active, setActive] = useState(0);

  const scrollTo = (index: number) => {
    const id = sections[index]?.id;
    if (id) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTouch = (clientY: number) => {
    const slider = sliderRef.current;
    if (!slider) return;
    const rect = slider.getBoundingClientRect();
    const ratio = (clientY - rect.top) / rect.height;
    const index = Math.min(
      sections.length - 1,
      Math.max(0, Math.round(ratio * (sections.length - 1)))
    );
    scrollTo(index);
  };

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach((section, index) => {
      const el = document.getElementById(section.id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActive(index);
          }
        },
        { rootMargin: '-50% 0px -50% 0px' }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [sections]);

  return (
    <div
      ref={sliderRef}
      className="section-slider"
      onTouchStart={(e) => handleTouch(e.touches[0].clientY)}
      onTouchMove={(e) => handleTouch(e.touches[0].clientY)}
    >
      {sections.map((s, i) => (
        <div
          key={s.id}
          className={`slider-dot${active === i ? ' active' : ''}`}
          onClick={() => scrollTo(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        >
          {hovered === i && <span className="label">{s.label}</span>}
        </div>
      ))}
    </div>
  );
}