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
    title: 'Behind from the start',
    sceneNote: 'State bus · CRT lab · 7:30 am',
    time: 'Dawn',
    p: [
      'I grew up in a small town where money was always tight. The safe path was a government job. I wanted to build something of my own.',
      'At school, computer class meant switching one on and opening Paint. At university, my classmates had been coding for years. I felt behind. When the textbooks stayed abstract, the real education was noticing everyday friction around town and picturing the software that would fix it.',
    ],
  },
  {
    yr: '2020',
    place: 'Lockdown',
    title: 'A problem one kilometre away',
    sceneNote: 'Shuttered street · Open kirana',
    time: 'Morning',
    p: [
      'During lockdown, groceries were only possible in a short window each day. The shop was a kilometre away, and most days people around me still could not reach it.',
      'With a close friend, I built an app that connected local shops to the people around them. We entered it in a national hackathon and won, because judges saw real shopkeepers using it. For someone who always felt behind, that meant everything.',
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
      'Then well-funded competitors arrived with more money than we could imagine. Clean code lost to quick-commerce subsidies and shopkeepers who had sold on trust and credit for decades. We closed it cleanly. After a rough first interview, I kept building software for small businesses that paid from day one.',
    ],
  },
  {
    yr: '2021',
    place: 'Bengaluru',
    title: 'Owning the backend early',
    sceneNote: 'Purple Line metro · Late deploy',
    time: 'Golden hour',
    p: [
      'A mentor invited me to join his startup, TechMachinery Labs, as an intern. Within months I was on a contract, and I had a full-time backend role before I graduated.',
      'I went from writing APIs to owning the core backend and the AI pipelines. When a flagship product had to be wound down and most of the team left, I was offered a way out. I stayed and kept building.',
    ],
  },
  {
    yr: '2025',
    place: 'Leicester',
    title: 'Rain, lectures, and night builds',
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
    title: 'Why I build now',
    sceneNote: 'South Bank · Thames lights',
    time: 'Night',
    p: [
      'I started out wanting to earn well and prove I belonged. Money looked like the answer to everything.',
      "Failed launches, late-night deploys, and a new country changed the metric. Now in London, I build production AI agents and backend systems that quietly take real work off someone's plate.",
    ],
  },
];
