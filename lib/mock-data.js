const mockProfiles = [
  {
    id: "p1",
    name: "Alex Johnson",
    title: "Software Engineer",
    company: "Google",
    degree: "BS",
    major: "Computer Science",
    graduationYear: 2022,
    isStudent: false,
    elo: 1850,
    skills: ["JavaScript", "React", "Node.js", "Machine Learning", "Python"],
    experiences: [
      {
        title: "Software Engineer",
        company: "Google",
        duration: "2022 - Present",
      },
      {
        title: "Software Engineering Intern",
        company: "Microsoft",
        duration: "Summer 2021",
      },
    ],
    achievements: [
      {
        title: "Dean's List",
        description: "Maintained a 4.0 GPA for 6 consecutive semesters",
      },
      {
        title: "Hackathon Winner",
        description: "1st place at GT Hackathon 2021",
      },
    ],
  },
  {
    id: "p2",
    name: "Samantha Lee",
    title: "Product Manager",
    company: "Amazon",
    degree: "MS",
    major: "Human-Computer Interaction",
    graduationYear: 2020,
    isStudent: false,
    elo: 1780,
    skills: [
      "Product Strategy",
      "UX Research",
      "Data Analysis",
      "Agile",
      "Prototyping",
    ],
    experiences: [
      {
        title: "Product Manager",
        company: "Amazon",
        duration: "2020 - Present",
      },
      {
        title: "UX Researcher",
        company: "Apple",
        duration: "2018 - 2020",
      },
    ],
    previousEducation: {
      school: "University of Michigan",
      degree: "BS",
      major: "Information Science",
      year: 2018,
    },
  },
  {
    id: "p3",
    name: "David Kim",
    title: "PhD Candidate",
    company: "Georgia Tech Research Institute",
    degree: "PhD",
    major: "Electrical Engineering",
    graduationYear: 2024,
    isStudent: true,
    elo: 1720,
    skills: [
      "Machine Learning",
      "Signal Processing",
      "MATLAB",
      "Python",
      "Research",
    ],
    experiences: [
      {
        title: "Research Assistant",
        company: "Georgia Tech Research Institute",
        duration: "2021 - Present",
      },
      {
        title: "Teaching Assistant",
        company: "Georgia Tech",
        duration: "2020 - 2021",
      },
    ],
    achievements: [
      {
        title: "IEEE Paper Publication",
        description:
          "Published research on advanced signal processing techniques",
      },
    ],
  },
  {
    id: "p4",
    name: "Emily Chen",
    title: "Data Scientist",
    company: "Netflix",
    degree: "MS",
    major: "Analytics",
    graduationYear: 2021,
    isStudent: false,
    elo: 1790,
    skills: ["Python", "R", "Machine Learning", "SQL", "Data Visualization"],
    experiences: [
      {
        title: "Data Scientist",
        company: "Netflix",
        duration: "2021 - Present",
      },
      {
        title: "Data Analyst",
        company: "Twitter",
        duration: "2019 - 2021",
      },
    ],
  },
  {
    id: "p5",
    name: "Michael Rodriguez",
    title: "Senior Software Engineer",
    company: "Meta",
    degree: "BS",
    major: "Computer Science",
    graduationYear: 2018,
    isStudent: false,
    elo: 1830,
    skills: [
      "React",
      "GraphQL",
      "TypeScript",
      "System Design",
      "Distributed Systems",
    ],
    experiences: [
      {
        title: "Senior Software Engineer",
        company: "Meta",
        duration: "2020 - Present",
      },
      {
        title: "Software Engineer",
        company: "Airbnb",
        duration: "2018 - 2020",
      },
    ],
    achievements: [
      {
        title: "Patent Holder",
        description: "Co-inventor on 2 tech patents for distributed systems",
      },
    ],
  },
  {
    id: "p6",
    name: "Olivia Taylor",
    title: "Undergraduate Researcher",
    company: "Georgia Tech AI Lab",
    degree: "BS",
    major: "Computer Science",
    graduationYear: 2025,
    isStudent: true,
    elo: 1650,
    skills: [
      "Python",
      "TensorFlow",
      "Deep Learning",
      "Computer Vision",
      "Research",
    ],
    experiences: [
      {
        title: "Undergraduate Researcher",
        company: "Georgia Tech AI Lab",
        duration: "2023 - Present",
      },
      {
        title: "Software Engineering Intern",
        company: "Startup XYZ",
        duration: "Summer 2023",
      },
    ],
  },
  {
    id: "p7",
    name: "James Wilson",
    title: "Technical Program Manager",
    company: "Microsoft",
    degree: "MBA",
    major: "Business Administration",
    graduationYear: 2019,
    isStudent: false,
    elo: 1760,
    skills: [
      "Project Management",
      "Agile",
      "Technical Leadership",
      "Strategy",
      "Product Development",
    ],
    experiences: [
      {
        title: "Technical Program Manager",
        company: "Microsoft",
        duration: "2019 - Present",
      },
      {
        title: "Product Manager",
        company: "Dell",
        duration: "2017 - 2019",
      },
    ],
    previousEducation: {
      school: "Georgia Tech",
      degree: "BS",
      major: "Computer Science",
      year: 2015,
    },
  },
];

module.exports = { mockProfiles };
