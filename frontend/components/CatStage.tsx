'use client';

import { useEffect, useRef } from 'react';

/**
 * Decorative animated cat mascots — ported 1:1 from the original static mockup
 * (cinq_preview.html). Two cats roam the whole viewport and cycle through
 * walk / sleep / eat / groom / fight / annoy states.
 *
 * Kept as plain DOM refs + a single rAF loop (rather than re-rendering via
 * React state) to match the original's performance characteristics exactly —
 * this is a purely decorative overlay with pointer-events disabled.
 */

type CatState = 'walk' | 'sleep' | 'eat' | 'fight' | 'annoy' | 'groom';

interface Cat {
  el: HTMLDivElement;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  dir: 1 | -1;
  state: CatState;
  lastState: CatState;
  speed: number;
  curSpeed: number;
  actionUntil: number;
  bobPhase: number;
}

function CatSvg() {
  return (
    <svg className="cat-svg" viewBox="0 0 140 110" xmlns="http://www.w3.org/2000/svg">
      <ellipse className="cs-shadow" cx="66" cy="96" rx="44" ry="6" />
      <path
        className="cs-tail-normal"
        d="M30,68 C8,66 2,45 14,28 C18,22 26,20 30,24 C22,32 20,50 34,60 C40,64 38,68 30,68 Z"
      />
      <path
        className="cs-tail-sleep"
        d="M20,72 C10,60 12,42 26,34 C30,44 34,54 44,60 C34,66 26,72 20,72 Z"
      />
      <path
        className="cs-body"
        d="M28,88 C20,58 40,38 72,38 C104,38 114,60 108,84 C102,100 44,100 28,88 Z"
      />
      <ellipse className="cs-paw" cx="42" cy="93" rx="9" ry="6.5" />
      <ellipse className="cs-paw" cx="64" cy="97" rx="9" ry="6.5" />
      <ellipse className="cs-paw" cx="90" cy="97" rx="9" ry="6.5" />
      <ellipse className="cs-paw" cx="110" cy="93" rx="9" ry="6.5" />
      <circle className="cs-head" cx="100" cy="34" r="30" />
      <path className="cs-ear" d="M75,14 L68,-6 L92,10 Z" />
      <path className="cs-ear" d="M118,8 L128,-10 L100,8 Z" />
      <path className="cs-ear-inner" d="M76,10 L73,-1 L86,7 Z" />
      <path className="cs-ear-inner" d="M115,6 L121,-4 L104,6 Z" />
      <g className="cs-face-open">
        <line className="cs-whisker" x1="82" y1="42" x2="62" y2="38" />
        <line className="cs-whisker" x1="83" y1="46" x2="63" y2="46" />
        <circle className="cs-eye-white" cx="90" cy="32" r="4.4" />
        <circle className="cs-eye-pupil" cx="91.2" cy="30.8" r="1.7" />
        <circle className="cs-eye-white" cx="108" cy="32" r="4.4" />
        <circle className="cs-eye-pupil" cx="109.2" cy="30.8" r="1.7" />
      </g>
      <g className="cs-face-sleep">
        <line className="cs-whisker" x1="82" y1="42" x2="62" y2="38" />
        <line className="cs-whisker" x1="83" y1="46" x2="63" y2="46" />
        <path className="cs-eye-closed" d="M87,32 Q90,29 93,32" />
        <path className="cs-eye-closed" d="M105,32 Q108,29 111,32" />
      </g>
      <ellipse className="cs-blush" cx="82" cy="43" rx="4" ry="2.6" />
      <ellipse className="cs-blush" cx="116" cy="43" rx="4" ry="2.6" />
      <path className="cs-nose" d="M97,40 L103,40 L100,44 Z" />
      <path className="cs-mouth" d="M100,44 Q100,47.5 96,47" />
      <path className="cs-mouth" d="M100,44 Q100,47.5 104,47" />
      <text className="cs-zzz" x="6" y="16">Z z z</text>
    </svg>
  );
}

export default function CatStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const bowlRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const catDarkRef = useRef<HTMLDivElement>(null);
  const catLightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const bowl = bowlRef.current;
    const bubble = bubbleRef.current;
    const catDarkEl = catDarkRef.current;
    const catLightEl = catLightRef.current;
    if (!stage || !bowl || !bubble || !catDarkEl || !catLightEl) return;

    const bowlX = 50;
    const bowlY = 90;

    const cats: Record<'dark' | 'light', Cat> = {
      dark: {
        el: catDarkEl,
        x: 15,
        y: 30,
        targetX: 60,
        targetY: 50,
        dir: 1,
        state: 'walk',
        lastState: 'walk',
        speed: 1.1,
        curSpeed: 0,
        actionUntil: 0,
        bobPhase: 0,
      },
      light: {
        el: catLightEl,
        x: 80,
        y: 70,
        targetX: 30,
        targetY: 20,
        dir: -1,
        state: 'walk',
        lastState: 'walk',
        speed: 1.3,
        curSpeed: 0,
        actionUntil: 0,
        bobPhase: 0,
      },
    };

    function pick<T>(arr: T[]): T {
      return arr[Math.floor(Math.random() * arr.length)];
    }
    function other(cat: Cat): Cat {
      return cat === cats.dark ? cats.light : cats.dark;
    }

    function newTarget(cat: Cat) {
      let tx: number, ty: number;
      do {
        tx = 6 + Math.random() * 88;
        ty = 10 + Math.random() * 74;
      } while (Math.hypot(tx - cat.x, ty - cat.y) < 18);
      cat.targetX = tx;
      cat.targetY = ty;
    }

    function decideNextState(cat: Cat) {
      const now = performance.now();
      let state: CatState;
      const roll = Math.random();
      if (roll < 0.16) state = 'sleep';
      else if (roll < 0.32) state = 'eat';
      else if (roll < 0.46) state = 'groom';
      else state = 'walk';

      // don't let both cats mirror the same non-walking activity at once
      if (state !== 'walk' && other(cat).state === state) state = 'walk';

      cat.state = state;
      if (state === 'sleep') {
        cat.actionUntil = now + 3000 + Math.random() * 3500;
      } else if (state === 'eat') {
        cat.targetX = bowlX + (cat === cats.dark ? -5 : 5);
        cat.targetY = bowlY;
        cat.actionUntil = now + 2200 + Math.random() * 2000;
      } else if (state === 'groom') {
        cat.actionUntil = now + 1800 + Math.random() * 1800;
      } else {
        newTarget(cat);
      }
    }

    function updateBowlVisibility() {
      const anyEating = cats.dark.state === 'eat' || cats.light.state === 'eat';
      bowl!.style.left = bowlX + '%';
      bowl!.style.top = bowlY + '%';
      bowl!.classList.toggle('cat-bowl-active', anyEating);
    }

    let lastTime = performance.now();
    let rafId = 0;

    function tick(now: number) {
      const dt = Math.min(48, now - lastTime) / 16.6; // frame-rate-independent step, capped
      lastTime = now;

      (['dark', 'light'] as const).forEach((key) => {
        const cat = cats[key];
        const moving = cat.state === 'walk' || cat.state === 'eat';

        if (moving) {
          const dx = cat.targetX - cat.x;
          const dy = cat.targetY - cat.y;
          const dist = Math.hypot(dx, dy);
          const arriveThreshold = 1;

          if (dist < arriveThreshold) {
            cat.curSpeed *= 0.5; // settle instead of hard stop
            if (cat.state === 'eat') {
              if (now >= cat.actionUntil) decideNextState(cat);
            } else {
              decideNextState(cat);
            }
          } else {
            // ease speed toward a target that slows near arrival and ramps up from a stop,
            // so cats accelerate/decelerate instead of sliding at constant velocity
            const desiredSpeed = cat.speed * Math.min(1, dist / 14);
            cat.curSpeed += (desiredSpeed - cat.curSpeed) * 0.09 * dt;

            const step = cat.curSpeed * 0.09 * dt;
            const nx = (dx / dist) * step;
            const ny = (dy / dist) * step * 0.62;
            cat.x += nx;
            cat.y += ny;

            // only flip facing on meaningful horizontal intent, avoids flickering when moving mostly vertically
            if (Math.abs(dx) > 1.2) cat.dir = dx > 0 ? 1 : -1;

            // footstep-driven bounce: phase advances with actual distance travelled,
            // so the bob visually matches how fast the cat is really moving
            cat.bobPhase += cat.curSpeed * 0.16 * dt;
          }
        } else if (cat.state === 'sleep' || cat.state === 'groom') {
          if (now >= cat.actionUntil) decideNextState(cat);
          cat.curSpeed = 0;
        } else if (cat.state === 'fight' || cat.state === 'annoy') {
          if (now >= cat.actionUntil) {
            cat.state = 'walk';
            newTarget(cat);
          }
          cat.curSpeed = 0;
        }
      });

      // occasionally start a scuffle or annoyance when close together & both free
      const dark = cats.dark;
      const light = cats.light;
      const bothFree =
        (dark.state === 'walk' || dark.state === 'sleep' || dark.state === 'groom') &&
        (light.state === 'walk' || light.state === 'sleep' || light.state === 'groom');
      if (bothFree && Math.hypot(dark.x - light.x, dark.y - light.y) < 10 && Math.random() < 0.02) {
        const isFight = Math.random() < 0.55;
        const until = now + (isFight ? 1500 : 1200);
        dark.state = isFight ? 'fight' : 'annoy';
        light.state = isFight ? 'fight' : 'annoy';
        dark.actionUntil = until;
        light.actionUntil = until;
        bubble!.style.left = (dark.x + light.x) / 2 + '%';
        bubble!.style.top = Math.min(dark.y, light.y) + '%';
        bubble!.style.opacity = '1';
        bubble!.textContent = isFight ? pick(['😾💥', '🐾💢', '😼🐾']) : pick(['😾!', '🐾?', '😹']);
        setTimeout(() => {
          bubble!.style.opacity = '0';
        }, isFight ? 1500 : 1200);
      }

      updateBowlVisibility();

      (['dark', 'light'] as const).forEach((key) => {
        const cat = cats[key];
        cat.el.style.left = cat.x + '%';
        cat.el.style.top = cat.y + '%';

        // only touch the state class when the state actually changes — toggling the
        // same class every frame was restarting the CSS keyframe animation 60x/sec,
        // which is what made walking/fighting/grooming look jittery and "weird"
        if (cat.state !== cat.lastState) {
          cat.el.classList.remove('cat-walk', 'cat-sleep', 'cat-eat', 'cat-fight', 'cat-annoy', 'cat-groom');
          cat.el.classList.add('cat-' + cat.state);
          cat.lastState = cat.state;
        }
        cat.el.classList.toggle('cat-face-left', cat.dir < 0);

        // drive the walking/eating bounce from JS, synced to real movement speed,
        // with a little squash-and-stretch for a bouncier, cuter gait
        const inner = cat.el.querySelector('.cat-inner') as HTMLDivElement | null;
        if (inner) {
          if ((cat.state === 'walk' || cat.state === 'eat') && cat.curSpeed > 0.02) {
            const hop = Math.abs(Math.sin(cat.bobPhase));
            const bobY = -hop * 3.2;
            const squashX = 1 + hop * 0.05;
            const squashY = 1 - hop * 0.06;
            const lean = Math.max(-6, Math.min(6, -cat.dir * hop * 3));
            inner.style.transform = `translateY(${bobY}px) scale(${squashX}, ${squashY}) rotate(${lean}deg)`;
          } else {
            inner.style.transform = '';
          }
        }
      });

      rafId = requestAnimationFrame(tick);
    }

    newTarget(cats.dark);
    newTarget(cats.light);
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="cat-stage" id="catStage" ref={stageRef}>
      <div className="cat-bowl" id="catBowl" ref={bowlRef}>
        <svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50" cy="30" rx="10" ry="26" fill="rgba(15,23,42,.08)" transform="rotate(90 50 30)" />
          <ellipse cx="50" cy="42" rx="34" ry="13" fill="#ffffff" stroke="#d6d3c9" strokeWidth="2.5" />
          <ellipse cx="50" cy="38" rx="26" ry="8.5" fill="#efe9dd" />
          <ellipse cx="38" cy="36" rx="4.5" ry="3.2" fill="#c98a4b" transform="rotate(-15 38 36)" />
          <ellipse cx="46" cy="39" rx="4.2" ry="3" fill="#e0a869" transform="rotate(10 46 39)" />
          <ellipse cx="55" cy="36" rx="4.4" ry="3.1" fill="#c98a4b" transform="rotate(20 55 36)" />
          <ellipse cx="63" cy="38" rx="4" ry="2.9" fill="#dba05f" transform="rotate(-8 63 38)" />
          <ellipse cx="42" cy="41" rx="3.8" ry="2.7" fill="#dba05f" transform="rotate(5 42 41)" />
          <ellipse cx="58" cy="41" rx="3.9" ry="2.8" fill="#c98a4b" transform="rotate(-12 58 41)" />
          <ellipse cx="50" cy="35" rx="4" ry="2.9" fill="#e0a869" transform="rotate(3 50 35)" />
        </svg>
      </div>

      <div className="cat cat-dark cat-walk" id="catDark" ref={catDarkRef}>
        <div className="cat-flip-wrap">
          <div className="cat-inner">
            <CatSvg />
          </div>
        </div>
      </div>

      <div className="cat cat-light cat-walk" id="catLight" ref={catLightRef}>
        <div className="cat-flip-wrap">
          <div className="cat-inner">
            <CatSvg />
          </div>
        </div>
      </div>

      <div className="cat-bubble" id="catBubble" ref={bubbleRef} />
    </div>
  );
}
