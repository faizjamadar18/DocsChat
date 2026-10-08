import React from 'react';
import Image from 'next/image';

export default function Problem() {
  const painPoints = [
    'Too many logins and tabs',
    'Work scattered everywhere',
    'Repeating the same tasks',
    'Hard to stay consistent',
    'No central place for brand assets',
    "Hard to track what's done vs pending",
  ];

  const benefits = [
    'All tools in one place',
    'Smart brand memory',
    'Faster workflows',
    'Consistent brand voice',
    'Central library for all assets',
    'Clear progress tracking',
  ];

  return (
    <div className="w-full mx-auto lg:max-w-5xl px-4 lg:px-0 relative py-12 lg:py-16">
      <div className="flex flex-col items-center text-center gap-4">
        <div>
          <div className="px-4 py-1 rounded-full bg-primary/20 select-none inline-block">
            <div className="text-primary font-medium text-sm">Problem</div>
          </div>
        </div>
        <div>
          <h2 className="heading">Your second brain for content creation</h2>
        </div>
        <div>
          <p className="paragraph">
            A unified content creation studio with docs, boards and agents to help you plan, write, and manage your content all in one place
          </p>
        </div>
      </div>

      <div id="problem" className="mx-auto w-full mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Before Column */}
          <div className="flex flex-col items-center justify-center gap-4 w-full">
            <div className="w-full">
              <div className="relative bg-secondary rounded-lg lg:rounded-2xl h-80 lg:h-96 flex items-end justify-center w-full p-4 mt-2 overflow-hidden shadow-xs">
                <Image
                  alt="Messy Icons"
                  width={1024}
                  height={1024}
                  className="w-full h-full object-contain"
                  src="/images/mess-icons.svg"
                />
              </div>
            </div>

            <div className="flex items-center justify-center w-full pt-2">
              <div className="h-0.75 w-full bg-neutral-200" />
              <span className="text-base md:text-lg mx-2 bg-primary/10 text-primary py-1 rounded-full font-semibold px-3 whitespace-nowrap min-w-min">
                Before
              </span>
              <div className="h-0.75 w-full bg-neutral-200" />
            </div>

            <div className="flex flex-col w-full gap-y-2 pt-4">
              {painPoints.map((point, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex items-center justify-center rounded-full bg-red-500 size-5 shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-x size-3 text-white"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </div>
                  <span className="text-base font-medium text-foreground">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* With Plura Column */}
          <div className="flex flex-col items-center justify-center gap-4 w-full">
            <div className="w-full">
              <div className="bg-secondary rounded-lg lg:rounded-2xl h-80 lg:h-96 flex items-center justify-center w-full mt-2 relative overflow-hidden shadow-xs">
                <div className="relative z-20 flex items-center justify-center">
                  <svg
                    className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-28 text-primary/50"
                    width="236"
                    height="62"
                    viewBox="0 0 236 62"
                    fill="none"
                  >
                    <path
                      d="M231.534 7.43697C162.034 -2.06303 -60.299 10.9308 22.0336 12.937C98.5334 14.801 142.016 11.1037 205.612 25.7551C207.895 26.2808 207.578 29.4886 205.236 29.5013C155.917 29.7677 6.91438 31.0668 53.0336 36.937C89.0377 41.5197 132.97 46.5305 159.022 49.4451C161.448 49.7165 161.366 53.3043 158.93 53.4694L93.0336 57.937"
                      stroke="currentColor"
                      strokeOpacity="0.5"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                  </svg>
                  <Image
                    alt="Plura Logo"
                    width={1024}
                    height={1024}
                    className="size-32 lg:size-44 object-contain"
                    src="/icons/logo/plogo.svg"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center w-full pt-4">
              <div className="h-0.75 w-full bg-neutral-200" />
              <span className="text-base md:text-lg mx-2 bg-primary/10 text-primary py-1 rounded-full font-semibold px-3 whitespace-nowrap min-w-min">
                With Plura
              </span>
              <div className="h-0.75 w-full bg-neutral-200" />
            </div>

            <div className="flex flex-col w-full gap-y-2 pt-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex items-center justify-center rounded-full bg-green-500/80 size-5 shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check size-3 text-white"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <span className="text-base font-medium text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
