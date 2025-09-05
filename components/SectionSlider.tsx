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
  const [active, setActive] = useState(0);
  const [labelIndex, setLabelIndex] = useState<number | null>(null);
  const labelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touching = useRef(false);

  const showLabel = (index: number, persist = false) => {
    if (labelTimeout.current) {
      clearTimeout(labelTimeout.current);
      labelTimeout.current = null;
    }
    setLabelIndex(index);
    if (!persist) {
      labelTimeout.current = setTimeout(() => setLabelIndex(null), 1000);
    }
  };

  const scrollTo = (index: number, persist = false) => {
    const id = sections[index]?.id;
    if (id) {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showLabel(index, persist);
    }
  };

  const handleTouch = (clientY: number, persist = false) => {
    const slider = sliderRef.current;
    if (!slider) return;
    const rect = slider.getBoundingClientRect();
    const ratio = (clientY - rect.top) / rect.height;
    const index = Math.min(
      sections.length - 1,
      Math.max(0, Math.round(ratio * (sections.length - 1)))
    );
    scrollTo(index, persist);
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
            if (!window.matchMedia('(max-width: 768px)').matches) {
              showLabel(index);
            }
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
      onTouchStart={(e) => {
        touching.current = true;
        handleTouch(e.touches[0].clientY, true);
      }}
      onTouchMove={(e) => {
        if (touching.current) handleTouch(e.touches[0].clientY, true);
      }}
      onTouchEnd={() => {
        touching.current = false;
        setLabelIndex(null);
      }}
    >
      {sections.map((s, i) => (
        <div
          key={s.id}
          className={`slider-dot${active === i ? ' active' : ''}`}
          onClick={() => scrollTo(i)}
          onMouseEnter={() => showLabel(i, true)}
          onMouseLeave={() => setLabelIndex(null)}
        >
          {labelIndex === i && <span className="label">{s.label}</span>}
        </div>
      ))}
    </div>
  );
}