'use client';

import React from 'react';
import {
  SlackIcon,
  Microsoft365Icon,
  NotionIcon,
  GoogleDriveIcon,
  GoogleDocsIcon,
  GoogleSlidesIcon,
  GoogleSheetsIcon,
  FirefliesIcon,
  GmailIcon,
  GitHubIcon,
  LinearIcon,
  HubSpotIcon,
  AttioIcon,
  GranolaIcon,
} from './Icons';

export default function IntegrationsBoundary() {
  const vendors = [
    { name: 'Slack', Icon: SlackIcon },
    { name: 'Microsoft 365', Icon: Microsoft365Icon },
    { name: 'Notion', Icon: NotionIcon },
    { name: 'Google Workspace', Icon: GoogleDriveIcon },
    { name: 'Docs', Icon: GoogleDocsIcon },
    { name: 'Slides', Icon: GoogleSlidesIcon },
    { name: 'Sheets', Icon: GoogleSheetsIcon },
    { name: 'Fireflies', Icon: FirefliesIcon },
    { name: 'Gmail', Icon: GmailIcon },
    { name: 'GitHub', Icon: GitHubIcon },
    { name: 'Linear', Icon: LinearIcon },
    { name: 'HubSpot', Icon: HubSpotIcon },
    { name: 'Attio', Icon: AttioIcon },
    { name: 'Granola', Icon: GranolaIcon },
  ];

  return (
    <section className="flex flex-col items-center px-6 py-16 md:py-24">
      <div className="flex w-full max-w-300 flex-col gap-10">
        {/* Headline & Description */}
        <div className="flex max-w-xl flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-medium leading-[1.3] tracking-[-0.03em] text-[#21201c]">
            Shared knowledge for the team.
            <br />
            <span className="text-[#63635e]">Private knowledge that stays yours.</span>
          </h2>
          <p className="text-sm md:text-base leading-relaxed tracking-[-0.005em] text-[#63635e]">
            Agentwork connects in two layers: shared sources everyone can see, and private ones each employee connects through their own account — private data never surfaces in someone else&apos;s answer. The boundary is enforced in code, not the model&apos;s judgment.
          </p>
        </div>

        {/* Marquee Ticker */}
        <div className="border-y border-[#e2e1de] py-6 relative overflow-hidden">
          {/* Subtle edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-[#fdfdfc] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-[#fdfdfc] to-transparent" />

          <div className="flex gap-10 whitespace-nowrap animate-integrations-marquee w-max">
            {/* Double the list for seamless loop */}
            {[...vendors, ...vendors].map((v, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm font-medium text-[#21201c] shrink-0">
                <v.Icon className="size-4" />
                <span>{v.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
