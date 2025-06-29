import React, { useEffect, useRef, useState } from 'react';

interface Cue {
  start: number;
  end: number;
  zh: string;
  en: string;
}

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  subtitleUrl: string;
  visible: boolean;
  mode: 'zh' | 'en' | 'both';
}

const parseTime = (time: string) => {
  const [h, m, s] = time.split(':');
  const [sec, ms] = s.split('.');
  return (
    parseInt(h, 10) * 3600 +
    parseInt(m, 10) * 60 +
    parseInt(sec, 10) +
    parseInt(ms || '0', 10) / 1000
  );
};

const isChinese = (text: string) => /[\u4e00-\u9fa5]/.test(text);

const parseCueText = (text: string) => {
  const parts = text.split(/\n+/).map(p => p.trim()).filter(Boolean);
  let zh = '';
  let en = '';
  parts.forEach(p => {
    if (isChinese(p)) {
      zh += (zh ? '\n' : '') + p;
    } else {
      en += (en ? '\n' : '') + p;
    }
  });
  return { zh, en };
};

const SubtitleOverlay: React.FC<Props> = ({ videoRef, subtitleUrl, visible, mode }) => {
  const [cues, setCues] = useState<Cue[]>([]);
  const [currentCue, setCurrentCue] = useState<Cue | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!subtitleUrl) return;
    let isMounted = true;
    fetch(subtitleUrl)
      .then(res => res.text())
      .then(text => {
        if (!isMounted) return;
        const cueBlocks = text.replace(/\r/g, '').split(/\n\n+/);
        const parsed: Cue[] = [];
        cueBlocks.forEach(block => {
          const lines = block.split('\n');
          if (lines.length >= 2) {
            const times = lines[0].split(/ --> /);
            if (times.length >= 2) {
              const start = parseTime(times[0].trim());
              const end = parseTime(times[1].trim());
              const { zh, en } = parseCueText(lines.slice(1).join('\n'));
              parsed.push({ start, end, zh, en });
            }
          }
        });
        setCues(parsed);
        indexRef.current = 0;
      });
    return () => {
      isMounted = false;
    };
  }, [subtitleUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => {
      const t = video.currentTime;
      let i = indexRef.current;
      if (i < cues.length && t >= cues[i].start && t <= cues[i].end) {
        setCurrentCue(cues[i]);
        return;
      }
      while (i < cues.length && t > cues[i].end) i++;
      while (i > 0 && t < cues[i].start) i--;
      indexRef.current = i;
      const cue = cues[i];
      if (cue && t >= cue.start && t <= cue.end) setCurrentCue(cue);
      else setCurrentCue(null);
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [cues, videoRef]);

  if (!visible || !currentCue) return null;

  let displayText = '';
  if (mode === 'zh') displayText = currentCue.zh;
  else if (mode === 'en') displayText = currentCue.en;
  else displayText = [currentCue.zh, currentCue.en].filter(Boolean).join('\n');

  if (!displayText) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full flex justify-center pointer-events-none subtitle-overlay px-4">
      <span className="bg-black/70 text-white px-3 py-2 rounded text-sm sm:text-base md:text-lg lg:text-xl font-semibold shadow">
        {displayText}
      </span>
    </div>
  );
};

export default SubtitleOverlay;
