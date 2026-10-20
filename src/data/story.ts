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
    title: 'Noticing first',
    sceneNote: 'State bus · CRT lab · 7:30 am',
    time: 'Dawn',
    p: [
      'I grew up in a small town in Karnataka, where computer class meant switching one on and opening Paint.',
      'When I started engineering in Bengaluru in 2018, most of my classmates had been coding for years. I hadn’t. What I did have was a habit of noticing friction: queues, paperwork, jobs done by hand that didn’t need to be.',
      'That became how I learned. Pick a real problem, then learn whatever it takes to solve it.',
    ],
  },
  {
    yr: '2020',
    place: 'Lockdown',
    title: 'The first thing people used',
    sceneNote: 'Shuttered street · Open kirana',
    time: 'Morning',
    p: [
      'In the 2020 lockdown, shops opened for a short window each day. The nearest was a kilometre away, and most people around me couldn’t get there in time.',
      'We built an app that let neighbourhood shops take orders from the streets around them. It won HackerEarth’s hackCOVID and OneHack in 2020. What mattered more was that real shopkeepers were using it.',
      'The same year I started freelancing: Flutter apps and Node.js backends for a hospital’s patient registration, a finance company’s field attendance tracking, and a shipbuilder’s iOS app.',
    ],
  },
  {
    yr: '2020',
    place: 'Drogher',
    title: "What code alone couldn't fix",
    sceneNote: 'Kirana counter vs. dark store',
    time: 'Noon',
    p: [
      'The hackathon app became Drogher Technologies, a quick-commerce platform for local shops. I co-founded it and led the engineering.',
      'I designed the mobile and web platform, real-time order fulfilment and inventory for last-mile delivery. We were selected for incubation at Great Lakes in Chennai and signed up our first shops one counter at a time.',
      'Then heavily funded quick-commerce companies arrived with subsidised delivery, and kirana stores ran on trust and credit that software couldn’t replace. I made the call to pivot: we stopped selling to shoppers and built for other businesses instead, in healthcare, food delivery and co-working. The lesson stayed: a product is only as strong as the business around it.',
    ],
  },
  {
    yr: '2021',
    place: 'Bengaluru',
    title: 'Owning what I ship',
    sceneNote: 'Purple Line metro · Late deploy',
    time: 'Golden hour',
    p: [
      'In late 2021, in my final year of university, I joined a small Bengaluru startup part-time, and was on the full-time team soon after I graduated.',
      'Over three years the work grew from Flutter apps and APIs to data sync between clouds in different regions, payment integrations, and then the backend and AI pipelines of an agentic AI platform: FastAPI services, vector databases and LLM agents.',
      'When the flagship product was wound down, I stayed and kept its systems running. That’s where I learned that shipping is the start of the job, not the end of it.',
    ],
  },
  {
    yr: '2025',
    place: 'Leicester',
    title: 'Starting again',
    sceneNote: 'University clocktower · 6:00 pm rain',
    time: 'Dusk',
    p: [
      'In 2025 I moved to the UK for an MSc in Advanced Computer Science at the University of Leicester.',
      'Lectures by day, part-time work for rent, and backend contracts in the evenings. One was a security testing platform, where I built parsers that turn the output of OWASP and open-source scanners into findings a team can act on.',
      'My Master’s project, Fashion AI, was a styling assistant that starts from the person: skin tone, build and occasion.',
    ],
  },
  {
    yr: 'Now',
    place: 'London',
    title: 'Systems people rely on',
    sceneNote: 'South Bank · Thames lights',
    time: 'Night',
    p: [
      'Now I’m in London, building AI agents, the backend systems they run on, and the security tooling that keeps them honest.',
      'I used to measure progress by how fast I shipped. Running a company, keeping systems alive after launch and starting over in a new country changed that. Now I care whether software is reliable, secure and genuinely useful to the people who depend on it.',
      'I still build the tools I wish existed. Brainvault gives coding agents a memory between sessions, and Claude Anchor keeps each project on the right Claude account. Both started as my own small frictions.',
    ],
  },
];
