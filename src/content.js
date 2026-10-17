// All biography, skills and profile information below is temporary demo content.
// Replace these entries with your real story. Add only verified personal URLs.
export const books = [
  { id: 'about', title: 'About me', spine: 'ABOUT ME', category: 'The introduction', color: '#a85c40', number: '01', summary: 'The person behind the pixels. A little background, a lot of curiosity.', heading: 'Hello, I’m Akhil.', lead: 'A curious mind, a love for building, and a bookshelf that is never quite finished.', sections: [
    { title: 'A little introduction', text: 'This is the beginning of my story. This space will hold my background, what led me to technology, and the kinds of problems I enjoy exploring.' },
    { title: 'What drives me', text: 'Turning a small idea into something people can use. Learning by making, asking better questions, and finding the thoughtful details that make an experience feel right.' },
    { title: 'Beyond the screen', text: 'A place for the books, hobbies, people, and everyday inspirations that make me who I am.' }
  ], tags: ['Curious by nature', 'Learning by doing', 'Thoughtful details'] },
  { id: 'frontend', title: 'Frontend', spine: 'FRONTEND', category: 'The craft', color: '#426151', number: '02', summary: 'Interfaces with a little personality. The tools that bring ideas to the screen.', heading: 'Where ideas become interfaces.', lead: 'A sample collection of frontend technologies, ready to be replaced with my own toolkit.', sections: [
    { title: 'The foundations', text: 'HTML, CSS, and JavaScript — the building blocks of responsive, accessible experiences on the web.' },
    { title: 'The toolkit', text: 'React, TypeScript, and modern CSS. Component thinking, clear state management, and an appreciation for maintainable code.' },
    { title: 'The finishing touches', text: 'Responsive layouts, considered motion, keyboard accessibility, and performance that respects the person on the other side of the screen.' }
  ], tags: ['HTML & CSS', 'JavaScript', 'React', 'TypeScript'] },
  { id: 'backend', title: 'Backend', spine: 'BACKEND', category: 'Under the surface', color: '#b28d55', number: '03', summary: 'The systems behind the scenes: APIs, data, and the logic connecting everything.', heading: 'Good things beneath the surface.', lead: 'A sample chapter for server-side skills and the systems that keep an application working.', sections: [
    { title: 'APIs & application logic', text: 'A place to describe experience with Node.js, Express, Python, or the server frameworks I actually use.' },
    { title: 'Working with data', text: 'Add databases, data modelling, and examples of designing a useful, reliable data flow.' },
    { title: 'Building with care', text: 'Document real experience with validation, authentication, testing, and deployment here.' }
  ], tags: ['Node.js', 'REST APIs', 'SQL', 'Sample toolkit'] },
  { id: 'projects', title: 'Selected work', spine: 'SELECTED WORK', category: 'Made with curiosity', color: '#40596a', number: '04', summary: 'Experiments, side quests, and ideas made real. A few things from the workbench.', heading: 'Small ideas. Real things.', lead: 'A collection of projects, with space for the story behind each one.', sections: [
    { title: '01 — The bookshelf portfolio', text: 'This interactive 3D room turns a portfolio into a collection of books. Built with Three.js, procedural geometry, custom materials, and accessible HTML reading views.', detail: 'Three.js · JavaScript · CSS · This project' },
    { title: '02 — Your next project', text: 'Replace this sample with a real project: the problem, your approach, what you built, and what you learned.', detail: 'Project placeholder' },
    { title: '03 — An experiment worth sharing', text: 'A home for a side project, open-source contribution, or creative experiment. Add screenshots and a verified project link when ready.', detail: 'Project placeholder' }
  ], tags: ['Creative development', 'Problem solving', 'Work in progress'] },
  { id: 'github', title: 'GitHub', spine: 'GITHUB', category: 'Code in the open', color: '#58505d', number: '05', summary: 'Repositories, experiments, and the ongoing habit of building in public.', heading: 'Behind every idea, a commit.', lead: 'This chapter will connect to my GitHub profile and the repositories I want to share.', sections: [
    { title: 'Featured repositories', text: 'Add a few selected repositories with a short explanation of what each one does and why it matters.' },
    { title: 'How I work', text: 'Use this space for open-source contributions, collaboration, documentation, and the lessons learned while working with others.' },
    { title: 'Profile link', text: 'My personal GitHub URL will be added here. No placeholder profile is linked.' }
  ], tags: ['Repositories', 'Open source', 'Version control'] },
  { id: 'leetcode', title: 'Problem solving', spine: 'PROBLEM SOLVING', category: 'One puzzle at a time', color: '#af7445', number: '06', summary: 'Algorithms, patterns, and the satisfaction of finding a simpler solution.', heading: 'A little better, one problem at a time.', lead: 'A place for my coding profiles, learning progress, and favourite problem-solving ideas.', sections: [
    { title: 'LeetCode & coding profiles', text: 'Add my verified LeetCode, CodeChef, or Codeforces links here. Any ratings and problem counts should come from my actual profiles.' },
    { title: 'What I’m practising', text: 'Sample topics: arrays, strings, trees, graphs, dynamic programming, and choosing the right data structure.' },
    { title: 'What the numbers don’t say', text: 'Explain a challenging problem, an insight that clicked, or a practice habit that helped me improve.' }
  ], tags: ['Algorithms', 'Data structures', 'Consistent practice'] },
  { id: 'experience', title: 'Experience', spine: 'EXPERIENCE', category: 'The journey so far', color: '#7f8765', number: '07', summary: 'Teams, collaborations, and lessons collected along the way.', heading: 'Learning through doing.', lead: 'A timeline for real experience. The entries below are prompts, not employment claims.', sections: [
    { title: 'Your role · Your organisation', text: 'Add the role, organisation, dates, and a concise description of the work. Focus on what you contributed and the impact you can verify.', detail: 'Experience placeholder' },
    { title: 'Collaborations & community', text: 'Include hackathons, team projects, volunteering, or open-source work that shaped your approach.' },
    { title: 'The takeaways', text: 'What did the experience teach you about communication, ownership, or working through an unfamiliar problem?' }
  ], tags: ['Collaboration', 'Ownership', 'Growth'] },
  { id: 'education', title: 'Education', spine: 'EDUCATION', category: 'The foundations', color: '#8c5350', number: '08', summary: 'Formal foundations and the learning that happens outside the classroom.', heading: 'Stay a student of something.', lead: 'This chapter is ready for my actual education, coursework, and learning milestones.', sections: [
    { title: 'Degree & institution', text: 'Add your degree, institution, field of study, and dates here.', detail: 'Education placeholder' },
    { title: 'Relevant coursework', text: 'Include the classes that connect to your work, such as computer science fundamentals, databases, software engineering, or mathematics.' },
    { title: 'Beyond the syllabus', text: 'Make room for independent learning, workshops, reading, and the small experiments that turned theory into understanding.' }
  ], tags: ['Foundations', 'Self-directed learning', 'Curiosity'] },
  { id: 'tools', title: 'My toolkit', spine: 'MY TOOLKIT', category: 'Everyday companions', color: '#577d7b', number: '09', summary: 'The tools, workflows, and small habits that make building a little better.', heading: 'Tools for the workbench.', lead: 'An editable sample of the everyday tools behind the work.', sections: [
    { title: 'Build & collaborate', text: 'Git, GitHub, VS Code, and the terminal. Replace this sample list with the tools you use and how they support your workflow.' },
    { title: 'Design & explore', text: 'A place for design tools, prototyping methods, sketches, and the ways an idea takes shape before the code.' },
    { title: 'Ship & improve', text: 'Add your real testing, deployment, and debugging tools, along with a useful lesson from using them.' }
  ], tags: ['Git', 'VS Code', 'Figma', 'Sample toolkit'] },
  { id: 'notes', title: 'Field notes', spine: 'FIELD NOTES', category: 'Ideas in the margins', color: '#c39f67', number: '10', summary: 'Things I’m learning, questions I’m asking, and ideas worth keeping.', heading: 'Notes from the process.', lead: 'An informal place for ideas that are still taking shape.', sections: [
    { title: 'On learning in public', text: 'A space for short reflections about what I’m learning. Start with something useful, surprising, or difficult that happened while building.' },
    { title: 'On thoughtful interfaces', text: 'A note about a small design decision and why it made an experience clearer or more enjoyable.' },
    { title: 'Currently exploring', text: 'Replace this with the topics, tools, or questions currently on my desk.' }
  ], tags: ['Learning journal', 'Design thoughts', 'Experiments'] },
  { id: 'resume', title: 'The résumé', spine: 'THE RÉSUMÉ', category: 'The short version', color: '#686e85', number: '11', summary: 'The highlights, gathered in one place. A concise overview of the journey.', heading: 'The story, at a glance.', lead: 'This chapter will hold a concise, accurate summary of my background.', sections: [
    { title: 'Profile', text: 'Add a short professional introduction, the role you’re pursuing, and the strengths you bring.' },
    { title: 'Highlights', text: 'Include a few verified achievements, relevant skills, and your strongest project or experience.' },
    { title: 'Résumé PDF', text: 'A downloadable résumé can be linked here once the final PDF is available.' }
  ], tags: ['Profile', 'Experience', 'Selected work'] },
  { id: 'contact', title: 'Say hello', spine: 'SAY HELLO', category: 'The next chapter', color: '#b76b53', number: '12', summary: 'A new idea, an interesting opportunity, or just a hello. Every conversation starts somewhere.', heading: 'Good things start with hello.', lead: 'Have an idea worth exploring? This is where we can begin a conversation.', sections: [
    { title: 'Email', text: 'My contact email will be added here.' },
    { title: 'Find me elsewhere', text: 'Verified LinkedIn and other social-profile links will live here.' },
    { title: 'Let’s talk about', text: 'Thoughtful products, interesting technical challenges, creative collaborations, and things that make the web a little more delightful.' }
  ], tags: ['Collaborate', 'Connect', 'Build something'] }
];
