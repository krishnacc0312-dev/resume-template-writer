// Sample resume used for thumbnails and sample previews. Fictional person.
import type { ResumeData } from "./types";

export const SAMPLE: ResumeData = {
    name: "Alex Morgan",
    title: "Senior Full Stack Developer",
    contact: ["Dallas, TX", "(555) 010-2233", "alex.morgan@email.com", "linkedin.com/in/alexmorgan"],
    summary: [
      "10+ years of experience designing and building full stack web applications using React, Angular, Node.js, Java and Spring Boot.",
      "Strong experience in microservices architecture, RESTful APIs and event-driven systems using Kafka.",
      "Hands-on with AWS and Azure; CI/CD using Jenkins, GitHub Actions, Docker and Kubernetes.",
      "Experienced in Agile/Scrum delivery, code reviews and mentoring developers."
    ],
    skills: [
      { cat: "Frontend", items: "React, Angular, TypeScript, Redux, HTML5, CSS3" },
      { cat: "Backend", items: "Node.js, Java, Spring Boot, Express, GraphQL" },
      { cat: "Cloud & DevOps", items: "AWS, Azure, Docker, Kubernetes, Jenkins" },
      { cat: "Databases", items: "PostgreSQL, MongoDB, Oracle, Redis" }
    ],
    clients: [
      { client: "Northwind Financial", description: [], location: "Dallas, TX", role: "Senior Full Stack Developer", dates: "Jan 2022 – Present",
        responsibilities: ["Developed React and TypeScript front-end modules with reusable component libraries.", "Built Spring Boot microservices and REST APIs deployed on AWS EKS.", "Implemented Kafka event streaming for real-time loan status updates."],
        environment: "React, TypeScript, Java 17, Spring Boot, Kafka, AWS, PostgreSQL" },
      { client: "Contoso Health", description: [], location: "Chicago, IL", role: "Full Stack Developer", dates: "Mar 2019 – Dec 2021",
        responsibilities: ["Built Angular dashboards and Node.js APIs for patient scheduling.", "Automated deployments using Jenkins and Docker."],
        environment: "Angular, Node.js, Express, MongoDB, Azure, Jenkins" }
    ],
    education: ["Master of Science in Computer Science, University of Texas at Dallas, 2014"]
  };
