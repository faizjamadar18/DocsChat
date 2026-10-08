import React from 'react';
import Image from 'next/image';

export default function Features() {
  const featuresList = [
    {
      title: 'The Studio',
      description: 'A unified workspace where your content stays in perfect sync',
      icon: '/icons/features/studio.svg',
      justify: 'md:justify-end',
    },
    {
      title: 'AI Agents',
      description: 'Smart assistants that help you write, manage, and optimize content',
      icon: '/icons/features/agent.svg',
      justify: 'md:justify-start',
    },
    {
      title: 'Smart Memory',
      description: 'Maintain your brand voice with intelligent style memory',
      icon: '/icons/features/memory.svg',
      justify: 'md:justify-end',
    },
    {
      title: 'Voice Commands',
      description: 'Control everything with your voice. Faster, hands-free content creation',
      icon: '/icons/features/mic.svg',
      justify: 'md:justify-start',
    },
  ];

  return (
    <div id="features" className="w-full mx-auto lg:max-w-5xl px-4 lg:px-0 relative py-12 lg:py-16">
      <div className="flex flex-col items-center text-center gap-2">
        <div>
          <div className="px-4 py-1 rounded-full bg-primary/20 select-none inline-block">
            <div className="text-primary font-medium text-sm">The plura way</div>
          </div>
        </div>
        <div>
          <h2 className="heading">Everything you need to create smarter, faster</h2>
        </div>
        <div>
          <p className="paragraph">Plura brings all your creative tools into one place</p>
        </div>
      </div>

      <div className="relative w-full mt-4">
        {/* Background Grid Lines */}
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full z-10 pointer-events-none opacity-40">
          <Image
            alt="Plus grid lines"
            width={32}
            height={32}
            className="size-full object-contain"
            src="/images/lines.svg"
          />
        </div>

        {/* 2x2 Feature Bento Grid */}
        <div className="grid md:grid-cols-2 gap-y-4 md:gap-y-0 relative z-20">
          {featuresList.map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-center p-2 md:p-16 w-full ${item.justify}`}
            >
              <div className="flex flex-col items-center text-center gap-4 transition-transform duration-300 hover:scale-105">
                <div className="size-12 lg:size-16 rounded-lg lg:rounded-2xl bg-secondary flex items-center justify-center shadow-xs">
                  <Image
                    alt={item.title}
                    width={1024}
                    height={1024}
                    className="size-6 lg:size-8 object-contain"
                    src={item.icon}
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg md:text-xl font-medium text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground max-w-62.5 text-balance">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
