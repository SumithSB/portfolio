// Six chapters. First person, tied to the scene the walk is standing in.
export interface Chapter {
  yr: string;
  place: string;
  title: string;
  time: string;
  sceneNote: string;
  p: string[];
}

export const chapters: Chapter[] = [
  {
    yr: 'Before',
    place: 'Karnataka',
    title: 'Learning where to begin',
    sceneNote: 'State bus · CRT lab · 7:30 am',
    time: 'Dawn',
    p: [
      'I grew up in a small town where money was always tight. The safe path was a government job. I wanted to build something of my own.',
      'At school, computer class meant switching one on and opening Paint. At university, my classmates had been coding for years. I felt behind. I began finding my way by noticing problems around town and thinking about software that could help.',
    ],
  },
  {
    yr: '2020',
    place: 'Lockdown',
    title: 'The first useful thing',
    sceneNote: 'Shuttered street · Open kirana',
    time: 'Morning',
    p: [
      'During lockdown, groceries were only possible in a short window each day. The shop was a kilometre away, and most days people around me still could not reach it.',
      'With a close friend, I built an app that connected local shops to the people around them. We won a national hackathon with it. Shopkeepers were already using what we had built; that mattered as much as the award.',
    ],
  },
  {
    yr: '2020',
    place: 'Drogher',
    title: "What code alone couldn't fix",
    sceneNote: 'Kirana counter vs. dark store',
    time: 'Noon',
    p: [
      'The win turned into Drogher Technologies. We launched, walked shop to shop, and found our first users.',
      'We struggled to compete with subsidised quick commerce and to fit into businesses built on trust and credit. We eventually closed the company. I continued building paid software for small businesses, with a clearer understanding of how much a product depends on the business around it.',
    ],
  },
  {
    yr: '2021',
    place: 'Bengaluru',
    title: 'Learning to take ownership',
    sceneNote: 'Purple Line metro · Late deploy',
    time: 'Golden hour',
    p: [
      'A mentor invited me to join his startup, TechMachinery Labs, as an intern. Within months I was on a contract, and I had a full-time backend role before I graduated.',
      'I went from writing APIs to owning the core backend and the AI pipelines. When a flagship product was wound down and much of the team left, I chose to stay. The work taught me to take responsibility for systems beyond their first release.',
    ],
  },
  {
    yr: '2025',
    place: 'Leicester',
    title: 'Starting again in Leicester',
    sceneNote: 'University clocktower · 6:00 pm rain',
    time: 'Dusk',
    p: [
      "That same mentor pushed me to study abroad. The first plan didn't work out, so I came to the UK for a Master's at Leicester.",
      'Days split between lectures and part-time work to pay rent. At night I opened the laptop with the old team and kept shipping.',
    ],
  },
  {
    yr: 'Now',
    place: 'London',
    title: 'Building with perspective',
    sceneNote: 'South Bank · Thames lights',
    time: 'Night',
    p: [
      'I started out wanting to earn well and prove I belonged. Money looked like the answer to everything.',
      "Running a company, maintaining systems, and moving countries changed what I value in the work. In London, I now build production AI agents and backend systems, with a focus on reliability and usefulness to the people using them.",
    ],
  },
];
