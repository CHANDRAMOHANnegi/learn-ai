const EVAL_CASES = [
  {
    id: "frontend-senior-profile",
    text:
      "Chandramohan Negi is a Senior Software Engineer focused on React, Next.js, TypeScript, React Native, Vitest, and Playwright.",
    expected: {
      name: "Chandramohan Negi",
      role: "Senior Software Engineer",
      skills: ["React", "Next.js", "TypeScript", "React Native", "Vitest", "Playwright"]
    }
  },
  {
    id: "mobile-profile",
    text:
      "A mobile engineer worked on React Native, Firebase, Redux, notifications, and app links.",
    expected: {
      role: "Mobile Engineer",
      skills: ["React Native", "Firebase", "Redux"]
    }
  },
  {
    id: "short-unknown-profile",
    text: "Frontend engineer with React.",
    expected: {
      role: "Frontend Engineer",
      skills: ["React"],
      missing_info_includes: "more detailed profile text"
    }
  }
];

module.exports = {
  EVAL_CASES
};
